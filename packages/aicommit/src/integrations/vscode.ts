import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export async function setupVSCodeIntegration(): Promise<void> {
	const extensionId = "kevin-kidd.aicommit-vscode";
	const extensionUrl = `vscode:extension/${extensionId}`;

	try {
		await execAsync(`code --install-extension ${extensionId}`);
		console.log("VS Code extension installed successfully!");
		console.log("Opening VS Code extension page...");
		await execAsync(`open ${extensionUrl}`);
	} catch (error) {
		console.error("Error setting up VS Code integration:", error);
		console.log("Please install the extension manually:");
		console.log(extensionUrl);
	}
}
