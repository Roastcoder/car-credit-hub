import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import Peer from 'peerjs';
import { 
  MessageSquare, Send, Users, Shield, Video, 
  Paperclip, Plus, Search, User, File, X, 
  ChevronRight, ChevronLeft, Phone, PhoneOff, Laptop, Lock, Check, CheckCheck,
  Mic, MicOff, VideoOff, Maximize, Minimize, Circle, Mail, Info
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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

const UserAvatar = ({ member, className, onClick }: { member: Member | any, className?: string, onClick?: () => void }) => {
  const [error, setError] = useState(false);
  const initials = member?.name?.slice(0, 2).toUpperCase() || 'U';
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
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [viewingProfile, setViewingProfile] = useState<Member | null>(null);
  const [lastMessageId, setLastMessageId] = useState<number | null>(null);
  
  // Custom Calling & Real-time States
  const [peer, setPeer] = useState<Peer | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [incomingCall, setIncomingCall] = useState<{ senderName: string; peerId: string; id: number; callObj: any } | null>(null);
  const [activeCall, setActiveCall] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [handledCallIds, setHandledCallIds] = useState<number[]>([]);
  
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

  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880.00, audioCtx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) { console.error('Notification sound failed', e); }
  };

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
      // Find the sender user from the peer ID
      const senderUserId = call.peer.replace('mehar-finance-user-', '');
      
      setIncomingCall(prev => ({
        senderName: prev?.senderName || 'A Colleague',
        peerId: call.peer,
        id: prev?.id || Date.now(),
        callObj: call
      }));
      startRingtone();
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

  // Notification Sound Logic
  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.id !== lastMessageId) {
        if (lastMsg.sender_id !== user?.id) {
           playNotificationSound();
        }
        setLastMessageId(lastMsg.id);
      }
    }
  }, [messages, user?.id, lastMessageId]);

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
    
    if (lastMessage.message_type === 'meeting' && lastMessage.sender_id !== user?.id && !handledCallIds.includes(lastMessage.id) && !activeCall) {
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
  }, [messages, user?.id, handledCallIds, incomingCall, activeCall]);

  const VIDEO_CONSTRAINTS = {
    video: {
      width: { ideal: 640 },
      height: { ideal: 480 },
      frameRate: { ideal: 24 }
    },
    audio: true
  };

  const startMeeting = async () => {
    if (!activeRoomId || !peer) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia(VIDEO_CONSTRAINTS);
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
    setHandledCallIds(prev => [...prev, incomingCall.id]);
    try {
      const stream = await navigator.mediaDevices.getUserMedia(VIDEO_CONSTRAINTS);
      setLocalStream(stream);
      if (incomingCall.callObj) {
        incomingCall.callObj.answer(stream);
        setupCallHandlers(incomingCall.callObj);
        setActiveCall(incomingCall.callObj);
        setIncomingCall(null);
      } else {
        peer.on('call', (newCall) => {
          newCall.answer(stream);
          setupCallHandlers(newCall);
          setActiveCall(newCall);
          setIncomingCall(null);
        });
        toast.info('Connecting...');
      }
    } catch (err) { declineCall(); }
  };

  const declineCall = () => {
    if (incomingCall) { 
      setHandledCallIds(prev => [...prev, incomingCall.id]); 
      setIncomingCall(null); 
      stopRingtone(); 
    }
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

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="h-[calc(100vh-6.5rem)] flex bg-[#f0f2f5] dark:bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-border">
      
      {/* Sidebar - WhatsApp Style */}
      <div className={`w-full md:w-96 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col ${activeRoomId && !isCreatingGroup ? 'hidden md:flex' : 'flex'}`}>
        {/* Sidebar Header */}
        <div className="p-4 bg-[#f0f2f5] dark:bg-slate-800/50 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
          <UserAvatar member={user} className="w-10 h-10 border-2 border-white dark:border-slate-700" />
          <div className="flex items-center gap-1">
            <button onClick={() => setIsCreatingGroup(!isCreatingGroup)} className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition" title="New Group">
              <Users size={20} />
            </button>
            <button className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition">
              <MessageSquare size={20} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-2 bg-white dark:bg-slate-900">
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
               {searchQuery ? <ChevronRight size={18} className="rotate-180" onClick={() => setSearchQuery('')} /> : <Search size={18} />}
            </div>
            <input 
              type="text" 
              placeholder="Search or start new chat" 
              className="w-full pl-12 pr-4 py-2 text-sm bg-[#f0f2f5] dark:bg-slate-800 rounded-xl border-none focus:ring-0 outline-none" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
          </div>
        </div>

        {/* Rooms List */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900 custom-scrollbar">
          {isCreatingGroup ? (
            <div className="p-4 space-y-4 animate-in slide-in-from-left duration-200">
              <div className="flex items-center justify-between"><h3 className="text-sm font-bold text-foreground uppercase tracking-wider">New Group Session</h3><button onClick={() => setIsCreatingGroup(false)} className="p-1 hover:bg-slate-100 rounded-full"><X size={18} /></button></div>
              <input type="text" placeholder="Group Session Name" className="w-full px-4 py-2.5 text-sm bg-[#f0f2f5] dark:bg-slate-800 rounded-xl outline-none" value={groupName} onChange={(e) => setGroupName(e.target.value)} />
              <div className="space-y-0.5 max-h-80 overflow-y-auto">
                {users.map(u => (
                  <label key={u.id} className="flex items-center gap-4 p-3 hover:bg-[#f0f2f5] dark:hover:bg-slate-800 cursor-pointer transition-colors border-b border-slate-50 dark:border-slate-800/50">
                    <input type="checkbox" checked={selectedUsers.includes(u.id)} onChange={() => { if(selectedUsers.includes(u.id)) setSelectedUsers(selectedUsers.filter(i=>i!==u.id)); else setSelectedUsers([...selectedUsers,u.id]); }} className="w-4 h-4 rounded-full text-[#00a884] focus:ring-[#00a884]" />
                    <UserAvatar member={u} className="w-10 h-10" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{u.name}</p>
                      <p className="text-[11px] text-slate-500 uppercase font-bold tracking-tighter">{u.role}</p>
                    </div>
                  </label>
                ))}
              </div>
              <button 
                onClick={() => createRoomMutation.mutate({ name: groupName, type: 'group', participantIds: selectedUsers })} 
                disabled={!groupName.trim() || selectedUsers.length === 0}
                className="w-full py-3 bg-[#00a884] hover:bg-[#008f6f] text-white text-sm font-bold rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
              >
                Create Group
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
                    className={`w-full flex items-center gap-4 p-3 pr-4 transition-all border-b border-slate-50 dark:border-slate-800/50 ${isActive ? 'bg-[#f0f2f5] dark:bg-slate-800' : 'hover:bg-[#f5f6f6] dark:hover:bg-slate-800/30'}`}
                  >
                    <div className="relative shrink-0">
                      <UserAvatar member={otherMember} className="w-12 h-12" />
                      {isOnline && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#00a884] border-2 border-white dark:border-slate-900 rounded-full" />}
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <p className="text-[15px] font-semibold truncate text-slate-900 dark:text-slate-100">{title}</p>
                        <span className="text-[11px] text-slate-500 shrink-0">
                          {room.last_message ? new Date(room.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {room.last_message?.sender_id === user?.id && <CheckCheck size={14} className="text-blue-500 shrink-0" />}
                        <p className="text-[13px] truncate text-slate-500 dark:text-slate-400">
                          {room.last_message?.content || 'Tap to start chatting'}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}

              {otherUsers.length > 0 && (
                <div className="mt-4">
                  <div className="px-4 py-2 bg-[#f0f2f5] dark:bg-slate-800/50 text-[11px] font-bold text-[#00a884] uppercase tracking-widest border-y border-slate-200 dark:border-slate-800">
                    New Connections
                  </div>
                  {otherUsers.map(u => (
                    <button key={u.id} onClick={() => createRoomMutation.mutate({ type: 'direct', participantIds: [u.id] })} className="w-full flex items-center gap-4 p-3 hover:bg-[#f5f6f6] dark:hover:bg-slate-800/30 transition-all group border-b border-slate-50 dark:border-slate-800/50">
                      <div className="relative shrink-0">
                        <UserAvatar member={u} className="w-12 h-12" />
                        {u.is_online && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#00a884] border-2 border-white dark:border-slate-900 rounded-full" />}
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <p className="text-[15px] font-semibold truncate text-slate-900 dark:text-slate-100">{u.name}</p>
                        <p className="text-[11px] text-slate-500 uppercase font-bold tracking-widest">{u.role}</p>
                      </div>
                      <div className="p-1.5 bg-[#00a884]/10 text-[#00a884] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Plus size={16} /></div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area - WhatsApp Theme */}
      <div className={`flex-1 flex flex-col relative ${!activeRoomId && !isCreatingGroup ? 'hidden md:flex bg-[#f0f2f5] dark:bg-slate-950 items-center justify-center' : 'flex bg-[#e5ddd5] dark:bg-slate-900'}`}>
        
        {activeRoomId ? (
          <>
            {/* Header */}
            <div className="h-[60px] px-4 bg-[#f0f2f5] dark:bg-slate-800 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 shadow-sm z-10">
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveRoomId(null)} className="md:hidden p-2 text-slate-600"><ChevronLeft size={24} /></button>
                <div className="relative cursor-pointer" onClick={() => {
                   const otherMember = activeRoom?.members.find(m => m.id !== user?.id);
                   if (otherMember) setViewingProfile(otherMember);
                }}>
                  <UserAvatar member={activeRoom?.type === 'group' ? { name: activeRoom.name } : activeRoom?.members.find(m => m.id !== user?.id)} className="w-10 h-10" />
                  {activeRoom?.type === 'direct' && activeRoom?.members.find(m => m.id !== user?.id)?.is_online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#00a884] border-2 border-white dark:border-slate-800 rounded-full" />
                  )}
                </div>
                <div className="cursor-pointer overflow-hidden" onClick={() => {
                   const otherMember = activeRoom?.members.find(m => m.id !== user?.id);
                   if (otherMember) setViewingProfile(otherMember);
                }}>
                  <h3 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {activeRoom?.type === 'group' ? activeRoom.name : activeRoom?.members.find(m => m.id !== user?.id)?.name}
                  </h3>
                  {activeRoom?.type === 'direct' && activeRoom?.members.find(m => m.id !== user?.id)?.is_online ? (
                    <p className="text-[11px] text-[#00a884] font-medium leading-none">online</p>
                  ) : (
                    <p className="text-[11px] text-slate-500 font-medium leading-none">click here for info</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={startMeeting} className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition"><Video size={20} /></button>
                <button className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition"><Phone size={20} /></button>
                <button className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition"><Search size={20} /></button>
              </div>
            </div>

            {/* Messages - Doodle Background Style */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-2 relative custom-scrollbar bg-opacity-90" style={{ 
              backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
              backgroundSize: '400px',
              backgroundColor: '#e5ddd5'
            }}>
              {messages.map((msg) => {
                const isMe = msg.sender_id === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-1 duration-300`}>
                    <div className={`relative max-w-[85%] md:max-w-[65%] rounded-lg p-2 px-3 shadow-md ${isMe ? 'bg-[#dcf8c6] dark:bg-[#056162] text-slate-900 dark:text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-tl-none'}`}>
                      {/* Triangle tail */}
                      <div className={`absolute top-0 w-2 h-2 ${isMe ? '-right-1.5 bg-[#dcf8c6] dark:bg-[#056162]' : '-left-1.5 bg-white dark:bg-slate-800'}`} style={{ clipPath: isMe ? 'polygon(0 0, 0% 100%, 100% 0)' : 'polygon(0 0, 100% 100%, 100% 0)' }}></div>
                      
                      {!isMe && activeRoom?.type === 'group' && (
                        <span className="block text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mb-0.5">{msg.sender_name}</span>
                      )}
                      
                      {msg.message_type === 'text' && <p className="text-[14px] leading-relaxed pr-8">{msg.content}</p>}
                      {msg.message_type === 'document' && (
                        <div className="flex flex-col gap-2 min-w-[200px]">
                          {msg.file_url && (msg.file_name?.match(/\.(jpeg|jpg|png|gif|webp)$/i)) && (
                            <img src={`${API_URL}${msg.file_url}`} alt={msg.file_name} className="rounded-md max-h-[300px] object-cover border border-black/5" />
                          )}
                          <div className={`flex items-center gap-3 p-2 rounded-lg ${isMe ? 'bg-[#c5e4ac] dark:bg-[#044d4e]' : 'bg-slate-100 dark:bg-slate-700'}`}>
                            <File size={28} className="text-slate-500" />
                            <div className="flex-1 min-w-0">
                               <p className="text-xs font-bold truncate">{msg.file_name || 'Document'}</p>
                               <p className="text-[10px] opacity-60">File • Download</p>
                            </div>
                            <a href={`${API_URL}${msg.file_url}`} target="_blank" rel="noreferrer" className="p-1.5 bg-white/20 rounded-full hover:bg-white/40 transition"><Plus size={16} className="rotate-45" /></a>
                          </div>
                        </div>
                      )}
                      {msg.message_type === 'meeting' && (
                        <div className="flex flex-col gap-3 p-3 bg-black/5 rounded-lg border border-dashed border-black/10 items-center text-center">
                           <div className="w-12 h-12 bg-[#00a884] text-white rounded-full flex items-center justify-center"><Video size={24} /></div>
                           <p className="text-xs font-bold uppercase tracking-widest">{isMe ? 'You started a call' : 'Incoming Video Call'}</p>
                        </div>
                      )}
                      
                      <div className="absolute right-1.5 bottom-1 flex items-center gap-1 text-[10px] opacity-60 font-medium">
                        <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {isMe && <CheckCheck size={14} className={msg.is_read ? 'text-blue-500' : ''} />}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* WhatsApp Styled Input Bar */}
            <div className="p-2 md:p-3 bg-[#f0f2f5] dark:bg-slate-800 flex items-center gap-2">
              <div className="flex items-center gap-1">
                <button type="button" className="p-2 text-slate-500 hover:text-[#00a884] transition"><Users size={24} className="opacity-70" /></button>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-500 hover:text-[#00a884] transition"><Paperclip size={24} className="opacity-70" /></button>
              </div>
              
              <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              
              <form onSubmit={handleSendMessage} className="flex-1 flex items-center gap-2">
                <div className="flex-1 relative flex items-center bg-white dark:bg-slate-900 rounded-3xl border border-transparent focus-within:border-white shadow-sm transition-all overflow-hidden">
                   <input 
                    type="text" 
                    placeholder="Type a message" 
                    className="w-full px-5 py-2.5 text-[15px] bg-transparent outline-none" 
                    value={newMessage} 
                    onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }} 
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={sendMessageMutation.isPending || (!newMessage.trim() && !file)} 
                  className={`w-12 h-12 flex items-center justify-center rounded-full shadow-lg transition-all active:scale-90 ${newMessage.trim() || file ? 'bg-[#00a884] text-white' : 'bg-[#00a884] text-white'}`}
                >
                  {newMessage.trim() || file ? <Send size={22} className="ml-1" /> : <Send size={22} className="ml-1" />}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-6 text-center max-w-md animate-in zoom-in duration-500">
            <div className="w-72 h-72 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center shadow-xl p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-[#00a884]/5 animate-ping duration-[3000ms]"></div>
                <img src={logo} alt="Mehar" className="w-full h-full object-contain relative z-10 opacity-80" />
            </div>
            <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-700 dark:text-white">Mehar Finance Web</h2>
                <p className="text-[15px] text-slate-500 dark:text-slate-400">Send and receive encrypted internal messages safely. Use the call feature for quick team syncs.</p>
            </div>
            <div className="flex items-center gap-2 text-[13px] text-slate-400 font-medium pt-8 border-t border-slate-300 w-full justify-center">
                <Lock size={14} /> End-to-end encrypted
            </div>
          </div>
        )}

        {/* Call Overlays - Same logic but rounded UI */}
        {isCalling && (
          <div className="fixed inset-0 z-[1000] bg-[#0b141a] flex flex-col items-center justify-center text-white animate-in fade-in duration-500">
            <div className="text-center">
                <UserAvatar member={activeRoom?.members.find(m => m.id !== user?.id)} className="w-32 h-32 mx-auto border-4 border-[#00a884]/20 shadow-2xl" />
                <h2 className="text-2xl font-bold mt-6">{activeRoom?.members.find(m => m.id !== user?.id)?.name}</h2>
                <p className="text-[#00a884] font-bold uppercase tracking-[0.3em] text-xs mt-2 animate-pulse">Calling...</p>
            </div>
            <div className="mt-24 flex gap-12">
                <button onClick={endCall} className="w-16 h-16 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-2xl transition-transform active:scale-90"><PhoneOff size={28} /></button>
            </div>
          </div>
        )}

        {incomingCall && (
          <div className="fixed inset-0 z-[1000] bg-[#0b141a] flex flex-col items-center justify-center text-white animate-in slide-in-from-top duration-500">
            <div className="text-center">
                <UserAvatar member={{ name: incomingCall.senderName }} className="w-32 h-32 mx-auto border-4 border-[#00a884]/20 shadow-2xl" />
                <h2 className="text-2xl font-bold mt-6">{incomingCall.senderName}</h2>
                <p className="text-[#00a884] font-bold uppercase tracking-[0.3em] text-xs mt-2 animate-pulse">Incoming Call</p>
            </div>
            <div className="mt-24 flex gap-16">
                <button onClick={declineCall} className="w-16 h-16 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-2xl transition-transform active:scale-90"><PhoneOff size={28} /></button>
                <button onClick={answerCall} className="w-16 h-16 bg-[#00a884] hover:bg-[#008f6f] text-white rounded-full flex items-center justify-center shadow-2xl animate-bounce transition-transform active:scale-90"><Video size={28} /></button>
            </div>
          </div>
        )}

        {activeCall && (
          <div className="fixed inset-0 z-[2000] bg-black flex flex-col">
            <div className="flex-1 relative flex items-center justify-center">
               {remoteStream ? <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-contain" /> : <div className="text-white animate-pulse font-bold tracking-widest">CONNECTING...</div>}
               <div className="absolute top-6 right-6 w-32 h-44 md:w-48 md:h-64 bg-slate-800 rounded-2xl border-2 border-white/20 overflow-hidden shadow-2xl">
                  <video ref={localVideoRef} autoPlay muted playsInline className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : 'block'}`} />
                  {isVideoOff && <div className="w-full h-full flex items-center justify-center bg-slate-900"><VideoOff className="text-slate-600" size={32} /></div>}
               </div>
            </div>
            <div className="h-24 bg-[#0b141a]/95 flex items-center justify-center gap-10">
               <button onClick={toggleMute} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-red-500' : 'bg-white/10 text-white hover:bg-white/20'}`}>{isMuted ? <MicOff /> : <Mic />}</button>
               <button onClick={endCall} className="w-16 h-16 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-xl transition-transform active:scale-90"><PhoneOff size={28} /></button>
               <button onClick={toggleVideo} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isVideoOff ? 'bg-red-500' : 'bg-white/10 text-white hover:bg-white/20'}`}>{isVideoOff ? <VideoOff /> : <Video />}</button>
            </div>
          </div>
        )}
      </div>

      {/* Member Profile Modal - Glassmorphic Rounded */}
      <Dialog open={!!viewingProfile} onOpenChange={() => setViewingProfile(null)}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl">
          <div className="h-32 bg-[#00a884] relative">
             <button onClick={() => setViewingProfile(null)} className="absolute top-4 right-4 p-2 bg-black/10 text-white rounded-full hover:bg-black/20 transition"><X size={18} /></button>
          </div>
          <div className="px-8 pb-10 -mt-16 relative bg-white dark:bg-slate-900">
             <div className="w-32 h-32 rounded-full bg-white dark:bg-slate-900 p-1.5 shadow-2xl mx-auto">
                <UserAvatar member={viewingProfile} className="w-full h-full text-4xl" />
             </div>
             <div className="text-center mt-6">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{viewingProfile?.name}</h2>
                <p className="text-sm font-bold text-[#00a884] uppercase tracking-[0.2em] mt-1">{viewingProfile?.role}</p>
             </div>

             <div className="mt-8 space-y-3">
                <div className="flex items-center gap-4 p-4 bg-[#f8f9fa] dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 group transition-all hover:shadow-md">
                   <div className="p-2.5 bg-[#00a884]/10 text-[#00a884] rounded-xl"><Phone size={20} /></div>
                   <div className="flex-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Mobile</p>
                      <p className="text-[15px] font-semibold text-slate-900 dark:text-white">{viewingProfile?.phone || 'Not provided'}</p>
                   </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-[#f8f9fa] dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 group transition-all hover:shadow-md">
                   <div className="p-2.5 bg-indigo-500/10 text-indigo-600 rounded-xl"><Mail size={20} /></div>
                   <div className="flex-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Email</p>
                      <p className="text-[15px] font-semibold text-slate-900 dark:text-white truncate">{viewingProfile?.email}</p>
                   </div>
                </div>
             </div>

             <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-4">
                <button 
                  onClick={() => { setViewingProfile(null); startMeeting(); }}
                  className="flex-1 py-3.5 bg-[#00a884] hover:bg-[#008f6f] text-white font-bold rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Video size={18} /> Call Now
                </button>
             </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
