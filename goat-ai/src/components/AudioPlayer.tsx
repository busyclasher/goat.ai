"use client";

import { useRef, useEffect, useState } from "react";
import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioPlayerProps {
  audioUrl: string;
  autoPlay?: boolean;
  className?: string;
}

export function AudioPlayer({ audioUrl, autoPlay = false, className }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  useEffect(() => {
    if (autoPlay && audioRef.current && audioUrl) {
      // Small delay to ensure audio is loaded
      const timer = setTimeout(() => {
        audioRef.current?.play().catch((err) => {
          console.warn('Autoplay blocked by browser:', err);
          // Browser blocked autoplay - user will need to click play button
        });
      }, 100);
      return () => clearTimeout(timer);
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
        aria-label={isPlaying ? "Pause audio" : "Play audio"}
      >
        {isPlaying ? (
          <Pause className="w-3 h-3" />
        ) : (
          <Play className="w-3 h-3" />
        )}
      </button>
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        className="hidden"
      />
    </div>
  );
}
