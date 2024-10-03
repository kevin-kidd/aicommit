import Anthropic from "@anthropic-ai/sdk";
import { $ } from "bun";
import Groq from "groq-sdk";
import OpenAI from "openai";
import simpleGit, { type DefaultLogFields } from "simple-git";
import * as v from "valibot";
import { COMMIT_MESSAGE_SCHEMA, PROMPT, SYSTEM_PROMPT } from "./constants";
import type { AIClient, Config } from "./types";

// Create client based on config AI provider
export function createClient(
	provider: Config["provider"],
	apiKey: Config["apiKey"],
	endpoint?: Config["endpoint"],
): AIClient {
	switch (provider) {
		case "openai":
			return new OpenAI({ apiKey });
		case "openai-compatible":
			return new OpenAI({ apiKey, baseURL: endpoint });
		case "anthropic":
			return new Anthropic({ apiKey });
		case "openrouter":
			return new OpenAI({ apiKey, baseURL: "https://openrouter.ai/api/v1" });
		case "groq":
			return new Groq({ apiKey });
		default:
			throw new Error(`Unsupported provider: ${provider}`);
	}
}

// Generate commit messages given client, amount, and git diff
export async function generateCommitMessages(
	client: AIClient,
	provider: Config["provider"],
	model: Config["model"],
	maxTokens: Config["maxTokens"],
	amount: number,
	diff: string,
	recentCommits: string,
): Promise<string[]> {
	const prompt = PROMPT.replaceAll("{{amount}}", amount.toString())
		.replaceAll("{{diff}}", diff)
		.replaceAll("{{recent-commits}}", recentCommits);
	let commitMessages: string | null | undefined;
	const messages = [
		{ role: "system", content: SYSTEM_PROMPT },
		{ role: "user", content: prompt },
	];
	try {
		switch (provider) {
			case "openai":
			case "openai-compatible":
			case "openrouter": {
				const openaiClient = client as OpenAI;
				const response = await openaiClient.chat.completions.create({
					model,
					max_tokens: maxTokens,
					messages:
						messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
				});
				commitMessages = response.choices[0].message.content;
				break;
			}
			case "anthropic": {
				const anthropicClient = client as Anthropic;
				const response = await anthropicClient.messages.create({
					model,
					max_tokens: maxTokens,
					messages: messages as Anthropic.MessageParam[],
				});
				commitMessages =
					response.content[0].type === "text" ? response.content[0].text : null;
				break;
			}
			case "groq": {
				const groqClient = client as Groq;
				const response = await groqClient.chat.completions.create({
					model,
					max_tokens: maxTokens,
					messages:
						messages as Groq.Chat.Completions.ChatCompletionMessageParam[],
				});
				commitMessages = response.choices[0].message.content;
				break;
			}
			default:
				throw new Error(`Unsupported provider (${provider})`);
		}

		if (!commitMessages) {
			throw new Error("No commit messages generated");
		}

		const jsonMatch = commitMessages.match(/{[\s\S]*}/);
		const jsonResponse = jsonMatch ? jsonMatch[0] : null;
		if (!jsonResponse) {
			throw new Error("No valid JSON found in AI response");
		}
		const parsedJson = JSON.parse(jsonResponse);
		const validatedJson = v.parse(COMMIT_MESSAGE_SCHEMA, parsedJson);
		return validatedJson.commitMessages;
	} catch (error) {
		throw new Error(
			`Error generating commit messages: ${
				error instanceof Error ? error.message : String(error)
			}`,
		);
	}
}

// Get the git diff
export async function getDiff() {
	const currentDirectory = (await $`pwd`.text()).trim();
	const git = simpleGit(currentDirectory);
	const diff = await git.diff(["--cached"]);
	if (diff.trim().length === 0) {
		throw new Error("No staged changes found.");
	}
	return diff;
}

// Get recent commit messages
export async function getRecentCommits() {
	const currentDirectory = (await $`pwd`.text()).trim();
	const git = simpleGit(currentDirectory);
	const recentCommits = await git.log({
		format: "%h %s",
		maxCount: 10,
	});
	return recentCommits.all
		.map((commit) => (commit as unknown as DefaultLogFields).message)
		.join("\n");
}
