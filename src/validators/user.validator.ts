import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    fullName: z
      .string()
      .trim()
      .min(3, { error: "Full name must be at least 3 characters" })
      .max(50, { error: "Full name cannot be more than 50 characters." }),

    email: z
      .email()
      .toLowerCase()
      .trim()
      .min(1, { error: "Email is required." }),

    username: z
      .string()
      .trim()
      .min(3, { error: "Username must be at least 3 characters" })
      .max(20, { error: "Username cannot be more than 20 characters." }),

    password: z
      .string()
      .min(8, { error: "Password must be at least 8 characters" })
      .max(16, { error: "Password must be less than 17 characters" }),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z
      .email()
      .toLowerCase()
      .trim()
      .min(1, { error: "Email is required." }),
    password: z
      .string()
      .min(8, { error: "Password must be at least 8 characters" })
      .max(16, { error: "Password cannot be more than 16 characters" }),
  }),
});

export const updateUserDetailSchema = z.object({
  body: z.object({
    fullName: z
      .string()
      .trim()
      .min(5, { error: "Full name must be at least 5 characters" })
      .max(25, { error: "Full name cannot be more than 25 characters." }),
  }),
});

export const userParamSchema = z.object({
  params: z.object({
    username: z
      .string()
      .trim()
      .min(3, { error: "Username must be at least 3 characters" })
      .max(20, { error: "Username cannot be more than 20 characters." }),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    oldPassword: z
      .string()
      .min(8, { error: "Password must be at least 8 characters" }),
    newPassword: z
      .string()
      .min(8, { error: "Password must be at least 8 characters" }),
  }),
});

export const getUserSuggestionsSchema = z.object({
  query: z.object({
    username: z
      .string()
      .trim()
      .min(3, { error: "Username must be at least 3 characters" })
      .max(20, { error: "Username cannot be more than 20 characters." }),
  }),
});

export const userSearchQuerySchema = z.object({
  query: z
    .object({
      username: z
        .string()
        .trim()
        .min(3, { error: "Query must be at least 3 characters." })
        .max(50, { error: "Query cannot exceed 50 characters." })
        .optional(),
      searchToken: z
        .string()
        .trim()
        .min(1, { error: "Query hash cannot be empty." })
        .optional(),
    })
    .refine((data) => data.username || data.searchToken, {
      message: "You must provide either a username or a searchToken.",
    }),
});

export type GetUserSuggestionsSchema = z.infer<
  typeof getUserSuggestionsSchema
>["query"];
export type UserSearchQuerySchema = z.infer<
  typeof userSearchQuerySchema
>["query"];
export type RegisterUserSchema = z.infer<typeof registerSchema>["body"];
export type LoginUserSchema = z.infer<typeof loginSchema>["body"];
export type UpdateUserSchema = z.infer<typeof updateUserDetailSchema>["body"];
export type UserParamSchema = z.infer<typeof userParamSchema>["params"];
export type ChangePasswordSchema = z.infer<typeof changePasswordSchema>["body"];
