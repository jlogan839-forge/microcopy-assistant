import { z } from "zod";

// What the form sends to the API route.
export const RewriteRequest = z.object({
  component: z.string().min(1),
  messageType: z.string().optional(),
  parts: z
    .array(
      z.object({
        name: z.string(),
        component: z.string(),
        text: z.string().min(1),
        charLimit: z.number().int().positive().optional(),
      }),
    )
    .min(1),
});

export type RewriteRequest = z.infer<typeof RewriteRequest>;

const Part = z.object({
  name: z.string(),
  text: z.string(),
});

export type Part = z.infer<typeof Part>;

// What Claude must return.
export const RewriteResult = z.object({
  rewrites: z.array(
    z.object({
      parts: z.array(Part),
      rulesApplied: z.array(z.string()),
      rationale: z.string(),
    }),
  ),
  flags: z.array(z.string()),
  suggestedComponent: z.string().nullable(),
});

export type RewriteResult = z.infer<typeof RewriteResult>;

// Token counts for one request, used by the test runner to estimate cost.
export type Usage = { input: number; cacheRead: number; cacheWrite: number; output: number };

// What the API route sends back to the page: Claude's result plus the original parts.
export type RewriteResponse = RewriteResult & { original: Part[]; usage?: Usage };
