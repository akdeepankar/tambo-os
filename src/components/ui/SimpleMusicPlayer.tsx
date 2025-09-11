"use client";
import { withInteractable } from "@tambo-ai/react";
import { Pause, Play, SkipBack, SkipForward, Trash2 } from "lucide-react";
import { IconMusic } from "@tabler/icons-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";

const trackSchema = z.object({
  title: z.string(),
  artist: z.string(),
  album: z.string(),
  duration: z.number().optional(),
  preview: z.string(),
  link: z.string(),
  albumCover: z.string().optional(),
});

export const simpleMusicPlayerSchema = z.object({
  tracks: z
    .array(trackSchema)
    .default([])
    .describe("The playlist of tracks to play"),
  currentIndex: z.number().int().nonnegative().default(0),
  isPlaying: z.boolean().default(false),
  addTrack: z.union([trackSchema, z.array(trackSchema)])
    .optional()
    .describe("Add track(s) to the playlist - can be a single track or array of tracks"),
  removeIndex: z
    .number()
    .int()
    .nonnegative()
    .optional()
    .describe("Remove track at this index (0-based)"),
  action: z
    .enum(["play", "pause", "toggle", "next", "previous"])
    .optional()
    .describe("Control playback: play, pause, toggle, next, or previous track"),
  replacePlaylist: z
    .array(trackSchema)
    .optional()
    .describe(
      "Replace entire playlist with new tracks. Use empty array [] to clear playlist. This is the only way to clear or bulk update tracks."
    ),
});

type SimpleMusicPlayerProps = z.infer<typeof simpleMusicPlayerSchema> & {
  onPropsUpdate?: (
    next: Partial<z.infer<typeof simpleMusicPlayerSchema>>
  ) => void;
};

