"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { MicButton } from "./MicButton";
import { Toast } from "./Toast";
import { cn } from "@/lib/utils";
import { PersonaSuggestions } from "./PersonaSuggestions";
import type { Persona } from "@/lib/supabase";

interface ComposerProps {
  onSend: (message: string) => void;
  onPersonaSwitch: (slug: string, remainingMessage?: string) => Promise<void>;
  disabled?: boolean;
  className?: string;
  personas: Persona[];
}

export function Composer({ 
  onSend, 
  onPersonaSwitch, 
  disabled = false,
  className,
  personas
}: ComposerProps) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [suggestions, setSuggestions] = useState<Persona[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSending || disabled) return;

    // Check for persona switch - detect @mention anywhere in message
    // Supports hyphens in persona slugs (e.g., @warren-buffett)
    const personaMatch = message.match(/@([\w]+)(?:\s+(.*))?/); // Disallow hyphens
    if (personaMatch) {
      const [, slug, remainingMessage] = personaMatch;
      
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

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);

    const mentionMatch = value.match(/@(\w*)$/);
    if (mentionMatch) {
      const query = mentionMatch[1].toLowerCase();
      const filteredPersonas = personas.filter(p =>
        p.slug.toLowerCase().startsWith(query)
      );
      setSuggestions(filteredPersonas);
      setShowSuggestions(filteredPersonas.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (slug: string) => {
    const updatedMessage = message.replace(/@(\w*)$/, `@${slug} `);
    setMessage(updatedMessage);
    setShowSuggestions(false);
    textareaRef.current?.focus();
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
        <div className="flex-1 relative">
          {showSuggestions && (
            <PersonaSuggestions
              suggestions={suggestions}
              onSelect={handleSuggestionClick}
            />
          )}
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message or @warrenbuffett to switch... (Shift+Enter for new line)"
            disabled={disabled || isSending}
            className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 pr-12 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            rows={1}
            style={{ minHeight: "40px", maxHeight: "120px" }}
          />
        </div>
        
        <div className="flex-shrink-0 flex items-center gap-2">
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
        </div>
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
