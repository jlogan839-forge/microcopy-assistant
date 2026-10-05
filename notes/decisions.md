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

## 2026-09-30 —  Separate title and description fields - SUPERSEDED by Parts
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

## 2026-10-05 —  Using parts instead of title + description
- Field has three parts (label, help text, error text), and reviewing them together gives better rewrites.
- Alerts, dialogs, toasts all have titles + description.

## 2026-10-05 —  Added Empty and Page as parent components
- So empty states and page headers get both fields, Title + Description.

## 2026-10-05 —  Component selection comes first in form
- The component type will determine what input fields are available, like Title + Description.
- Field labels change with the component.

## 2026-10-05 —  Character limit per part
- Because a title and a description need different limits.

## 2026-10-05 —  Hidden fields are kept but not sent
- Text in hidden fields is kept but not sent, so switching components doesn't lose work.

## 2026-10-05 —  Parts table lives in code, not JSON
- The parts table lives in code (component-fields.ts), not the rules JSON.
- It configures the form, not the style guide.

## 2026-10-05 —  API returns original parts
- The API route returns the original parts itself. 
- Claude doesn't repeat them, which saves cost and means the original can't be altered by mistake.

## 2026-10-05 —  Added CONTRACTIONS-01
- Flagged by tool during testing that no rule covers contractions.

## 2026-10-05 —  Added diff view of parts
- Showing changes without relying on color: strikethrough for removed and underline for added, plus hidden "removed:"/"added:" text for screen readers.
- Over 70% changed → "Rewritten from:" instead of a word-by-word diff.
- Punctuation-only changes include the previous word, because a lone added "." was invisible.
- Parts are compared by name, falling back to position when the component changes.

## 2026-10-05 —  Card design and readability
- Raised muted text from 4.74:1 to 7.46:1, AA felt too light for secondary text in practice.
- The Changes section uses dark text. Grey with strikethrough was hard to read even at 4.74:1.
- Removed the "Rewrite" label. "Option 1, 2…" appears only when there are several.
- Unique screen-reader names for "Max characters" ("Max characters for Label").
- Copy copies all parts, one per line.


## 2026-10-05 —  Test runner design (Phase 6)
- `web/scripts/run-tests.mts` sends every test row to the running app, the same path the browser uses.
- Multi-part rows use " | " between parts in one cell (T19, T20), in the order the form shows them. Kept one row per test instead of extra columns.
- Checked automatically: rules cited, unchanged rows left alone, a flag raised when expected, Alert suggested when TOASTS-02 applies.
- Judged by me: a report shows my ideal rewrite next to Claude's for every row.
- Each row runs 3 times, because the same input can give different answers. A row only counts as passing if it passes every run.
- Options for cheaper runs while tuning: `--runs 1` and `--only T01,T19`.

## 2026-10-05 —  Prompt caching to reduce cost
- The prompt and rules (about 4,500 tokens) are identical on every request, so the API caches them.
- Repeat requests read them from the cache at a fraction of the price: about 1¢ per request instead of 2.6¢.
- A full 3-run pass (90 requests) costs about $0.90. This also lowers the cost of every rewrite in the app.

## 2026-10-05 —  First test run: 22 of 30
- Six failures were tests written before later decisions (cite only the required rule; placeholders).
- Updated T07, T10, T16, T19, T30, and T31 to match those decisions.
- Why: the test set records decisions, so when a decision changes, the tests have to change with it.

## 2026-10-05 —  URL isn't jargon
- T15 expected "URL" to become "web address" (TONE-02). Claude kept "URL" in all 3 runs.
- I agree that URL is familiar to our users, so T15 became an "already correct" row.
- Why: when Claude consistently disagrees with a test, check whether the test is wrong before changing the rule.

## 2026-10-05 —  DESCRIPTIONS-01 covers Dialog and Card descriptions
- Claude flagged twice in T14 that no rule covered punctuation for DialogDescription.
- Added DialogDescription and CardDescription to DESCRIPTIONS-01.

## 2026-10-05 —  Concrete example for ambiguous rule citations
- T30 cited only ERR-03 in one run and ERR-03, CAPS-01, and PUNCTUATION-01 in the next: consistent within a run, but flipped between runs.
- Cause: the guideline didn't say which rule "required" a complete rewrite.
- Added an example: when ERR-03's "Couldn't…" pattern rewrites the whole text, list only ERR-03.

## 2026-10-05 —  Keep the principle, add the example under it
- My first edit replaced the general guideline ("list only the rule that required the change") with the ERR-03 example.
- The next run regressed: T17 cited an extra rule, and T02 rewrote text with no rules at all.
- Fixed by restoring the principle with the example under it, plus "If you change the text, list at least one rule."
- Why: replacing a general rule with a specific example made Claude handle only that example's case. The tests caught it the same day.

## 2026-10-05 —  Formatting rules can be cited or not after a rewrite
- T08 and T09 were the same situation (a full rewrite that also dropped a period), but Claude cited PUNCTUATION-01 in one and not the other.
- The rewrites were correct either way; only the citation varied.
- The runner now tolerates CAPS-01 and PUNCTUATION-01 being cited or not when another rule also changed the text. When they're the only expected rules, they must still match exactly.
- Why: failing correct rewrites over an unclear, low-stakes citation would make the test less useful, not more.

