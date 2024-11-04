#!/usr/bin/env bun
import { select } from "@inquirer/prompts";
import { Command, Option } from "commander";
import { version } from "../package.json";
import { loadConfig, promptForConfig, saveConfig } from "./config";
import { PROVIDERS } from "./constants";
import { setupLazyGitIntegration } from "./integrations/lazygit";
import { setupVSCodeIntegration } from "./integrations/vscode";
import type { Config } from "./types";
import { createClient, generateCommitMessages, getDiff } from "./utils";
import { exec } from "node:child_process";
import { confirm } from "@inquirer/prompts";

const CLI: Command = new Command();

CLI.name("AI Commit")
	.description(
		"Generate Git commit messages with AI using your preferred model and provider.",
	)
	.version(version)
	.action(async () => {
		let config = await loadConfig();

		if (!config) {
			console.log("Welcome to AI Commit! Let's set up your configuration.");
			config = await promptForConfig();
			await saveConfig(config);
			console.log("Configuration saved successfully!");
		} else {
			CLI.help();
		}
	});

CLI.command("generate")
	.description(
		"Generate between 1-10 commit messages based on your current staged changes.",
	)
	.option(
		"-a, --amount <number>",
		"The number of commit messages to generate (1-10)",
		Number.parseInt,
		5,
	)
	.action(async (options) => {
		try {
			// Verify the amount is a number between 1 and 10
			const amount = Number.parseInt(options.amount);
			if (Number.isNaN(amount) || amount < 1 || amount > 10) {
				console.error("Amount must be a number between 1 and 10");
				process.exit(1);
			}
			const config = await loadConfig();
			if (!config) {
				console.info(
					"Could not find configuration file. Please run `aic config` first.",
				);
				process.exit(1);
			}
			const client = createClient(
				config.provider,
				config.apiKey,
				config.endpoint,
			);
			const diff = await getDiff();
			const commitMessages = await generateCommitMessages(
				client,
				config.provider,
				config.model,
				config.maxTokens,
				amount,
				diff,
			);
			if (commitMessages) {
				// Log to console if LazyGit or VS Code is the chosen integration
				if (
					config.integration === "lazygit" ||
					config.integration === "vscode"
				) {
					console.log(commitMessages.join("\n"));
				} else {
					// Allow user to select from the commit messages
					const selectedCommitMessage = await select({
						message: "Select a commit message:",
						choices: commitMessages.map((message) => ({ value: message })),
					});
					// Confirm the user wants to commit with the selected message
					const confirmation = await confirm({
						message: `Are you sure you want to commit with the message: "${selectedCommitMessage}"?`,
					});
					if (confirmation) {
						// Git commit with the selected message
						exec(`git commit -m "${selectedCommitMessage}"`, (error) => {
							if (error) {
								console.error(`Error committing: ${error}`);
							}
						});
					}
				}
			} else {
				throw new Error("No commit messages returned from API.");
			}
		} catch (error) {
			console.error(error instanceof Error ? error.message : String(error));
			process.exit(1);
		}
	});

CLI.command("config")
	.description("Configure your AI provider and model.")
	.addOption(
		new Option("-p, --provider <provider>", "The AI provider to use").choices([
			"openai",
			"openai-compatible",
			"anthropic",
			"openrouter",
			"groq",
		]),
	)
	.addOption(
		new Option(
			"-i, --integration <integration>",
			"The integration to use",
		).choices(["lazygit", "vscode", "none"]),
	)
	.option(
		"-m, --model <model>",
		"The AI model to use (gpt-4, gpt-3.5, etc.)",
		"gpt-4",
	)
	.option("-k, --api-key <api-key>", "The API key to use for the AI provider.")
	.option(
		"-e, --endpoint <endpoint>",
		"The provider's endpoint to use, if you selected openai-compatible.",
	)
	.option(
		"--tokens <max-tokens>",
		"The maximum number of tokens to generate (default: 256)",
		Number.parseInt,
		256,
	)
	.action(async (options, command) => {
		try {
			// Call promptForConfig() if none of the options are set
			if (command.parent.args?.length === 1) {
				console.log("Welcome to AI Commit! Let's set up your configuration.");
				const config = await promptForConfig();
				await saveConfig(config);
			} else {
				await saveConfig({
					provider: options.provider,
					model: options.model,
					endpoint: options.endpoint,
					apiKey: options.apiKey,
					maxTokens: options.tokens,
					integration: options.integration,
				});
			}

			console.log("Configuration saved successfully!");
		} catch (error) {
			console.error(error instanceof Error ? error.message : String(error));
			process.exit(1);
		}
	});

CLI.command("view-config")
	.description("View your current configuration.")
	.action(async () => {
		const config = await loadConfig();
		if (!config) {
			console.error(
				"Could not find configuration file. Please run `aic config` first.",
			);
			process.exit(1);
		}
		console.log(config);
	});

CLI.command("integrate")
	.description("Set up integrations with LazyGit or VS Code")
	.action(async () => {
		const integration = await select({
			message: "Choose an integration to set up:",
			choices: [
				{ value: "none", name: "None (default)" },
				{ value: "lazygit", name: "LazyGit" },
				{ value: "vscode", name: "VS Code" },
			],
		});

		switch (integration) {
			case "lazygit":
				await setupLazyGitIntegration();
				await saveConfig({ integration: "lazygit" });
				break;
			case "vscode":
				await setupVSCodeIntegration();
				await saveConfig({ integration: "vscode" });
				break;
			case "none":
				await saveConfig({ integration: "none" });
				break;
			default:
				console.error("Invalid integration selected");
				process.exit(1);
		}
	});

CLI.parse(process.argv);

export { CLI };
export { createClient, generateCommitMessages };
export { getDiff };
export type { Config };
export { PROVIDERS };
