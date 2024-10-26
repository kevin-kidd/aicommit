import * as vscode from "vscode";
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

export async function activate(context: vscode.ExtensionContext) {
	const generateCommitMessageCommand = vscode.commands.registerCommand(
		"aicommit.generateCommitMessage",
		async () => {
			try {
				const secrets: vscode.SecretStorage = context.secrets;
				const config = vscode.workspace.getConfiguration("ai-commit");
				const amount = config.get<number>("amount");
				let model = config.get<string>("model");
				let provider = config.get<Config["provider"]>("provider");
				const maxTokens = config.get<number>("maxTokens");
				let endpoint = config.get<string>("endpoint");

				// Find provider name based on matching key
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
					config.update("provider", selectedProviderKey);
					provider = selectedProviderKey;
					providerName = selectedProvider;
				}
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
					config.update("endpoint", selectedEndpoint);
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

				if (!model) {
					const selectedModel = await vscode.window.showInputBox({
						title: "Enter the model to use",
						placeHolder: "e.g. gpt-4, claude-3-5-sonnet, etc.",
					});
					if (!selectedModel) {
						throw new Error("Model is required.");
					}
					model = selectedModel;
					config.update("model", selectedModel);
				}

				if (!provider) {
					throw new Error(
						"Provider is not set. Please configure it in the settings.",
					);
				}

				if (!model) {
					throw new Error(
						"Model is not set. Please configure it in the settings.",
					);
				}
				// Get the git extension
				const gitExtension =
					vscode.extensions.getExtension("vscode.git")?.exports;
				const git = gitExtension.getAPI(1);

				// Get the current repository
				const repo = git.repositories[0];

				if (!repo) {
					throw new Error("No Git repository found.");
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
						const diff = await repo.diff();
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
		const config = vscode.workspace.getConfiguration("ai-commit");
		const provider = config.get<Config["provider"]>("provider");
		const model = config.get<string>("model");
		const endpoint = config.get<string>("endpoint");
		try {
			if (!provider) {
				throw new Error(
					"Provider is not set. Please configure it in the settings.",
				);
			}

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
			const testMessages = await generateCommitMessages(
				client,
				provider,
				model || "gpt-4",
				100,
				1,
				"",
			);

			if (testMessages && testMessages.length > 0) {
				vscode.window.showInformationMessage(
					"API key is valid and working correctly.",
				);
			} else {
				throw new Error("Failed to generate a test commit message.");
			}
		} catch (error) {
			vscode.window.showErrorMessage(
				`API key test failed for provider ${provider} and model ${model}: ${
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
