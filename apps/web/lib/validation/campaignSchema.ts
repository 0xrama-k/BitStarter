import { z } from "zod";

export const createCampaignSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  goalAmount: z.coerce.number().positive("Goal amount must be greater than zero."),
  deadline: z.string().refine((value) => {
    const date = new Date(value);
    return Number.isFinite(date.getTime()) && date.getTime() > Date.now();
  }, "Deadline must be in the future."),
  metadataUri: z.string().min(1, "Metadata URI is required.")
});

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