## 2026-10-05 —  Optional rules in the test set ("?")
- T17: "Changes saved to server" is only 4 words, so TOASTS-01 didn't require removing "server". One run cited TONE-02 for it; the next three didn't.
- Both readings are defensible: removing "server" is shortening or plain language.
- A rule ending in "?" in `expected_rules` (T17: `TOASTS-01, TONE-02?`) now passes whether or not Claude cites it.
- Why: marks the specific rows where I've accepted ambiguity, instead of loosening every test.

## 2026-10-05 —  Open issue: a rewrite with no rules
- T10 run 1 rewrote the text but cited no rules, even with "list at least one rule" in the prompt (1 of 3 runs).
- A prompt makes this less likely but can't guarantee it.
- Options: return no rewrites when nothing changes, so every rewrite must list at least one rule (enforced by the output schema, if structured outputs support it), or retry once in the API route when it happens.

## 2026-10-05 —  Phase 6 result so far
- First full 3-run pass after tuning: 28 of 30 rows pass every run (up from 22), about $0.91.
- Every failure so far has been one of four kinds: an outdated test, an ambiguous prompt, a genuinely ambiguous rule, or a guarantee that needs code instead of a prompt.

## 2026-10-05 —  Every rewrite must cite a rule (schema, not prompt)
- T10 once rewrote text with no rules, even with "list at least one rule" in the prompt.
- Changed the output: when text already follows the rules, Claude returns no rewrites. Every rewrite must list at least one rule.
- The output schema enforces this (minimum 1 rule), so a change with no reason can't happen anymore.
- Why: a prompt makes a mistake less likely; a schema makes it impossible. Use the schema for guarantees.

## 2026-10-05 —  BUTTONS-01: verb only when the object is clear
- T16 ("Execute Query"): Claude gave "Run query"; my ideal was "Run". T01 and T11 had the same question.
- The rule didn't say when to keep the object, so a human writer would face the same question.
- Clarified BUTTONS-01: use just the verb when the screen makes the object clear, like Save, Submit, or Run.
- Retested T01, T11, T16: 3 of 3 each. But Claude still often offers verb + object as a second option (e.g. "Save changes" next to "Save"); the runner passes a row if any option matches.
- Why: clarifying the rule helps writers too; making the test lenient would only have hidden the question.

## 2026-10-05 —  An outdated prompt example overrode a new rule
- After clarifying BUTTONS-01, Claude still offered "Save changes" next to "Save".
- Cause: the prompt's Output section allowed several options "such as how short a button label should be", written before BUTTONS-01 settled that question.
- Replaced the example with a choice the rules really leave open: whether the user can fix an error (ERR-01) or not (ERR-03).
- Added: don't offer an option that breaks a rule.
- Why: the second time today an example in the prompt changed Claude's behavior more than the instructions around it. Examples need updating when rules change.

## 2026-10-05 —  Diagnostics and a retry guard
- One run returned a rewrite with no rules, which the schema should make impossible. The server log was lost when it restarted, so the cause couldn't be traced.
- Most likely the dev server was running an old copy of the schema. After a restart, 6 runs in a row were correct.
- Added: every response reports which model answered; a rewrite with no rules is logged and retried once; schema mismatches get a clear error.
- The test report now shows fallback answers and retries.
- Why: when something that should be impossible happens, make it visible and recoverable instead of guessing.
- Lesson: restart the dev server after changing files in `web/lib/` before running tests.

## 2026-10-05 —  ERR-02: what counts as blame
- T20: Claude sometimes changed "Your card was declined" to "This card was declined", citing ERR-02. It happened in 2 separate test runs.
- Clarified ERR-02: say what happened, not what the user did wrong. "Your card was declined" is fine; "You entered the wrong card number" isn't.
- T20 and T02 pass 3 of 3 afterwards.

## 2026-10-05 —  Phase 6 result
- Final full run: 29 of 30 rows pass every run, 0 fallback answers, 0 retries, about $0.85 for 90 requests. The remaining row (T20) was fixed by clarifying ERR-02.
- Up from 22 of 30 on the first run the same day.

## 2026-10-05 —  Quotes inside the rules file
- The new ERR-02 wording used straight double quotes inside the rule, which broke the JSON.
- The API still worked (it sends the file as text), but the home page would have failed. The production build caught it.
- Use single quotes for examples inside rule text. Run the checker after every rules edit.

## 2026-10-05 —  Deploying: rules stay outside the app
- Considered: moving `content/` into `web/`. Kept it outside, so the rules stay separate from the interface.
- `next.config.ts` tells the build to include `../content`, and Vercel includes files outside the root directory in the build.
- Checked with a local production build before deploying.

## 2026-10-05 —  Protecting the API credit on the live site
- Anyone with the link could otherwise use the tool, charged to my account.
- An access code is required on the live site only (set in Vercel); locally no code is needed. The code is remembered in the browser so reviewers enter it once.
- A monthly spend limit in the Claude Console caps the worst case.
- A separate API key for the live site, so it can be replaced without affecting local development, and its usage shows on its own.
- Checked on the live site: requests with no code or a wrong code are rejected before reaching Claude.

## 2026-10-05 —  Public repository
- The repository is public so people can read the rules, decision log, and test reports.
- The README is written for visitors; the build roadmap moved to `notes/roadmap.md`.
- Checked every screenshot before publishing. One showed my email on another site's sign-in page, so it's excluded with `.gitignore`.
- Checked the git history: no API key was ever committed.
