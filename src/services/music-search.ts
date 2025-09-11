import fetchJsonp from "fetch-jsonp";
import { SearchMusicInput, Song } from "@/lib/types";

export async function searchMusic({ query }: SearchMusicInput): Promise<Song[]> {
  const response = await fetchJsonp(
    `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=10&output=jsonp`
  );
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  // Map Deezer API results to MusicSearchResult type
  return (data.data || []).map((item: { artist: { name: string }; album: { title: string; cover: string }; [key: string]: unknown }) => ({
    ...item,
    artist: item.artist?.name || "",
    album: item.album?.title || "",
    albumCover: item.album?.cover || ""
  }));
}