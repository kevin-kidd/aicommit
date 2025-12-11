import * as v from "valibot";
import type { Config } from "./types";

export const SYSTEM_PROMPT = `
You are an AI assistant that generates commit messages for a git repository.
You will only respond with JSON in the following format: { "commitMessages": [] }.
Ensure you respond with valid JSON.
`;

export const BASE_PROMPT = `
Please suggest {{amount}} commit message(s) for the following git diff:

\`\`\`diff
{{diff}}
\`\`\`

**Basic Guidelines:**
1. Use imperative mood: "Add feature" not "Added feature" or "Adds feature".
2. Don't capitalize the first letter or end with a period.
3. Provide a concise description (aim for 50 characters or less).
4. The diff may include multiple files. Encapsulate ALL changes in each commit message.
5. Analyze the diff carefully and focus ONLY on the changes present.
`;

export const CONVENTIONAL_COMMITS_PROMPT = `
**Commit Message Format:**
Follow the Conventional Commits specification:

<type>[optional scope]: <description>

[optional body]

[optional footer(s)]

**Instructions:**
1. Every commit message should encapsulate ALL changes across ALL files in the diff.
2. Focus on selecting ONE or TWO most appropriate <type>s from the list below that best represent the changes in the diff.
3. Ensure the commit message(s) directly relate to the specific changes shown in the diff.
4. Include a scope if it's clear from the diff which part of the codebase is affected.

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

**Additional Guidelines:**
1. For breaking changes, add "BREAKING CHANGE:" in the footer.
2. If addressing an issue, reference it in the footer: "Closes #123".
3. If only one type is applicable, suggest variations of that type with different descriptions.

Respond with a JSON object containing an array of commit messages:
{
  "commitMessages": [
    "<type>[(scope)]: <description>",
    // ... more messages up to {{amount}}
  ]
}
`;

// Keep PROMPT for backwards compatibility
export const PROMPT: string = BASE_PROMPT + CONVENTIONAL_COMMITS_PROMPT;

export const PROVIDERS: Record<Config["provider"], string> = {
	openai: "OpenAI",
	anthropic: "Anthropic",
	openrouter: "OpenRouter",
	groq: "Groq",
	"openai-compatible": "Other (OpenAI compatible)",
};

export const COMMIT_MESSAGE_SCHEMA: v.ObjectSchema<
	{
		readonly commitMessages: v.ArraySchema<
			v.StringSchema<undefined>,
			undefined
		>;
	},
	undefined
> = v.object({
	commitMessages: v.array(v.string()),
});
