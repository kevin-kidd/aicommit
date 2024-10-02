import { expect, mock, test } from "bun:test";
import Anthropic from "@anthropic-ai/sdk";
import Groq from "groq-sdk";
import OpenAI from "openai";
import type { Config } from "../src/types";
import {
	createClient,
	generateCommitMessages,
	getDiff,
	getRecentCommits,
} from "../src/utils";

test("createClient", () => {
	const openaiClient = createClient("openai", "test-api-key", undefined);
	expect(openaiClient).toBeInstanceOf(OpenAI);

	const anthropicClient = createClient("anthropic", "test-api-key", undefined);
	expect(anthropicClient).toBeInstanceOf(Anthropic);

	const groqClient = createClient("groq", "test-api-key", undefined);
	expect(groqClient).toBeInstanceOf(Groq);

	expect(() =>
		createClient("invalid" as Config["provider"], "test-api-key", undefined),
	).toThrow("Unsupported provider: invalid");
});

test("getDiff", async () => {
	const mockGit = {
		diff: mock(() => Promise.resolve("mock diff")),
	};
	mock.module("simple-git", () => ({
		default: () => mockGit,
	}));

	const diff = await getDiff();
	expect(diff).toBe("mock diff");
});

test("getRecentCommits", async () => {
	const mockGit = {
		log: mock(() =>
			Promise.resolve({
				all: [
					{ message: "feat: first commit" },
					{ message: "fix: second commit" },
				],
			}),
		),
	};
	mock.module("simple-git", () => ({
		default: () => mockGit,
	}));

	const recentCommits = await getRecentCommits();
	expect(recentCommits).toBe("feat: first commit\nfix: second commit");
});
