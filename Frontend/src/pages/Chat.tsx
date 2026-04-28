import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import Peer from 'peerjs';
import { 
  MessageSquare, Send, Users, Shield, Video, 
  Paperclip, Plus, Search, User, File, X, 
  ChevronRight, Phone, PhoneOff, Laptop, Lock, Check, CheckCheck,
  Mic, MicOff, VideoOff, Maximize, Minimize, Circle
} from 'lucide-react';

interface Member {
  id: number;
  name: string;
  email: string;
  role: string;
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

export default function Chat() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  
  // Custom Calling & Real-time States
  const [peer, setPeer] = useState<Peer | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [incomingCall, setIncomingCall] = useState<{ senderName: string; peerId: string; id: number; callObj: any } | null>(null);
  const [activeCall, setActiveCall] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [declinedCalls, setDeclinedCalls] = useState<number[]>([]);
  
  // Presence & Typing States
  const [typingUsers, setTypingUsers] = useState<Record<number, boolean>>({});
  const typingTimeoutRef = useRef<any>(null);
  const dataConnections = useRef<Record<string, any>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');

  // Heartbeat polling
  useEffect(() => {
    const sendHeartbeat = async () => {
      try {
        await fetch(`${API_URL}/api/users/heartbeat`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        });
      } catch (e) {
        console.error('Heartbeat failed', e);
      }
    };
    
    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [API_URL]);

