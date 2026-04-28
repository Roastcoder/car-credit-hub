import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  MessageSquare, Send, Users, Shield, Video, 
  Paperclip, Plus, Search, User, File, X, 
  ChevronRight, ChevronLeft, Phone, PhoneOff, Laptop, Lock, Check, CheckCheck,
  Mic, MicOff, VideoOff, Maximize, Minimize, Circle, Mail, Info, Share2, Forward
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
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [viewingProfile, setViewingProfile] = useState<Member | null>(null);
  const [lastMessageId, setLastMessageId] = useState<number | null>(null);
  const [forwardMessage, setForwardMessage] = useState<Message | null>(null);
  const [forwardSearch, setForwardSearch] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');

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
    <div className="h-[calc(100vh-6.5rem)] flex bg-[#f0f2f5] dark:bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-border">
      
      {/* Sidebar - Zoomed Out (Compact) */}
      <div className={`w-full md:w-72 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col ${activeRoomId && !isCreatingGroup ? 'hidden md:flex' : 'flex'}`}>
        {/* Sidebar Header - Compact */}
        <div className="p-3 bg-[#f0f2f5] dark:bg-slate-800/50 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
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
        <div className="p-2 bg-white dark:bg-slate-900">
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
               {searchQuery ? <ChevronRight size={14} className="rotate-180" onClick={() => setSearchQuery('')} /> : <Search size={14} />}
            </div>
            <input 
              type="text" 
              placeholder="Search or start chat" 
              className="w-full pl-10 pr-4 py-1.5 text-xs bg-[#f0f2f5] dark:bg-slate-800 rounded-lg border-none focus:ring-0 outline-none" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
          </div>
        </div>

        {/* Rooms List - Compact */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900 custom-scrollbar">
          {isCreatingGroup ? (
            <div className="p-3 space-y-3 animate-in slide-in-from-left duration-200 bg-white dark:bg-slate-900 h-full">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-[11px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">New Group</h3>
                </div>
                <button onClick={() => setIsCreatingGroup(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition">
                  <X size={16} className="text-slate-500" />
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Group Name</label>
                <input 
                  type="text" 
                  placeholder="Group Name..." 
                  className="w-full px-3 py-2 text-sm bg-[#f0f2f5] dark:bg-slate-800 rounded-lg border-none outline-none transition-all" 
                  value={groupName} 
                  onChange={(e) => setGroupName(e.target.value)} 
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Select Participants</label>
                <div className="space-y-0.5 max-h-60 overflow-y-auto border border-slate-100 dark:border-slate-800 rounded-lg custom-scrollbar">
                  {users.map(u => (
                    <label key={u.id} className={`flex items-center gap-3 p-2 hover:bg-[#f0f2f5] dark:hover:bg-slate-800 cursor-pointer transition-colors border-b border-slate-50 dark:border-slate-800/50 ${selectedUsers.includes(u.id) ? 'bg-[#00a884]/5' : ''}`}>
                      <input 
                        type="checkbox" 
                        checked={selectedUsers.includes(u.id)} 
                        onChange={() => { 
                          if(selectedUsers.includes(u.id)) setSelectedUsers(selectedUsers.filter(i=>i!==u.id)); 
                          else setSelectedUsers([...selectedUsers,u.id]); 
                        }} 
                        className="w-4 h-4 rounded-full text-[#00a884] focus:ring-[#00a884]" 
                      />
                      <UserAvatar member={u} className="w-8 h-8" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{u.name}</p>
                        <p className="text-[9px] text-slate-500 uppercase font-bold tracking-tighter">{u.role}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => createRoomMutation.mutate({ name: groupName, type: 'group', participantIds: selectedUsers })} 
                disabled={!groupName.trim() || selectedUsers.length === 0 || createRoomMutation.isPending}
                className="w-full py-2.5 bg-[#00a884] text-white text-xs font-black rounded-lg shadow transition-all active:scale-95 disabled:opacity-50"
              >
                {createRoomMutation.isPending ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          ) : (
            <div className="flex flex-col">
              {filteredRooms.map(room => {
                const otherMember = room.members.find(m => m.id !== user?.id);
                const title = room.type === 'group' ? room.name : (otherMember?.name || 'DC');
                const isOnline = room.type === 'direct' && otherMember?.is_online;
                const isActive = activeRoomId === room.id;
                
                return (
                  <button 
                    key={room.id} 
                    onClick={() => setActiveRoomId(room.id)} 
                    className={`w-full flex items-center gap-3 p-2 pr-3 transition-all border-b border-slate-50 dark:border-slate-800/50 ${isActive ? 'bg-[#f0f2f5] dark:bg-slate-800' : 'hover:bg-[#f5f6f6] dark:hover:bg-slate-800/30'}`}
                  >
                    <div className="relative shrink-0">
                      <UserAvatar member={otherMember} className="w-10 h-10" />
                      {isOnline && <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#00a884] border-2 border-white dark:border-slate-900 rounded-full" />}
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <p className="text-[13px] font-semibold truncate text-slate-900 dark:text-slate-100">{title}</p>
                        <span className="text-[10px] text-slate-500 shrink-0">
                          {room.last_message ? new Date(room.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {room.last_message?.sender_id === user?.id && <CheckCheck size={12} className="text-blue-500 shrink-0" />}
                        <p className="text-[11px] truncate text-slate-500 dark:text-slate-400">
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
                        <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">{u.role}</p>
                      </div>
                      <Plus size={14} className="text-[#00a884] opacity-0 group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area - Zoomed Out */}
      <div className={`flex-1 flex flex-col relative ${!activeRoomId && !isCreatingGroup ? 'hidden md:flex bg-[#f0f2f5] dark:bg-slate-950 items-center justify-center' : 'flex bg-[#e5ddd5] dark:bg-slate-900'}`}>
        
        {activeRoomId ? (
          <>
            {/* Header - Compact */}
            <div className="h-[50px] px-3 bg-[#f0f2f5] dark:bg-slate-800 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 shadow-sm z-10">
              <div className="flex items-center gap-2">
                <button onClick={() => setActiveRoomId(null)} className="md:hidden p-1 text-slate-600"><ChevronLeft size={20} /></button>
                <div className="relative cursor-pointer" onClick={() => {
                   const otherMember = activeRoom?.members.find(m => m.id !== user?.id);
                   if (otherMember) setViewingProfile(otherMember);
                }}>
                  <UserAvatar member={activeRoom?.type === 'group' ? { name: activeRoom.name } : activeRoom?.members.find(m => m.id !== user?.id)} className="w-8 h-8" />
                </div>
                <div className="cursor-pointer overflow-hidden" onClick={() => {
                   const otherMember = activeRoom?.members.find(m => m.id !== user?.id);
                   if (otherMember) setViewingProfile(otherMember);
                }}>
                  <h3 className="text-[14px] font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {activeRoom?.type === 'group' ? activeRoom.name : activeRoom?.members.find(m => m.id !== user?.id)?.name}
                  </h3>
                  {activeRoom?.type === 'direct' && activeRoom?.members.find(m => m.id !== user?.id)?.is_online && (
                    <p className="text-[9px] text-[#00a884] font-medium leading-none">online</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => initiateCall(false)} className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition"><Video size={18} /></button>
                <button onClick={() => initiateCall(true)} className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition"><Phone size={18} /></button>
              </div>
            </div>

            {/* Messages - Zoomed Out */}
            <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-1.5 relative custom-scrollbar" style={{ 
              backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
              backgroundSize: '300px',
              backgroundColor: '#e5ddd5'
            }}>
              {messages.map((msg) => {
                const isMe = msg.sender_id === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group/msg`}>
                    <div className={`relative max-w-[85%] md:max-w-[60%] rounded-lg p-1.5 px-2.5 shadow-sm ${isMe ? 'bg-[#dcf8c6] dark:bg-[#056162] text-slate-900 dark:text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-tl-none'}`}>
                      <div className={`absolute top-0 w-1.5 h-1.5 ${isMe ? '-right-1.5 bg-[#dcf8c6] dark:bg-[#056162]' : '-left-1.5 bg-white dark:bg-slate-800'}`} style={{ clipPath: isMe ? 'polygon(0 0, 0% 100%, 100% 0)' : 'polygon(0 0, 100% 100%, 100% 0)' }}></div>
                      
                      {!isMe && activeRoom?.type === 'group' && (
                        <span className="block text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mb-0.5">{msg.sender_name}</span>
                      )}
                      
                      {msg.message_type === 'text' && <p className="text-[13px] leading-relaxed pr-14 pb-1">{msg.content}</p>}
                      {msg.message_type === 'document' && (
                        <div className="flex flex-col gap-1.5 min-w-[150px] pr-14 pb-1">
                          {msg.file_url && (msg.file_name?.match(/\.(jpeg|jpg|png|gif|webp)$/i)) && (
                            <img src={`${API_URL}${msg.file_url}`} alt={msg.file_name} className="rounded-md max-h-[200px] object-cover border border-black/5" />
                          )}
                          {msg.file_url && (msg.file_name?.match(/\.(mp4|webm|ogg)$/i)) && (
                            <video src={`${API_URL}${msg.file_url}`} controls className="rounded-md max-h-[200px] w-full bg-black/10" />
                          )}
                          <div className={`flex items-center gap-2 p-1.5 rounded-lg ${isMe ? 'bg-[#c5e4ac] dark:bg-[#044d4e]' : 'bg-slate-100 dark:bg-slate-700'}`}>
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
                            <a href={`${API_URL}${msg.file_url}`} target="_blank" rel="noreferrer" className="p-1 bg-white/20 rounded-full hover:bg-white/40"><Plus size={12} className="rotate-45" /></a>
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
                      
                      <div className="absolute right-1.5 bottom-1 flex items-center gap-1 text-[9px] opacity-60 font-medium">
                        <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {isMe && <CheckCheck size={12} className={msg.is_read ? 'text-blue-500' : ''} />}
                      </div>

                      {/* Forward Button - Visible on Hover */}
                      <button 
                        onClick={() => setForwardMessage(msg)}
                        className={`absolute top-1/2 -translate-y-1/2 p-1.5 bg-white/80 dark:bg-slate-800/80 rounded-full shadow-lg opacity-0 group-hover/msg:opacity-100 transition-all ${isMe ? '-left-10' : '-right-10'} hover:bg-white dark:hover:bg-slate-700`}
                      >
                        <Forward size={14} className="text-slate-600 dark:text-slate-300" />
                      </button>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* File Preview Bar */}
            {file && (
              <div className="px-4 py-2 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between animate-in slide-in-from-bottom-2">
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
            <div className="p-2 bg-[#f0f2f5] dark:bg-slate-800 flex items-center gap-1.5">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="p-1.5 text-slate-500 hover:text-[#00a884]"><Paperclip size={20} /></button>
              <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              
              <form onSubmit={handleSendMessage} className="flex-1 flex items-center gap-1.5">
                <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm">
                   <input 
                    type="text" 
                    placeholder="Message" 
                    className="w-full px-4 py-2 text-sm bg-transparent outline-none" 
                    value={newMessage} 
                    onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }} 
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={sendMessageMutation.isPending || (!newMessage.trim() && !file)} 
                  className="w-9 h-9 flex items-center justify-center bg-[#00a884] text-white rounded-full transition-all active:scale-90 disabled:opacity-50"
                >
                  {sendMessageMutation.isPending ? <Circle size={14} className="animate-spin" /> : <Send size={18} className="ml-0.5" />}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 text-center max-w-xs animate-in zoom-in duration-500">
            <div className="w-48 h-48 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center shadow-lg p-6 relative">
                <img src={logo} alt="Mehar" className="w-full h-full object-contain opacity-80" />
            </div>
            <div className="space-y-1">
                <h2 className="text-xl font-black text-slate-700 dark:text-white">Mehar Finance</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Secure internal team workspace.</p>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium pt-4 border-t border-slate-300 w-full justify-center">
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
                    <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">{room.type}</p>
                  </div>
                  <Send size={14} className="text-[#00a884]" />
                </button>
               );
            })}
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
            <button onClick={() => setForwardMessage(null)} className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-slate-700">Cancel</button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile Modal - Compact */}
      <Dialog open={!!viewingProfile} onOpenChange={() => setViewingProfile(null)}>
        <DialogContent className="sm:max-w-xs p-0 overflow-hidden rounded-[1.5rem] border-none shadow-2xl">
          <div className="h-20 bg-[#00a884]" />
          <div className="px-6 pb-6 -mt-10 relative bg-white dark:bg-slate-900 text-center">
             <UserAvatar member={viewingProfile} className="w-20 h-20 mx-auto shadow-xl text-2xl" />
             <h2 className="text-lg font-black text-slate-900 dark:text-white mt-4">{viewingProfile?.name}</h2>
             <p className="text-[9px] font-bold text-[#00a884] uppercase tracking-widest">{viewingProfile?.role}</p>
             <div className="mt-6 space-y-2 text-left">
                <div className="flex items-center gap-3 p-3 bg-[#f8f9fa] dark:bg-slate-800 rounded-xl">
                   <Phone size={14} className="text-[#00a884]" />
                   <div className="min-w-0"><p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Mobile</p><p className="text-xs font-semibold truncate">{viewingProfile?.phone || 'N/A'}</p></div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-[#f8f9fa] dark:bg-slate-800 rounded-xl">
                   <Mail size={14} className="text-indigo-600" />
                   <div className="min-w-0"><p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Email</p><p className="text-xs font-semibold truncate">{viewingProfile?.email}</p></div>
                </div>
             </div>
             <button onClick={() => { setViewingProfile(null); initiateCall(false); }} className="w-full mt-6 py-3 bg-[#00a884] text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 text-xs flex items-center justify-center gap-2">
                <Video size={16} /> Start Call
             </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
