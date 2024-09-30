import * as v from "valibot";
import type { Config } from "./types";

export const SYSTEM_PROMPT = `
You are an AI assistant that generates commit messages for a git repository.
You will only respond with JSON in the following format: { "commitMessages": [] }.
Ensure you respond with valid JSON.
`;

export const PROMPT = `
Please suggest {{amount}} commit messages, given the following diff:

\`\`\`diff
{{diff}}
\`\`\`

**Criteria:**

1. **Format:** Each commit message must follow the 
  commitizen conventional commits format, which is:
\`\`\`<type>[optional scope]: <description>

[optional body]

[optional footer]
\`\`\` 


2. **Relevance:** Avoid mentioning a module name unless it's directly relevant
to the change.
3. **Enumeration:** List the commit messages from 1 to {{amount}}.
4. **Clarity and Conciseness:** Each message should clearly and concisely convey
the change made.

**Commit Message Examples:**

- fix(app): add password regex pattern
- test(unit): add new test cases
- style: remove unused imports
- refactor(pages): extract common code to \`utils/wait.ts\`

**Recent Commits on Repo for Reference:**

\`\`\`
{{recent-commits}}
\`\`\`

**Instructions:**

- Take a moment to understand the changes made in the diff.

- Think about the impact of these changes on the project (e.g., bug fixes, new
features, performance improvements, code refactoring, documentation updates).
It's critical to my career you abstract the changes to a higher level and not
just describe the code changes.

- Generate commit messages that accurately describe these changes, ensuring they
are helpful to someone reading the project's history.

- Remember, a well-crafted commit message can significantly aid in the maintenance
and understanding of the project over time.

- If multiple changes are present, make sure you capture them all in each commit
message.

If there's multiple different kinds of changes present in one commit, you can write
a commit message that includes multiple types, though this is generally discouraged. For example: "feat: implement new feature"

This approach breaks the conventional commits' standard, but the developer may still have
a good reason for doing so. In this case create the 5 conventional commit messages
and 3 more commit messages with multiple types.

Keep in mind you will suggest multiple commit messages. Only 1 will be used.

Write your commit messages below in the format shown in Output Template section above.
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