  const startRingtone = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = audioCtx;
      const playRing = () => {
        if (!audioCtxRef.current) return;
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc1.type = 'sine'; osc1.frequency.value = 400;
        osc2.type = 'sine'; osc2.frequency.value = 450;
        osc1.connect(gain); osc2.connect(gain); gain.connect(audioCtx.destination);
        gain.gain.setValueAtTime(0, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.5, audioCtx.currentTime + 1.2);
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.3);
        osc1.start(audioCtx.currentTime); osc2.start(audioCtx.currentTime);
        osc1.stop(audioCtx.currentTime + 1.3); osc2.stop(audioCtx.currentTime + 1.3);
        setTimeout(() => { if (audioCtxRef.current) playRing(); }, 2500);
      };
      playRing();
    } catch (e) { console.error('Ringtone failed', e); }
  };

  const stopRingtone = () => {
    if (audioCtxRef.current) { audioCtxRef.current.close(); audioCtxRef.current = null; }
  };

  // Initialize PeerJS
  useEffect(() => {
    if (!user?.id) return;
    
    const myPeerId = `mehar-finance-user-${user.id}`;
    const newPeer = new Peer(myPeerId, {
      debug: 1,
      config: {
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }]
      }
    });

    newPeer.on('open', (id) => console.log('Peer connected with ID:', id));

    // Handle Incoming Media (Call)
    newPeer.on('call', (call) => {
      setIncomingCall(prev => prev ? { ...prev, callObj: call } : null);
    });

    // Handle Incoming Data (Typing etc.)
    newPeer.on('connection', (conn) => {
      conn.on('data', (data: any) => {
        if (data.type === 'typing') {
          setTypingUsers(prev => ({ ...prev, [data.userId]: data.isTyping }));
          // Clear typing after 3 seconds if no update
          setTimeout(() => {
            setTypingUsers(prev => ({ ...prev, [data.userId]: false }));
          }, 3000);
        }
      });
    });

    newPeer.on('error', (err) => {
      console.error('Peer error:', err);
      if (err.type === 'peer-unavailable') {
        toast.error('The user is currently offline');
        endCall();
      }
    });

    setPeer(newPeer);
    return () => newPeer.destroy();
  }, [user?.id]);

  // Notify Typing
  const handleTyping = () => {
    if (!activeRoomId || !peer || !activeRoom) return;
    
    const notifyMembers = () => {
      activeRoom.members.forEach(m => {
        if (m.id === user?.id) return;
        const targetPeerId = `mehar-finance-user-${m.id}`;
        
        let conn = dataConnections.current[targetPeerId];
        if (!conn || !conn.open) {
          conn = peer.connect(targetPeerId);
          dataConnections.current[targetPeerId] = conn;
        }
        
        if (conn.open) {
          conn.send({ type: 'typing', userId: user?.id, isTyping: true });
        } else {
          conn.on('open', () => conn.send({ type: 'typing', userId: user?.id, isTyping: true }));
        }
      });
    };

    notifyMembers();
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
       // Optional: send "stop typing" event
    }, 2000);
  };

  // Handle Video Elements
  useEffect(() => {
    if (localStream && localVideoRef.current) localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  // Fetch Chat Rooms
  const { data: rooms = [], isLoading: roomsLoading } = useQuery<Room[]>({
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

  // Fetch Messages
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
    enabled: !!activeRoomId,
    refetchInterval: 3000 
  });

  // Fetch Users
  const { data: users = [] } = useQuery<Member[]>({
    queryKey: ['chatUsers'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/chat/users`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    },
    refetchInterval: 10000 // Poll online status
  });

  // Send Message
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, message_type, file, meeting_link }: { 
      content?: string; 
      message_type?: string; 
      file?: File; 
      meeting_link?: string 
    }) => {
      const formData = new FormData();
      if (content) formData.append('content', content);
      if (message_type) formData.append('message_type', message_type);
      if (meeting_link) formData.append('meeting_link', meeting_link);
      if (file) formData.append('file', file);

      const res = await fetch(`${API_URL}/api/chat/rooms/${activeRoomId}/messages`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
        body: formData
      });

      if (!res.ok) throw new Error('Failed to send message');
      return res.json();
    },
    onSuccess: () => {
      setNewMessage('');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      queryClient.invalidateQueries({ queryKey: ['chatMessages', activeRoomId] });
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
    }
  });

  // Listen for Incoming Calls
  useEffect(() => {
    if (!messages || messages.length === 0) return;
    const lastMessage = messages[messages.length - 1];
    
    if (lastMessage.message_type === 'meeting' && lastMessage.sender_id !== user?.id && !declinedCalls.includes(lastMessage.id) && !activeCall) {
      const msgTime = new Date(lastMessage.created_at).getTime();
      if (Date.now() - msgTime < 30000) { 
        if (!incomingCall) {
          setIncomingCall({
            senderName: lastMessage.sender_name || 'A Colleague',
            peerId: lastMessage.meeting_link || '', 
            id: lastMessage.id,
            callObj: null
          });
          startRingtone();
        }
      }
    }

    if (lastMessage.message_type === 'call_end' && activeCall && lastMessage.sender_id !== user?.id) {
       endCall();
       toast.info('Call ended by other user');
    }
  }, [messages, user?.id, declinedCalls, incomingCall, activeCall]);

  const startMeeting = async () => {
    if (!activeRoomId || !peer) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      setIsCalling(true);
      const activeRoom = rooms.find(r => r.id === activeRoomId);
      const otherUser = activeRoom?.members.find(m => m.id !== user?.id);
      if (!otherUser) return toast.error('Cannot call here');
      const targetPeerId = `mehar-finance-user-${otherUser.id}`;
      sendMessageMutation.mutate({ content: 'Incoming video call...', message_type: 'meeting', meeting_link: `mehar-finance-user-${user?.id}` });
      const call = peer.call(targetPeerId, stream);
      setupCallHandlers(call);
      setActiveCall(call);
    } catch (err) { toast.error('Camera/mic access denied'); }
  };

  const setupCallHandlers = (call: any) => {
    call.on('stream', (st: MediaStream) => { setRemoteStream(st); setIsCalling(false); });
    call.on('close', endCall);
    call.on('error', () => { toast.error('Call error'); endCall(); });
  };

  const answerCall = async () => {
    if (!incomingCall || !peer) return;
    stopRingtone();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      let callObj = incomingCall.callObj;
      if (!callObj) {
        peer.on('call', (newCall) => {
          newCall.answer(stream); setupCallHandlers(newCall); setActiveCall(newCall); setIncomingCall(null);
        });
      } else {
        callObj.answer(stream); setupCallHandlers(callObj); setActiveCall(callObj); setIncomingCall(null);
      }
    } catch (err) { declineCall(); }
  };

  const declineCall = () => {
    if (incomingCall) { setDeclinedCalls([...declinedCalls, incomingCall.id]); setIncomingCall(null); stopRingtone(); }
  };

  const endCall = () => {
    if (activeCall) activeCall.close();
    if (localStream) localStream.getTracks().forEach(t => t.stop());
    if (activeCall || isCalling) sendMessageMutation.mutate({ content: 'Call ended', message_type: 'call_end' });
    setLocalStream(null); setRemoteStream(null); setActiveCall(null); setIsCalling(false); setIncomingCall(null); stopRingtone();
  };

  const toggleMute = () => {
    if (localStream) { localStream.getAudioTracks().forEach(t => t.enabled = !t.enabled); setIsMuted(!isMuted); }
  };

  const toggleVideo = () => {
    if (localStream) { localStream.getVideoTracks().forEach(t => t.enabled = !t.enabled); setIsVideoOff(!isVideoOff); }
  };

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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && !file) return;
    sendMessageMutation.mutate({ content: newMessage, message_type: file ? 'document' : 'text', file: file || undefined });
  };

  const activeRoom = rooms.find(r => r.id === activeRoomId);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="h-[calc(100vh-6.5rem)] flex bg-slate-50 dark:bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-blue-100 dark:border-slate-800">
      
      {/* Sidebar */}
      <div className={`w-full md:w-80 border-r border-blue-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col ${activeRoomId && !isCreatingGroup ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-blue-50 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-black text-blue-950 dark:text-white flex items-center gap-2">
              <MessageSquare className="text-blue-600 w-6 h-6" />
              Workspace
            </h1>
            <button onClick={() => setIsCreatingGroup(!isCreatingGroup)} className="p-2 bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 transition"><Users size={18} /></button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input type="text" placeholder="Search people..." className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 rounded-xl border border-transparent focus:border-blue-500 outline-none" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isCreatingGroup ? (
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between"><h3 className="text-sm font-bold text-foreground">Create Group Session</h3><button onClick={() => setIsCreatingGroup(false)}><X size={18} /></button></div>
              <input type="text" placeholder="Group Session Name" className="w-full px-4 py-2 text-sm border border-border bg-slate-50 dark:bg-slate-800 rounded-xl outline-none" value={groupName} onChange={(e) => setGroupName(e.target.value)} />
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {users.map(u => (
                  <label key={u.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer">
                    <input type="checkbox" checked={selectedUsers.includes(u.id)} onChange={() => { if(selectedUsers.includes(u.id)) setSelectedUsers(selectedUsers.filter(i=>i!==u.id)); else setSelectedUsers([...selectedUsers,u.id]); }} className="rounded text-blue-600" />
                    <div><p className="text-xs font-bold flex items-center gap-1.5">{u.name} {u.is_online && <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />}</p><p className="text-[10px] text-muted-foreground">{u.role}</p></div>
                  </label>
                ))}
              </div>
              <button onClick={() => createRoomMutation.mutate({ name: groupName, type: 'group', participantIds: selectedUsers })} className="w-full py-2 bg-blue-600 text-white text-sm font-bold rounded-xl">Create Session</button>
            </div>
          ) : rooms.map(room => {
                const otherMember = room.members.find(m => m.id !== user?.id);
                const title = room.type === 'group' ? room.name : (otherMember?.name || 'DC');
                const isOnline = room.type === 'direct' && otherMember?.is_online;
                return (
                  <button key={room.id} onClick={() => setActiveRoomId(room.id)} className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${activeRoomId === room.id ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                    <div className="relative">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${activeRoomId === room.id ? 'bg-white/20' : 'bg-blue-50 dark:bg-slate-800 text-blue-600'}`}>{title?.slice(0, 2).toUpperCase()}</div>
                      {isOnline && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full" />}
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{title}</p>
                      <p className={`text-xs truncate ${activeRoomId === room.id ? 'text-white/80' : 'text-muted-foreground'}`}>{room.last_message?.content || 'Start messaging'}</p>
                    </div>
                  </button>
                );
              })}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 relative ${!activeRoomId && !isCreatingGroup ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
        
        {activeRoomId ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-blue-50 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveRoomId(null)} className="md:hidden p-2"><X size={20} /></button>
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-slate-800 text-blue-600 flex items-center justify-center font-bold">
                    {activeRoom?.type === 'group' ? <Users size={18} /> : (activeRoom?.members.find(m => m.id !== user?.id)?.name || 'DC').slice(0, 2).toUpperCase()}
                  </div>
                  {activeRoom?.type === 'direct' && activeRoom?.members.find(m => m.id !== user?.id)?.is_online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold">{activeRoom?.type === 'group' ? activeRoom.name : activeRoom?.members.find(m => m.id !== user?.id)?.name}</h3>
                  {activeRoom?.type === 'direct' && activeRoom?.members.find(m => m.id !== user?.id)?.is_online ? (
                    <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Active Now</p>
                  ) : (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest"><Lock size={10} /> Encrypted Session</div>
                  )}
                </div>
              </div>
              <button onClick={startMeeting} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-2xl shadow-md hover:bg-blue-700 transition"><Phone size={16} /> Call</button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => {
                const isMe = msg.sender_id === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl p-3 px-4 shadow-sm ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white dark:bg-slate-900 rounded-bl-none border border-blue-50'}`}>
                      {!isMe && <span className="block text-[10px] font-bold text-blue-500 mb-1">{msg.sender_name}</span>}
                      {msg.message_type === 'text' && <p className="text-sm whitespace-pre-wrap">{msg.content}</p>}
                      {msg.message_type === 'document' && (
                        <div className="flex flex-col gap-2">
                          {msg.file_url && (msg.file_name?.match(/\.(jpeg|jpg|png|gif|webp)$/i)) && (
                            <img src={`${API_URL}${msg.file_url}`} alt={msg.file_name} className="rounded-xl max-h-[200px] object-cover" />
                          )}
                          <div className="flex items-center gap-3 bg-black/10 p-2 rounded-xl">
                            <File size={24} className={isMe ? 'text-white' : 'text-blue-500'} />
                            <p className="text-xs font-bold truncate max-w-[150px]">{msg.file_name || 'Doc'}</p>
                            <a href={`${API_URL}${msg.file_url}`} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg text-xs font-bold underline">Download</a>
                          </div>
                        </div>
                      )}
                      {msg.message_type === 'meeting' && <div className="flex flex-col gap-2 bg-black/10 p-3 rounded-xl border border-dashed border-white/40"><p className="text-xs font-bold flex items-center gap-2"><Phone size={14} /> {isMe ? 'You started a call' : 'Incoming call...'}</p></div>}
                      {msg.message_type === 'call_end' && <p className="text-[10px] italic opacity-70">Call ended</p>}
                      <div className="flex items-center justify-end gap-1 mt-1 text-[9px] opacity-80">
                        <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {isMe && <span>{msg.is_read ? <CheckCheck size={12} className="text-blue-200" /> : <CheckCheck size={12} className="opacity-50" />}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Typing Indicator */}
              {activeRoom?.members.some(m => m.id !== user?.id && typingUsers[m.id]) && (
                <div className="flex justify-start animate-in slide-in-from-left-2 duration-300">
                  <div className="bg-white dark:bg-slate-900 rounded-2xl rounded-bl-none p-3 px-4 shadow-sm border border-blue-50 flex items-center gap-2">
                     <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                     </div>
                     <span className="text-[10px] font-bold text-slate-500 uppercase">Someone is typing...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-blue-50 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3">
              <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 text-muted-foreground hover:text-blue-600 rounded-2xl"><Paperclip size={20} /></button>
              <input 
                type="text" 
                placeholder="Type your message…" 
                className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 text-sm border border-transparent focus:border-blue-500 rounded-2xl outline-none" 
                value={newMessage} 
                onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }} 
              />
              <button type="submit" disabled={sendMessageMutation.isPending || (!newMessage.trim() && !file)} className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-md transition"><Send size={20} /></button>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 text-center max-w-sm">
            <div className="p-4 bg-blue-50 dark:bg-slate-900 rounded-full text-blue-600"><Shield size={40} /></div>
            <div><h2 className="text-xl font-bold">Secure Workspace Chat</h2><p className="text-sm text-muted-foreground mt-1">Exchange encrypted messages and launch secure internal calls with any colleague.</p></div>
          </div>
        )}

        {/* Overlay Modals (Calling) */}
        {isCalling && (
          <div className="fixed inset-0 z-[1000] bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center text-white">
            <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center font-bold text-2xl shadow-2xl animate-pulse">{(activeRoom?.members.find(m => m.id !== user?.id)?.name || 'U').slice(0, 2).toUpperCase()}</div>
            <h2 className="text-xl font-bold mt-8">Calling...</h2>
            <button onClick={endCall} className="mt-12 px-8 py-3 bg-red-600 font-bold rounded-2xl flex items-center gap-2"><X size={18} /> Cancel</button>
          </div>
        )}

        {incomingCall && (
          <div className="fixed inset-0 z-[1000] bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center text-white">
            <div className="w-24 h-24 bg-green-600 rounded-full flex items-center justify-center font-bold text-2xl shadow-2xl animate-bounce">{incomingCall.senderName.slice(0, 2).toUpperCase()}</div>
            <h2 className="text-xl font-bold mt-8">Incoming Call</h2>
            <p className="text-slate-300 mb-12">{incomingCall.senderName} is calling you</p>
            <div className="flex gap-6"><button onClick={answerCall} className="px-8 py-4 bg-green-600 font-bold rounded-2xl flex items-center gap-2 shadow-xl"><Phone size={20} /> Answer</button><button onClick={declineCall} className="px-8 py-4 bg-red-600 font-bold rounded-2xl flex items-center gap-2 shadow-xl"><PhoneOff size={20} /> Decline</button></div>
          </div>
        )}

        {activeCall && (
          <div className="fixed inset-0 z-[2000] bg-black flex flex-col">
            <div className="flex-1 relative flex items-center justify-center">
               {remoteStream ? <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" /> : <div className="text-white animate-pulse">Connecting...</div>}
               <div className="absolute bottom-24 right-6 w-32 h-48 bg-slate-800 rounded-2xl border-2 border-white/20 overflow-hidden">
                  <video ref={localVideoRef} autoPlay muted playsInline className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : 'block'}`} />
                  {isVideoOff && <div className="w-full h-full flex items-center justify-center bg-slate-900"><VideoOff className="text-slate-600" size={32} /></div>}
               </div>
            </div>
            <div className="h-24 bg-slate-900/90 flex items-center justify-center gap-6">
               <button onClick={toggleMute} className={`p-4 rounded-full ${isMuted ? 'bg-red-500' : 'bg-white/10 text-white'}`}>{isMuted ? <MicOff /> : <Mic />}</button>
               <button onClick={endCall} className="p-5 bg-red-600 text-white rounded-full"><PhoneOff size={28} /></button>
               <button onClick={toggleVideo} className={`p-4 rounded-full ${isVideoOff ? 'bg-red-500' : 'bg-white/10 text-white'}`}>{isVideoOff ? <VideoOff /> : <Video />}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
