import * as vscode from "vscode";
import type { GitExtension } from "./git";
const {
	PROVIDERS,
	createClient,
	generateCommitMessages,
} = require("@kkidd/aicommit");

interface Config {
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

async function selectProvider(
	config: vscode.WorkspaceConfiguration,
): Promise<{ provider: Config["provider"]; providerName: string }> {
	let provider = config.get<Config["provider"]>("provider");
	let providerName = PROVIDERS[provider as keyof typeof PROVIDERS];

	if (!provider) {
		const selectedProvider = (await vscode.window.showQuickPick(
			Object.values(PROVIDERS),
			{
				placeHolder: "Select a provider",
			},
		)) as Config["provider"];

		if (!selectedProvider) {
			throw new Error("Provider is required.");
		}

		const selectedProviderKey = Object.entries(PROVIDERS).find(
			([_, value]) => value === selectedProvider,
		)?.[0] as Config["provider"] | undefined;

		if (!selectedProviderKey) {
			throw new Error("The selected provider is not supported.");
		}

		await config.update(
			"provider",
			selectedProviderKey,
			vscode.ConfigurationTarget.Global,
		);
		provider = selectedProviderKey;
		providerName = selectedProvider;
	}

	return { provider, providerName };
}

async function selectModel(
	config: vscode.WorkspaceConfiguration,
): Promise<string> {
	let model = config.get<string>("model");

	if (!model) {
		const selectedModel = await vscode.window.showInputBox({
			title: "Enter the model to use",
			placeHolder: "e.g. gpt-4, claude-3-5-sonnet, etc.",
		});

		if (!selectedModel) {
			throw new Error("Model is required.");
		}

		await config.update(
			"model",
			selectedModel,
			vscode.ConfigurationTarget.Global,
		);
		model = selectedModel;
	}

	return model;
}

export async function activate(context: vscode.ExtensionContext) {
	const outputChannel = vscode.window.createOutputChannel("AI Commit");
	const generateCommitMessageCommand = vscode.commands.registerCommand(
		"aicommit.generateCommitMessage",
		async () => {
			try {
				const secrets: vscode.SecretStorage = context.secrets;
				const config = vscode.workspace.getConfiguration("aicommit");
				const amount = config.get<number>("amount");
				const { provider, providerName } = await selectProvider(config);
				const maxTokens = config.get<number>("maxTokens");
				let endpoint = config.get<string>("endpoint");

				if (provider === "openai-compatible" && !endpoint) {
					const selectedEndpoint = await vscode.window.showInputBox({
						title: "Enter the endpoint to use",
						placeHolder: "e.g. https://api.openai.com/v1",
					});
					if (!selectedEndpoint) {
						throw new Error(
							"Endpoint is required for OpenAI compatible providers.",
						);
					}
					endpoint = selectedEndpoint;
					config.update(
						"endpoint",
						selectedEndpoint,
						vscode.ConfigurationTarget.Global,
					);
				}

				// Ask for API key if not set
				let apiKey = await secrets.get("api-key"); // todo: figure out how to add secret to vscode config
				if (!apiKey) {
					apiKey = await vscode.window.showInputBox({
						title: `Enter your ${providerName} API key`,
						password: true,
					});
					if (!apiKey) {
						throw new Error("API key is required.");
					}
					await secrets.store("api-key", apiKey);
				}

				const model = await selectModel(config);

				// Get the git extension
				const gitExtension =
					vscode.extensions.getExtension<GitExtension>("vscode.git")?.exports;

				if (!gitExtension) {
					throw new Error("Git extension is not installed");
				}

				const git = gitExtension.getAPI(1);
				if (!git) {
					throw new Error("Failed to get Git API");
				}

				// Get the current repository
				const repo = git.repositories[0];
				if (!repo) {
					throw new Error(
						"No Git repository found. Please open a folder with a Git repository.",
					);
				}

				let messages: string[] = [];

				// Start loading indicator
				await vscode.window.withProgress(
					{
						location: vscode.ProgressLocation.Notification,
						title: "Generating commit messages...",
					},
					async () => {
						// Get the staged changes
						let diff: unknown;
						try {
							// First check if there are any staged changes
							diff = (await repo.diff(true)).trim();
							if (!diff) {
								throw new Error("No staged changes found.");
							}
							outputChannel.appendLine(`Diff: ${diff}`);
						} catch (error) {
							throw new Error(
								error instanceof Error
									? error.message
									: "Failed to get staged changes.",
							);
						}

						const client = createClient(provider, apiKey, endpoint);

						// Generate commit messages
						messages = await generateCommitMessages(
							client,
							provider,
							model,
							maxTokens ?? 256,
							amount ?? 5,
							diff,
						);
						messages = messages.map((message: string) => {
							// Remove numbers from the beginning of the message
							return message.replace(/^\d+\.\s*/, "");
						});
					},
				);

				if (messages.length === 0) {
					throw new Error(
						"The AI didn't generate any commit messages. Try again.",
					);
				}

				// Show quick pick to select a commit message
				const selected = await vscode.window.showQuickPick(messages, {
					placeHolder: "Select a commit message",
				});

				if (selected) {
					// Set the selected message as the commit message
					repo.inputBox.value = selected;
				}
			} catch (error) {
				vscode.window.showErrorMessage(
					`Error: ${error instanceof Error ? error.message : String(error)}`,
				);
			}
		},
	);

	const updateApiKey = async () => {
		const config = vscode.workspace.getConfiguration("ai-commit");
		const provider = config.get<Config["provider"]>("provider");
		const apiKey = await vscode.window.showInputBox({
			title: provider
				? `Enter your ${PROVIDERS[provider]} API key`
				: "Enter your API key",
			password: true,
		});
		if (apiKey) {
			await context.secrets.store("api-key", apiKey);
			vscode.window.showInformationMessage("API key has been securely stored.");
		} else {
			vscode.window.showWarningMessage(
				"No API key found in settings. Please enter an API key first.",
			);
		}
	};

	const updateApiKeyCommand = vscode.commands.registerCommand(
		"aicommit.updateApiKey",
		updateApiKey,
	);

	const testApiKey = async () => {
		const config = vscode.workspace.getConfiguration("aicommit");
		const { provider, providerName } = await selectProvider(config);
		const model = await selectModel(config);
		const endpoint = config.get<string>("endpoint");
		try {
			let apiKey = await context.secrets.get("api-key");
			if (!apiKey) {
				apiKey = config.get<string>("apiKey");
				if (!apiKey) {
					throw new Error(
						"API key is not set. Please use the 'AI Commit: Save API Key' command.",
					);
				}
			}

			const client = createClient(provider, apiKey, endpoint);

			// Test the API by generating a simple commit message
			await generateCommitMessages(
				client,
				provider,
				model || "gpt-4",
				100,
				1,
				"",
			);
			vscode.window.showInformationMessage(
				"API key is valid and working correctly.",
			);
		} catch (error) {
			vscode.window.showErrorMessage(
				`API key test failed for provider ${providerName} and model ${model}: ${
					error instanceof Error ? error.message : String(error)
				}`,
			);
		}
	};

	const testApiKeyCommand = vscode.commands.registerCommand(
		"aicommit.testApiKey",
		testApiKey,
	);
	context.subscriptions.push(
		generateCommitMessageCommand,
		updateApiKeyCommand,
		testApiKeyCommand,
	);
}

export function deactivate() {}
