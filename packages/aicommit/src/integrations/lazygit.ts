import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { input } from "@inquirer/prompts";
import yaml from "js-yaml";

function getDefaultLazyGitConfigPath(): string {
	switch (process.platform) {
		case "linux":
			return path.join(os.homedir(), ".config", "lazygit", "config.yml");
		case "darwin": // macOS
			return path.join(
				os.homedir(),
				"Library",
				"Application Support",
				"lazygit",
				"config.yml",
			);
		case "win32": {
			// Windows
			const localAppData =
				process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local");
			const appData =
				process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming");
			const localPath = path.join(localAppData, "lazygit", "config.yml");
			const roamingPath = path.join(appData, "lazygit", "config.yml");
			return fs.existsSync(localPath) ? localPath : roamingPath;
		}
		default:
			throw new Error(`Unsupported operating system: ${process.platform}`);
	}
}

export async function setupLazyGitIntegration() {
	let configPath = getDefaultLazyGitConfigPath();

	if (fs.existsSync(configPath)) {
		const confirmPath = await input({
			message: `Is this your LazyGit config file path? ${configPath}`,
			required: true,
			default: "y",
		});

		if (confirmPath.toLowerCase() !== "y") {
			configPath = await promptForConfigPath();
		}
	} else {
		console.log(`Default LazyGit config file not found at ${configPath}`);
		configPath = await promptForConfigPath();
	}

	try {
		const configContent = await fs.promises.readFile(configPath, "utf-8");
		// biome-ignore lint/suspicious/noExplicitAny: no point in creating a type for lazygit config file, as it may change in future
		let config = yaml.load(configContent) as Record<string, any>;
		if (!config) {
			config = {
				customCommands: [],
			};
		}

		config.customCommands = config.customCommands || [];
		config.customCommands.push({
			key: "<c-g>", // CTRL + G
			prompts: [
				{
					type: "menuFromCommand",
					title: "AI Commit",
					key: "Msg",
					command: "aic generate",
				},
			],
			command: `git commit -m "{{.Form.Msg}}"`,
			context: "files",
			description: "Generate commit message with AI",
		});

		await fs.promises.writeFile(
			configPath,
			yaml.dump(config, { lineWidth: -1 }),
		);

		console.log("LazyGit integration set up successfully!");
	} catch (error) {
		console.error("Error setting up LazyGit integration:", error);
	}
}

async function promptForConfigPath(): Promise<string> {
	return input({
		message: "Please enter the correct path to your LazyGit config file:",
		validate: (input) => fs.existsSync(input) || "File does not exist",
	});
}
