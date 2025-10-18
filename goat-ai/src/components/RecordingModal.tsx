"use client";

import { useEffect, useState } from "react";
import { X, Mic } from "lucide-react";
import { MicrophoneWaveform } from "./ui/waveform";
import { cn } from "@/lib/utils";

interface RecordingModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaStream: MediaStream | null;
  isProcessing?: boolean;
}

export function RecordingModal({
  isOpen,
  onClose,
  mediaStream,
  isProcessing = false,
}: RecordingModalProps) {
  const [recordingTime, setRecordingTime] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setRecordingTime(0);
      return;
    }

    const interval = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl mx-4 flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 text-white/60 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Recording indicator */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500 animate-pulse">
              <Mic className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-white">
              {isProcessing ? "Processing..." : "Recording"}
            </h2>
          </div>
          <p className="text-4xl font-mono text-white/80">{formatTime(recordingTime)}</p>
        </div>

        {/* Large waveform */}
        <div className="w-full h-[70vh] bg-gradient-to-b from-gray-900/50 to-gray-900/30 rounded-2xl p-8 border border-white/10 shadow-2xl">
          <MicrophoneWaveform
            active={!!mediaStream && !isProcessing}
            height="100%"
            barWidth={6}
            barGap={3}
            barColor="#3b82f6"
            sensitivity={1.8}
            fadeEdges={true}
            className="w-full h-full"
          />
        </div>

        {/* Instructions */}
        <div className="mt-8 text-center">
          <p className="text-white/60 text-sm mb-4">
            {isProcessing 
              ? "Converting speech to text..." 
              : "Click anywhere or press ESC to stop recording"
            }
          </p>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className={cn(
              "px-8 py-3 rounded-full font-medium transition-all",
              isProcessing
                ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                : "bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-red-500/50"
            )}
          >
            {isProcessing ? "Processing..." : "Stop Recording"}
          </button>
        </div>
      </div>
    </div>
  );
}

