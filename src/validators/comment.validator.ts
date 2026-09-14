import z from "zod";
import { validateId } from "../utils/validateId.js";

const createCommentSchema = z.strictObject({
  body: z.strictObject({
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

const fetchCommentsSchema = z.strictObject({
  query: z.strictObject({
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

const editCommentSchema = z.strictObject({
  params: z.strictObject({
    commentId: z
      .string()
      .trim()
      .refine((value) => validateId(value), {
        message: "Invalid commentId",
      })
      .min(1, { error: "commentId is required." }),
  }),
  body: z.strictObject({
    content: z.string().trim().min(1, { error: "content is required." }),
  }),
});

const deleteCommentSchema = z.strictObject({
  params: z.strictObject({
    commentId: z
      .string()
      .trim()
      .refine((value) => validateId(value), {
        message: "Invalid commentId",
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
export type FetchCommentsSchema = z.infer<typeof fetchCommentsSchema>["query"];
export type EditCommentSchema = z.infer<typeof editCommentSchema>;
export type DeleteCommentSchema = z.infer<typeof deleteCommentSchema>["params"];
