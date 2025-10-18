import { supabase, type Conversation, type Message } from './supabase'

// In-memory storage for demo mode
const demoConversations: Map<string, Conversation & { messages: Message[] }> = new Map()

export async function getConversation(conversationId: string): Promise<(Conversation & { messages: Message[] }) | null> {
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
  
  // Demo mode: use in-memory storage
  if (demoMode) {
    return demoConversations.get(conversationId) || null
  }

  // Real mode: use Supabase
  const { data: conversation, error: conversationError } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single()

  if (conversationError) {
    console.error('Error fetching conversation:', conversationError)
    return null
  }

  const { data: messages, error: messagesError } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (messagesError) {
    console.error('Error fetching messages:', messagesError)
    return null
  }

  return {
    ...conversation,
    messages: messages || []
  }
}

export async function createConversation(personaId: string, userId?: string, title?: string): Promise<Conversation | null> {
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
  
  // Demo mode: create in memory
  if (demoMode) {
    const newConversation: Conversation & { messages: Message[] } = {
      id: `demo-conv-${Date.now()}`,
      persona_id: personaId,
      user_id: userId,
      title,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      messages: []
    }
    demoConversations.set(newConversation.id, newConversation)
    return newConversation
  }

  // Real mode: use Supabase
  const { data, error } = await supabase
    .from('conversations')
    .insert([{
      persona_id: personaId,
      user_id: userId,
      title
    }])
    .select()
    .single()

  if (error) {
    console.error('Error creating conversation:', error)
    return null
  }

  return data
}

export async function sendMessage(conversationId: string, content: string, audioUrl?: string): Promise<boolean> {
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
        audio_url: audioUrl,
        created_at: new Date().toISOString()
      }
      conversation.messages.push(newMessage)
      conversation.updated_at = new Date().toISOString()
    }
    return true
  }

  // Real mode: use Supabase
  const { error } = await supabase
    .from('messages')
    .insert([{
      conversation_id: conversationId,
      role: 'user',
      content,
      audio_url: audioUrl
    }])

  if (error) {
    console.error('Error sending message:', error)
    return false
  }

  // Update conversation timestamp
  const { error: updateError } = await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId)

  if (updateError) {
    console.error('Error updating conversation:', updateError)
  }

  return true
}

export async function addAssistantMessage(conversationId: string, content: string, audioUrl?: string): Promise<boolean> {
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
        created_at: new Date().toISOString()
      }
      conversation.messages.push(newMessage)
    }
    return true
  }

  // Real mode: use Supabase
  const { error } = await supabase
    .from('messages')
    .insert([{
      conversation_id: conversationId,
      role: 'assistant',
      content,
      audio_url: audioUrl
    }])

  if (error) {
    console.error('Error adding assistant message:', error)
    return false
  }

  return true
}
