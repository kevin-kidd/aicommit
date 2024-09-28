import type { Config } from "./config";
import { PROMPT } from "./constants";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import Groq from "groq-sdk";
import type { ChatCompletionMessageParam as OpenAIMessageParam } from "openai/resources/index.mjs";
import type { ChatCompletionMessageParam as GroqMessageParam } from "groq-sdk/resources/chat/completions.mjs";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages.mjs";
import { $ } from "bun";
import simpleGit from "simple-git";

// Create client based on config AI provider
export function createClient(
	provider: Config["provider"],
	apiKey: Config["apiKey"],
	endpoint: Config["endpoint"],
) {
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
	client: OpenAI | Anthropic | Groq,
	model: Config["model"],
	maxTokens: Config["maxTokens"],
	amount: number,
	diff: string,
) {
	const prompt = PROMPT.replace("{{amount}}", amount.toString()).replace(
		"{{diff}}",
		diff,
	);
	const messages: OpenAIMessageParam[] | MessageParam[] | GroqMessageParam[] = [
		{ role: "user", content: prompt },
	];
	switch (client.constructor.name) {
		case "OpenAI": {
			const openaiClient = client as OpenAI;
			const response = await openaiClient.chat.completions.create({
				model,
				max_tokens: maxTokens,
				messages: messages as OpenAIMessageParam[],
			});
			return response.choices[0].message.content;
		}
		case "Anthropic": {
			const anthropicClient = client as Anthropic;
			const response = await anthropicClient.messages.create({
				model,
				max_tokens: maxTokens,
				messages: messages as MessageParam[],
			});
			return response;
		}
		case "Groq": {
			const groqClient = client as Groq;
			const response = await groqClient.chat.completions.create({
				model,
				max_tokens: maxTokens,
				messages: messages as GroqMessageParam[],
			});
			return response.choices[0].message.content;
		}
		default:
			throw new Error(`Unsupported provider: ${client.constructor.name}`);
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
