"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { AudioPlayer } from "./AudioPlayer";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  audio_url?: string;
  persona_id?: string;
  persona?: {
    id: string;
    slug: string;
    name: string;
    voice_id?: string;
    avatar_url?: string;
  };
  created_at: string;
}

interface ChatListProps {
  messages: Message[];
  className?: string;
}

export function ChatList({ messages, className }: ChatListProps) {
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const handleCopy = (content: string, messageId: string) => {
    if (copiedMessageId === messageId) return;
    navigator.clipboard.writeText(content).then(() => {
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    }).catch(err => {
      console.error("Failed to copy text: ", err);
    });
  };

  return (
    <div className={cn("p-4 space-y-4", className)}>
      {messages.map((message) => {
        // Add null check for message
        if (!message || !message.id) {
          console.warn("Invalid message:", message);
          return null;
        }

        return (
          <div
            key={message.id}
            className={cn(
              "flex gap-3 items-start group",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {message.role === "assistant" && (
              message.persona?.avatar_url ? (
                <Image src={message.persona.avatar_url} alt={message.persona.name} width={32} height={32} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                  {message.persona?.name?.[0]?.toUpperCase() || "AI"}
                </div>
              )
            )}
            
            <div
              className={cn(
                "max-w-[70%] min-w-[100px]",
                message.role === "user" ? "" : "flex flex-col gap-1"
              )}
            >
              {message.role === "assistant" && message.persona && (
                <div className="text-xs font-medium text-gray-600 px-1">
                  {message.persona.name}
                </div>
              )}
              
              <div
                className={cn(
                  "rounded-lg px-4 py-2 break-words",
                  message.role === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-900"
                )}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.content || "(empty message)"}
                    </p>
                  </div>
                  {message.audio_url && (
                    <div className="flex-shrink-0">
                      <AudioPlayer 
                        audioUrl={message.audio_url} 
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {message.role === "assistant" && message.content && (
              <div className="flex-shrink-0 self-center">
                <button
                  onClick={() => handleCopy(message.content, message.id)}
                  className="p-1 rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Copy message"
                >
                  {copiedMessageId === message.id ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            )}

            {message.role === "user" && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 text-sm font-medium">
                U
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
