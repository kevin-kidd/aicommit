import type Anthropic from "@anthropic-ai/sdk";
import type Groq from "groq-sdk";
import type OpenAI from "openai";
import type * as v from "valibot";
import type { COMMIT_MESSAGE_SCHEMA } from "./constants";

export type AIClient = OpenAI | Anthropic | Groq;

export type CommitMessageSchema = v.InferInput<typeof COMMIT_MESSAGE_SCHEMA>;

export interface Config {
	provider:
		| "openai"
		| "openai-compatible"
		| "anthropic"
		| "openrouter"
		| "groq";
	maxTokens: number;
	apiKey: string;
	model: string;
	endpoint?: string;
	integration?: "lazygit" | "vscode" | "none";
}
