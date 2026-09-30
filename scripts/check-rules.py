"""Check content/style-guide-rules.json for mistakes the app would trip on.

Run from anywhere:  python3 ~/microcopy-assistant/scripts/check-rules.py
"""
import json
import re
import sys
from pathlib import Path

RULES_FILE = Path(__file__).resolve().parent.parent / "content" / "style-guide-rules.json"
REQUIRED = ["id", "category", "rule", "do", "dont"]
ID_PATTERN = re.compile(r"^[A-Z]+-\d{2}$")  # e.g. ERR-01

problems = []

try:
    data = json.loads(RULES_FILE.read_text())
except json.JSONDecodeError as e:
    print(f"✗ Not valid JSON: line {e.lineno}, column {e.colno}: {e.msg}")
    sys.exit(1)

components = set(data.get("components", []))
message_types = set(data.get("messageTypes", []))
rules = data.get("rules", [])
seen_ids = set()
seen_examples = {}

for rule in rules:
    rid = rule.get("id", "(missing id)")

    for field in REQUIRED:
        if not rule.get(field):
            problems.append(f"{rid}: missing '{field}'")

    if not ID_PATTERN.match(rid):
        problems.append(f"{rid}: id should look like CATEGORY-01 (capitals, dash, two digits)")
    if rid in seen_ids:
        problems.append(f"{rid}: id used more than once")
    seen_ids.add(rid)

    # Old single-list format: each name must be a known component OR message type.
    # "*" means the rule applies to every component.
    for name in rule.get("appliesTo", []):
        if name == "*":
            continue
        if name not in components and name not in message_types:
            problems.append(f"{rid}: '{name}' in appliesTo isn't in the components or messageTypes list")

    # New split format
    for name in rule.get("components", []):
        if name not in components:
            problems.append(f"{rid}: component '{name}' isn't in the components list")
    for name in rule.get("messageTypes", []):
        if name not in message_types:
            problems.append(f"{rid}: message type '{name}' isn't in the messageTypes list")

    if not (rule.get("appliesTo") or rule.get("components") or rule.get("messageTypes")):
        problems.append(f"{rid}: doesn't say what it applies to")

    example = (rule.get("do"), rule.get("dont"))
    if example in seen_examples:
        problems.append(f"{rid}: same do/dont examples as {seen_examples[example]}")
    else:
        seen_examples[example] = rid

if problems:
    print(f"✗ {len(problems)} problem(s) in {len(rules)} rules:\n")
    for p in problems:
        print(f"  • {p}")
    sys.exit(1)

print(f"✓ {len(rules)} rules, no problems found")
