'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import Cookies from 'js-cookie';

interface ChatUser {
  id: number;
  username: string;
}

export default function MessagesPage() {
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const API_URL = 'http://localhost:3000';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Eigene User-ID holen
  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) return;

    fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setCurrentUserId(data.id));
  }, []);

  // Alle anderen User für die Sidebar holen
  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) return;

    fetch(`${API_URL}/auth/users`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setChatUsers(data.filter((u: any) => u.id !== currentUserId)));
  }, [currentUserId]);

  // WebSocket für den aktuellen Chat
  useEffect(() => {
    if (!currentUserId || !selectedId) return () => {};

    const token = Cookies.get('token');
    const newSocket = io(API_URL, { auth: { token } });
    socketRef.current = newSocket;

    newSocket.on('connect', () => console.log('✅ Socket verbunden'));

    newSocket.on('newMessage', (msg: any) => {
      if (msg.senderId === selectedId || msg.receiverId === selectedId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        scrollToBottom();
      }
    });

    newSocket.on('messageSent', (msg: any) => {
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== msg.id);
        return [...filtered, msg];
      });
      scrollToBottom();
    });

    return () => newSocket.disconnect();
  }, [currentUserId, selectedId]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socketRef.current || !currentUserId || !selectedId) return;

    const messageData = { receiverId: selectedId, content: newMessage };

    const optimisticMsg = {
      id: Date.now(),
      content: newMessage,
      senderId: currentUserId,
      receiverId: selectedId,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    scrollToBottom();

    socketRef.current.emit('sendMessage', messageData);
    setNewMessage('');
  };

  const selectChat = (id: number) => {
    setSelectedId(id);
    setMessages([]);
  };

  if (!currentUserId) return <div className="flex items-center justify-center h-screen text-white">Lade Chats...</div>;

  return (
    <div className="flex h-screen bg-[#0b1220] text-white">
      {/* Sidebar – Chat Liste */}
      <div className="w-80 border-r border-white/10 flex flex-col">
        <div className="p-4 border-b border-white/10 font-bold text-lg">Chats</div>
        <div className="flex-1 overflow-y-auto">
          {chatUsers.map((user) => (
            <div
              key={user.id}
              onClick={() => selectChat(user.id)}
              className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-white/10 transition-colors ${
                selectedId === user.id ? 'bg-white/10' : ''
              }`}
            >
              <div className="w-10 h-10 rounded-2xl overflow-hidden border border-white/30">
                <img src="https://i.pravatar.cc/128" alt={user.username} className="w-full h-full object-cover" />
              </div>
              <div className="font-medium">{user.username}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Haupt-Chat */}
      <div className="flex-1 flex flex-col">
        {selectedId ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl overflow-hidden border border-white/30 flex-shrink-0">
                <img src="https://i.pravatar.cc/128" alt="Partner" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="font-bold text-xl">
                  {chatUsers.find(u => u.id === selectedId)?.username || 'Chat-Partner'}
                </h1>
                <p className="text-emerald-400 text-xs flex items-center gap-1">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span> online
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4 bg-[#0b1220]">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] px-5 py-3 rounded-3xl text-base leading-relaxed
                      ${msg.senderId === currentUserId
                        ? 'bg-[#7c5cff] rounded-tr-none'
                        : 'bg-white/10 rounded-tl-none'}`}
                  >
                    {msg.content}
                    <div className="text-[10px] opacity-60 mt-1 text-right">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="p-4 bg-[#0b1220] border-t border-white/10">
              <div className="flex gap-3 max-w-3xl mx-auto">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Nachricht schreiben..."
                  className="flex-1 bg-white/10 border border-white/20 focus:border-[#7c5cff] rounded-3xl px-6 py-3 outline-none text-white placeholder:text-white/50"
                />
                <button
                  type="submit"
                  className="w-12 h-12 bg-[#7c5cff] hover:bg-[#6a4fff] rounded-3xl flex items-center justify-center transition-colors"
                >
                  ➤
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-white/50 text-lg">
            Wähle links einen Chat aus
          </div>
        )}
      </div>
    </div>
  );
}
