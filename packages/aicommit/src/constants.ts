import * as v from "valibot";
import type { Config } from "./types";

export const SYSTEM_PROMPT = `
You are an AI assistant that generates commit messages for a git repository.
You will only respond with JSON in the following format: { "commitMessages": [] }.
Ensure you respond with valid JSON.
`;

export const PROMPT = `
Please suggest {{amount}} commit message(s) for the following git diff:

\`\`\`diff
{{diff}}
\`\`\`

**Commit Message Format:**
Follow the Conventional Commits specification:

<type>[optional scope]: <description>

[optional body]

[optional footer(s)]

**Important Instructions:**
1. Focus on selecting ONE or TWO most appropriate <type>s from the list below that best represent the changes in the diff.
2. Ensure the commit message(s) directly relate to the specific changes shown in the diff.
3. Include a scope if it's clear from the diff which part of the codebase is affected.
4. Provide a concise description (aim for 50 characters or less) that accurately reflects the changes.

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
1. Use imperative mood: "Add feature" not "Added feature" or "Adds feature".
2. Don't capitalize the first letter or end with a period.
3. For breaking changes, add "BREAKING CHANGE:" in the footer.
4. If addressing an issue, reference it in the footer: "Closes #123".

**Key Points:**
1. Analyze the diff carefully and focus ONLY on the changes present.
2. Choose the most appropriate type(s) that accurately represent the changes.
3. Include a scope if it's clear which part of the codebase is affected.
4. Ensure the description directly relates to the changes in the diff.
5. Avoid suggesting commits for changes not present in the diff.
6. If only one type is applicable, suggest variations of that type with different descriptions.

Remember, these commit messages should be helpful for someone reviewing the project's history and should accurately represent the changes in the diff.

Respond with a JSON object containing an array of commit messages:
{
  "commitMessages": [
    "<type>[(scope)]: <description>",
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
