import type { z } from "zod";
import { manifestShape } from "../errors.js";
import type { AdapterId } from "./types.js";

export function parseOrThrow<T>(
  schema: z.ZodType<T>,
  data: unknown,
  adapter: AdapterId,
): T {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  const issue = result.error.issues[0];
  const path =
    issue && issue.path.length > 0
      ? issue.path.map(String).join(".")
      : "<root>";
  throw manifestShape(adapter, path, issue?.message ?? "invalid data");
}
