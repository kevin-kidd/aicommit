import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { select, input } from "@inquirer/prompts";
import { PROVIDERS } from "./constants";

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

const CONFIG_FILE = path.join(os.homedir(), ".aicommitrc");

export async function loadConfig(): Promise<Config | null> {
	try {
		const configData = await fs.promises.readFile(CONFIG_FILE, "utf-8");
		const parsedConfig = JSON.parse(configData);
		const validatedConfig = validateConfig(parsedConfig);
		return validatedConfig;
	} catch (error) {
		return null;
	}
}

function validateConfig(config: Config): Config {
	const validProviders = [
		"openai",
		"openai-compatible",
		"anthropic",
		"openrouter",
		"groq",
	];

	if (!config || typeof config !== "object") {
		throw new Error("Invalid config: must be an object");
	}

	if (!validProviders.includes(config.provider)) {
		throw new Error(
			`Invalid provider: ${
				config.provider
			}. Must be one of: ${validProviders.join(", ")}`,
		);
	}

	if (typeof config.apiKey !== "string" || config.apiKey.trim() === "") {
		throw new Error("Invalid API key: must be a non-empty string");
	}

	if (typeof config.model !== "string" || config.model.trim() === "") {
		throw new Error("Invalid model: must be a non-empty string");
	}

	if (config.provider === "openai-compatible") {
		if (typeof config.endpoint !== "string" || config.endpoint.trim() === "") {
			throw new Error(
				"Invalid endpoint: must be a non-empty string for openai-compatible provider",
			);
		}
	} else {
		config.endpoint = undefined;
	}

	return {
		provider: config.provider,
		apiKey: config.apiKey,
		model: config.model,
		endpoint: config.endpoint,
		maxTokens: config.maxTokens,
	};
}

export async function saveConfig(config: Partial<Config>): Promise<void> {
	const currentConfig = (await loadConfig()) || ({} as Config);
	const newConfig: Config = {
		...currentConfig,
		...config,
		provider: validateProvider(
			config.provider || currentConfig.provider || "openai",
		),
		apiKey: config.apiKey || currentConfig.apiKey || "",
		model: config.model || currentConfig.model || "",
	};

	if (newConfig.provider === "openai-compatible") {
		newConfig.endpoint = config.endpoint || currentConfig.endpoint || "";
	} else {
		newConfig.endpoint = undefined;
	}

	await fs.promises.writeFile(CONFIG_FILE, JSON.stringify(newConfig, null, 2));
}

export async function promptForConfig(): Promise<Config> {
	const providerName = await select({
		message: "Select the AI provider:",
		choices: Object.values(PROVIDERS).map((value) => ({ value })),
	});
	const provider = Object.entries(PROVIDERS).find(
		([_, name]) => name === providerName,
	)?.[0] as Config["provider"];
	const apiKey = await input({
		message: `Enter your ${PROVIDERS[provider]} API key:`,
		validate: (input: string) =>
			input.trim() !== "" || "API key cannot be empty",
	});

	const model = await input({
		message: `Enter the name of the ${PROVIDERS[provider]} model to use:`,
		default: "gpt-4",
	});

	const newConfig: Config = {
		provider,
		apiKey,
		model,
		maxTokens: 256,
	};
	if (provider === "openai-compatible") {
		newConfig.endpoint = await input({
			message: "Enter the OpenAI compatible provider's endpoint:",
			required: true,
			validate: (input: string) =>
				input.trim() !== "" ||
				"Endpoint cannot be empty for openai-compatible provider",
		});
	}
	return validateConfig(newConfig);
}

function validateProvider(provider: unknown): Config["provider"] {
	const validProviders: Config["provider"][] = [
		"openai",
		"openai-compatible",
		"anthropic",
		"openrouter",
		"groq",
	];
	if (
		typeof provider === "string" &&
		validProviders.includes(provider as Config["provider"])
	) {
		return provider as Config["provider"];
	}
	throw new Error(
		`Invalid provider: ${provider}. Must be one of: ${validProviders.join(
			", ",
		)}`,
	);
}
