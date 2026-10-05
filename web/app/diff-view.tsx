import { diffWords } from "diff";

// Above this share of changed characters, a word-by-word diff is mostly
// strikethrough followed by new text, which is harder to read than the rewrite.
const MOSTLY_REWRITTEN = 0.7;

type Segment = { text: string } | { removed: string; added: string };

// Group the diff into unchanged text and change pairs (removed + added).
// When a change is only punctuation, like an added period, a lone "." is
// nearly invisible, so the change borrows the word before it: "you" → "you."
function toSegments(before: string, after: string): Segment[] {
  const segments: Segment[] = [];
  for (const change of diffWords(before, after)) {
    const last = segments.at(-1);
    if (!change.added && !change.removed) {
      segments.push({ text: change.value });
    } else if (last && "removed" in last) {
      if (change.removed) last.removed += change.value;
      else last.added += change.value;
    } else {
      segments.push({
        removed: change.removed ? change.value : "",
        added: change.added ? change.value : "",
      });
    }
  }

  for (let i = 1; i < segments.length; i++) {
    const segment = segments[i];
    const previous = segments[i - 1];
    const punctuationOnly = /^[^\p{L}\p{N}]*$/u;
    if (
      "removed" in segment &&
      "text" in previous &&
      punctuationOnly.test(segment.removed + segment.added)
    ) {
      const word = previous.text.match(/\S+$/)?.[0];
      if (word) {
        previous.text = previous.text.slice(0, -word.length);
        segment.removed = word + segment.removed;
        segment.added = word + segment.added;
      }
    }
  }
  return segments;
}

export function DiffView({ before, after }: { before: string; after: string }) {
  if (before === after) {
    return <span>No changes</span>;
  }

  const segments = toSegments(before, after);
  const changed = segments.reduce(
    (total, segment) =>
      "removed" in segment ? total + segment.removed.length + segment.added.length : total,
    0,
  );

  if (changed / (before.length + after.length) > MOSTLY_REWRITTEN) {
    return (
      <span>
        <span>Rewritten from: </span>
        <del className="decoration-foreground/60">{before}</del>
      </span>
    );
  }

  return (
    <span>
      {segments.map((segment, index) =>
        "text" in segment ? (
          <span key={index}>{segment.text}</span>
        ) : (
          <span key={index}>
            {segment.removed && (
              <del className="decoration-foreground/60">
                <span className="sr-only">removed: </span>
                {segment.removed}
              </del>
            )}
            {segment.removed && segment.added && " "}
            {segment.added && (
              <ins className="rounded-sm bg-success-subtle underline decoration-success decoration-2 underline-offset-2">
                <span className="sr-only">added: </span>
                {segment.added}
              </ins>
            )}
          </span>
        ),
      )}
    </span>
  );
}
