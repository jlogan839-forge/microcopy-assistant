"use client";

import { useState, type FormEvent } from "react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { RewriteResult } from "@/lib/rewrite-schema";
import { RewriteResultView } from "./rewrite-result";

type ResultState = RewriteResult | { error: string } | null;

type Props = {
  components: string[];
  messageTypes: string[];
};

export function RewriteForm({ components, messageTypes }: Props) {
  const [text, setText] = useState("");
  const [component, setComponent] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<string | null>(null);
  const [charLimit, setCharLimit] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResultState>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch("/api/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          component,
          messageType: messageType ?? undefined,
          charLimit: charLimit ? Number(charLimit) : undefined,
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
      <Field>
        <FieldLabel htmlFor="text">UI text</FieldLabel>
        <Textarea
          id="text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={3}
          required
        />
      </Field>

      <div className="grid gap-6 sm:grid-cols-3">
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

        <Field>
          <FieldLabel htmlFor="char-limit">Character limit</FieldLabel>
          <Input
            id="char-limit"
            type="number"
            min={1}
            value={charLimit}
            onChange={(event) => setCharLimit(event.target.value)}
          />
          <FieldDescription>Optional</FieldDescription>
        </Field>
      </div>

      <Button type="submit" disabled={!text || !component || loading} className="self-start">
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