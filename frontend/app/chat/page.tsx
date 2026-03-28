"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import io, { Socket } from "socket.io-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [friends, setFriends] = useState<any[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const token = Cookies.get("token");

  // Socket verbinden
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
      if (selectedFriend && (msg.receiverId === selectedFriend.id || msg.senderId === selectedFriend.id)) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    setSocket(newSocket);

    // Cleanup (wichtig für TypeScript)
    return () => {
      newSocket.disconnect();
    };
  }, [token]); // selectedFriend bewusst rausgenommen, um Loop zu vermeiden

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!socket || !newMessage.trim() || !selectedFriend) return;

    socket.emit("sendMessage", {
      receiverId: selectedFriend.id,
      content: newMessage,
    });

    setNewMessage("");
  };

  // Dummy Friends (später echte Freunde aus DB)
  useEffect(() => {
    setFriends([
      { id: 2, username: "TestFriend2" },
      { id: 3, username: "TestFriend3" },
    ]);
  }, []);

  if (!token) return <div className="p-8 text-center">Bitte zuerst einloggen</div>;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Friends Sidebar */}
      <div className="w-72 border-r bg-white p-4 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Friends</h2>
        {friends.map((friend) => (
          <div
            key={friend.id}
            onClick={() => setSelectedFriend(friend)}
            className={`p-4 rounded-xl mb-2 cursor-pointer hover:bg-blue-50 transition ${
              selectedFriend?.id === friend.id ? "bg-blue-100" : ""
            }`}
          >
            {friend.username}
          </div>
        ))}
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col">
        {selectedFriend ? (
          <>
            <div className="p-4 border-b bg-white font-semibold flex items-center">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center mr-3">
                {selectedFriend.username[0]}
              </div>
              Chat with {selectedFriend.username}
            </div>

            <div className="flex-1 p-6 overflow-y-auto bg-gray-50 space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.senderId === 1 ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs px-5 py-3 rounded-3xl ${
                      msg.senderId === 1
                        ? "bg-blue-600 text-white"
                        : "bg-white border shadow-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  className="flex-1 border rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nachricht schreiben..."
                />
                <button
                  onClick={sendMessage}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 rounded-2xl font-medium transition"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-lg">
            Wähle einen Freund aus der Liste
          </div>
        )}
      </div>
    </div>
  );
}
