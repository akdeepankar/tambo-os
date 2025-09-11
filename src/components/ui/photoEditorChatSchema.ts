import { z } from "zod";

export const photoEditorChatSchema = z.object({
  imageUrl: z.string().optional().describe("URL of the image to edit"),
});
