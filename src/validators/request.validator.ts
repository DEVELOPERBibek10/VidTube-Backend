import { z } from "zod";

export const noRequestDataSchema = z.strictObject({});

export const fileRequestSchema = z.strictObject({
  file: z.unknown(),
});
