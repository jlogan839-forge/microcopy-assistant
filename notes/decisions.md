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
- No punctation is included in titles
- Punctuation is included in descriptions, including field errors.

## 2026-09-29 — shadcn base library: Base UI
- Considered: Radix (shadcn's default).
- Why: Using Base UI to support more detail component parts like ProgressLabel.

## 2026-09-30 —  Created page titles and descriptions
- shadcn has no page header
- named ours PageTitle/PageDescription to match the Title/Description pattern

## 2026-09-30 —  Parent name covers its parts
- A parent name (Alert) covers its parts (AlertTitle, AlertDescription). 
- If a rule lists components and message types, both must match.

## 2026-09-30 —  Flagging instead of inventing facts
- When interaction details or contextual info is missing, flagged instead of making assumptions
- Because a wrong guess can be worse than a missing detail: it puts false information in the product

## 2026-09-30 —  Expected rules
- Expected rules are rules applied only when there is a change in the rewrite based on the expected rule
- If there are no changes, expected rules doesn't apply
- Because listing every rule that could apply makes the test pass too easily and fills the tool's explanations with noise

## 2026-09-30 —  Expected flags
- Expected flags column added so flags are testable

## 2026-09-30 —  PAGE-01 description added
- Based on refining test set, added PAGE-01 Description
- Drops page types from page titles.



