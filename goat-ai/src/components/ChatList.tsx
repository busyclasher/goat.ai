"use client";

import { useEffect, useRef } from "react";
import { AudioPlayer } from "./AudioPlayer";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  audio_url?: string;
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
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
              AI
            </div>
          )}
          
          <div
            className={cn(
              "max-w-[80%] rounded-lg px-4 py-2",
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

          {message.role === "user" && (
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 text-sm font-medium">
              U
            </div>
          )}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
