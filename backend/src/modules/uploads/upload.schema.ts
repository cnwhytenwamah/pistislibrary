import { z } from "zod";

export const presignSchema = z.object({
  kind: z.enum(["book", "cover", "authorPhoto"]),
  contentType: z.string().trim().min(1).max(100),
  sizeBytes: z.number().int().positive(),
});

export type PresignInput = z.infer<typeof presignSchema>;
