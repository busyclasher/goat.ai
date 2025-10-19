"use client";

import * as React from "react";
import { useEffect, useState, useRef, useMemo } from "react";
import { cn } from "@/lib/utils";

// Types
export type AgentState = 
  | "connecting"
  | "initializing" 
  | "listening"
  | "speaking"
  | "thinking";

export type AnimationState = AgentState | "idle";

export interface AudioAnalyserOptions {
  fftSize?: number;
  smoothingTimeConstant?: number;
  minDecibels?: number;
  maxDecibels?: number;
}

export interface MultiBandVolumeOptions extends AudioAnalyserOptions {
  bands?: number;
  loPass?: number;
  hiPass?: number;
  updateInterval?: number;
}

export interface BarVisualizerProps extends React.HTMLAttributes<HTMLDivElement> {
  state: AgentState;
  barCount?: number;
  mediaStream?: MediaStream | null;
  minHeight?: number;
  maxHeight?: number;
  demo?: boolean;
  centerAlign?: boolean;
}

// Hook: Get overall volume from audio stream
export function useAudioVolume(
  mediaStream: MediaStream | null,
  options: AudioAnalyserOptions = {}
): number {
  const [volume, setVolume] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (!mediaStream) {
      setVolume(0);
      return;
    }

    try {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(mediaStream);

      analyser.fftSize = options.fftSize || 32;
      analyser.smoothingTimeConstant = options.smoothingTimeConstant ?? 0;
      analyser.minDecibels = options.minDecibels ?? -90;
      analyser.maxDecibels = options.maxDecibels ?? -10;

      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      sourceRef.current = source;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateVolume = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        setVolume(average / 255);
        
        animationFrameRef.current = requestAnimationFrame(updateVolume);
      };

      updateVolume();
    } catch (error) {
      console.error("Error setting up audio analysis:", error);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [mediaStream, options.fftSize, options.smoothingTimeConstant, options.minDecibels, options.maxDecibels]);

  return volume;
}

// Hook: Get volume across multiple frequency bands
export function useMultibandVolume(
  mediaStream: MediaStream | null,
  options: MultiBandVolumeOptions = {}
): number[] {
  const [frequencies, setFrequencies] = useState<number[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const intervalRef = useRef<NodeJS.Timeout>();

  const bands = options.bands || 15;

  useEffect(() => {
    if (!mediaStream) {
      setFrequencies(Array(bands).fill(0));
      return;
    }

    try {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(mediaStream);

      analyser.fftSize = options.fftSize || 512;
      analyser.smoothingTimeConstant = options.smoothingTimeConstant ?? 0.5;
      analyser.minDecibels = options.minDecibels ?? -90;
      analyser.maxDecibels = options.maxDecibels ?? -10;

      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      sourceRef.current = source;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateInterval = options.updateInterval || 32;

      const updateFrequencies = () => {
        if (!analyserRef.current) return;

        analyserRef.current.getByteFrequencyData(dataArray);
        
        const bandSize = Math.floor(dataArray.length / bands);
        const bandValues: number[] = [];

        for (let i = 0; i < bands; i++) {
          const start = i * bandSize;
          const end = start + bandSize;
          const bandData = dataArray.slice(start, end);
          const average = bandData.reduce((sum, value) => sum + value, 0) / bandData.length;
          bandValues.push(average / 255);
        }

        setFrequencies(bandValues);
      };

      intervalRef.current = setInterval(updateFrequencies, updateInterval);
    } catch (error) {
      console.error("Error setting up multiband analysis:", error);
      setFrequencies(Array(bands).fill(0));
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [mediaStream, bands, options.fftSize, options.smoothingTimeConstant, options.minDecibels, options.maxDecibels, options.updateInterval]);

  return frequencies;
}

// Hook: Animate bars based on state
export function useBarAnimator(
  state: AnimationState,
  columns: number,
  interval: number = 100
): Set<number> {
  const [highlightedIndices, setHighlightedIndices] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (state === "idle") {
      setHighlightedIndices(new Set());
      return;
    }

    let currentIndex = 0;

    const animate = () => {
      if (state === "connecting" || state === "initializing") {
        // Wave animation
        setHighlightedIndices(new Set([currentIndex % columns]));
        currentIndex++;
      } else if (state === "thinking") {
        // Random pulses
        const count = Math.floor(Math.random() * 3) + 1;
        const indices = new Set<number>();
        for (let i = 0; i < count; i++) {
          indices.add(Math.floor(Math.random() * columns));
        }
        setHighlightedIndices(indices);
      }
    };

    const animationInterval = setInterval(animate, interval);
    return () => clearInterval(animationInterval);
  }, [state, columns, interval]);

  return highlightedIndices;
}

// Main BarVisualizer Component
export function BarVisualizer({
  state,
  barCount = 15,
  mediaStream,
  minHeight = 20,
  maxHeight = 100,
  demo = false,
  centerAlign = false,
  className,
  ...props
}: BarVisualizerProps) {
  const bands = useMultibandVolume(demo ? null : mediaStream || null, {
    bands: barCount,
    updateInterval: 32,
  });

  const highlightedIndices = useBarAnimator(
    mediaStream || demo ? state : "idle",
    barCount,
    100
  );

  const [demoIndex, setDemoIndex] = useState(0);

  useEffect(() => {
    if (!demo) return;

    const interval = setInterval(() => {
      setDemoIndex((prev) => (prev + 1) % barCount);
    }, 100);

    return () => clearInterval(interval);
  }, [demo, barCount]);

  const getBarHeight = (index: number): number => {
    if (demo) {
      const isActive = state === "speaking" || state === "listening";
      if (isActive) {
        const distance = Math.abs(index - demoIndex);
        const maxDistance = Math.floor(barCount / 2);
        const normalized = 1 - Math.min(distance, maxDistance) / maxDistance;
        return minHeight + normalized * (maxHeight - minHeight);
      }
      return minHeight;
    }

    const volume = bands[index] || 0;
    const isHighlighted = highlightedIndices.has(index);
    
    if (state === "speaking" || state === "listening") {
      return minHeight + volume * (maxHeight - minHeight);
    }
    
    if (isHighlighted) {
      return minHeight + 0.5 * (maxHeight - minHeight);
    }

    return minHeight;
  };

  return (
    <div
      className={cn(
        "flex items-center gap-[2px]",
        centerAlign ? "items-center" : "items-end",
        className
      )}
      {...props}
    >
      {Array.from({ length: barCount }).map((_, index) => {
        const height = getBarHeight(index);
        
        return (
          <div
            key={index}
            className={cn(
              "w-1 rounded-full transition-all duration-75",
              state === "speaking" || state === "listening"
                ? "bg-blue-500"
                : "bg-gray-400"
            )}
            style={{
              height: `${height}%`,
              maxHeight: "32px",
            }}
          />
        );
      })}
    </div>
  );
}

