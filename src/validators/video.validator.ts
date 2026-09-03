import { Types } from "mongoose";
import { z } from "zod";
import { validateId } from "../utils/validateId.js";

export const videoRequestSchema = z.object({
  body: z.object({
    title: z
      .string()
      .trim()
      .min(2, { error: "Title must be at least 2 characters." })
      .max(100, { error: "Title cannot exceed 100 characters." }),

    description: z
      .string()
      .trim()
      .max(300, { error: "Description must be less than 300 characters" })
      .optional(),

    videoUrl: z.string().trim().min(1, { error: "Video url is required." }),

    videoPublicId: z
      .string()
      .trim()
      .min(1, { error: "Public Id is required." }),

    duration: z.coerce
      .number({ message: "Video duration must be a valid number." })
      .min(1, { message: "Video duration must be at least 1." }),
    isPublished: z
      .enum(["true", "false"], {
        error: "Please provide a valid status",
      })
      .transform((val) => val === "true"),
  }),
});

export const updateVideoSchema = z.object({
  body: z
    .object({
      title: z
        .string()
        .trim()
        .min(2, { error: "Title must be at least 2 characters." })
        .max(100, { error: "Title cannot exceed 100 characters." })
        .optional(),

      description: z
        .string()
        .trim()
        .max(400, { error: "Description cannot exceed 400 characters." })
        .optional(),

      isPublished: z
        .enum(["true", "false"], {
          error: "Please provide a valid status",
        })
        .transform((val) => val === "true")
        .optional(),
    })
    .refine((data) => data.title || data.description || data.isPublished, {
      error:
        "You must provide at least a title or a description or visibility status to update.",
    }),
});

export const updateVideoParamsSchema = z.object({
  params: z.object({
    videoId: z
      .string()
      .trim()
      .refine((value) => validateId(value), {
        message: "Invalid videoId",
      }),
  }),
});

export const videoQuerySchema = z.object({
  query: z.object({
    videoId: z
      .string()
      .trim()
      .refine((value) => validateId(value), {
        message: "Invalid videoId",
      })
      .optional(),
    userId: z
      .string()
      .trim()
      .refine((value) => validateId(value), {
        message: "Invalid userId",
      })
      .optional(),
  }),
});

export const getSuggestionsSchema = z.object({
  query: z.object({
    title: z
      .string()
      .trim()
      .max(50, { error: "Search query cannot exceed 50 characters." }),
  }),
});

const videoSearchQuerySchema = z.object({
  query: z
    .object({
      searchQuery: z
        .string()
        .trim()
        .max(50, { error: "Search query cannot exceed 50 characters." })
        .optional(),
      queryHash: z
        .string()
        .trim()
        .max(32, { error: "Query hash cannot exceed 32 characters." })
        .regex(/^[a-f0-9]+$/, {
          message: "Query hash must be a valid hash.",
        })
        .optional(),
      page: z.coerce
        .number({ message: "Page must be a valid number." })
        .positive({ message: "Page must be a positive integer." }),
    })
    .refine((data) => data.searchQuery || data.queryHash, {
      message: "You must provide either a search query or a query hash.",
    }),
});

export type VideoUploadSchema = z.infer<typeof videoRequestSchema>["body"];
export type UpdateVideoSchema = z.infer<typeof updateVideoSchema>["body"];
export type UpdateVideoParamsSchema = z.infer<
  typeof updateVideoParamsSchema
>["params"];
export type VideoQuerySchema = z.infer<typeof videoQuerySchema>["query"];
export type GetSuggestionsSchema = z.infer<
  typeof getSuggestionsSchema
>["query"];
export type VideoSearchQuerySchema = z.infer<
  typeof videoSearchQuerySchema
>["query"];
