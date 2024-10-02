import * as v from "valibot";
import type { Config } from "./types";

export const SYSTEM_PROMPT = `
You are an AI assistant that generates commit messages for a git repository.
You will only respond with JSON in the following format: { "commitMessages": [] }.
Ensure you respond with valid JSON.
`;

export const PROMPT = `
Please suggest {{amount}} commit messages for the following git diff:

\`\`\`diff
{{diff}}
\`\`\`

**Commit Message Format:**
Follow the Conventional Commits specification:

<type>[optional scope]: <description>

[optional body]

[optional footer(s)]

Where <type> is one of:
- feat: A new feature
- fix: A bug fix
- docs: Documentation only changes
- style: Changes that do not affect the meaning of the code (white-space, formatting, etc)
- refactor: A code change that neither fixes a bug nor adds a feature
- perf: A code change that improves performance
- test: Adding missing tests or correcting existing tests
- build: Changes that affect the build system or external dependencies
- ci: Changes to our CI configuration files and scripts
- chore: Other changes that don't modify src or test files

**Guidelines:**
1. Be concise: Aim for 50 characters or less in the description.
2. Use imperative mood: "Add feature" not "Added feature" or "Adds feature".
3. Don't capitalize the first letter or end with a period.
4. If the change is specific to a part of the codebase, include a scope, e.g., "feat(parser):".
5. For breaking changes, add "BREAKING CHANGE:" in the footer.
6. If addressing an issue, reference it in the footer: "Closes #123".

**Examples:**
- feat(auth): add password strength indicator
- fix(api): handle null response from user service
- docs: update README with new build instructions
- style: format code using prettier
- refactor(utils): extract date formatting logic
- perf(queries): optimize database joins for user lookup
- test(unit): add tests for password reset flow
- build(deps): upgrade to TypeScript 4.5
- ci: add GitHub Actions workflow for linting
- chore: update .gitignore with new build output directory

**Recent Commits (for context):**
\`\`\`
{{recent-commits}}
\`\`\`

**Instructions:**
1. Analyze the diff carefully to understand the changes.
2. Consider the impact of these changes (e.g., new features, bug fixes, optimizations).
3. Generate {{amount}} distinct commit messages that accurately describe the changes.
4. Ensure each message follows the Conventional Commits format.
5. Provide a clear, concise description that captures the essence of the change.
6. Use an appropriate type and scope (if applicable) for each message.
7. If a change is breaking, include "BREAKING CHANGE:" in the footer.
8. If addressing a specific issue, reference it in the footer.
9. Avoid mentioning file names unless absolutely necessary for clarity.
10. Focus on the "why" and "what" of the change, not just the "how".

Remember, these commit messages should be helpful for someone reviewing the project's history. Each message should stand on its own and provide value.

Respond with a JSON object containing an array of commit messages:
{
  "commitMessages": [
    "feat(user): implement password reset functionality",
    "fix(api): handle edge case in data validation",
    // ... more messages up to {{amount}}
  ]
}
`;

export const PROVIDERS: Record<Config["provider"], string> = {
	openai: "OpenAI",
	anthropic: "Anthropic",
	openrouter: "OpenRouter",
	groq: "Groq",
	"openai-compatible": "Other (OpenAI compatible)",
};

export const COMMIT_MESSAGE_SCHEMA = v.object({
	commitMessages: v.array(v.string()),
});
