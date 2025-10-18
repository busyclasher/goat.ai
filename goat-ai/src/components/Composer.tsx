"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { MicButton } from "./MicButton";
import { cn } from "@/lib/utils";

interface ComposerProps {
  onSend: (message: string) => void;
  onPersonaSwitch: (slug: string, remainingMessage?: string) => Promise<void>;
  disabled?: boolean;
  className?: string;
}

export function Composer({ 
  onSend, 
  onPersonaSwitch, 
  disabled = false,
  className 
}: ComposerProps) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSending || disabled) return;

    // Check for persona switch - detect @mention anywhere in message
    const personaMatch = message.match(/@(\w+)(?:\s+(.*))?/);
    if (personaMatch) {
      const [fullMatch, slug, remainingMessage] = personaMatch;
      
      setIsSending(true);
      try {
        await onPersonaSwitch(slug, remainingMessage?.trim());
        setMessage("");
      } catch (error) {
        console.error("Error switching persona:", error);
      } finally {
        setIsSending(false);
      }
      return;
    }

    setIsSending(true);
    try {
      await onSend(message);
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTranscription = (text: string) => {
    setMessage(text);
    textareaRef.current?.focus();
  };

  const handleError = (error: string) => {
    console.error("Mic error:", error);
    // You could add a toast notification here
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  return (
    <form onSubmit={handleSubmit} className={cn("flex gap-2 p-4 border-t", className)}>
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message or @persona to switch... (Shift+Enter for new line)"
          disabled={disabled || isSending}
          className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          rows={1}
          style={{ minHeight: "40px", maxHeight: "120px" }}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
          <MicButton
            onTranscription={handleTranscription}
            onError={handleError}
            disabled={disabled || isSending}
            className="w-8 h-8"
          />
        </div>
      </div>
      
      <button
        type="submit"
        disabled={!message.trim() || isSending || disabled}
        className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
        aria-label="Send message"
      >
        {isSending ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Send className="w-5 h-5" />
        )}
      </button>
    </form>
  );
}
