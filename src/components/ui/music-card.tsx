import { useEffect, useRef, useState } from "react";
import { z } from "zod";

import { songSchema } from "@/lib/types";
export type MusicCardProps = z.infer<typeof songSchema> & {
  playing?: boolean;
  onPropsUpdate?: (next: Partial<{ playing: boolean }>) => void;
};

const Icon = ({
  d,
  ...props
}: { d: string } & React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d={d} />
  </svg>
);

export function MusicCard({
  title,
  artist,
  album,
  preview,
  link,
  albumCover,
  playing,
  onPropsUpdate,
}: MusicCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(30);
  const ref = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (ref.current) {
        clearInterval(ref.current);
      }
    };
  }, []);
  useEffect(() => {
    if (isPlaying && audio)
      ref.current = setInterval(() => setTime(audio.currentTime), 100);
    else {
      clearInterval(ref.current!);
      ref.current = null;
    }
  }, [isPlaying, audio]);

  // Respond to external playing prop changes
  useEffect(() => {
    if (playing === undefined) return;
    const ensureAudio = async () => {
      if (!audio) {
        const a = new Audio(preview);
        a.onended = () => {
          setIsPlaying(false);
          setTime(0);
          onPropsUpdate?.({ playing: false });
        };
        a.onloadedmetadata = () => setDuration(a.duration || 30);
        setAudio(a);
        if (playing) {
          try {
            await a.play();
            setIsPlaying(true);
          } catch {}
        }
        return;
      }
      if (playing && !isPlaying) {
        try {
          await audio.play();
          setIsPlaying(true);
        } catch {}
      } else if (!playing && isPlaying) {
        audio.pause();
        setIsPlaying(false);
      }
    };
    void ensureAudio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, preview]);

  const togglePlay = async () => {
    if (!audio) {
      const a = new Audio(preview);
      a.onended = () => {
        setIsPlaying(false);
        setTime(0);
      };
      a.onloadedmetadata = () => setDuration(a.duration || 30);
      setAudio(a);
      await a.play();
      setIsPlaying(true);
      onPropsUpdate?.({ playing: true });
      return;
    }
    if (isPlaying) {
      audio.pause();
    } else {
      await audio.play();
    }
    setIsPlaying(!isPlaying);
    onPropsUpdate?.({ playing: !isPlaying });
  };

  const pct = (time / duration) * 100;
  const fmt = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="w-full max-w-full mx-auto p-3">
      <div className="relative">
        <div className="relative rounded-xl overflow-hidden border border-border bg-card/60 backdrop-blur-xl">
          <button
            onClick={() => window.open(link, "_blank")}
            className="absolute top-2 right-2 h-8 w-8 flex items-center justify-center rounded-full bg-muted/50 border border-border hover:bg-muted transition-colors duration-200"
          >
            <Icon
              d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6m4-3h6v6m-6 0L21 3"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className="h-5 w-5 text-foreground"
            />
          </button>
          <div className="p-4 flex items-center gap-4">
            <img
              src={albumCover || undefined}
              alt={album}
              className="w-32 h-32 rounded-md object-cover ring-1 ring-border"
            />
            <div className="flex-1 min-w-0">
              <h2 className="text-foreground text-2xl font-bold truncate">
                {title}
              </h2>
              <div className="text-muted-foreground font-medium truncate">{artist}</div>
              <div className="text-muted-foreground text-sm truncate">{album}</div>
              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={togglePlay}
                  className="h-9 w-9 rounded-full border border-border bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors duration-200"
                >
                  <Icon
                    d={
                      isPlaying
                        ? "M6 5h4v14H6zM14 5h4v14h-4z"
                        : "M8 5v14l11-7-11-7z"
                    }
                    className="text-foreground w-6 h-6"
                  />
                </button>
                <div className="relative flex-1 h-2">
                  <div className="absolute inset-0 rounded-full bg-muted border border-border" />
                  <div
                    className="absolute left-0 top-0 h-2 rounded-full bg-primary/80"
                    style={{ width: `${pct}%` }}
                  />
                  <input
                    type="range"
                    min={0}
                    max={duration}
                    value={time}
                    onChange={(e) => {
                      const t = +e.target.value;
                      setTime(t);
                      if (audio) audio.currentTime = t;
                    }}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer"
                  />
                </div>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {fmt(Math.floor(time))}
                </span>
              </div>
            </div>
          </div>
          <div
            className="pointer-events-none absolute -z-10 blur-[30px] opacity-20"
            style={{
              inset: "-20%",
              background: `radial-gradient(50% 50% at 20% 10%, rgba(255,255,255,0.1), transparent 60%), radial-gradient(60% 60% at 80% 90%, rgba(255,255,255,0.05), transparent 60%)`,
            }}
          />
        </div>
        <div
          className="absolute inset-0 -z-20 rounded-xl blur-md opacity-70"
          style={{
            background: `url(${albumCover}) center/cover`,
          }}
        />
      </div>
    </div>
  );
}
