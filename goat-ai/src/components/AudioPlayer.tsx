"use client";

import { useRef, useEffect, useState } from "react";
import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { BarVisualizer } from "@/components/ui/bar-visualizer";

interface AudioPlayerProps {
  audioUrl: string;
  autoPlay?: boolean;
  className?: string;
}

export function AudioPlayer({ audioUrl, autoPlay = false, className }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioDestinationNode | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => {
      setIsPlaying(true);
      
      // Create audio stream for visualization
      if (!audioContextRef.current) {
        try {
          const audioContext = new AudioContext();
          const source = audioContext.createMediaElementSource(audio);
          const destination = audioContext.createMediaStreamDestination();
          
          source.connect(destination);
          source.connect(audioContext.destination);
          
          audioContextRef.current = audioContext;
          sourceRef.current = destination;
          setAudioStream(destination.stream);
        } catch (error) {
          console.warn("Could not create audio stream for visualization:", error);
        }
      }
    };
    
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (autoPlay && audioRef.current && audioUrl && isClient) {
      // Small delay to ensure audio is loaded
      const timer = setTimeout(() => {
        const playPromise = audioRef.current?.play();
        
        playPromise?.then(() => {
          console.log('Autoplay started successfully');
        }).catch((err) => {
          console.warn('Autoplay blocked by browser:', err);
          // Browser blocked autoplay - user will need to click play button
          // This is normal behavior for many browsers
        });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [autoPlay, audioUrl, isClient]);

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
      />
    </div>
  );
}
