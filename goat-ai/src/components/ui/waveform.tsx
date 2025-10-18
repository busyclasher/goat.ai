"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

// Base Waveform Props
export interface WaveformProps extends React.HTMLAttributes<HTMLDivElement> {
  data: number[];
  barWidth?: number;
  barGap?: number;
  barRadius?: number;
  barColor?: string;
  fadeEdges?: boolean;
  fadeWidth?: number;
  height?: string | number;
  onBarClick?: (index: number, value: number) => void;
}

// Microphone Waveform Props
export interface MicrophoneWaveformProps extends Omit<WaveformProps, "data" | "onBarClick"> {
  active?: boolean;
  fftSize?: number;
  smoothingTimeConstant?: number;
  sensitivity?: number;
  onError?: (error: Error) => void;
}

// Recording Waveform Props
export interface RecordingWaveformProps extends Omit<WaveformProps, "data"> {
  recording?: boolean;
  onRecordingComplete?: (data: number[]) => void;
  showHandle?: boolean;
  updateRate?: number;
}

// Base Waveform Component
export function Waveform({
  data,
  barWidth = 4,
  barGap = 2,
  barRadius = 2,
  barColor,
  fadeEdges = true,
  fadeWidth = 24,
  height = 128,
  onBarClick,
  className,
  ...props
}: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size with device pixel ratio
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Calculate bar dimensions
    const totalBarWidth = barWidth + barGap;
    const visibleBars = Math.floor(rect.width / totalBarWidth);
    const startX = (rect.width - visibleBars * totalBarWidth + barGap) / 2;

    // Draw bars
    data.slice(0, visibleBars).forEach((value, index) => {
      const x = startX + index * totalBarWidth;
      const barHeight = Math.max(4, value * rect.height);
      const y = (rect.height - barHeight) / 2;

      // Apply fade effect
      let opacity = 1;
      if (fadeEdges) {
        const distFromLeft = x;
        const distFromRight = rect.width - x;
        const minDist = Math.min(distFromLeft, distFromRight);
        if (minDist < fadeWidth) {
          opacity = minDist / fadeWidth;
        }
      }

      ctx.globalAlpha = opacity;
      ctx.fillStyle = barColor || "hsl(var(--foreground))";
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, barRadius);
      ctx.fill();
    });

    ctx.globalAlpha = 1;
  }, [data, barWidth, barGap, barRadius, barColor, fadeEdges, fadeWidth]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onBarClick) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const totalBarWidth = barWidth + barGap;
    const index = Math.floor(x / totalBarWidth);
    
    if (index >= 0 && index < data.length) {
      onBarClick(index, data[index]);
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full h-full", className)}
      style={{ 
        height: typeof height === "number" ? `${height}px` : height,
        minHeight: typeof height === "number" ? `${height}px` : height,
      }}
      {...props}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        onClick={handleClick}
      />
    </div>
  );
}

// Microphone Waveform Component
export function MicrophoneWaveform({
  active = false,
  fftSize = 256,
  smoothingTimeConstant = 0.8,
  sensitivity = 1,
  onError,
  barWidth = 4,
  barGap = 2,
  ...props
}: MicrophoneWaveformProps) {
  const [waveformData, setWaveformData] = useState<number[]>(Array(50).fill(0));
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (!active) {
      setWaveformData(Array(50).fill(0));
      return;
    }

    let mounted = true;

    const startMicrophone = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);

        analyser.fftSize = fftSize;
        analyser.smoothingTimeConstant = smoothingTimeConstant;
        source.connect(analyser);

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        sourceRef.current = source;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const barCount = 50;

        const updateWaveform = () => {
          if (!mounted || !analyserRef.current) return;

          analyserRef.current.getByteFrequencyData(dataArray);

          const bandSize = Math.floor(dataArray.length / barCount);
          const bars: number[] = [];

          for (let i = 0; i < barCount; i++) {
            const start = i * bandSize;
            const end = start + bandSize;
            const bandData = dataArray.slice(start, end);
            const average = bandData.reduce((sum, value) => sum + value, 0) / bandData.length;
            bars.push(Math.min(1, (average / 255) * sensitivity));
          }

          setWaveformData(bars);
          animationFrameRef.current = requestAnimationFrame(updateWaveform);
        };

        updateWaveform();
      } catch (error) {
        console.error("Microphone error:", error);
        if (onError && error instanceof Error) {
          onError(error);
        }
      }
    };

    startMicrophone();

    return () => {
      mounted = false;
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
  }, [active, fftSize, smoothingTimeConstant, sensitivity, onError]);

  return <Waveform data={waveformData} barWidth={barWidth} barGap={barGap} {...props} />;
}

// Recording Waveform Component
export function RecordingWaveform({
  recording = false,
  onRecordingComplete,
  showHandle = true,
  updateRate = 50,
  barWidth = 4,
  barGap = 2,
  ...props
}: RecordingWaveformProps) {
  const [recordedData, setRecordedData] = useState<number[]>([]);
  const [currentData, setCurrentData] = useState<number[]>(Array(60).fill(0));
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const intervalRef = useRef<NodeJS.Timeout>();
  const recordingRef = useRef(false);

  useEffect(() => {
    if (!recording) {
      if (recordingRef.current && onRecordingComplete) {
        onRecordingComplete(recordedData);
      }
      recordingRef.current = false;
      setCurrentData(recordedData.length > 0 ? recordedData : Array(60).fill(0));
      return;
    }

    recordingRef.current = true;
    let mounted = true;

    const startRecording = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);

        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        source.connect(analyser);

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        sourceRef.current = source;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const bars: number[] = [];

        const updateRecording = () => {
          if (!mounted || !analyserRef.current) return;

          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
          const normalizedValue = Math.min(1, average / 255);

          bars.push(normalizedValue);
          const recentBars = bars.slice(-150); // Keep last 150 bars
          
          setRecordedData([...recentBars]);
          setCurrentData([...recentBars]);
        };

        intervalRef.current = setInterval(updateRecording, updateRate);
      } catch (error) {
        console.error("Recording error:", error);
      }
    };

    startRecording();

    return () => {
      mounted = false;
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
  }, [recording, updateRate, onRecordingComplete, recordedData]);

  return (
    <Waveform 
      data={currentData} 
      barWidth={barWidth} 
      barGap={barGap} 
      {...props} 
    />
  );
}

