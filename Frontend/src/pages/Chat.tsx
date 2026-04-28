import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  MessageSquare, Send, Users, Shield, Video, 
  Paperclip, Plus, Search, User, File, X, 
  ChevronRight, ChevronLeft, Phone, PhoneOff, Laptop, Lock, Check, CheckCheck,
  Mic, MicOff, VideoOff, Maximize, Minimize, Circle, Mail, Info, Share2, Forward, Download
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useCall } from '@/contexts/CallContext';
import logo from '@/assets/logo.png';

interface Member {
  id: number;
  name: string;
  email: string;
  role: string;
  phone?: string;
  profile_image?: string;
  is_online?: boolean;
}

interface Message {
  id: number;
  room_id: number;
  sender_id: number;
  sender_name: string;
  content: string;
  message_type: 'text' | 'document' | 'meeting' | 'call_end';
  file_url?: string;
  file_name?: string;
  file_size?: number;
  meeting_link?: string;
  is_read: boolean;
  created_at: string;
}

interface Room {
  id: number;
  name: string;
  type: 'direct' | 'group';
  created_at: string;
  members: Member[];
  last_message?: Message;
}

const UserAvatar = ({ member, className = "w-10 h-10", onClick }: { member?: Partial<Member> | null, className?: string, onClick?: () => void }) => {
  const [error, setError] = useState(false);
  const initials = member?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');

  return (
    <div 
      onClick={onClick}
      className={`rounded-full bg-blue-50 dark:bg-slate-800 text-blue-600 flex items-center justify-center font-bold overflow-hidden shrink-0 transition-transform active:scale-95 ${className} ${onClick ? 'cursor-pointer' : ''}`}
    >
      {(member?.profile_image && !error) ? (
        <img 
          src={`${API_URL}${member.profile_image}`} 
          alt="" 
          className="w-full h-full object-cover"
          onError={() => setError(true)}
        />
      ) : (
        initials
      )}
    </div>
  );
};

