"use client";

import {
  ArrowRightLeftIcon,
  CircleCheckIcon,
  CircleHelpIcon,
  CopyIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Part, RewriteResponse } from "@/lib/rewrite-schema";
import { DiffView } from "./diff-view";

function sameParts(a: Part[], b: Part[]) {
  return (
    a.length === b.length &&
    a.every((part) => b.find((other) => other.name === part.name)?.text === part.text)
  );
}

export function RewriteResultView({ result }: { result: RewriteResponse }) {
  const unchanged =
    result.rewrites.length === 0 ||
    (result.rewrites.length === 1 && sameParts(result.rewrites[0].parts, result.original));

  // Match each rewritten part to the original part with the same name. If the
  // names differ (e.g. a suggested component), fall back to the same position.
  function originalFor(name: string, index: number) {
    const byName = result.original.find((part) => part.name === name);
    return byName?.text ?? result.original[index]?.text ?? "";
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied");
    } catch {
      toast.error("Couldn't copy text");
    }
  }

  return (
    <section aria-label="Results" className="flex flex-col gap-4">
      {result.suggestedComponent && (
        <Alert>
          <ArrowRightLeftIcon />
          <AlertTitle>Use {result.suggestedComponent} instead</AlertTitle>
          <AlertDescription>
            The style guide puts this kind of message in a different component.
          </AlertDescription>
        </Alert>
      )}

      {unchanged ? (
        result.flags.length > 0 ? (
          <Alert>
            <CircleHelpIcon />
            <AlertTitle>No rewrite yet</AlertTitle>
            <AlertDescription>
              Add the details listed below, then check the text again.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert variant="success">
            <CircleCheckIcon />
            <AlertTitle>Follows the style guide</AlertTitle>
            <AlertDescription>No changes needed.</AlertDescription>
          </Alert>
        )
      ) : (
        result.rewrites.map((rewrite, index) => (
          <Card key={index}>
            <CardHeader>
              {result.rewrites.length > 1 && (
                <CardDescription>Option {index + 1}</CardDescription>
              )}
              {rewrite.parts.length === 1 ? (
                <CardTitle className="text-lg">{rewrite.parts[0].text}</CardTitle>
              ) : (
                <dl className="flex flex-col gap-2">
                  {rewrite.parts.map((part, partIndex) => (
                    <div key={part.name}>
                      <dt className="text-xs text-muted-foreground">{part.name}</dt>
                      <dd className={partIndex === 0 ? "text-lg font-medium" : ""}>
                        {part.text}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
              <CardAction>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copy(rewrite.parts.map((part) => part.text).join("\n"))}
                >
                  <CopyIcon />
                  Copy
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="text-sm">
                <p className="mb-1 text-xs font-medium">Changes</p>
                {rewrite.parts.length === 1 ? (
                  <DiffView before={originalFor(rewrite.parts[0].name, 0)} after={rewrite.parts[0].text} />
                ) : (
                  <dl className="flex flex-col gap-1">
                    {rewrite.parts.map((part, partIndex) => (
                      <div key={part.name}>
                        <dt className="inline font-medium">{part.name}: </dt>
                        <dd className="inline">
                          <DiffView before={originalFor(part.name, partIndex)} after={part.text} />
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{rewrite.rationale}</p>
              {rewrite.rulesApplied.length > 0 && (
                <ul aria-label="Rules applied" className="flex flex-wrap gap-2">
                  {rewrite.rulesApplied.map((id) => (
                    <li key={id}>
                      <Badge variant="secondary">{id}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ))
      )}

      {result.flags.length > 0 && (
        <Alert variant="warning">
          <TriangleAlertIcon />
          <AlertTitle>Needs more information</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4">
              {result.flags.map((flag) => (
                <li key={flag}>{flag}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </section>
  );
}