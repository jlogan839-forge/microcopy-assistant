import { readFile } from "node:fs/promises";
import path from "node:path";
import { RewriteForm } from "./rewrite-form";

export default async function Home() {
  const file = await readFile(
    path.join(process.cwd(), "..", "content", "style-guide-rules.json"),
    "utf8",
  );
  const { components, messageTypes } = JSON.parse(file) as {
    components: string[];
    messageTypes: string[];
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Microcopy assistant</h1>
      <p className="mt-1 text-muted-foreground">
        Paste UI text to check it against the style guide.
      </p>
      <RewriteForm
        components={components}
        messageTypes={messageTypes}
        needsAccessCode={Boolean(process.env.ACCESS_CODE)}
      />
    </main>
  );
}