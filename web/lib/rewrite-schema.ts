import { z } from "zod";

export const RewriteResult = z.object({
  original: z.string(),
  rewrites: z.array(
    z.object({
      text: z.string(),
      rulesApplied: z.array(z.string()),
      rationale: z.string(),
    }),
  ),
  flags: z.array(z.string()),
  suggestedComponent: z.string().nullable(),
});

export type RewriteResult = z.infer<typeof RewriteResult>;