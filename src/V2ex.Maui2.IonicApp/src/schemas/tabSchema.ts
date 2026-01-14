import { z } from "zod";
export const TabSchema = z.object({
  key: z.string(),
  label: z.string(),
  kind: z.enum(["latest", "hot", "tab"]),
  tab: z.string().optional(),
});

export type TabType = z.infer<typeof TabSchema>;
