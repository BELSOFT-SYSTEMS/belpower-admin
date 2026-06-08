export type ChatSender = 'admin' | 'user';

export type ChatMessage = {
  id: string;
  conversation_id: string;
  sender: ChatSender;
  text: string;
  timestamp: string;
  sent_at: string;
};

export type ChatConversation = {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  status: 'active' | 'dormant' | 'blocked' | 'new';
};
