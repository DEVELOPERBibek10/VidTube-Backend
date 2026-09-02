import z from "zod";
import { validateId } from "../utils/validateId.js";

export const createWatchHistorySchema = z.object({
  body: z.object({
    videoId: z
      .string()
      .trim()
      .refine((value) => validateId(value), {
        message: "Invalid videoId",
      }),
    watchTime: z.coerce
      .number({ message: "Watch time must be a valid number." })
      .min(0, { message: "Watch time cannot be negative." }),
  }),
});

export const fetchWatchHistorySchema = z.object({
  query: z.object({
    historyId: z
      .string()
      .trim()
      .refine((value) => validateId(value), {
        message: "Invalid historyId",
      })
      .optional(),
  }),
});

export const deleteWatchHistorySchema = z.object({
  params: z.object({
    historyId: z
      .string()
      .trim()
      .refine((value) => validateId(value), {
        message: "Invalid historyId",
      }),
  }),
});

export type CreateWatchHistorySchema = z.infer<
  typeof createWatchHistorySchema
>["body"];
export type FetchWatchHistorySchema = z.infer<
  typeof fetchWatchHistorySchema
>["query"];
export type DeleteWatchHistorySchema = z.infer<
  typeof deleteWatchHistorySchema
>["params"];
