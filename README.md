# Microcopy Assistant

Rewrites UI text against a content style guide, and explains which rules each change applies.

## Project layout

```
microcopy-assistant/
├── README.md               ← you are here: the roadmap
├── content/                ← the "brain": rules, prompt, tests (no code)
│   ├── style-guide-rules.json
│   ├── output-schema.json
│   ├── system-prompt.md
│   └── test-set.csv
├── notes/
│   └── decisions.md        ← log of choices + why (becomes your case study)
└── web/                    ← Next.js app (you create this in Phase 3)
```

`content/` is kept separate from `web/` on purpose: the rules and prompt are
the product; the app is just a way to use them.

## Roadmap

### Phase 1 — Rules (no code)
- [x] Turn your style guide into rules in `content/style-guide-rules.json`
      (start with 10; each needs an id, rule, and do/don't example)
- [x] Log anything you had to interpret or decide in `notes/decisions.md`

### Phase 2 — Test set (no code)
- [x] Collect 30–50 real UI strings in `content/test-set.csv`
- [x] Write your ideal rewrite for each, and which rule ids apply

### Phase 3 — Scaffold the app
- [x] Create the Next.js app in `web/` with Tailwind
- [x] Add shadcn/ui and the components you need
- [x] Run it locally and see the starter page

### Phase 4 — Talk to Claude
- [x] Get an Anthropic API key, store it in `web/.env.local`
- [x] Build an API route that sends rules + input text to Claude
- [x] Return JSON that matches `content/output-schema.json`

### Phase 5 — Interface
- [ ] Input: textarea, component type, character limit
- [ ] Output: rewrite options, before/after diff, rule badges, copy button

### Phase 6 — Evaluate & ship
- [ ] Run the test set, compare to your ideal rewrites, tune the prompt
- [ ] Deploy to Vercel, link from your portfolio
