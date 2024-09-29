#! /usr/bin/env bun

import { loadConfig, saveConfig, promptForConfig } from "./config";
import { CLI } from "./cli";

async function main() {
	let config = await loadConfig();

	if (!config) {
		console.log("Welcome to AI Commit! Let's set up your configuration.");
		config = await promptForConfig();
		await saveConfig(config);
		console.log("Configuration saved successfully!");
	}

	CLI.parseAsync();
}

main().catch(console.error);
