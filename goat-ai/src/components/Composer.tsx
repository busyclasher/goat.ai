"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { MicButton } from "./MicButton";
import { Toast } from "./Toast";
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
  const [toastMessage, setToastMessage] = useState<string | null>(null);
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
    setToastMessage(error);
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  return (
    <>
      <form onSubmit={handleSubmit} className={cn("flex gap-2 p-4 border-t", className)}>
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="@ to switch persona, or type a message..."
            className="w-full h-12 p-3 bg-gray-100 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all text-gray-900"
            rows={1}
            disabled={isSending || disabled}
          />
        </div>
        
        <MicButton
          onTranscription={handleTranscription}
          onError={handleError}
          disabled={disabled || isSending}
        />
        
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

      {toastMessage && (
        <Toast
          message={toastMessage}
          type="error"
          onClose={() => setToastMessage(null)}
        />
      )}
    </>
  );
}
