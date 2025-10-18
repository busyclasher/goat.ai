"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ChatList } from "@/components/ChatList";
import { Composer } from "@/components/Composer";
import { Toast } from "@/components/Toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { getPersona, buildPersona } from "@/lib/personas";
import { getConversation, createConversation, sendMessage, addAssistantMessage } from "@/lib/chat";
import type { Persona, Conversation, Message } from "@/lib/supabase";
import Link from "next/link";

function ChatPageContent() {
  const searchParams = useSearchParams();
  const personaParam = searchParams.get("persona") || "warrenbuffett";
  
  const [currentPersonaSlug, setCurrentPersonaSlug] = useState(personaParam);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [persona, setPersona] = useState<Persona | null>(null);
  const [conversation, setConversation] = useState<(Conversation & { messages: Message[] }) | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" | "info" } | null>(null);

  // Load persona when slug changes
  useEffect(() => {
    const loadPersona = async () => {
      if (!currentPersonaSlug) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        let personaData = await getPersona(currentPersonaSlug);
        if (!personaData) {
          personaData = await buildPersona(currentPersonaSlug);
        }
        setPersona(personaData);
      } catch (err) {
        console.error("Error loading persona:", err);
        setError("Failed to load persona");
      } finally {
        setIsLoading(false);
      }
    };

    loadPersona();
  }, [currentPersonaSlug]);

  // Create conversation when persona is ready
  useEffect(() => {
    const createNewConversation = async () => {
      if (persona && !conversationId) {
        try {
          const newConversation = await createConversation(persona.id);
          if (newConversation) {
            setConversationId(newConversation.id);
          }
        } catch (err) {
          console.error("Error creating conversation:", err);
          setError("Failed to create conversation");
        }
      }
    };

    createNewConversation();
  }, [persona, conversationId]);

  // Load conversation when conversationId changes
  useEffect(() => {
    const loadConversation = async () => {
      if (conversationId) {
        try {
          const conversationData = await getConversation(conversationId);
          setConversation(conversationData);
        } catch (err) {
          console.error("Error loading conversation:", err);
        }
      }
    };

    loadConversation();
  }, [conversationId]);

  const handlePersonaSwitch = async (slug: string) => {
    setCurrentPersonaSlug(slug);
    setConversationId(null);
    setError(null);
  };

  const handleSendMessage = async (content: string) => {
    if (!conversationId || !persona) return;

    try {
      setError(null);
      await sendMessage(conversationId, content);

      // Generate AI response
      const response = await generateAIResponse(content, persona);
      await addAssistantMessage(conversationId, response.text, response.audioUrl);
      
      // Refresh conversation to show new messages
      const updatedConversation = await getConversation(conversationId);
      setConversation(updatedConversation);
    } catch (err) {
      console.error("Error sending message:", err);
      setToast({ message: "Failed to send message", type: "error" });
    }
  };

  const generateAIResponse = async (userMessage: string, persona: any) => {
    const demoMode = process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_DEMO_MODE === "true";
    
    if (demoMode) {
      // Demo mode - return canned response
      const responses = [
        "That's an interesting perspective. Let me think about this...",
        "I've seen this situation many times before. Here's what I would suggest...",
        "You're asking the right questions. This reminds me of a similar case...",
        "Based on my experience, I'd recommend taking a different approach...",
        "That's a great point. Let me share what I've learned about this..."
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      // Generate audio for demo
      try {
        const ttsResponse = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: randomResponse })
        });
        const ttsData = await ttsResponse.json();
        return { text: randomResponse, audioUrl: ttsData.audioUrl };
      } catch {
        return { text: randomResponse };
      }
    }

    // Real mode - call LLM
    try {
      const llmResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          systemPrompt: persona.system_prompt,
          conversationHistory: conversation?.messages.slice(-10) || []
        })
      });

      if (!llmResponse.ok) {
        throw new Error('LLM API error');
      }

      const { text } = await llmResponse.json();
      
      // Generate audio
      try {
        const ttsResponse = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        });
        const ttsData = await ttsResponse.json();
        return { text, audioUrl: ttsData.audioUrl };
      } catch {
        return { text };
      }
    } catch (error) {
      console.error('Error generating AI response:', error);
      return { text: "I'm sorry, I'm having trouble processing that right now." };
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading persona...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!persona) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Persona not found</p>
          <Link 
            href="/landing"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 inline-block"
          >
            Choose Persona
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center gap-3">
          <Link href="/landing" className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
            {persona.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="font-semibold text-gray-900">{persona.name}</h1>
            <p className="text-sm text-gray-500">@{persona.slug}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="@persona"
            className="px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const value = e.currentTarget.value.trim();
                if (value.startsWith('@')) {
                  handlePersonaSwitch(value.slice(1));
                  e.currentTarget.value = '';
                }
              }
            }}
          />
        </div>
      </div>

      {/* Chat */}
      <ChatList 
        messages={conversation?.messages || []} 
        className="flex-1"
      />

      {/* Composer */}
      <Composer
        onSend={handleSendMessage}
        onPersonaSwitch={handlePersonaSwitch}
        disabled={!conversationId}
      />

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  );
}
