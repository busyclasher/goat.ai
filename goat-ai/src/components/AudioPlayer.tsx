"use client";

import { useRef, useEffect, useState } from "react";
import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { BarVisualizer } from "@/components/ui/bar-visualizer";

declare global {
  interface Window {
    currentlyPlayingAudio?: HTMLAudioElement;
  }
}

interface AudioPlayerProps {
  audioUrl: string;
  autoPlay?: boolean;
  className?: string;
  onAutoPlayComplete?: () => void;
}

export function AudioPlayer({ audioUrl, autoPlay = false, className, onAutoPlayComplete }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const destinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const setupVisualization = () => {
    const audio = audioRef.current;
    if (!audio || audioContextRef.current) return;

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createMediaElementSource(audio);
      const destination = audioContext.createMediaStreamDestination();

      source.connect(destination);
      source.connect(audioContext.destination);

      audioContextRef.current = audioContext;
      sourceRef.current = source;
      destinationRef.current = destination;
      setAudioStream(destination.stream);
    } catch (error) {
      console.warn("Could not create audio stream for visualization:", error);
    }
  };

  const onPlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (window.currentlyPlayingAudio && window.currentlyPlayingAudio !== audio) {
      window.currentlyPlayingAudio.pause();
    }
    window.currentlyPlayingAudio = audio;
    setIsPlaying(true);
    setupVisualization();
  };

  const onPauseOrEnd = () => {
    setIsPlaying(false);
    if (window.currentlyPlayingAudio === audioRef.current) {
      window.currentlyPlayingAudio = undefined;
    }
  };

  useEffect(() => {
    if (autoPlay && audioRef.current && audioUrl && isClient) {
      const timer = setTimeout(() => {
        audioRef.current?.play().catch(err => {
          console.warn("Autoplay was blocked by the browser.", err);
        });
        if (onAutoPlayComplete) {
          onAutoPlayComplete();
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [autoPlay, audioUrl, isClient, onAutoPlayComplete]);
  
  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (window.currentlyPlayingAudio === audio) {
        window.currentlyPlayingAudio = undefined;
      }
    };
  }, []);

  const togglePlay = () => {
    if (audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play().catch(console.error);
      } else {
        audioRef.current.pause();
      }
    }
  };

  if (!isClient) {
    return null;
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <button
        onClick={togglePlay}
        className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-colors flex-shrink-0"
        aria-label={isPlaying ? "Pause audio" : "Play audio"}
      >
        {isPlaying ? (
          <Pause className="w-3 h-3" />
        ) : (
          <Play className="w-3 h-3" />
        )}
      </button>
      
      {isPlaying && (
        <BarVisualizer
          state="speaking"
          mediaStream={audioStream}
          barCount={12}
          centerAlign={true}
          className="h-6"
        />
      )}
      
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="auto"
        className="hidden"
        onPlay={onPlay}
        onPause={onPauseOrEnd}
        onEnded={onPauseOrEnd}
      />
    </div>
  );
}