export default function Chat() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { startCall } = useCall();
  
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [viewingProfile, setViewingProfile] = useState<Member | null>(null);
  const [lastMessageId, setLastMessageId] = useState<number | null>(null);
  const [forwardMessage, setForwardMessage] = useState<Message | null>(null);
  const [forwardSearch, setForwardSearch] = useState('');
  const [previewMedia, setPreviewMedia] = useState<{ url: string, name: string, type: string } | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatMessageDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880.00, audioCtx.currentTime + 0.1);
      gain.gain.setValueAtTime(0, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) { console.log('Audio blocked'); }
  };

  const { data: rooms = [] } = useQuery<Room[]>({
    queryKey: ['chatRooms'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/chat/rooms`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      if (!res.ok) throw new Error('Failed to fetch rooms');
      return res.json();
    },
    refetchInterval: 5000 
  });

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ['chatMessages', activeRoomId],
    queryFn: async () => {
      if (!activeRoomId) return [];
      const res = await fetch(`${API_URL}/api/chat/rooms/${activeRoomId}/messages`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json();
    },
    enabled: !!activeRoomId,
    refetchInterval: 3000 
  });

  const { data: users = [] } = useQuery<Member[]>({
    queryKey: ['chatUsers'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/chat/users`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    },
    refetchInterval: 10000
  });

  const activeRoom = rooms.find(r => r.id === activeRoomId);

  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, message_type, file, meeting_link, targetRoomId }: { content: string; message_type: 'text' | 'document' | 'meeting' | 'call_end'; file?: File; meeting_link?: string; targetRoomId?: number }) => {
      const roomId = targetRoomId || activeRoomId;
      const formData = new FormData();
      formData.append('content', content);
      formData.append('message_type', message_type);
      if (file) formData.append('file', file);
      if (meeting_link) formData.append('meeting_link', meeting_link);

      const res = await fetch(`${API_URL}/api/chat/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
        body: formData
      });
      if (!res.ok) throw new Error('Failed to send message');
      return res.json();
    },
    onSuccess: (_, variables) => {
      if (!variables.targetRoomId) {
        setNewMessage('');
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
      queryClient.invalidateQueries({ queryKey: ['chatMessages', activeRoomId] });
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
    }
  });

  const createRoomMutation = useMutation({
    mutationFn: async ({ name, type, participantIds }: { name?: string; type: 'direct' | 'group'; participantIds: number[] }) => {
      const res = await fetch(`${API_URL}/api/chat/rooms`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
        body: JSON.stringify({ name, type, participantIds })
      });
      return res.json();
    },
    onSuccess: (data) => {
      setActiveRoomId(data.id); setIsCreatingGroup(false); queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
    }
  });

  const initiateCall = (audioOnly = false) => {
    const otherUser = activeRoom?.members.find(m => m.id !== user?.id);
    if (!otherUser) return toast.error('Cannot call here');
    
    sendMessageMutation.mutate({ 
      content: `${audioOnly ? 'Audio' : 'Video'} Call`, 
      message_type: 'meeting', 
      meeting_link: `mehar-finance-user-${user?.id}` 
    });
    
    startCall(`mehar-finance-user-${otherUser.id}`, audioOnly);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && !file) return;
    sendMessageMutation.mutate({ content: newMessage, message_type: file ? 'document' : 'text', file: file || undefined });
  };

  const handleTyping = () => {
    // Typing indicator logic
  };

  const handleForward = (roomId: number) => {
    if (!forwardMessage) return;
    sendMessageMutation.mutate({ 
      content: forwardMessage.content, 
      message_type: forwardMessage.message_type, 
      targetRoomId: roomId 
    });
    setForwardMessage(null);
    toast.success('Message forwarded');
  };

  const filteredRooms = rooms.filter(room => {
    const otherMember = room.members.find(m => m.id !== user?.id);
    const title = room.type === 'group' ? room.name : (otherMember?.name || 'DC');
    return title?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const otherUsers = searchQuery.trim() ? users.filter(u => {
    const match = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  u.email.toLowerCase().includes(searchQuery.toLowerCase());
    if (!match) return false;
    const hasRoom = rooms.some(r => r.type === 'direct' && r.members.some(m => m.id === u.id));
    return !hasRoom;
  }) : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    if (messages.length > 0) {
      const latest = messages[messages.length - 1];
      if (lastMessageId !== null && latest.id > lastMessageId && latest.sender_id !== user?.id) {
        playNotificationSound();
      }
      setLastMessageId(latest.id);
    }
  }, [messages, lastMessageId, user?.id]);

  return (
    <div className="fixed md:static inset-0 z-[100] md:z-auto flex h-full bg-[#f0f2f5] dark:bg-slate-950 md:rounded-2xl overflow-hidden md:shadow-2xl md:border border-border animate-in fade-in duration-500">
      
      {/* Sidebar - Contacts List */}
      <div className={`${activeRoomId || isCreatingGroup ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-20`}>
        {/* Sidebar Header - Compact & Locked */}
        <div className="sticky top-0 z-30 bg-[#f0f2f5]/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="p-3 flex items-center justify-between">
            <UserAvatar member={user} className="w-8 h-8 border-2 border-white dark:border-slate-700" />
            <div className="flex items-center gap-0.5">
              <button onClick={() => setIsCreatingGroup(!isCreatingGroup)} className="p-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition" title="New Group">
                <Users size={16} />
              </button>
              <button className="p-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition">
                <MessageSquare size={16} />
              </button>
            </div>
          </div>

          {/* Search - Compact */}
          <div className="p-2 pt-0">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                 {searchQuery ? <ChevronRight size={14} className="rotate-180" onClick={() => setSearchQuery('')} /> : <Search size={14} />}
              </div>
              <input 
                type="text" 
                placeholder="Search or start chat" 
                className="w-full pl-10 pr-4 py-1.5 text-xs bg-white/50 dark:bg-slate-900/50 rounded-lg border-none focus:ring-0 outline-none transition-all" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
              />
            </div>
          </div>
        </div>

        {/* Rooms List - Compact */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900 custom-scrollbar">
          <div className="flex flex-col">
            {filteredRooms.map(room => {
                const otherMember = room.members.find(m => m.id !== user?.id);
                const title = room.type === 'group' ? room.name : (otherMember?.name || 'DC');
                const isOnline = room.type === 'direct' && otherMember?.is_online;
                const isActive = activeRoomId === room.id;
                const isUnread = room.last_message && !room.last_message.is_read && room.last_message.sender_id !== user?.id;
                
                return (
                  <button 
                    key={room.id} 
                    onClick={() => setActiveRoomId(room.id)} 
                    className={`w-full flex items-center gap-3 p-3 transition-all border-b border-slate-50 dark:border-slate-800/50 ${isActive ? 'bg-[#f0f2f5] dark:bg-slate-800 border-l-[3px] border-l-[#00a884]' : 'hover:bg-[#f5f6f6] dark:hover:bg-slate-800/30'}`}
                  >
                    <div className="relative shrink-0">
                      <UserAvatar member={room.type === 'group' ? { name: room.name } : otherMember} className="w-10 h-10" />
                      {room.type === 'direct' && otherMember?.is_online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#00a884] border-2 border-white dark:border-slate-900 rounded-full" />}
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <p className={`text-[13px] font-semibold truncate ${isUnread ? 'text-slate-900 dark:text-slate-100 font-bold' : 'text-slate-900 dark:text-slate-100'}`}>{title}</p>
                        <span className="text-[10px] text-slate-500 shrink-0">
                          {room.last_message ? new Date(room.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {room.last_message?.sender_id === user?.id && <CheckCheck size={12} className="text-blue-500 shrink-0" />}
                        <p className={`text-[11px] truncate ${isUnread ? 'text-[#00a884] font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
                          {room.last_message?.content || 'Tap to start'}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}

              {otherUsers.length > 0 && (
                <div className="mt-2">
                  <div className="px-3 py-1.5 bg-[#f0f2f5] dark:bg-slate-800/50 text-[9px] font-bold text-[#00a884] uppercase tracking-widest border-y border-slate-200 dark:border-slate-800">
                    New Connections
                  </div>
                  {otherUsers.map(u => (
                    <button key={u.id} onClick={() => createRoomMutation.mutate({ type: 'direct', participantIds: [u.id] })} className="w-full flex items-center gap-3 p-2 hover:bg-[#f5f6f6] dark:hover:bg-slate-800/30 transition-all group border-b border-slate-50 dark:border-slate-800/50">
                      <div className="relative shrink-0">
                        <UserAvatar member={u} className="w-10 h-10" />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <p className="text-[13px] font-semibold truncate text-slate-900 dark:text-slate-100">{u.name}</p>
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">{u.role}</p>
                      </div>
                      <div className="p-1.5 bg-[#00a884]/10 text-[#00a884] rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                         <Plus size={16} />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
        </div>
      </div>

      {/* Main Chat Area - Zoomed Out */}
      <div className={`${!activeRoomId && !isCreatingGroup ? 'hidden md:flex' : 'flex'} fixed md:static inset-0 z-[100] md:z-auto flex-1 flex flex-col bg-[#e5ddd5] dark:bg-slate-900 h-full`}>
        
        {activeRoomId ? (
          <>
            {/* Header - Compact */}
            <div className="h-[60px] md:h-[50px] px-3 bg-[#f0f2f5] dark:bg-slate-800 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 shadow-sm z-10 shrink-0">
              <div className="flex items-center gap-2">
                <button onClick={() => setActiveRoomId(null)} className="md:hidden p-1 text-slate-600"><ChevronLeft size={24} /></button>
                <div className="relative cursor-pointer" onClick={() => {
                   const otherMember = activeRoom?.members.find(m => m.id !== user?.id);
                   if (otherMember) setViewingProfile(otherMember);
                }}>
                  <UserAvatar member={activeRoom?.type === 'group' ? { name: activeRoom.name } : activeRoom?.members.find(m => m.id !== user?.id)} className="w-9 h-9 md:w-8 md:h-8" />
                </div>
                <div className="cursor-pointer overflow-hidden" onClick={() => {
                   const otherMember = activeRoom?.members.find(m => m.id !== user?.id);
                   if (otherMember) setViewingProfile(otherMember);
                }}>
                  <h3 className="text-[15px] md:text-[14px] font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {activeRoom?.type === 'group' ? activeRoom.name : activeRoom?.members.find(m => m.id !== user?.id)?.name}
                  </h3>
                  {activeRoom?.type === 'direct' && activeRoom?.members.find(m => m.id !== user?.id)?.is_online && (
                    <p className="text-[10px] md:text-[9px] text-[#00a884] font-medium leading-none">online</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => initiateCall(false)} className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition"><Video size={20} /></button>
                <button onClick={() => initiateCall(true)} className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition"><Phone size={20} /></button>
              </div>
            </div>

            {/* Messages - Zoomed Out */}
            <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-1.5 relative custom-scrollbar" style={{ 
              backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
              backgroundRepeat: 'repeat',
              backgroundSize: '400px'
            }}>
              <div className="absolute inset-0 bg-[#e5ddd5]/95 dark:bg-slate-900/98 pointer-events-none"></div>
              
              <div className="relative z-10 flex flex-col gap-1.5">
                {messages.map((msg, index) => {
                  const isMe = msg.sender_id === user?.id;
                  const prevMsg = index > 0 ? messages[index - 1] : null;
                  const showDateSeparator = !prevMsg || formatMessageDate(msg.created_at) !== formatMessageDate(prevMsg.created_at);

                  return (
                    <div key={msg.id} className="flex flex-col gap-1.5">
                      {showDateSeparator && (
                        <div className="flex justify-center my-3 sticky top-0 z-20">
                          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md px-4 py-1 rounded-full shadow-sm border border-slate-100 dark:border-slate-700">
                            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                              {formatMessageDate(msg.created_at)}
                            </span>
                          </div>
                        </div>
                      )}
                      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} group/msg relative`}>
                        <div className={`relative max-w-[85%] md:max-w-[60%] rounded-lg p-1.5 px-2.5 shadow-sm ${isMe ? 'bg-[#dcf8c6] dark:bg-[#056162] text-slate-900 dark:text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none'}`}>
                          {/* Message Tail */}
                          <div className={`absolute top-0 w-1.5 h-1.5 ${isMe ? '-right-1.5 bg-[#dcf8c6] dark:bg-[#056162]' : '-left-1.5 bg-white dark:bg-slate-800'}`} style={{ clipPath: isMe ? 'polygon(0 0, 0% 100%, 100% 0)' : 'polygon(0 0, 100% 100%, 100% 0)' }}></div>
                          
                          {!isMe && activeRoom?.type === 'group' && (
                            <span className="block text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mb-0.5">{msg.sender_name}</span>
                          )}
                        
                        {msg.message_type === 'text' && <p className="text-[13px] leading-relaxed pr-14 pb-1">{msg.content}</p>}
                        {msg.message_type === 'document' && (
                          <div className="flex flex-col gap-1.5 min-w-[150px] pr-14 pb-1">
                            {msg.file_url && (msg.file_name?.match(/\.(jpeg|jpg|png|gif|webp)$/i)) && (
                              <img 
                                src={`${API_URL}${msg.file_url}`} 
                                alt={msg.file_name} 
                                className="rounded-md max-h-[200px] object-cover border border-black/5 cursor-zoom-in hover:opacity-90 transition-opacity" 
                                onClick={() => setPreviewMedia({ url: `${API_URL}${msg.file_url}`, name: msg.file_name || 'Image', type: 'image' })}
                              />
                            )}
                            {msg.file_url && (msg.file_name?.match(/\.(mp4|webm|ogg)$/i)) && (
                              <div className="relative group/vid cursor-pointer" onClick={() => setPreviewMedia({ url: `${API_URL}${msg.file_url}`, name: msg.file_name || 'Video', type: 'video' })}>
                                <video src={`${API_URL}${msg.file_url}`} className="rounded-md max-h-[200px] w-full bg-black/10" />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover/vid:opacity-100 transition-opacity">
                                  <div className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white"><Video size={24} /></div>
                                </div>
                              </div>
                            )}
                            <div 
                              onClick={() => {
                                if (msg.file_name?.match(/\.pdf$/i)) {
                                  setPreviewMedia({ url: `${API_URL}${msg.file_url}`, name: msg.file_name || 'PDF', type: 'pdf' });
                                }
                              }}
                              className={`flex items-center gap-2 p-1.5 rounded-lg ${isMe ? 'bg-[#c5e4ac] dark:bg-[#044d4e]' : 'bg-slate-100 dark:bg-slate-700'} ${msg.file_name?.match(/\.pdf$/i) ? 'cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600' : ''}`}
                            >
                              {msg.file_name?.match(/\.pdf$/i) ? (
                                <File size={20} className="text-red-500" />
                              ) : msg.file_name?.match(/\.(doc|docx)$/i) ? (
                                <File size={20} className="text-blue-500" />
                              ) : msg.file_name?.match(/\.(xls|xlsx|csv)$/i) ? (
                                <File size={20} className="text-emerald-600" />
                              ) : (
                                <File size={20} className="text-slate-500" />
                              )}
                              <div className="flex-1 min-w-0">
                                 <p className="text-[10px] font-bold truncate">{msg.file_name || 'Document'}</p>
                                 {msg.file_size && <p className="text-[8px] opacity-60">{(msg.file_size / 1024).toFixed(1)} KB</p>}
                              </div>
                              <a 
                                href={`${API_URL}${msg.file_url}`} 
                                target="_blank" 
                                rel="noreferrer" 
                                onClick={(e) => e.stopPropagation()}
                                className="p-1 bg-white/20 rounded-full hover:bg-white/40"
                              >
                                <Download size={14} className="text-slate-600 dark:text-slate-300" />
                              </a>
                            </div>
                          </div>
                        )}
                        {msg.message_type === 'meeting' && (
                          <div 
                            onClick={() => !isMe && msg.meeting_link && startCall(msg.meeting_link, false)}
                            className="flex flex-col gap-2 p-3 bg-black/5 rounded-lg border border-dashed border-black/10 items-center text-center cursor-pointer hover:bg-black/10 transition-colors pr-14"
                          >
                             <div className="w-8 h-8 bg-[#00a884] text-white rounded-full flex items-center justify-center shadow-lg"><Video size={16} /></div>
                             <p className="text-[10px] font-bold uppercase tracking-wider">{isMe ? 'Meeting started' : 'Join Call'}</p>
                          </div>
                        )}

                        <div className="absolute bottom-1 right-1.5 flex items-center gap-0.5 opacity-60">
                           <span className="text-[9px] font-medium">{formatTime(msg.created_at)}</span>
                           {isMe && <CheckCheck size={12} className={msg.is_read ? 'text-blue-500' : ''} />}
                        </div>

                        <button 
                          onClick={() => setForwardMessage(msg)}
                          className={`absolute top-1/2 -translate-y-1/2 p-1.5 bg-white/80 dark:bg-slate-800/80 rounded-full shadow-lg opacity-0 group-hover/msg:opacity-100 transition-all ${isMe ? '-left-10' : '-right-10'} hover:bg-white dark:hover:bg-slate-700`}
                        >
                          <Forward size={14} className="text-slate-600 dark:text-slate-300" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
                })}
              </div>
              <div ref={messagesEndRef} />
            </div>

            {/* File Preview Bar */}
            {file && (
              <div className="px-4 py-2 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between animate-in slide-in-from-bottom-2 shrink-0">
                <div className="flex items-center gap-3 truncate">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-lg">
                    <File size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">{file.name}</p>
                    <p className="text-[10px] text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button onClick={() => setFile(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400">
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Input Bar - Zoomed Out */}
            <div className="p-2 bg-[#f0f2f5] dark:bg-slate-800 flex items-center gap-1.5 shrink-0 pb-[safe-area-inset-bottom]">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-500 hover:text-[#00a884]"><Paperclip size={24} /></button>
              <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              
              <form onSubmit={handleSendMessage} className="flex-1 flex items-center gap-1.5">
                <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm">
                   <input 
                    type="text" 
                    placeholder="Message" 
                    className="w-full px-4 py-2.5 text-[15px] bg-transparent outline-none" 
                    value={newMessage} 
                    onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }} 
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={sendMessageMutation.isPending || (!newMessage.trim() && !file)} 
                  className="w-10 h-10 flex items-center justify-center bg-[#00a884] text-white rounded-full transition-all active:scale-90 disabled:opacity-50"
                >
                  {sendMessageMutation.isPending ? <Circle size={16} className="animate-spin" /> : <Send size={20} className="ml-0.5" />}
                </button>
              </form>
            </div>
          </>
        ) : isCreatingGroup ? (
          <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 overflow-hidden h-full">
             <div className="h-[50px] px-4 bg-[#00a884] text-white flex items-center gap-4 shrink-0">
                <button onClick={() => setIsCreatingGroup(false)}><ChevronLeft size={24} /></button>
                <h3 className="text-[14px] font-bold">New Group</h3>
             </div>
             <div className="p-4 flex flex-col gap-4 flex-1 overflow-y-auto">
                <div className="flex flex-col items-center gap-3">
                   <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 border border-slate-200 dark:border-slate-700">
                      <Users size={32} />
                   </div>
                   <input 
                     type="text" 
                     placeholder="Group Name" 
                     className="w-full max-w-sm px-4 py-2 bg-transparent border-b-2 border-[#00a884] outline-none text-center font-bold"
                     value={groupName}
                     onChange={(e) => setGroupName(e.target.value)}
                   />
                </div>
                
                <div className="flex-1 mt-4">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Select Members</p>
                   <div className="space-y-1">
                      {users.map(u => (
                        <div 
                          key={u.id}
                          onClick={() => {
                            if (selectedMembers.includes(u.id)) {
                              setSelectedMembers(selectedMembers.filter(id => id !== u.id));
                            } else {
                              setSelectedMembers([...selectedMembers, u.id]);
                            }
                          }}
                          className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors"
                        >
                           <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${selectedMembers.includes(u.id) ? 'bg-[#00a884] border-[#00a884]' : 'border-slate-300'}`}>
                              {selectedMembers.includes(u.id) && <Check size={14} className="text-white" />}
                           </div>
                           <UserAvatar member={u} className="w-10 h-10" />
                           <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold truncate">{u.name}</p>
                              <p className="text-[10px] text-slate-500 uppercase font-medium">{u.role}</p>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
             <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end shrink-0">
                <button 
                  onClick={() => createRoomMutation.mutate({ name: groupName, type: 'group', participantIds: selectedMembers })}
                  disabled={!groupName.trim() || selectedMembers.length === 0 || createRoomMutation.isPending}
                  className="px-6 py-2 bg-[#00a884] text-white rounded-lg font-bold text-sm shadow-lg shadow-[#00a884]/20 disabled:opacity-50 active:scale-95 transition-all"
                >
                  {createRoomMutation.isPending ? 'Creating...' : 'Create Group'}
                </button>
             </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-col items-center justify-center p-8 text-center max-w-sm m-auto">
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/20 text-[#00a884] rounded-full flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/10">
               <MessageSquare size={40} />
            </div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2 uppercase tracking-tighter">Mehar Chat</h2>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed uppercase tracking-widest">
              Send and receive messages with your workspace team. End-to-end encrypted for your security.
            </p>
            <div className="mt-8 flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                <Lock size={12} /> End-to-end encrypted
            </div>
          </div>
        )}
      </div>

      {/* Forward Modal */}
      <Dialog open={!!forwardMessage} onOpenChange={() => setForwardMessage(null)}>
        <DialogContent className="sm:max-w-xs p-0 overflow-hidden rounded-[1.5rem] border-none shadow-2xl bg-white dark:bg-slate-900">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Forward Message</h3>
            <div className="mt-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="Search chats..." 
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-[#f0f2f5] dark:bg-slate-800 rounded-lg outline-none"
                value={forwardSearch}
                onChange={(e) => setForwardSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto custom-scrollbar">
            {rooms.filter(r => {
                const other = r.members.find(m => m.id !== user?.id);
                const title = r.type === 'group' ? r.name : (other?.name || '');
                return title.toLowerCase().includes(forwardSearch.toLowerCase());
            }).map(room => {
               const otherMember = room.members.find(m => m.id !== user?.id);
               const title = room.type === 'group' ? room.name : (otherMember?.name || 'DC');
               return (
                <button 
                  key={room.id} 
                  onClick={() => handleForward(room.id)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-[#f0f2f5] dark:hover:bg-slate-800 transition-colors border-b border-slate-50 dark:border-slate-800/50 text-left"
                >
                  <UserAvatar member={otherMember} className="w-8 h-8" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{title}</p>
                  </div>
                </button>
               );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* User Profile Modal */}
      <Dialog open={!!viewingProfile} onOpenChange={() => setViewingProfile(null)}>
        <DialogContent className="sm:max-w-xs p-0 overflow-hidden rounded-[1.5rem] border-none shadow-2xl bg-white dark:bg-slate-900">
          <div className="relative h-32 bg-gradient-to-br from-[#00a884] to-emerald-600">
             <button onClick={() => setViewingProfile(null)} className="absolute top-4 left-4 text-white hover:scale-110 transition-transform"><ChevronLeft size={24} /></button>
          </div>
          <div className="px-6 pb-6 text-center -mt-12 relative z-10">
             <div className="inline-block p-1 bg-white dark:bg-slate-900 rounded-full shadow-xl mb-4">
                <UserAvatar member={viewingProfile!} className="w-24 h-24" />
             </div>
             <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-wider">{viewingProfile?.name}</h3>
             <p className="text-[10px] font-bold text-[#00a884] uppercase tracking-[0.2em] mb-4">{viewingProfile?.role}</p>
             
             <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</span>
                   <span className={`text-[10px] font-bold uppercase tracking-widest ${viewingProfile?.is_online ? 'text-[#00a884]' : 'text-slate-400'}`}>
                      {viewingProfile?.is_online ? 'Online' : 'Offline'}
                   </span>
                </div>
                {viewingProfile?.id !== user?.id && (
                  <div className="flex gap-2">
                     <button onClick={() => { setViewingProfile(null); initiateCall(true); }} className="flex-1 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-white font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95">Call</button>
                     <button onClick={() => { setViewingProfile(null); initiateCall(false); }} className="flex-1 py-3 bg-[#00a884] text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-[#00a884]/20 hover:bg-[#008f6f] transition-all active:scale-95">Video</button>
                  </div>
                )}
             </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Media Preview Modal */}
      <Dialog open={!!previewMedia} onOpenChange={() => setPreviewMedia(null)}>
        <DialogContent className="max-w-[95vw] w-full max-h-[90vh] p-0 overflow-hidden bg-black/95 border-none rounded-3xl shadow-2xl flex flex-col z-[200]">
          <div className="absolute top-4 right-4 z-[210] flex gap-2">
             <button 
               onClick={() => {
                 if (previewMedia) {
                   const a = document.createElement('a');
                   a.href = previewMedia.url;
                   a.download = previewMedia.name;
                   a.click();
                 }
               }}
               className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-all active:scale-90"
               title="Download"
             >
               <Download size={22} />
             </button>
             <button 
               onClick={() => setPreviewMedia(null)}
               className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-all active:scale-90"
               title="Close"
             >
               <X size={22} />
             </button>
          </div>
          
          <div className="flex-1 flex items-center justify-center overflow-hidden p-4 md:p-8">
            {previewMedia?.type === 'image' && (
              <img src={previewMedia.url} alt={previewMedia.name} className="max-w-full max-h-full object-contain animate-in zoom-in-95 duration-300 shadow-2xl rounded-lg" />
            )}
            {previewMedia?.type === 'video' && (
              <video src={previewMedia.url} controls autoPlay className="max-w-full max-h-full object-contain animate-in zoom-in-95 duration-300 shadow-2xl rounded-lg" />
            )}
            {previewMedia?.type === 'pdf' && (
              <iframe src={previewMedia.url} className="w-full h-full border-none rounded-xl bg-white" title={previewMedia.name} />
            )}
          </div>
          
          <div className="p-5 bg-gradient-to-t from-black/80 to-transparent border-t border-white/5 flex items-center justify-between">
            <div className="min-w-0">
               <p className="text-white font-bold text-sm tracking-wide truncate">{previewMedia?.name}</p>
            </div>
            <div className="flex items-center gap-2">
               <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black text-white uppercase tracking-widest">{previewMedia?.type}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
