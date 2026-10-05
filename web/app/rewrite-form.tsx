"use client";

import { useState, type FormEvent } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { partsFor } from "@/lib/component-fields";
import type { RewriteResponse } from "@/lib/rewrite-schema";
import { RewriteResultView } from "./rewrite-result";

type ResultState = RewriteResponse | { error: string } | null;

// Text is stored by part name, so switching between components that share
// a part (like Alert and Dialog, which both have a Title) keeps what was typed.
type PartValues = Record<string, { text: string; charLimit: string }>;

type Props = {
  components: string[];
  messageTypes: string[];
};

export function RewriteForm({ components, messageTypes }: Props) {
  const [component, setComponent] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<string | null>(null);
  const [values, setValues] = useState<PartValues>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResultState>(null);

  const parts = component ? partsFor(component) : [];
  const filledParts = parts
    .map((part) => ({
      name: part.name,
      component: part.ruleName,
      text: values[part.name]?.text.trim() ?? "",
      charLimit: Number(values[part.name]?.charLimit) || undefined,
    }))
    .filter((part) => part.text);

  function updatePart(name: string, change: Partial<PartValues[string]>) {
    setValues((current) => ({
      ...current,
      [name]: { ...(current[name] ?? { text: "", charLimit: "" }), ...change },
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch("/api/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          component,
          messageType: messageType ?? undefined,
          parts: filledParts,
        }),
      });
      setResult(await response.json());
    } catch {
      setResult({ error: "Couldn't reach the server." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="component">Component</FieldLabel>
          <Select value={component} onValueChange={setComponent}>
            <SelectTrigger id="component" className="w-full">
              <SelectValue placeholder="Choose a component" />
            </SelectTrigger>
            <SelectContent>
              {components.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel htmlFor="message-type">Message type</FieldLabel>
          <Select value={messageType} onValueChange={setMessageType}>
            <SelectTrigger id="message-type" className="w-full">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>None</SelectItem>
              {messageTypes.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      {parts.length === 0 ? (
        <p className="text-sm text-muted-foreground">Choose a component to start.</p>
      ) : (
        parts.map((part, index) => (
          <div key={part.name} className="grid gap-3 sm:grid-cols-[1fr_9rem]">
            <Field>
              <FieldLabel htmlFor={`part-${index}`}>{part.name}</FieldLabel>
              <Textarea
                id={`part-${index}`}
                value={values[part.name]?.text ?? ""}
                onChange={(event) => updatePart(part.name, { text: event.target.value })}
                rows={2}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={`limit-${index}`}>
                Max characters<span className="sr-only"> for {part.name}</span>
              </FieldLabel>
              <Input
                id={`limit-${index}`}
                type="number"
                min={1}
                value={values[part.name]?.charLimit ?? ""}
                onChange={(event) => updatePart(part.name, { charLimit: event.target.value })}
              />
              <FieldDescription>Optional</FieldDescription>
            </Field>
          </div>
        ))
      )}

      <Button
        type="submit"
        disabled={!component || filledParts.length === 0 || loading}
        className="self-start"
      >
        {loading && <Spinner />}
        {loading ? "Checking" : "Check text"}
      </Button>

      {result && "error" in result && (
        <Alert variant="destructive">
          <AlertTitle>Couldn&rsquo;t check text</AlertTitle>
          <AlertDescription>{result.error}</AlertDescription>
        </Alert>
      )}
      {result && !("error" in result) && <RewriteResultView result={result} />}
    </form>
  );
}
