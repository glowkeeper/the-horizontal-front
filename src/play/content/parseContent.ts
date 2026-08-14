import { z } from "zod";

export function parseContent<T>(
  label: string,
  schema: z.ZodType<T>,
  content: unknown,
): T {
  const result = schema.safeParse(content);
  if (result.success) return result.data;
  throw new Error(`${label} is invalid:\n${z.prettifyError(result.error)}`, {
    cause: result.error,
  });
}
