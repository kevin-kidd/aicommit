import { Command, Option } from "commander";
import { version } from "../package.json";
import { loadConfig, promptForConfig, saveConfig } from "./config";
import {
	createClient,
	generateCommitMessages,
	getDiff,
	getRecentCommits,
} from "./utils";

const CLI = new Command();

CLI.name("AI Commit")
	.description(
		"Generate Git commit messages with AI using your preferred model and provider.",
	)
	.version(version);

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
				console.error(
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
			const recentCommits = await getRecentCommits();
			const commitMessages = await generateCommitMessages(
				client,
				config.model,
				config.maxTokens,
				amount,
				diff,
				recentCommits,
			);
			// Handle the different integrations (lazygit, console, etc...);
			console.log(commitMessages?.join("\n"));
		} catch (error) {
			console.error("An error occurred:", error);
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
			});
		}

		console.log("Configuration saved successfully!");
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

export { CLI };
