"use client";

import { useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioPlayerProps {
  audioUrl: string;
  autoPlay?: boolean;
  className?: string;
}

export function AudioPlayer({ audioUrl, autoPlay = false, className }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (autoPlay && audioRef.current) {
      audioRef.current.play().catch(console.error);
    }
  }, [autoPlay, audioUrl]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play().catch(console.error);
      } else {
        audioRef.current.pause();
      }
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <button
        onClick={togglePlay}
        className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-colors"
        aria-label="Play audio"
      >
        <Play className="w-3 h-3" />
      </button>
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="none"
        className="hidden"
      />
    </div>
  );
}
