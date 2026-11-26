import z from "zod";
import { validateId } from "../utils/validateId.js";

const createCommentSchema = z.strictObject({
  params: z.strictObject({
    videoId: z
      .string()
      .trim()
      .refine((value) => validateId(value), {
        error: "Invalid videoId",
      }),
  }),
  body: z.strictObject({
    content: z.string().trim().min(1, { error: "content is required." }),
    parentComment: z
      .string()
      .trim()
      .refine((value) => validateId(value), {
        error: "Invalid parentComment",
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
        error: "Invalid videoId",
      }),
    cursor: z
      .string()
      .trim()
      .refine((value) => validateId(value), {
        error: "Invalid cursor",
      })
      .optional(),
    parentComment: z
      .string()
      .trim()
      .refine((value) => validateId(value), {
        error: "Invalid parentComment",
      })
      .optional(),
  }),
});

const editCommentSchema = z.object({
  params: z.strictObject({
    commentId: z
      .string()
      .trim()
      .refine((value) => validateId(value), {
        error: "Invalid commentId",
      })
      .min(1, { error: "commentId is required." }),
  }),
  body: z.strictObject({
    content: z.string().trim().min(1, { error: "content is required." }),
  }),
});

const deleteCommentSchema = z.object({
  params: z.strictObject({
    commentId: z
      .string()
      .trim()
      .refine((value) => validateId(value), {
        error: "Invalid commentId",
      }),
  }),
});

export {
  createCommentSchema,
  fetchCommentsSchema,
  editCommentSchema,
  deleteCommentSchema,
};

export type CreateCommentSchema = z.infer<typeof createCommentSchema>["body"];
export type CreateCommentParamsSchema = z.infer<
  typeof createCommentSchema
>["params"];
export type FetchCommentsSchema = z.infer<typeof fetchCommentsSchema>["query"];
export type EditCommentSchema = z.infer<typeof editCommentSchema>;
export type DeleteCommentSchema = z.infer<typeof deleteCommentSchema>["params"];
