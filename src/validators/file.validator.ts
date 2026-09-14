import { z } from "zod";

export const noRequestDataSchema = z.strictObject({});

export const multerFileSchema = z.object({
  fieldname: z.string(),
  originalname: z.string(),
  encoding: z.string(),
  mimetype: z.enum(["image/jpeg", "image/png", "image/webp"]),
  size: z.number().max(5 * 1024 * 1024),
  destination: z.string(),
  filename: z.string(),
  path: z.string(),
  buffer: z.instanceof(Buffer).optional(),
});

export const avatarSchema = z.strictObject({
  file: multerFileSchema,
});
export const coverImageSchema = z.strictObject({
  file: multerFileSchema,
});
export const thumbnailSchema = z.strictObject({
  file: multerFileSchema,
});
