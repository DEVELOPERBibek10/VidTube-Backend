import z from "zod";
import { validateId } from "../utils/validateId.js";

const videoLikeSchema = z.strictObject({
  params: z.strictObject({
    videoId: z
      .string()
      .trim()
      .refine((value) => validateId(value)),
  }),
});

const commentLikeSchema = z.strictObject({
  params: z.strictObject({
    commentId: z
      .string()
      .trim()
      .refine((value) => validateId(value)),
  }),
});

export { videoLikeSchema, commentLikeSchema };
export type VideoLikeSchema = z.infer<typeof videoLikeSchema>["params"];
export type CommentLikeSchema = z.infer<typeof commentLikeSchema>["params"];
