import type { COMMIT_MESSAGE_SCHEMA } from "./constants";
import type * as v from "valibot";
import type OpenAI from "openai";
import type Anthropic from "@anthropic-ai/sdk";
import type Groq from "groq-sdk";

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
}