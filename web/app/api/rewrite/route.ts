import { readFile } from "node:fs/promises";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { RewriteRequest, RewriteResult, type RewriteResponse } from "@/lib/rewrite-schema";

const client = new Anthropic();
const contentDir = path.join(process.cwd(), "..", "content");

export async function POST(request: Request) {
  const input = RewriteRequest.safeParse(await request.json());
  if (!input.success) {
    return Response.json({ error: "Choose a component and enter some text." }, { status: 400 });
  }
  const { component, messageType, parts } = input.data;

  const [prompt, rules] = await Promise.all([
    readFile(path.join(contentDir, "system-prompt.md"), "utf8"),
    readFile(path.join(contentDir, "style-guide-rules.json"), "utf8"),
  ]);
  const system = prompt.replace("{{RULES}}", rules);

  const details = [`Component: ${component}`];
  if (messageType) details.push(`Message type: ${messageType}`);
  const partBlocks = parts.map((part) => {
    const limit = part.charLimit ? ` char_limit="${part.charLimit}"` : "";
    return `<part name="${part.name}" component="${part.component}"${limit}>\n${part.text}\n</part>`;
  });
  const userMessage = `${details.join("\n")}\n\n${partBlocks.join("\n")}`;

  const ask = () =>
    client.beta.messages.parse({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      output_config: { effort: "medium", format: betaZodOutputFormat(RewriteResult) },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      // The prompt and rules are the same on every request, so cache them:
      // repeat requests read them from the cache at a fraction of the price.
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: userMessage }],
    });

  try {
    let response = await ask();
    let retried = false;

    // The schema requires at least one rule per rewrite, so this shouldn't
    // happen. If it does, log what we know and ask once more, so a writer
    // never sees a change with no reason.
    const unexplained = (output: typeof response.parsed_output) =>
      output?.rewrites.some((rewrite) => rewrite.rulesApplied.length === 0) ?? false;
    if (unexplained(response.parsed_output)) {
      console.warn("Rewrite with no rules; retrying once.", {
        id: response.id,
        model: response.model,
        stopReason: response.stop_reason,
        component,
      });
      response = await ask();
      retried = true;
      if (unexplained(response.parsed_output)) {
        return Response.json(
          { error: "Claude's rewrite didn't say which rules it applied. Try again." },
          { status: 502 },
        );
      }
    }

    if (response.stop_reason === "refusal") {
      return Response.json({ error: "Claude declined to rewrite this text." }, { status: 422 });
    }
    if (!response.parsed_output) {
      return Response.json({ error: "Claude's answer didn't match the expected format." }, { status: 502 });
    }
    const result: RewriteResponse = {
      original: parts.map(({ name, text }) => ({ name, text })),
      ...response.parsed_output,
      usage: {
        input: response.usage.input_tokens,
        cacheRead: response.usage.cache_read_input_tokens ?? 0,
        cacheWrite: response.usage.cache_creation_input_tokens ?? 0,
        output: response.usage.output_tokens,
        model: response.model,
        retried,
      },
    };
    return Response.json(result);
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      return Response.json({ error: `Claude API error: ${error.message}` }, { status: 502 });
    }
    // The SDK checks Claude's answer against the schema; log when it doesn't match.
    if (error instanceof Anthropic.AnthropicError) {
      console.warn("Claude's answer didn't match the schema.", error.message);
      return Response.json({ error: "Claude's answer didn't match the expected format." }, { status: 502 });
    }
    throw error;
  }
}
