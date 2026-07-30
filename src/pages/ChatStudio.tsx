import React from 'react';
import { ChatTools } from '../components/ChatTools';

interface ChatStudioProps {
  activeChatId: string | null;
  loadChatTrigger: number;
  onChatIdChange: (id: string | null) => void;
}

const ChatStudio: React.FC<ChatStudioProps> = ({ activeChatId, loadChatTrigger, onChatIdChange }) => {
  return <ChatTools activeChatId={activeChatId} loadChatTrigger={loadChatTrigger} onChatIdChange={onChatIdChange} />;
};

export default ChatStudio;
