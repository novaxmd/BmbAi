import { useState, useCallback } from 'react';

export interface ChatSummary {
  id: string;
  title: string;
  provider: string;
  created_at: string;
  updated_at: string;
}

export interface StoredMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  created_at: string;
}

export function useChatHistory() {
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchChats = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/chats', { credentials: 'include' });
      if (res.status === 401) {
        setChats([]);
        return;
      }
      const data = await res.json();
      setChats(data.chats || []);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createChat = useCallback(async (title: string, provider: string) => {
    const res = await fetch('/api/chats', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, provider }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create chat');
    return data.chat;
  }, []);

  const loadChat = useCallback(async (chatId: string) => {
    const res = await fetch(`/api/chats/${chatId}`, { credentials: 'include' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load chat');
    return data as { chat: ChatSummary; messages: StoredMessage[] };
  }, []);

  const deleteChat = useCallback(async (chatId: string) => {
    const res = await fetch(`/api/chats/${chatId}`, { method: 'DELETE', credentials: 'include' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to delete chat');
    }
    setChats((prev) => prev.filter((c) => c.id !== chatId));
  }, []);

  const addMessage = useCallback(async (chatId: string, role: 'user' | 'model', content: string) => {
    await fetch(`/api/chats/${chatId}/messages`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, content }),
    });
  }, []);

  const renameChat = useCallback(async (chatId: string, title: string) => {
    await fetch(`/api/chats/${chatId}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
  }, []);

  return { chats, isLoading, fetchChats, createChat, loadChat, deleteChat, addMessage, renameChat };
}
