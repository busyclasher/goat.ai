"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { X, Mic, Square } from "lucide-react";
import { Orb } from "./ui/orb";
import { cn } from "@/lib/utils";
import { VoiceSession, VoiceSessionState } from "@/lib/voiceSession";

interface VoiceInteractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  personaAvatar?: string;
  personaName: string;
  personaVoiceId: string;
  onMessage: (text: string) => Promise<{ text: string; audioUrl?: string }>;
}

export function VoiceInteractionModal({
  isOpen,
  onClose,
  personaAvatar,
  personaName,
  personaVoiceId,
  onMessage,
}: VoiceInteractionModalProps) {
  const [agentState, setAgentState] = useState<VoiceSessionState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>("");
  const voiceSessionRef = useRef<VoiceSession | null>(null);

  // Initialize voice session
  useEffect(() => {
    if (isOpen) {
      voiceSessionRef.current = new VoiceSession((state) => {
        setAgentState(state);
      });
    }

    return () => {
      if (voiceSessionRef.current) {
        voiceSessionRef.current.cleanup();
        voiceSessionRef.current = null;
      }
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  const handleClose = useCallback(() => {
    if (voiceSessionRef.current) {
      voiceSessionRef.current.cleanup();
    }
    setAgentState("idle");
    setError(null);
    setTranscript("");
    onClose();
  }, [onClose]);

  const handleVoiceInteraction = useCallback(async () => {
    const session = voiceSessionRef.current;
    if (!session) return;

    try {
      setError(null);

      // If already recording, stop and process
      if (session.isRecording()) {
        const audioBlob = await session.stopListening();
        
        // Process the audio
        setAgentState("processing");
        const text = await session.processVoiceInput(audioBlob);
        setTranscript(text);

        // Send to chat and get response
        const response = await onMessage(text);

        // If there's audio, play it
        if (response.audioUrl) {
          await session.playResponse(response.audioUrl);
          
          // After AI finishes speaking, automatically start listening again
          setTranscript("");
          await session.startListening();
        } else {
          // No audio, just go back to idle
          setAgentState("idle");
          setTranscript("");
        }
      } else {
        // Start recording
        await session.startListening();
      }
    } catch (err) {
      console.error("Voice interaction error:", err);
      setError(err instanceof Error ? err.message : "Voice interaction failed");
      setAgentState("idle");
      
      // Clear error after 3 seconds
      setTimeout(() => setError(null), 3000);
    }
  }, [onMessage]);

  const getStateText = () => {
    switch (agentState) {
      case "listening":
        return "Listening...";
      case "processing":
        return "Give me a sec...";
      case "talking":
        return `${personaName} is speaking...`;
      default:
        return "Ready for a conversation";
    }
  };

  const getButtonIcon = () => {
    if (agentState === "listening") {
      return <Square className="w-6 h-6" />;
    }
    return <Mic className="w-6 h-6" />;
  };

  const getButtonText = () => {
    if (agentState === "listening") {
      return "Stop Recording";
    }
    return "Start Talking";
  };

  if (!isOpen) return null;

  // Map voice session state to orb state
  const orbState = agentState === "processing" ? "idle" : agentState;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        // Allow clicking background to close only when idle
        if (e.target === e.currentTarget && agentState === "idle") {
          handleClose();
        }
      }}
    >
      <div
        className="relative w-full max-w-2xl mx-4 flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute -top-12 right-0 p-2 text-white/60 hover:text-white transition-colors"
          aria-label="Close voice mode"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Persona name */}
        <div className="mb-4 text-center">
          <h2 className="text-2xl font-semibold text-white">
            {personaName}
          </h2>
        </div>

        {/* Orb */}
        <div className="mb-8">
          <Orb
            agentState={orbState}
            avatarUrl={personaAvatar}
            size={280}
          />
        </div>

        {/* Status text */}
        <div className="mb-6 text-center min-h-[60px]">
          <p className="text-white text-lg mb-2">{getStateText()}</p>
          {transcript && (
            <p className="text-white/70 text-sm italic">"{transcript}"</p>
          )}
          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={handleVoiceInteraction}
            disabled={agentState === "processing" || agentState === "talking"}
            className={cn(
              "flex items-center gap-3 px-8 py-4 rounded-full font-medium transition-all shadow-lg",
              agentState === "listening"
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-blue-500 hover:bg-blue-600 text-white",
              (agentState === "processing" || agentState === "talking") &&
                "opacity-50 cursor-not-allowed"
            )}
          >
            {getButtonIcon()}
            <span>{getButtonText()}</span>
          </button>

          <p className="text-white/50 text-xs text-center max-w-md">
            {agentState === "idle" && "Start a voice conversation with " + personaName}
            {agentState === "listening" && "Speak now, then click Stop when done"}
            {agentState === "processing" && "Processing your message..."}
            {agentState === "talking" && "Listening will resume automatically after response"}
          </p>
        </div>
      </div>
    </div>
  );
}

