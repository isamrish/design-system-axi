# Prompt

Each arm ran as a separate agent (model: Claude Sonnet, no tools). The text below was sent verbatim, with
`<LISTING>` replaced by the arm's listing file and `<TASKS>` by the design system's intents file. Primer arms
omit nothing; Gutenberg arms omit the sentence about repeated names (Gutenberg has none).

| arm             | listing             | tasks                 |
| --------------- | ------------------- | --------------------- |
| primer-names    | primer-names.txt    | primer-intents.txt    |
| primer-about    | primer-about.txt    | primer-intents.txt    |
| gutenberg-names | gutenberg-names.txt | gutenberg-intents.txt |
| gutenberg-about | gutenberg-about.txt | gutenberg-intents.txt |

The listings are real CLI output. Primer's include the deprecated listing appended, because three of
registration 3's golden components are deprecated. The `--about` listings come from an unmerged branch.
Answers (`picks.json`) are each agent's raw reply; scoring is `score.ts`.

---

You are helping an app-building agent choose UI components from a design system. You have ONLY the component listing below, exactly as a design-system CLI printed it. You cannot run commands, read files, search the web, or use any tools. Do not attempt to use any tool; answer only from this text and your own judgment.

For each task, pick up to 3 components from the listing, best first, that you would use to build it. Use names exactly as they appear in the first column of the listing. If a name appears more than once (for example a current and a deprecated version), just give the name once.

Return ONLY a JSON object mapping each task id to an array of up to 3 names, with no other text. Example: {"x-01": ["Button", "Link"]}

LISTING:
<LISTING>

TASKS:
<TASKS>
