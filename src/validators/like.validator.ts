import { Types } from "mongoose";
import z from "zod";
import { validateId } from "../utils/validateId.js";

const videoLikeSchema = z.object({
  params: z.object({
    videoId: z
      .string()
      .trim()
      .refine((value) => validateId(value)),
  }),
});

const commentLikeSchema = z.object({
  params: z.object({
    commentId: z
      .string()
      .trim()
      .refine((value) => validateId(value)),
  }),
});

export { videoLikeSchema, commentLikeSchema };
export type VideoLikeSchema = z.infer<typeof videoLikeSchema>["params"];
export type CommentLikeSchema = z.infer<typeof commentLikeSchema>["params"];
