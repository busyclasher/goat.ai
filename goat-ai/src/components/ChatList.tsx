"use client";

import { useEffect, useRef } from "react";
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
  };
  created_at: string;
}

interface ChatListProps {
  messages: Message[];
  className?: string;
}

export function ChatList({ messages, className }: ChatListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    console.log('ChatList messages:', messages.map(m => ({
      id: m.id,
      role: m.role,
      hasAudio: !!m.audio_url,
      audioUrlLength: m.audio_url?.length || 0
    })));
  }, [messages]);

  return (
    <div className={cn("flex-1 overflow-y-auto p-4 space-y-4", className)}>
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn(
            "flex gap-3",
            message.role === "user" ? "justify-end" : "justify-start"
          )}
        >
          {message.role === "assistant" && (
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
              {message.persona?.name?.[0]?.toUpperCase() || "AI"}
            </div>
          )}
          
          <div
            className={cn(
              "max-w-[80%]",
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
                "rounded-lg px-4 py-2",
                message.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-900"
              )}
              data-testid={message.role === "assistant" ? "assistant-message" : "user-message"}
            >
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                {message.audio_url && (
                  <AudioPlayer 
                    audioUrl={message.audio_url} 
                    autoPlay={message.role === "assistant"}
                  />
                )}
              </div>
            </div>
          </div>

          {message.role === "user" && (
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 text-sm font-medium">
              U
            </div>
          )}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
