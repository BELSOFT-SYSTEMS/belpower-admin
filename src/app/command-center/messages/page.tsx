'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { FaPaperPlane, FaSearch, FaComments } from 'react-icons/fa';
import '@/styles/adminMessages.css';
import '@/styles/adminShared.css';
import {
  getConversationsSnapshot,
  getMessages,
  markConversationRead,
  sendAdminMessage,
} from '@/data/adminMessagesMock';
import { useMessagesStore, useMessagesStoreVersion } from '@/hooks/useMessagesStore';
import { getAvatarBackground, getUserInitials } from '@/utils/userAvatar';

function parseUserName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  return {
    first: parts[0] ?? '',
    last: parts.slice(1).join(' ') || parts[0] || '',
  };
}

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const conversations = useMessagesStore();
  const storeVersion = useMessagesStoreVersion();
  const [activeId, setActiveId] = useState<string | null>(
    () => getConversationsSnapshot()[0]?.id ?? null
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [draft, setDraft] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const messages = useMemo(
    () => (activeId ? getMessages(activeId) : []),
    [activeId, storeVersion]
  );

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId),
    [conversations, activeId]
  );

  const activeName = useMemo(
    () => (activeConversation ? parseUserName(activeConversation.user_name) : null),
    [activeConversation]
  );

  const filteredConversations = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return conversations;
    return conversations.filter(
      (c) =>
        c.user_name.toLowerCase().includes(q) ||
        c.user_email.toLowerCase().includes(q) ||
        c.last_message.toLowerCase().includes(q)
    );
  }, [conversations, searchTerm]);

  useEffect(() => {
    const userId = searchParams?.get('userId');
    if (!userId) return;

    const conversation = getConversationsSnapshot().find((c) => c.user_id === userId);
    if (conversation) {
      setActiveId(conversation.id);
    }
  }, [searchParams]);

  useEffect(() => {
    if (activeId) {
      markConversationRead(activeId);
    }
  }, [activeId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelect = useCallback((id: string) => {
    setActiveId(id);
    setDraft('');
  }, []);

  const handleSend = useCallback(() => {
    if (!activeId || !draft.trim()) return;
    sendAdminMessage(activeId, draft);
    setDraft('');
  }, [activeId, draft]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="messages_page">
      <h1>Messages</h1>

      <div className="messages_shell">
        <aside className="conversations_panel">
          <div className="conversations_search">
            <FaSearch />
            <input
              type="text"
              placeholder="Search conversations"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <ul className="conversations_list">
            {filteredConversations.map((conv) => {
              const { first, last } = parseUserName(conv.user_name);
              return (
                <li key={conv.id}>
                  <button
                    type="button"
                    className={`conversation_item${activeId === conv.id ? ' is_active' : ''}`}
                    onClick={() => handleSelect(conv.id)}
                  >
                    <div
                      className="admin_user_avatar_initials"
                      style={{ backgroundColor: getAvatarBackground(conv.user_id) }}
                      aria-hidden
                    >
                      {getUserInitials(first, last)}
                    </div>
                    <div className="conversation_item_body">
                      <div className="conversation_item_top">
                        <strong>{conv.user_name}</strong>
                        <span className="conversation_item_time">{conv.last_message_at}</span>
                      </div>
                      <p className="conversation_item_preview">{conv.last_message}</p>
                    </div>
                    {conv.unread_count > 0 && (
                      <span className="conversation_unread">{conv.unread_count}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <section className="chat_panel">
          {!activeConversation ? (
            <div className="chat_empty">
              <FaComments style={{ fontSize: '2rem', color: '#9ca3af' }} />
              <p>Select a conversation to start supporting users.</p>
            </div>
          ) : (
            <>
              <header className="chat_header">
                <div
                  className="admin_user_avatar_initials"
                  style={{
                    backgroundColor: getAvatarBackground(activeConversation.user_id),
                  }}
                  aria-hidden
                >
                  {activeName && getUserInitials(activeName.first, activeName.last)}
                </div>
                <div className="chat_header_info">
                  <h2>{activeConversation.user_name}</h2>
                  <p>{activeConversation.user_email}</p>
                </div>
                <span className={`pill pill_${activeConversation.status}`}>
                  {activeConversation.status}
                </span>
              </header>

              <div className="chat_messages">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`chat_bubble_row ${msg.sender === 'admin' ? 'is_admin' : 'is_user'}`}
                  >
                    <div className="chat_bubble">
                      {msg.text}
                      <span className="chat_bubble_time">{msg.timestamp}</span>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <div className="chat_compose">
                <input
                  type="text"
                  placeholder="Type a message…"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={handleKeyDown}
                  aria-label="Message"
                />
                <button
                  type="button"
                  className="chat_send_btn"
                  disabled={!draft.trim()}
                  onClick={handleSend}
                  aria-label="Send message"
                >
                  <FaPaperPlane />
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
