import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { input } from "@inquirer/prompts";
import yaml from "js-yaml";

const DEFAULT_LAZYGIT_CONFIG_PATH = path.join(
	os.homedir(),
	".config",
	"lazygit",
	"config.yml",
);

export async function setupLazyGitIntegration() {
	let configPath = DEFAULT_LAZYGIT_CONFIG_PATH;

	const confirmPath = await input({
		message: `Is this your LazyGit config file path? ${configPath}`,
		required: true,
		default: "y",
	});

	if (confirmPath.toLowerCase() !== "y") {
		configPath = await input({
			message: "Please enter the correct path to your LazyGit config file:",
			validate: (input) => fs.existsSync(input) || "File does not exist",
		});
	}

	try {
		const configContent = await fs.promises.readFile(configPath, "utf-8");
		// biome-ignore lint/suspicious/noExplicitAny: no point in creating a type for lazygit config file, as it may change in future
		const config = yaml.load(configContent) as Record<string, any>;

		config.customCommands = config.customCommands || [];
		config.customCommands.push({
			key: "<c-g>", // CTRL + G
			command: `git commit -m "{{.Form.Msg}}"`,
			context: "files",
			description: "Generate commit message with AI",
			prompts: {
				"- type": "menuFromCommand",
				title: "AI Commit",
				key: "Msg",
				command: "aic generate",
				valueFormat: "{{ .message }}",
				labelFormat: "{{ .number }}: {{ .message | blue }}",
				filter: "^(?P<number>d+).s(?P<message>.+)$",
			},
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
