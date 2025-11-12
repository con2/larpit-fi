import z from "zod";

export const PageForm = z.object({
  slug: z.string().min(1).max(200),
  language: z.string().min(2).max(2),
  title: z.string().min(1),
  content: z.string().optional().default(""),
});