function SimpleMusicPlayerBase({
  tracks: propTracks = [],
  currentIndex: propCurrentIndex = 0,
  isPlaying: propIsPlaying = false,
  addTrack,
  removeIndex,
  action,
  replacePlaylist,
  onPropsUpdate,
}: SimpleMusicPlayerProps) {
  // Use internal state as the source of truth
  const [tracks, setTracks] = useState(propTracks);
  const [currentIndex, setCurrentIndex] = useState(propCurrentIndex);
  const [isPlaying, setIsPlaying] = useState(propIsPlaying);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(30);
  const playPauseTimeout = useRef<NodeJS.Timeout | null>(null);
  const playAfterSwitchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Sync with props on initial load only
  useEffect(() => {
    if (propTracks.length > 0) {
      setTracks(propTracks);
      setCurrentIndex(propCurrentIndex);
      setIsPlaying(propIsPlaying);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount - ignore prop dependencies

  // Report state changes back to AI
  useEffect(() => {
    onPropsUpdate?.({
      tracks,
      currentIndex,
      isPlaying,
    });
  }, [tracks, currentIndex, isPlaying, onPropsUpdate]);

  // Handle external prop changes (from AI)
  useEffect(() => {
    if (addTrack) {
      console.log("Adding track(s):", addTrack); // Debug log
      setTracks((prev) => {
        const tracksToAdd = Array.isArray(addTrack) ? addTrack : [addTrack];
        const newTracks = [...prev, ...tracksToAdd];
        console.log("New tracks array:", newTracks); // Debug log
        return newTracks;
      });
      // Clear the addTrack prop after processing
      onPropsUpdate?.({ addTrack: undefined });
    }
  }, [addTrack, onPropsUpdate]);

  useEffect(() => {
    if (removeIndex !== undefined && removeIndex < tracks.length) {
      setTracks((prev) => {
        const newTracks = prev.filter((_, i) => i !== removeIndex);
        // Adjust current index if needed
        if (removeIndex === currentIndex) {
          setCurrentIndex(0);
          setIsPlaying(false);
          if (audio) {
            audio.pause();
            setAudio(null);
          }
        } else if (removeIndex < currentIndex) {
          setCurrentIndex(currentIndex - 1);
        }
        return newTracks;
      });
    }
  }, [removeIndex]); // Only depend on removeIndex

  useEffect(() => {
    if (action) {
      switch (action) {
        case "play":
          setIsPlaying(true);
          break;
        case "pause":
          setIsPlaying(false);
          break;
        case "toggle":
          setIsPlaying((prev) => !prev);
          break;
        case "next":
          if (tracks.length > 0) {
            setCurrentIndex((prev) => (prev + 1) % tracks.length);
          }
          break;
        case "previous":
          if (tracks.length > 0) {
            setCurrentIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
          }
          break;
      }
    }
  }, [action, tracks.length]); // Remove currentIndex from dependencies

  useEffect(() => {
    if (replacePlaylist !== undefined) {
      console.log("Replace playlist with tracks:", replacePlaylist);
      // Stop current audio
      if (audio) {
        audio.pause();
        setAudio(null);
      }
      // Set new playlist (can be empty array to clear)
      setTracks(replacePlaylist);
      setCurrentIndex(0);
      // Don't auto-play, let user control playback
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [replacePlaylist]); // Only depend on replacePlaylist

  const currentTrack = useMemo(
    () => tracks[currentIndex],
    [tracks, currentIndex]
  );

  // Handle audio creation when track changes
  useEffect(() => {
    if (!currentTrack) {
      if (audio) {
        audio.pause();
        setAudio(null);
      }
      setCurrentTime(0);
      return;
    }

    // Clean up old audio completely
    if (audio) {
      audio.pause();
      audio.removeEventListener("ended", () => {});
      audio.removeEventListener("loadedmetadata", () => {});
      audio.removeEventListener("timeupdate", () => {});
    }

    const newAudio = new Audio(currentTrack.preview);

    const handleEnded = () => {
      setCurrentIndex((prev) => (prev + 1) % tracks.length);
      setIsPlaying(tracks.length > 1);
    };

    const handleLoadedMetadata = () => setDuration(newAudio.duration || 30);
    const handleTimeUpdate = () => setCurrentTime(newAudio.currentTime);

    newAudio.addEventListener("ended", handleEnded);
    newAudio.addEventListener("loadedmetadata", handleLoadedMetadata);
    newAudio.addEventListener("timeupdate", handleTimeUpdate);

    setAudio(newAudio);
    setCurrentTime(0);

    // Add a short delay before playing the new track to avoid play/pause warning
    if (isPlaying) {
      if (playAfterSwitchTimeout.current) {
        clearTimeout(playAfterSwitchTimeout.current);
      }
      playAfterSwitchTimeout.current = setTimeout(() => {
        newAudio.play().catch(console.error);
      }, 200);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.preview]); // Only depend on preview URL

  // Handle play/pause changes independently
  useEffect(() => {
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch(console.error);
    } else {
      audio.pause();
    }
  }, [isPlaying, audio]);

  // Button handlers - these work immediately
  const handlePlay = () => {
    // Debounce play/pause to avoid rapid toggling
    if (playPauseTimeout.current) {
      clearTimeout(playPauseTimeout.current);
    }
    playPauseTimeout.current = setTimeout(() => {
      setIsPlaying((prev) => !prev);
    }, 150);
  };

  const handleNext = () => {
    if (tracks.length > 0) {
      setCurrentIndex((currentIndex + 1) % tracks.length);
      // Keep current playing state - don't force play
    }
  };

  const handlePrevious = () => {
    if (tracks.length > 0) {
      setCurrentIndex((currentIndex - 1 + tracks.length) % tracks.length);
      // Keep current playing state - don't force play
    }
  };

  const handlePlayTrack = (index: number) => {
    setCurrentIndex(index);
    setIsPlaying(true);
  };

  const handleRemoveTrack = (index: number) => {
    const newTracks = tracks.filter((_, i) => i !== index);
    setTracks(newTracks);

    if (index === currentIndex) {
      setCurrentIndex(0);
      setIsPlaying(false);
      if (audio) {
        audio.pause();
        setAudio(null);
      }
    } else if (index < currentIndex) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleClearPlaylist = () => {
    setTracks([]);
    setCurrentIndex(0);
    setIsPlaying(false);
    if (audio) {
      audio.pause();
      setAudio(null);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-br from-[#f8fafc] via-[#e0e7ef] to-[#f1f5f9] dark:from-[#18181b] dark:via-[#23272f] dark:to-[#1e293b] p-0 m-0">
      {/* Navbar */}
  <nav className="w-full flex items-center justify-between px-6 py-4 shadow bg-white/80 dark:bg-neutral-900/80">
        <div className="flex items-center space-x-3">
          <span className="inline-flex items-center ">
            <IconMusic className="w-6 h-6" />
          </span>
          <h2 className="text-xl font-bold text-foreground">Music Player</h2>
        </div>
        <span className="text-xs text-muted-foreground">{tracks.length} tracks</span>
      </nav>

      {/* Two Column Layout: Bigger Player, Smaller Playlist */}
      <div className="w-full flex flex-1 gap-0 min-h-0 h-full">
        {/* Left: Current Track & Controls (Bigger) */}
        <div className="flex-[2] flex flex-col justify-center h-full min-h-0">
          <div className="h-full flex flex-col justify-center shadow-2xl bg-white/70 dark:bg-neutral-900/70 backdrop-blur-lg border border-neutral-200 dark:border-neutral-800 p-6 mb-0 transition-all duration-300">
            {currentTrack ? (
              <div className="flex flex-col h-full justify-between">
                <div>
                  <div className="relative flex flex-col items-center justify-center mb-6">
                    {currentTrack.albumCover && (
                      <>
                        <div className="absolute inset-0 z-0 flex items-center justify-center">
                          <img
                            src={currentTrack.albumCover}
                            alt={currentTrack.album}
                            className="w-72 h-72 object-cover blur-md opacity-40 scale-110"
                          />
                        </div>
                        <div className="relative z-10 flex items-center justify-center">
                          <img
                            src={currentTrack.albumCover}
                            alt={currentTrack.album}
                            className="w-56 h-56 rounded-2xl object-cover shadow-lg border border-neutral-300 dark:border-neutral-700"
                          />
                        </div>
                      </>
                    )}
                    <div className="relative z-10 flex flex-col items-center justify-center mt-4 w-full">
                      <h2 className="font-bold text-2xl text-foreground truncate mb-1 text-center">{currentTrack.title}</h2>
                      <p className="text-base text-muted-foreground truncate mb-1 text-center">{currentTrack.artist}</p>
                      <p className="text-sm text-muted-foreground/70 truncate text-center">{currentTrack.album}</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-3 mb-4 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${(currentTime / duration) * 100}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-xs text-muted-foreground mb-4 font-mono">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Controls Section */}
                <div className="flex justify-center items-center space-x-8 mt-2 pb-2">
                  <button
                    aria-label="Previous track"
                    onClick={handlePrevious}
                    className="p-3 rounded-full bg-white/80 dark:bg-neutral-800/80 shadow hover:scale-110 active:scale-95 transition-all duration-200 text-foreground disabled:text-muted-foreground disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    disabled={tracks.length === 0}
                  >
                    <SkipBack className="w-7 h-7" />
                  </button>

                  <button
                    aria-label={isPlaying ? "Pause" : "Play"}
                    onClick={handlePlay}
                    className="p-5 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all duration-200 disabled:bg-muted disabled:text-muted-foreground disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    disabled={!currentTrack}
                  >
                    {isPlaying ? (
                      <Pause className="w-8 h-8" />
                    ) : (
                      <Play className="w-8 h-8" />
                    )}
                  </button>

                  <button
                    aria-label="Next track"
                    onClick={handleNext}
                    className="p-3 rounded-full bg-white/80 dark:bg-neutral-800/80 shadow hover:scale-110 active:scale-95 transition-all duration-200 text-foreground disabled:text-muted-foreground disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    disabled={tracks.length === 0}
                  >
                    <SkipForward className="w-7 h-7" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>No tracks in playlist</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Playlist (Smaller) */}
        <div className="flex-[1] flex flex-col min-h-0 h-full">
          <div className="border-t border-neutral-200 dark:border-neutral-800 bg-white/60 dark:bg-neutral-900/60 shadow-lg backdrop-blur-md p-4 flex-1 flex flex-col h-full">
            <div className="flex-shrink-0 flex justify-between items-center pb-2">
              <h3 className="font-semibold text-foreground">Playlist</h3>
              {tracks.length > 0 && (
                <button
                  onClick={handleClearPlaylist}
                  className="text-destructive text-sm hover:text-destructive/80 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-400 rounded"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto pb-4">
              {tracks.map((track, index) => (
                <div
                  key={`${track.title}-${index}`}
                  className={`flex items-center justify-between p-3 m-5 rounded-xl transition-all duration-200 shadow-sm ${
                    index === currentIndex
                      ? "bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 dark:from-blue-900 dark:via-purple-900 dark:to-pink-900 border border-blue-300 dark:border-blue-700 scale-105"
                      : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  }`}
                >
                  <div
                    className="flex items-center space-x-3 flex-1 min-w-0 cursor-pointer"
                    onClick={() => handlePlayTrack(index)}
                  >
                    {track && track.albumCover ? (
                      <img
                        src={track.albumCover}
                        alt={track.album}
                        className="w-10 h-10 rounded-xl object-cover flex-shrink-0 shadow"
                      />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-base truncate text-foreground">
                        {track.title}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {track.artist}
                      </div>
                    </div>
                    {index === currentIndex && isPlaying && (
                      <span className="text-primary text-lg flex-shrink-0 animate-pulse">♪</span>
                    )}
                  </div>

                  <button
                    aria-label="Remove track"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveTrack(index);
                    }}
                    className="p-2 text-destructive hover:text-destructive/80 transition-colors duration-200 flex-shrink-0 rounded-full bg-white/70 dark:bg-neutral-800/70 shadow focus:outline-none focus:ring-2 focus:ring-red-400"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const SimpleMusicPlayer = withInteractable(SimpleMusicPlayerBase, {
  componentName: "SimpleMusicPlayer",
  description:
    "A complete music player that can play, pause, skip tracks, and manage a playlist. Add tracks with addTrack, control playback with action, remove tracks with removeIndex.",
  propsSchema: simpleMusicPlayerSchema,
});
