import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { 
  MessageSquare, X, Send, Users, Shield, 
  Search, ChevronRight, CheckCheck, Loader2
} from 'lucide-react';

interface Member {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface Message {
  id: number;
  room_id: number;
  sender_id: number;
  sender_name: string;
  content: string;
  message_type: 'text' | 'document' | 'meeting';
  is_read?: boolean;
  created_at: string;
}

interface Room {
  id: number;
  name: string | null;
  type: 'direct' | 'group';
  created_at: string;
  members: Member[];
  last_message?: {
    content: string;
    sender_id: number;
    created_at: string;
  };
}

export default function FloatingChatWidget() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');

  // 1. Fetch Rooms
  const { data: rooms = [], isLoading: roomsLoading } = useQuery<Room[]>({
    queryKey: ['chatRooms'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/chat/rooms`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      if (!res.ok) throw new Error('Failed to fetch rooms');
      return res.json();
    },
    enabled: isOpen,
    refetchInterval: isOpen ? 5000 : false
  });

  // 2. Fetch Messages
  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ['chatMessages', activeRoomId],
    queryFn: async () => {
      if (!activeRoomId) return [];
      const res = await fetch(`${API_URL}/api/chat/rooms/${activeRoomId}/messages`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json();
    },
    enabled: isOpen && !!activeRoomId,
    refetchInterval: isOpen && !!activeRoomId ? 3000 : false
  });

  // 3. Fetch Users
  const { data: users = [] } = useQuery<Member[]>({
    queryKey: ['chatUsers'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/chat/users`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    },
    enabled: isOpen
  });

  // 4. Send Message
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content }: { content: string }) => {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('message_type', 'text');

      const res = await fetch(`${API_URL}/api/chat/rooms/${activeRoomId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: formData
      });

      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['chatMessages', activeRoomId] });
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
    }
  });

  // 5. Create Room
  const createRoomMutation = useMutation({
    mutationFn: async ({ participantIds }: { participantIds: number[] }) => {
      const res = await fetch(`${API_URL}/api/chat/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ type: 'direct', participantIds })
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: (data) => {
      setActiveRoomId(data.id);
      setSearchQuery('');
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
    }
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate({ content: newMessage });
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeRoom = rooms.find(r => r.id === activeRoomId);

  if (!user) return null;

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 right-6 lg:bottom-6 lg:right-6 z-[100] w-14 h-14 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 border border-white/20"
        title="Open Workspace Chat"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

      {/* Popover Chat Interface */}
      {isOpen && (
        <div className="fixed bottom-[110px] right-6 lg:bottom-[80px] lg:right-6 z-[100] w-[360px] h-[500px] bg-white dark:bg-slate-900 border border-blue-100 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-5">
          
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white flex items-center justify-between">
            {activeRoomId ? (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setActiveRoomId(null)} 
                  className="text-white/80 hover:text-white font-bold text-xs p-1 bg-white/10 rounded-lg"
                >
                  Back
                </button>
                <div className="text-left">
                  <p className="text-xs font-bold truncate max-w-[150px]">
                    {activeRoom?.type === 'group' ? activeRoom.name : activeRoom?.members.find(m => m.id !== user?.id)?.name}
                  </p>
                  <p className="text-[9px] text-white/70">Encrypted Chat</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <MessageSquare size={18} />
                <span className="text-sm font-bold tracking-tight">Workspace Support</span>
              </div>
            )}
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-3 bg-slate-50/50 dark:bg-slate-950/50">
            {activeRoomId ? (
              /* Chat Messages View */
              messagesLoading ? (
                <div className="flex justify-center items-center h-full text-xs text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500 mr-2" /> Loading…
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-xs">
                  <Shield size={24} className="mx-auto mb-2 text-blue-300 opacity-60" />
                  Messages are end-to-end encrypted.
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map(msg => {
                    const isMe = msg.sender_id === user?.id;
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-xl p-2 px-3 text-xs shadow-sm ${
                          isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-bl-none text-slate-800 dark:text-slate-200'
                        }`}>
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                          <div className="flex items-center justify-end gap-1 mt-1 text-[8px] opacity-70">
                            <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {isMe && <CheckCheck size={10} className={msg.is_read ? 'text-blue-200' : 'text-slate-300'} />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )
            ) : (
              /* Rooms / Users View */
              <div className="space-y-2">
                {/* Search */}
                <input 
                  type="text" 
                  placeholder="Search colleagues to start chat…" 
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-blue-100 dark:border-slate-800 rounded-xl outline-none focus:border-blue-500 transition shadow-inner"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />

                {roomsLoading ? (
                  <div className="text-center py-6 text-xs text-muted-foreground">Loading…</div>
                ) : searchQuery.trim() ? (
                  /* User List Results */
                  <div className="space-y-1">
                    {filteredUsers.map(u => (
                      <button 
                        key={u.id} 
                        onClick={() => createRoomMutation.mutate({ participantIds: [u.id] })}
                        className="w-full flex items-center gap-2 p-2 rounded-xl hover:bg-white dark:hover:bg-slate-900 border border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition text-left"
                      >
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                          {u.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate text-slate-800 dark:text-slate-200">{u.name}</p>
                          <p className="text-[10px] text-muted-foreground">{u.role}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  /* Active Chats */
                  <div className="space-y-1">
                    {rooms.length === 0 ? (
                      <div className="text-center py-12 text-xs text-muted-foreground">
                        No active conversations.
                      </div>
                    ) : (
                      rooms.map(room => {
                        const isGroup = room.type === 'group';
                        const otherMember = room.members.find(m => m.id !== user?.id);
                        const title = isGroup ? room.name : (otherMember?.name || 'Direct Chat');

                        return (
                          <button 
                            key={room.id} 
                            onClick={() => setActiveRoomId(room.id)}
                            className={`w-full flex items-center gap-2 p-2.5 rounded-xl transition border ${activeRoomId === room.id ? 'bg-blue-600 border-transparent text-white shadow-md' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:bg-blue-50/50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'}`}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${activeRoomId === room.id ? 'bg-white/20' : 'bg-blue-100 text-blue-600'}`}>
                              {isGroup ? <Users size={14} /> : title.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="text-left flex-1 min-w-0">
                              <p className="text-xs font-bold truncate">{title}</p>
                              <p className={`text-[10px] truncate ${activeRoomId === room.id ? 'text-white/80' : 'text-muted-foreground'}`}>
                                {room.last_message?.content || 'Click to message'}
                              </p>
                            </div>
                            <ChevronRight size={12} className="opacity-50" />
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Input */}
          {activeRoomId && (
            <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-slate-900 border-t border-blue-50 dark:border-slate-800 flex items-center gap-2 shrink-0">
              <input 
                type="text" 
                placeholder="Type a message…" 
                className="flex-1 px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl outline-none border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition shadow-inner"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={sendMessageMutation.isPending}
              />
              <button 
                type="submit" 
                disabled={!newMessage.trim() || sendMessageMutation.isPending}
                className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl shadow-md hover:scale-105 transition"
              >
                <Send size={14} />
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
}
