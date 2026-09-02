import z from "zod";
import { validateId } from "../utils/validateId.js";

const createCommentSchema = z.object({
  body: z.object({
    videoId: z
      .string()
      .trim()
      .refine((value) => validateId(value), {
        message: "Invalid videoId",
      }),
    content: z.string().trim().min(1, { error: "content is required." }),
    parentComment: z
      .string()
      .trim()
      .refine((value) => validateId(value), {
        message: "Invalid parentComment",
      })
      .optional(),
  }),
});

const fetchCommentsSchema = z.object({
  query: z.object({
    videoId: z
      .string()
      .trim()
      .refine((value) => validateId(value), {
        message: "Invalid videoId",
      }),
    cursor: z
      .string()
      .trim()
      .refine((value) => validateId(value), {
        message: "Invalid cursor",
      })
      .optional(),
    parentComment: z
      .string()
      .trim()
      .refine((value) => validateId(value), {
        message: "Invalid parentComment",
      })
      .optional(),
  }),
});

const editCommentSchema = z.object({
  params: z.object({
    commentId: z
      .string()
      .trim()
      .refine((value) => validateId(value), {
        message: "Invalid commentId",
      })
      .min(1, { error: "commentId is required." }),
  }),
  body: z.object({
    content: z.string().trim().min(1, { error: "content is required." }),
  }),
});

const deleteCommentSchema = z.object({
  params: z.object({
    commentId: z
      .string()
      .trim()
      .refine((value) => validateId(value), {
        message: "Invalid commentId",
      }),
  }),
});

export { createCommentSchema, fetchCommentsSchema, editCommentSchema };

export type CreateCommentSchema = z.infer<typeof createCommentSchema>["body"];
export type FetchCommentsSchema = z.infer<typeof fetchCommentsSchema>["query"];
export type EditCommentSchema = z.infer<typeof editCommentSchema>;
export type DeleteCommentSchema = z.infer<typeof deleteCommentSchema>["params"];
