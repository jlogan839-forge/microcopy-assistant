# Decision log

Short entries: what you chose, what else you considered, why. This becomes the case study.

## 2026-09-28 — Stack: Next.js + Tailwind + shadcn/ui
- Considered: Forge UI (my own kit), plain HTML.
- Chose a stack audiences recognize and agents write fluently; Forge stays for test projects.
- Next.js API route keeps the API key off the browser; deploys easily to Vercel.

## 2026-09-28 — Rules and prompt live outside the app
- `content/` holds rules, schema, prompt, tests. The app reads them.
- The rules are the product; the UI is swappable.

## 2026-09-29 — Punctuation in titles versus descriptions
- No punctation is included in titles.
- Punctuation is included in descriptions, including field errors.

## 2026-09-29 — shadcn base library: Base UI
- Considered: Radix (shadcn's default).
- Why: Using Base UI to support more detail component parts like ProgressLabel.

## 2026-09-30 —  Created page titles and descriptions
- shadcn has no page header.
- Named ours PageTitle/PageDescription to match the Title/Description pattern.

## 2026-09-30 —  Parent name covers its parts
- A parent name (Alert) covers its parts (AlertTitle, AlertDescription). 
- If a rule lists components and message types, both must match.

## 2026-09-30 —  Flagging instead of inventing facts
- When interaction details or contextual info is missing, flag instead of making assumptions.
- Because a wrong guess can be worse than a missing detail: it puts false information into the product.

## 2026-09-30 —  Expected rules
- Expected rules are rules applied only when there is a change in the rewrite based on the expected rule.
- If there are no changes, expected rules doesn't apply.
- Because listing every rule that could apply makes the test pass too easily and fills the tool's explanations with noise.

## 2026-09-30 —  Expected flags
- Expected flags column added so flags are testable.

## 2026-09-30 —  PAGE-01 description added
- Based on refining test set, added PAGE-01 Description.
- Drops page types from page titles.

## 2026-09-30 —  Number of rewrites
- Return a max of 3 rewrites so user is not overwhelmed.

## 2026-09-30 —  Using placeholder suggestions
- When a fix needs information you don't have, you may use [bracketed placeholders] to show the structure, and flag what fills them
- Came from test T19: Claude used placeholders on its own instead of keeping "Something went wrong".
- Placeholders show the writer the right structure for the rule without inventing facts.

## 2026-09-30 —  Cite only the rule that required the change
- Test T01 ("Save Changes" → "Save"): Claude cited BUTTONS-01 and CAPS-01.
- Removing "Changes" also removed the capital letter, but CAPS-01 didn't cause anything.
- Added to prompt: if a change made for one rule also fixes another, list only the rule that required it.
- Retested: Claude now cites BUTTONS-01 only.
- Keeps explanations short and honest about what drove each change.

## 2026-09-30 —  Rules can overlap; the overriding rule says so
- ERR-03 ("Couldn't…") overrides ERR-01 (start with a verb) when the user can't fix the issue.
- DESCRIPTIONS-03 overrides DESCRIPTIONS-01 for status text like "Optional".
- Without a stated winner, Claude picks one inconsistently.

## 2026-09-30 —  DESCRIPTIONS-03: no punctuation on field status text
- The tool's own form had "Optional." under Character limit and it read wrong.
- Added a rule: status descriptions like Optional and Required have no punctuation.
- The tool's interface should follow the style guide it enforces.

## 2026-09-30 —  Model and request settings
- Model: Claude Opus 5.5 with effort set to medium (short rewrites don't need deep reasoning).
- Structured output: responses must match a zod schema, so the app never has to parse free text.
- Fallbacks on: if a safety check wrongly declines text (e.g. mentions SSN), the request retries on a fallback model.
- Rules and prompt are read on every request, so edits take effect without restarting.
- User text is wrapped in <text> tags so pasted text can't be mistaken for instructions.

## 2026-09-30 —  One shared result schema
- `web/lib/rewrite-schema.ts` defines the result shape once; the API route and the page both import it.
- `content/output-schema.json` stays as human-readable documentation and must be kept in sync.
- Defining it twice would let the two drift apart.

## 2026-09-30 —  Rewrites as stacked cards, not tabs
- Considered: tabs for multiple options (planned earlier).
- Chose stacked cards so writers can compare options side by side, e.g. "user can fix it" vs "user can't".
- Each card: option label, rewrite, rationale, rule badges, copy button.

## 2026-09-30 —  Separate title and description fields
- Claude first returned multi-part rewrites as one string: "Title: … / Description: …".
- It displayed as one long bold line, and Copy included the labels.
- Considered: splitting the string in the UI (fragile if Claude words the labels differently).
- Chose: a separate `description` field (null for one-part components) in the schema, prompt, and UI.
- The rewrite should look like the real component, and structured data is more reliable than parsing text.

## 2026-09-30 —  Flags don't start with "Missing"
- Every flag started with "Missing:", repeating the "Needs more information" heading.
- Changed the prompt to describe what's missing without starting with "Missing".

## 2026-09-30 —  "No rewrite yet" state
- Found in use: with no message type, Claude left "Something went wrong" unchanged but flagged problems.
- The page showed "Follows the style guide" next to flags saying it didn't: a contradiction.
- Now: "Follows the style guide" only when there are no flags; unchanged text with flags shows "No rewrite yet".
- Because "unchanged" can mean "already good" or "can't fix without more information", and the UI has to tell them apart.

## 2026-09-30 —  Green and amber alerts, dark text
- Added success (green) and warning (amber) styles to the Alert component with theme tokens for light and dark mode.
- Green: Follows the style guide. Amber: Needs more information. "No rewrite yet" stays neutral so two amber boxes don't compete.
- Colored text passed WCAG AA (amber 6.95:1) but was hard to read on the tinted background.
- Changed title and description to the normal dark text (17.9:1); only the icon keeps the color.
- Why: contrast ratios are a minimum, not a guarantee of comfortable reading; meaning also comes from icons and titles, not color alone (WCAG 1.4.1).

## 2026-09-30 —  Finding: same input, different answers
- "Something went wrong" + Toast + no message type gave two different results on two runs.
- One run applied TOASTS-02 even though it requires the error message type.
- To do: run each test more than once in Phase 6; consider a firmer prompt line: if a rule needs a message type and none was given, don't apply it; flag it instead.

## 2026-10-05 —  Raised muted text from 4.74:1 to 7.46:1
- AA felt too light for secondary text in practice.