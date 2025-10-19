import { useState, useEffect, useCallback } from 'react';
import { getConversation, createConversation } from '@/lib/chat';
import type { Conversation as ConversationType, Message as SupabaseMessage, Persona } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';

type Message = SupabaseMessage & { type?: 'system_notification' };

export function useConversation(persona: Persona | null) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<(ConversationType & { messages: Message[] }) | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const createNewConversation = async () => {
      if (persona && !conversationId) {
        try {
          const newConversation = await createConversation(persona.id);
          if (newConversation) {
            setConversationId(newConversation.id);
            setConversation(newConversation as ConversationType & { messages: Message[] });
          }
        } catch (err) {
          console.error("Error creating conversation:", err);
          setError("Failed to create conversation");
        }
      }
    };
    createNewConversation();
  }, [persona, conversationId]);

  useEffect(() => {
    if (!conversationId) return;

    const loadConversation = async () => {
      try {
        const conversationData = await getConversation(conversationId);
        setConversation(conversationData);
      } catch (err) {
        console.error("Error loading conversation:", err);
        setError("Failed to load conversation");
      }
    };
    loadConversation();

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
          const { data: newMessage } = await supabase
            .from('messages')
            .select('*, persona:personas(*)')
            .eq('id', payload.new.id)
            .single();

          if (newMessage) {
            setConversation((prev) => {
              if (!prev) return prev;
              if (prev.messages.some(msg => msg.id === newMessage.id)) {
                return prev;
              }
              return {
                ...prev,
                messages: [...prev.messages, newMessage]
              };
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const addMessage = useCallback((message: Message) => {
    setConversation(prev => {
        if (!prev) return null;
        if (prev.messages.some(msg => msg.id === message.id)) {
          return prev;
        }
        return {
          ...prev,
          messages: [...prev.messages, message]
        };
      });
  }, []);

  return { conversation, conversationId, error, addMessage };
}
