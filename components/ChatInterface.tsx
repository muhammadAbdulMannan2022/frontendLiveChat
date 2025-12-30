
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../services/api';
import { Room, Message, WSEvent, User } from '../types';
import { WS_BASE_URL } from '../constants';

interface ChatInterfaceProps {
  currentUser: User;
  onLogout: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ currentUser, onLogout }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [wsToken, setWsToken] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const lobbyWs = useRef<WebSocket | null>(null);
  const roomWs = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadRooms = useCallback(async () => {
    try {
      const { data } = await api.get('/msg/room');
      setRooms(data.rooms);
      setWsToken(data.token);
    } catch (err) {
      console.error("Failed to load rooms", err);
    }
  }, []);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  const loadMessages = async (roomId: string) => {
    try {
      const { data } = await api.get(`/msg/room/${roomId}/messages`);
      setMessages(data);
    } catch (err) {
      console.error("Failed to load messages", err);
    }
  };

  // Room-specific WebSocket
  useEffect(() => {
    if (!wsToken || !activeRoomId) return;

    const socketUrl = `${WS_BASE_URL}/room/${activeRoomId}?token=${wsToken}`;
    roomWs.current = new WebSocket(socketUrl);

    roomWs.current.onmessage = (event) => {
      try {
        const payload: WSEvent = JSON.parse(event.data);
        if (payload.type === "NEW_MESSAGE") {
          setMessages(prev => [...prev, payload.data]);
        } else if (payload.type === "ERROR") {
          console.error("Room WS Error:", payload.message);
        }
      } catch (e) {
        console.error("Failed to parse Room WS message", e);
      }
    };

    roomWs.current.onclose = (event) => {
      if (event.code === 4001 || event.code === 4002) {
        loadRooms();
      }
    };

    return () => {
      roomWs.current?.close();
    };
  }, [activeRoomId, wsToken, loadRooms]);

  // Lobby WebSocket
  useEffect(() => {
    if (!wsToken) return;

    const socketUrl = `${WS_BASE_URL}/rooms?token=${wsToken}`;
    lobbyWs.current = new WebSocket(socketUrl);

    lobbyWs.current.onmessage = (event) => {
      try {
        const payload: WSEvent = JSON.parse(event.data);
        if (payload.type === "ROOM_UPDATE") {
          const { roomId, lastMessage } = payload.data;
          setRooms(prevRooms => {
            const roomExists = prevRooms.some(r => r.id === roomId);
            if (!roomExists) {
              // New room detected, fetch the full list
              loadRooms();
              return prevRooms;
            }

            const updatedRooms = prevRooms.map(room => {
              if (room.id === roomId) {
                const updatedMessages = room.messages ? [...room.messages, lastMessage] : [lastMessage];
                return { ...room, messages: updatedMessages };
              }
              return room;
            });

            // Sort rooms by last message date
            return [...updatedRooms].sort((a, b) => {
              const timeA = a.messages?.length 
                ? new Date(a.messages[a.messages.length - 1].createdAt).getTime() 
                : 0;
              const timeB = b.messages?.length 
                ? new Date(b.messages[b.messages.length - 1].createdAt).getTime() 
                : 0;
              return timeB - timeA;
            });
          });
        }
      } catch (e) {
        console.error("Failed to parse Lobby WS message", e);
      }
    };

    lobbyWs.current.onclose = (event) => {
      if (event.code === 4001 || event.code === 4002) {
        loadRooms();
      }
    };

    return () => {
      lobbyWs.current?.close();
    };
  }, [wsToken, loadRooms]);

  const handleSelectRoom = (roomId: string) => {
    setActiveRoomId(roomId);
    loadMessages(roomId);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !roomWs.current || !activeRoomId) return;

    const tempMsg: Message = {
      id: `temp-${Date.now()}`,
      roomId: activeRoomId,
      senderId: 'me',
      content: input,
      createdAt: new Date().toISOString()
    };

    // Optimistic update
    setMessages(prev => [...prev, tempMsg]);
    
    // Send via WebSocket
    roomWs.current.send(JSON.stringify({ content: input }));
    setInput('');
  };

  const createNewRoom = async () => {
    const userIdStr = prompt("Enter other user ID to chat with:");
    if (!userIdStr) return;
    const otherUserId = parseInt(userIdStr);
    if (isNaN(otherUserId)) return;

    try {
      const { data } = await api.post('/msg/room', { otherUserId });
      await loadRooms();
      handleSelectRoom(data.id);
    } catch (err) {
      alert("Failed to create room. Make sure the User ID exists.");
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden text-white">
      {/* Sidebar */}
      <aside className={`
        ${isSidebarOpen ? 'w-80' : 'w-0'} 
        transition-all duration-300 bg-black/30 backdrop-blur-xl border-r border-white/10 flex flex-col
      `}>
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <h2 className="font-bold text-xl tracking-tight">Dimensions</h2>
          <button onClick={createNewRoom} className="p-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">
            <i className="fa-solid fa-plus"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto glass-scroll p-4 space-y-2">
          {rooms.map(room => (
            <button
              key={room.id}
              onClick={() => handleSelectRoom(room.id)}
              className={`w-full p-4 rounded-xl text-left transition-all border ${
                activeRoomId === room.id 
                  ? 'bg-white/10 border-indigo-500/50 shadow-lg shadow-indigo-500/10' 
                  : 'bg-transparent border-transparent hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center font-bold">
                  {room.id.substring(room.id.length - 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold truncate">Room {room.id.substring(0, 8)}</div>
                  <div className="text-xs text-gray-400 truncate w-48">
                    {room.messages && room.messages.length > 0 
                      ? room.messages[room.messages.length - 1].content 
                      : 'No messages yet'}
                  </div>
                </div>
              </div>
            </button>
          ))}
          {rooms.length === 0 && (
            <div className="text-center py-10 text-gray-500 italic">
              No dimensions found.<br/>Create one to start chatting.
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/10 bg-black/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
              <i className="fa-solid fa-user text-xs"></i>
            </div>
            <div className="truncate flex-1">
              <div className="text-sm font-bold">{currentUser.email}</div>
              <div className="text-[10px] text-gray-400">ID: {currentUser.id}</div>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full py-2 px-4 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm transition-all flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-right-from-bracket"></i>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-6 bg-black/20 backdrop-blur-md border-b border-white/10 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <i className={`fa-solid ${isSidebarOpen ? 'fa-indent' : 'fa-outdent'}`}></i>
            </button>
            <h1 className="font-semibold">
              {activeRoomId ? `Dimension ID: ${activeRoomId}` : 'Select a Dimension'}
            </h1>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2 text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Node
            </div>
          </div>
        </header>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 glass-scroll">
          {!activeRoomId ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
              <div className="w-24 h-24 rounded-full border-2 border-dashed border-white flex items-center justify-center text-4xl">
                <i className="fa-solid fa-message"></i>
              </div>
              <div>
                <h3 className="text-xl font-bold">Encrypted Gateway</h3>
                <p>Select a room from the terminal to begin secure transmission.</p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => {
                const isMe = msg.senderId === 'me' || Number(msg.senderId) === Number(currentUser.id);
                return (
                  <div key={msg.id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] group`}>
                      <div className={`
                        px-4 py-2 rounded-2xl relative
                        ${isMe 
                          ? 'bg-indigo-600 rounded-tr-none text-white' 
                          : 'bg-white/10 border border-white/10 rounded-tl-none text-gray-200'
                        }
                      `}>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      <div className={`text-[10px] text-gray-500 mt-1 ${isMe ? 'text-right' : 'text-left'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Message Input */}
        {activeRoomId && (
          <div className="p-6 bg-transparent">
            <form 
              onSubmit={handleSendMessage}
              className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 flex gap-2 shadow-2xl"
            >
              <input 
                type="text" 
                placeholder="Secure transmission..." 
                className="flex-1 bg-transparent border-none outline-none px-4 text-white placeholder:text-gray-500"
                value={input}
                onChange={e => setInput(e.target.value)}
              />
              <button 
                type="submit" 
                className="w-12 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 transition-all flex items-center justify-center shadow-lg active:scale-95"
              >
                <i className="fa-solid fa-paper-plane"></i>
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};

export default ChatInterface;
