import { supabase, type Conversation, type Message } from './supabase'

// In-memory storage for demo mode
const demoConversations: Map<string, Conversation & { messages: Message[] }> = new Map()

export async function getConversation(
  conversationId: string
): Promise<(Conversation & { messages: Message[] }) | null> {
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  // Demo mode: use in-memory storage
  if (demoMode) {
    return demoConversations.get(conversationId) || null;
  }

  try {
    const response = await fetch(`/api/conversations/${conversationId}`);

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error fetching conversation:", errorData.error);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Exception when trying to fetch conversation:", error);
    return null;
  }
}

export async function createConversation(
  personaId: string,
  userId?: string,
  title?: string,
): Promise<Conversation | null> {
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  // Demo mode: create in memory
  if (demoMode) {
    const newConversation: Conversation & { messages: Message[] } = {
      id: `demo-conv-${Date.now()}`,
      persona_id: personaId,
      user_id: userId,
      title,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      messages: [],
    };
    demoConversations.set(newConversation.id, newConversation);
    return newConversation;
  }

  try {
    const response = await fetch("/api/conversations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ personaId, userId, title }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error creating conversation:", errorData.error);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Exception when trying to create conversation:", error);
    return null;
  }
}

export async function sendMessage(conversationId: string, content: string): Promise<boolean> {
  console.log(`Sending user message to conversation ${conversationId}:`, { content });

  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
  
  // Demo mode: add to in-memory conversation
  if (demoMode) {
    const conversation = demoConversations.get(conversationId)
    if (conversation) {
      const newMessage: Message = {
        id: `demo-msg-${Date.now()}`,
        conversation_id: conversationId,
        role: 'user',
        content,
        audio_url: undefined, // audioUrl is no longer a parameter
        persona_id: undefined, // personaId is no longer a parameter
        created_at: new Date().toISOString()
      }
      conversation.messages.push(newMessage)
      conversation.updated_at = new Date().toISOString()
    }
    return true
  }

  try {
    const response = await fetch('/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ conversationId, role: 'user', content, audioUrl: undefined, personaId: undefined }), // audioUrl and personaId are no longer parameters
    });

    return response.ok;
  } catch (error) {
    console.error("Exception when sending message:", error);
    return false;
  }
}

export async function addAssistantMessage(conversationId: string, content: string, audioUrl?: string, personaId?: string): Promise<boolean> {
  console.log(`Adding assistant message to conversation ${conversationId}:`, { content, audioUrl, personaId });

  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
  
  // Demo mode: add to in-memory conversation
  if (demoMode) {
    const conversation = demoConversations.get(conversationId)
    if (conversation) {
      const newMessage: Message = {
        id: `demo-msg-${Date.now()}`,
        conversation_id: conversationId,
        role: 'assistant',
        content,
        audio_url: audioUrl,
        persona_id: personaId,
        created_at: new Date().toISOString()
      }
      conversation.messages.push(newMessage)
    }
    return true
  }

  try {
    const response = await fetch('/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ conversationId, role: 'assistant', content, audioUrl, personaId }),
    });

    return response.ok;
  } catch (error) {
    console.error("Exception when adding assistant message:", error);
    return false;
  }
}
