import { z } from "zod";

export const notepadSchema = z.object({
  heading: z.string().describe("Heading for the note"),
  content: z.string().describe("Content of the note"),
  save: z.boolean().optional().describe("Save the note if true"),
  clear: z.boolean().optional().describe("Clear the note if true"),
});
