import z from "zod";

export const SignInFormInfoSchema = z
  .object({
    usernameFieldName: z.string(),
    passwordFieldName: z.string(),
    captchaFieldName: z.string(),
    once: z.string(),
    captchaImage: z.string(),
  })
  .passthrough();

export type SignInFormInfoType = z.infer<typeof SignInFormInfoSchema>;
