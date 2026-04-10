'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import Avatar from '@/components/Avatar';
import { useTranslation } from 'react-i18next';
import '../i18n';

interface ChatUser {
  id: number;
  username: string;
}

interface Message {
  id: number;
  content: string;
  senderId: number;
  receiverId: number;
  createdAt: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

function authHeaders(): HeadersInit {
  const token = Cookies.get('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function MessagesPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [allUsers, setAllUsers] = useState<ChatUser[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetch(`${API_URL}/auth/me`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => setCurrentUserId(data.id));
  }, []);

  useEffect(() => {
    if (!currentUserId) return;
    fetch(`${API_URL}/auth/conversations`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setChatUsers(data); });
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId || !selectedId) return;
    const token = Cookies.get('token');
    const socket = io(API_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on('newMessage', (msg: Message) => {
      if (msg.senderId === selectedId || msg.receiverId === selectedId) {
        setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
        scrollToBottom();
      }
    });

    socket.on('messageSent', (msg: Message) => {
      setMessages((prev) => [...prev.filter((m) => m.id !== msg.id), msg]);
      scrollToBottom();
    });

    return () => { socket.disconnect(); };
  }, [currentUserId, selectedId]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socketRef.current || !currentUserId || !selectedId) return;

    const optimistic: Message = {
      id: Date.now(),
      content: newMessage,
      senderId: currentUserId,
      receiverId: selectedId,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    scrollToBottom();
    socketRef.current.emit('sendMessage', { receiverId: selectedId, content: newMessage });
    setNewMessage('');
  };

  const openNewChat = () => {
    if (allUsers.length === 0) {
      Promise.all([
        fetch(`${API_URL}/users/me/following`, { headers: authHeaders() }).then((r) => r.json()),
        fetch(`${API_URL}/users/me/followers`, { headers: authHeaders() }).then((r) => r.json()),
      ]).then(([following, followers]) => {
        const merged = new Map<number, ChatUser>();
        [...(Array.isArray(following) ? following : []), ...(Array.isArray(followers) ? followers : [])]
          .forEach((u: ChatUser) => { if (u.id !== currentUserId) merged.set(u.id, u); });
        setAllUsers(Array.from(merged.values()));
      });
    }
    setShowNewChat(true);
    setUserSearch('');
  };

  const startChat = (user: ChatUser) => {
    if (!chatUsers.find((u) => u.id === user.id)) {
      setChatUsers((prev) => [user, ...prev]);
    }
    setShowNewChat(false);
    selectChat(user.id);
  };

  const selectChat = (id: number) => {
    setSelectedId(id);
    setMessages([]);
    fetch(`${API_URL}/auth/messages/${id}`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setMessages(data); })
      .catch(console.error);
  };

  const selectedUser = chatUsers.find((u) => u.id === selectedId);

  if (!currentUserId) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="muted">{t('messages.loading')}</span>
      </div>
    );
  }

  return (
    <div className="page">
      {/* Topbar */}
      <header className="topbar">
        <button className="ghostBtn btnSmall" onClick={() => router.push('/home')} type="button">
          {t('messages.back')}
        </button>
      </header>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '8px 32px 24px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '70%', height: '70vh', minHeight: 0 }}>
        <div className="profileTabs">
          <button type="button" className="profileTab active">{t('messages.title')}</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 12, flex: 1, minHeight: 0 }}>

        {/* Sidebar */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: 0, minHeight: 0, height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            <span className="cardTitle" style={{ margin: 0 }}>{t('messages.chats')}</span>
            <button className="btn btnSmall" type="button" onClick={openNewChat}>+ {t('messages.new_message')}</button>
          </div>

          {showNewChat && (
            <div style={{ borderBottom: '1px solid var(--border)', padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <input
                className="authInput"
                style={{ borderRadius: 10, fontSize: 13, padding: '7px 10px' }}
                placeholder={t('messages.search_users')}
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                autoFocus
              />
              <div style={{ maxHeight: 180, overflowY: 'auto' }}>
                {allUsers
                  .filter((u) => u.username.toLowerCase().includes(userSearch.toLowerCase()))
                  .map((u) => (
                    <div
                      key={u.id}
                      onClick={() => startChat(u)}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 6px', cursor: 'pointer', borderRadius: 8 }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <Avatar name={u.username} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{u.username}</div>
                        <div className="muted">@{u.username}</div>
                      </div>
                    </div>
                  ))}
              </div>
              <button className="ghostBtn btnSmall" type="button" onClick={() => setShowNewChat(false)} style={{ marginTop: 2 }}>✕</button>
            </div>
          )}

          <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
            {chatUsers.length === 0 && (
              <div className="muted" style={{ padding: 16 }}>{t('messages.no_users')}</div>
            )}
            {chatUsers.map((user) => (
              <div
                key={user.id}
                onClick={() => selectChat(user.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '12px 16px',
                  cursor: 'pointer',
                  background: selectedId === user.id ? 'rgba(124,92,255,0.12)' : 'transparent',
                  borderLeft: selectedId === user.id ? '3px solid var(--accent)' : '3px solid transparent',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (selectedId !== user.id) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.05)';
                }}
                onMouseLeave={(e) => {
                  if (selectedId !== user.id) (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                }}
              >
                <Avatar name={user.username} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{user.username}</div>
                  <div className="muted">@{user.username}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%' }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: 0, minHeight: 0, flex: 1 }}>
          {selectedUser ? (
            <>
              {/* Chat header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px', borderBottom: '1px solid var(--border)',
              }}>
                <Avatar name={selectedUser.username} />
                <div>
                  <div style={{ fontWeight: 800 }}>{selectedUser.username}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent2)', display: 'inline-block' }} />
                    <span className="muted">{t('messages.online')}</span>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', paddingRight: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {messages.map((msg) => {
                  const mine = msg.senderId === currentUserId;
                  return (
                    <div key={msg.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        maxWidth: '70%',
                        padding: '10px 14px',
                        borderRadius: mine ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                        background: mine ? 'linear-gradient(180deg, rgba(124,92,255,0.95), rgba(124,92,255,0.7))' : 'rgba(255,255,255,0.08)',
                        border: '1px solid ' + (mine ? 'rgba(124,92,255,0.4)' : 'var(--border)'),
                        fontSize: 14,
                        lineHeight: 1.5,
                      }}>
                        {msg.content}
                        <div style={{ fontSize: 10, opacity: 0.55, marginTop: 4, textAlign: 'right' }}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={sendMessage} style={{
                padding: '12px 16px', borderTop: '1px solid var(--border)',
                display: 'flex', gap: 10,
              }}>
                <input
                  className="authInput"
                  style={{ flex: 1, borderRadius: 12 }}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={t('messages.placeholder')}
                />
                <button
                  className="btn"
                  type="submit"
                  disabled={!newMessage.trim()}
                  style={{ padding: '10px 18px' }}
                >
                  {t('messages.send')}
                </button>
              </form>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="muted">{t('messages.select')}</span>
            </div>
          )}
          </div>
        </div>
        </div>
        </div>
      </div>
    </div>
  );
}
