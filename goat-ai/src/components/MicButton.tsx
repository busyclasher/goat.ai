"use client";

import { useState, useRef, useCallback } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { RecordingModal } from "./RecordingModal";

interface MicButtonProps {
  onTranscription: (text: string) => void;
  onError: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

export function MicButton({ 
  onTranscription, 
  onError, 
  disabled = false,
  className 
}: MicButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const processAudio = useCallback(async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch('/api/stt', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`STT API error: ${response.status}`);
      }

      const data = await response.json();
      if (data.text && data.text.trim()) {
        onTranscription(data.text.trim());
      } else {
        onError("No speech detected. Please try again.");
      }
    } catch (error) {
      console.error("Error processing audio:", error);
      onError("Failed to process audio. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [onTranscription, onError]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMediaStream(stream);
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
        setMediaStream(null);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setShowModal(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      onError("Failed to access microphone. Please check permissions.");
    }
  }, [onError, processAudio]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setShowModal(false);
    }
  }, [isRecording]);

  const handleClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={disabled || isProcessing}
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-full transition-colors flex-shrink-0",
          isRecording 
            ? "bg-red-500 hover:bg-red-600 text-white" 
            : "bg-gray-200 hover:bg-gray-300 text-gray-700",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        aria-label={isRecording ? "Stop recording" : "Start recording"}
      >
        {isProcessing ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isRecording ? (
          <MicOff className="w-5 h-5" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </button>

      <RecordingModal
        isOpen={showModal}
        onClose={stopRecording}
        mediaStream={mediaStream}
        isProcessing={isProcessing}
      />
    </>
  );
}
