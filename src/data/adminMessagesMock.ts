/**
 * Mock support conversations — replace with WebSocket / messaging API
 */

import type { ChatConversation, ChatMessage } from '@/types/adminMessages';

const INITIAL_CONVERSATIONS: ChatConversation[] = [
  {
    id: 'conv-john',
    user_id: 'john-travis',
    user_name: 'John Travis',
    user_email: 'johntravis@gmail.com',
    last_message: 'Thanks, the token worked!',
    last_message_at: '10:42 AM',
    unread_count: 0,
    status: 'active',
  },
  {
    id: 'conv-debbie',
    user_id: 'debbie-sam',
    user_name: 'Debbie Sam',
    user_email: 'debbiesam@gmail.com',
    last_message: 'My meter verification is still pending.',
    last_message_at: 'Yesterday',
    unread_count: 2,
    status: 'new',
  },
  {
    id: 'conv-michael',
    user_id: 'michael-essien',
    user_name: 'Michael Essien',
    user_email: 'mikeessien@gmail.com',
    last_message: 'Can you check transaction TRX-789460?',
    last_message_at: 'Mon',
    unread_count: 1,
    status: 'dormant',
  },
  {
    id: 'conv-anita',
    user_id: 'anita-bose',
    user_name: 'Anita Bose',
    user_email: 'anitabose@gmail.com',
    last_message: 'How do I schedule a weekly electricity purchase?',
    last_message_at: 'May 28',
    unread_count: 0,
    status: 'active',
  },
];

const INITIAL_MESSAGES: Record<string, ChatMessage[]> = {
  'conv-john': [
    {
      id: 'm1',
      conversation_id: 'conv-john',
      sender: 'user',
      text: 'Hi, I bought electricity but did not receive my token.',
      timestamp: '10:15 AM',
      sent_at: '2026-06-03T10:15:00Z',
    },
    {
      id: 'm2',
      conversation_id: 'conv-john',
      sender: 'admin',
      text: 'Hello John, I can help with that. Please share your transaction reference.',
      timestamp: '10:18 AM',
      sent_at: '2026-06-03T10:18:00Z',
    },
    {
      id: 'm3',
      conversation_id: 'conv-john',
      sender: 'user',
      text: 'TRX-789456',
      timestamp: '10:20 AM',
      sent_at: '2026-06-03T10:20:00Z',
    },
    {
      id: 'm4',
      conversation_id: 'conv-john',
      sender: 'admin',
      text: 'Found it — your token is 1234-5678-9012-3456. It has also been sent to your email.',
      timestamp: '10:35 AM',
      sent_at: '2026-06-03T10:35:00Z',
    },
    {
      id: 'm5',
      conversation_id: 'conv-john',
      sender: 'user',
      text: 'Thanks, the token worked!',
      timestamp: '10:42 AM',
      sent_at: '2026-06-03T10:42:00Z',
    },
  ],
  'conv-debbie': [
    {
      id: 'm6',
      conversation_id: 'conv-debbie',
      sender: 'user',
      text: 'I added my meter yesterday but it still shows unverified.',
      timestamp: 'Yesterday',
      sent_at: '2026-06-02T14:00:00Z',
    },
    {
      id: 'm7',
      conversation_id: 'conv-debbie',
      sender: 'admin',
      text: 'Hi Debbie, we are reviewing your meter details. This usually takes up to 24 hours.',
      timestamp: 'Yesterday',
      sent_at: '2026-06-02T15:30:00Z',
    },
    {
      id: 'm8',
      conversation_id: 'conv-debbie',
      sender: 'user',
      text: 'My meter verification is still pending.',
      timestamp: 'Yesterday',
      sent_at: '2026-06-02T18:00:00Z',
    },
  ],
  'conv-michael': [
    {
      id: 'm9',
      conversation_id: 'conv-michael',
      sender: 'user',
      text: 'Can you check transaction TRX-789460?',
      timestamp: 'Mon',
      sent_at: '2026-06-01T09:00:00Z',
    },
  ],
  'conv-anita': [
    {
      id: 'm10',
      conversation_id: 'conv-anita',
      sender: 'user',
      text: 'How do I schedule a weekly electricity purchase?',
      timestamp: 'May 28',
      sent_at: '2026-05-28T11:00:00Z',
    },
    {
      id: 'm11',
      conversation_id: 'conv-anita',
      sender: 'admin',
      text: 'Go to Electricity → Schedule purchase and pick weekly frequency. I can walk you through it if needed.',
      timestamp: 'May 28',
      sent_at: '2026-05-28T11:15:00Z',
    },
  ],
};

let conversations = [...INITIAL_CONVERSATIONS];
let messagesByConv = { ...INITIAL_MESSAGES };

type Listener = () => void;
const listeners = new Set<Listener>();

let conversationsSnapshot = [...conversations];
let messagesVersion = 0;
const messagesSnapshotCache = new Map<string, ChatMessage[]>();

function refreshSnapshot() {
  conversationsSnapshot = [...conversations];
  messagesSnapshotCache.clear();
}

function notify() {
  messagesVersion += 1;
  refreshSnapshot();
  listeners.forEach((fn) => fn());
}

export function getMessagesStoreVersion(): number {
  return messagesVersion;
}

export function subscribeMessages(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getConversationsSnapshot(): ChatConversation[] {
  return conversationsSnapshot;
}

export function getMessages(conversationId: string): ChatMessage[] {
  let snap = messagesSnapshotCache.get(conversationId);
  if (!snap) {
    snap = [...(messagesByConv[conversationId] ?? [])];
    messagesSnapshotCache.set(conversationId, snap);
  }
  return snap;
}

export function sendAdminMessage(conversationId: string, text: string): ChatMessage {
  const trimmed = text.trim();
  const msg: ChatMessage = {
    id: `m-${Date.now()}`,
    conversation_id: conversationId,
    sender: 'admin',
    text: trimmed,
    timestamp: 'Just now',
    sent_at: new Date().toISOString(),
  };
  const existing = messagesByConv[conversationId] ?? [];
  messagesByConv = { ...messagesByConv, [conversationId]: [...existing, msg] };
  conversations = conversations.map((c) =>
    c.id === conversationId
      ? { ...c, last_message: trimmed, last_message_at: 'Just now', unread_count: 0 }
      : c
  );
  notify();
  return msg;
}

export function markConversationRead(conversationId: string) {
  const target = conversations.find((c) => c.id === conversationId);
  if (!target || target.unread_count === 0) return;
  conversations = conversations.map((c) =>
    c.id === conversationId ? { ...c, unread_count: 0 } : c
  );
  notify();
}

export function getConversationById(id: string): ChatConversation | undefined {
  return conversations.find((c) => c.id === id);
}
