import { z } from "zod";

export const songSchema = z.object({
    title: z.string().describe("Song title"),
    artist: z.string().describe("Artist name"),
    album: z.string().describe("Album name"),
    duration: z.number().describe("Duration in seconds"),
    preview: z.string().describe("Preview URL (30 seconds)"),
    link: z.string().describe("Full song link"),
    albumCover: z.string().optional().describe("Album cover URL"),
  });

export type Song = z.infer<typeof songSchema>;

export const searchMusicInputSchema = z.object({
  query: z
    .string()
    .describe("Music search query (song title, artist name, or genre)"),
});
export type SearchMusicInput = z.infer<typeof searchMusicInputSchema>;

export const searchMusicSchema = z.function().args(searchMusicInputSchema).returns(z.array(songSchema));