"use client";

import { useState, useEffect, Suspense, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { ChatList } from "@/components/ChatList";
import { Composer } from "@/components/Composer";
import { Toast } from "@/components/Toast";
import { 
  Conversation, 
  ConversationContent, 
  ConversationEmptyState, 
  ConversationScrollButton 
} from "@/components/ui/conversation";
import { Loader2, ArrowLeft } from "lucide-react";
import { getPersona, buildPersona, listPersonas } from "@/lib/personas";
import { getConversation, createConversation, sendMessage, addAssistantMessage } from "@/lib/chat";
import type { Persona, Conversation as ConversationType, Message } from "@/lib/supabase";
import Link from "next/link";

function ChatPageContent() {
  const searchParams = useSearchParams();
  const personaParam = searchParams.get("persona") || "warrenbuffett";
  const messageParam = searchParams.get("message");
  
  const [currentPersonaSlug, setCurrentPersonaSlug] = useState(personaParam);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [persona, setPersona] = useState<Persona | null>(null);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [conversation, setConversation] = useState<(ConversationType & { messages: Message[] }) | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" | "info" } | null>(null);
  const hasAutoSentRef = useRef(false);

  useEffect(() => {
    const fetchPersonas = async () => {
      const personaList = await listPersonas();
      setPersonas(personaList);
    };
    fetchPersonas();
  }, []);

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
      if (persona && !conversationId) { // Check for existing conversation
        try {
          const newConversation = await createConversation(persona.id);
          if (newConversation) {
            setConversationId(newConversation.id);
            setConversation(newConversation); // Also set the conversation object
          }
        } catch (err) {
          console.error("Error creating conversation:", err);
          setError("Failed to create conversation");
        }
      }
    };

    createNewConversation();
  }, [persona, conversationId]); // Add conversationId to dependencies

  // Load conversation and set up real-time subscription
  useEffect(() => {
    if (!conversationId) return;

    // Initial load
    const loadConversation = async () => {
      try {
        const conversationData = await getConversation(conversationId);
        setConversation(conversationData);
      } catch (err) {
        console.error("Error loading conversation:", err);
      }
    };

    loadConversation();

    // Skip real-time in demo mode
    const demoMode = process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_DEMO_MODE === "true";
    if (demoMode) return;

    // Set up real-time subscription for new messages
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { supabase } = require("@/lib/supabase");
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload: { new: { id: string } }) => {
          console.log('New message received:', payload.new);
          
          // Fetch the complete message with persona data
          const { data: newMessage } = await supabase
            .from('messages')
            .select(`
              *,
              persona:personas(*)
            `)
            .eq('id', payload.new.id)
            .single();

          if (newMessage) {
            setConversation((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                messages: [...prev.messages, newMessage]
              };
            });
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const handlePersonaSwitch = async (slug: string, remainingMessage?: string) => {
    if (!conversationId) {
      setToast({ message: "No active conversation", type: "error" });
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Call the persona switch API
      const response = await fetch('/api/persona/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          newPersonaSlug: slug,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to switch persona');
      }

      const { persona: newPersona } = await response.json();
      
      // Update local state with new persona
      setPersona(newPersona);
      setCurrentPersonaSlug(slug);
      setToast({ message: `Switched to ${newPersona.name}`, type: "success" });

      // If there's a remaining message, send it with the new persona
      if (remainingMessage?.trim()) {
        await handleSendMessage(remainingMessage);
      }
    } catch (err) {
      console.error("Error switching persona:", err);
      setToast({ message: "Failed to switch persona", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIResponse = useCallback(async (userMessage: string, personaData: Persona, convId: string) => {
    const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
    
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
        console.log('Generating TTS with voice_id:', personaData.voice_id);
        const ttsResponse = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            text: randomResponse,
            voiceId: personaData.voice_id
          })
        });
        
        if (!ttsResponse.ok) {
          console.error('TTS API error:', ttsResponse.status);
          return { text: randomResponse };
        }
        
        const ttsData = await ttsResponse.json();
        console.log('TTS generated, audioUrl length:', ttsData.audioUrl?.length || 0);
        return { text: randomResponse, audioUrl: ttsData.audioUrl };
      } catch (error) {
        console.error('Error generating TTS:', error);
        return { text: randomResponse };
      }
    }

    // Real mode - call LLM
    try {
      const llmResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: convId,
          text: userMessage,
        })
      });

      if (!llmResponse.ok) {
        const errorData = await llmResponse.json();
        console.error('LLM API error details:', errorData);
        throw new Error(`LLM API error: ${errorData.error || llmResponse.statusText}`);
      }

      const { text } = await llmResponse.json();
      
      // Generate audio
      try {
        console.log('Generating TTS for real mode with voice_id:', personaData.voice_id);
        const ttsResponse = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            text,
            voiceId: personaData.voice_id
          })
        });
        
        if (!ttsResponse.ok) {
          console.error('TTS API error:', ttsResponse.status);
          return { text };
        }
        
        const ttsData = await ttsResponse.json();
        console.log('TTS generated, audioUrl length:', ttsData.audioUrl?.length || 0);
        return { text, audioUrl: ttsData.audioUrl };
      } catch (error) {
        console.error('Error generating TTS:', error);
        return { text };
      }
    } catch (error) {
      console.error('Error generating AI response:', error);
      return { text: "I'm sorry, I'm having trouble processing that right now." };
    }
  }, []);

  const handleSendMessage = useCallback(async (content: string, convId?: string, personaOverride?: Persona) => {
    const activeConversationId = convId || conversationId;
    const activePersona = personaOverride || persona;
    if (!activeConversationId || !activePersona) return;

    try {
      setError(null);
      const demoMode = process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_DEMO_MODE === "true";
      
      // Send user message (no persona_id for user messages)
      await sendMessage(activeConversationId, content);

      // In demo mode, manually update the conversation state
      if (demoMode) {
        const updatedConversation = await getConversation(activeConversationId);
        setConversation(updatedConversation);
      }

      // Generate AI response
      const response = await generateAIResponse(content, activePersona, activeConversationId);
      await addAssistantMessage(activeConversationId, response.text, response.audioUrl, activePersona.id);

      // In demo mode, manually update the conversation state again
      if (demoMode) {
        const updatedConversation = await getConversation(activeConversationId);
        setConversation(updatedConversation);
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setToast({ message: "Failed to send message", type: "error" });
    }
  }, [conversationId, persona, generateAIResponse]);

  // Auto-send initial message from URL parameter
  useEffect(() => {
    const autoSendMessage = async () => {
      if (conversationId && persona && messageParam && !hasAutoSentRef.current) {
        hasAutoSentRef.current = true;
        await handleSendMessage(messageParam);
      }
    };

    autoSendMessage();
  }, [conversationId, persona, messageParam, handleSendMessage]);

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
      <header className="flex items-center justify-between p-4 border-b bg-gray-50 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/landing" className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          {persona && (
            <>
              {persona.avatar_url ? (
                <Image src={persona.avatar_url} alt={persona.name} width={40} height={40} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                  {persona.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="font-semibold text-gray-900">{persona.name}</h1>
                <p className="text-sm text-gray-500">@{persona.slug}</p>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Chat */}
      <main className="flex-1 overflow-hidden">
        <Conversation>
          <ConversationContent>
            {!conversation?.messages || conversation.messages.length === 0 ? (
              <ConversationEmptyState 
                title="No messages yet"
                description="Start a conversation below"
              />
            ) : (
              <ChatList messages={conversation.messages} />
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      </main>

      {/* Composer */}
      <footer className="flex-shrink-0">
        <Composer
          onSend={handleSendMessage}
          onPersonaSwitch={handlePersonaSwitch}
          disabled={!conversationId}
          personas={personas}
        />
      </footer>

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
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return (
    <>
      {isClient ? (
        <Suspense fallback={
          <div className="flex items-center justify-center h-screen">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        }>
          <ChatPageContent />
        </Suspense>
      ) : (
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      )}
    </>
  );
}
