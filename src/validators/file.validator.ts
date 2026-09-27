import { z } from "zod";
import { Readable } from "node:stream";

export const multerFileSchema = z.object({
  fieldname: z.string(),
  originalname: z.string(),
  encoding: z.string(),
  mimetype: z.enum(["image/jpeg", "image/png", "image/webp"]),
  size: z.number().max(5 * 1024 * 1024),
  stream: z.instanceof(Readable),
  destination: z.string(),
  filename: z.string(),
  path: z.string(),
  buffer: z.instanceof(Buffer).optional(),
});

export const avatarSchema = z.object({
  file: multerFileSchema,
});
export const coverImageSchema = z.object({
  file: multerFileSchema,
});
export const thumbnailSchema = z.object({
  file: multerFileSchema,
});
