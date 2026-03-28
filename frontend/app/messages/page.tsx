"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import io, { Socket } from "socket.io-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export default function MessagesPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const token = Cookies.get("token");

  // Socket.io
  useEffect(() => {
    if (!token) {
      router.push("/");
      return;
    }

    const newSocket = io(API_URL, {
      auth: { token },
      transports: ["websocket"],
    });

    newSocket.on("connect", () => console.log("🟢 Socket connected"));

    newSocket.on("newMessage", (msg: any) => {
      if (selectedUser && (msg.receiverId === selectedUser.id || msg.senderId === selectedUser.id)) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token, selectedUser]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Alle User laden (außer sich selbst)
  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/auth/users`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const currentUserId = JSON.parse(atob(token.split(".")[1])).sub;
        setUsers(data.filter((u: any) => u.id !== currentUserId));
      })
      .catch(console.error);
  }, [token]);

  // Chat-Historie laden
  useEffect(() => {
    if (!selectedUser || !token) return;
    fetch(`${API_URL}/auth/messages/${selectedUser.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setMessages(data))
      .catch(console.error);
  }, [selectedUser, token]);

  const sendMessage = () => {
    if (!socket || !newMessage.trim() || !selectedUser) return;

    socket.emit("sendMessage", {
      receiverId: selectedUser.id,
      content: newMessage,
    });

    setNewMessage("");
  };

  if (!token) return <div className="p-8 text-center">Bitte zuerst einloggen</div>;

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-800 bg-[#111] p-6 overflow-y-auto">
        <h1 className="text-3xl font-bold mb-8">Messages</h1>
        {users.map((user) => (
          <div
            key={user.id}
            onClick={() => setSelectedUser(user)}
            className={`flex items-center gap-4 p-5 rounded-3xl mb-3 cursor-pointer hover:bg-gray-800 transition-all ${
              selectedUser?.id === user.id ? "bg-blue-600" : ""
            }`}
          >
            <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-2xl font-semibold">
              {user.username[0].toUpperCase()}
            </div>
            <div className="font-medium">{user.username}</div>
          </div>
        ))}
      </div>

      {/* Chat Fenster */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-800 bg-[#111] flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-2xl font-semibold">
                {selectedUser.username[0].toUpperCase()}
              </div>
              <div>
                <h2 className="font-bold text-2xl">{selectedUser.username}</h2>
              </div>
            </div>

            {/* Chatverlauf */}
            <div className="flex-1 p-8 overflow-y-auto bg-[#0a0a0a] space-y-6">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.senderId === 1 ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[65%] px-6 py-4 rounded-3xl text-lg ${
                      msg.senderId === 1
                        ? "bg-blue-600 text-white rounded-br-none"
                        : "bg-gray-800 text-white rounded-bl-none"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Eingabefeld unten in der Mitte */}
            <div className="p-6 bg-[#111] border-t border-gray-800">
              <div className="flex gap-3 max-w-3xl mx-auto">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  className="flex-1 bg-gray-900 border border-gray-700 rounded-3xl px-6 py-5 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                  placeholder="Nachricht schreiben..."
                />
                <button
                  onClick={sendMessage}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-10 rounded-3xl font-medium text-lg transition"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-2xl">
          </div>
        )}
      </div>
    </div>
  );
}
