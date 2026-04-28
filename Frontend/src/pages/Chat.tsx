import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  MessageSquare, Send, Users, Shield, Video, 
  Paperclip, Plus, Search, User, File, X, 
  ChevronRight, Phone, Laptop, Lock, Check, CheckCheck
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
  const [isMeetingActive, setIsMeetingActive] = useState(false);
  const [currentMeetingUrl, setCurrentMeetingUrl] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jitsiContainerRef = useRef<HTMLDivElement>(null);

  const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');

  // 1. Fetch Chat Rooms
  const { data: rooms = [], isLoading: roomsLoading } = useQuery<Room[]>({
    queryKey: ['chatRooms'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/chat/rooms`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      if (!res.ok) throw new Error('Failed to fetch rooms');
      return res.json();
    },
    refetchInterval: 5000 // Poll rooms every 5 seconds
  });

  // 2. Fetch Messages for active room
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
    refetchInterval: 3000 // Poll messages every 3 seconds for active room
  });

  // 3. Fetch all users to start chat
  const { data: users = [] } = useQuery<Member[]>({
    queryKey: ['chatUsers'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/chat/users`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    }
  });

  // 4. Send Message Mutation
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
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
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
    },
    onError: (err) => {
      toast.error(err.message || 'Error sending message');
    }
  });

  // 5. Create Room Mutation
  const createRoomMutation = useMutation({
    mutationFn: async ({ name, type, participantIds }: { name?: string; type: 'direct' | 'group'; participantIds: number[] }) => {
      const res = await fetch(`${API_URL}/api/chat/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ name, type, participantIds })
      });
      if (!res.ok) throw new Error('Failed to create chat');
      return res.json();
    },
    onSuccess: (data) => {
      toast.success('Chat created successfully');
      setIsCreatingGroup(false);
      setGroupName('');
      setSelectedUsers([]);
      setActiveRoomId(data.id);
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
    }
  });

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load Jitsi Meet Script dynamically
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://meet.ffmuc.net/external_api.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && !file) return;
    sendMessageMutation.mutate({
      content: newMessage,
      message_type: file ? 'document' : 'text',
      file: file || undefined
    });
  };

  const startMeeting = () => {
    if (!activeRoomId) return;
    const roomName = `MeharPulse_Meeting_${activeRoomId}_${Date.now()}`;
    const meetingUrl = `https://meet.ffmuc.net/${roomName}`;

    // Send meeting message
    sendMessageMutation.mutate({
      content: 'Started a video meeting',
      message_type: 'meeting',
      meeting_link: meetingUrl
    });

    joinMeeting(meetingUrl);
  };

  const joinMeeting = (meetingUrl: string) => {
    setCurrentMeetingUrl(meetingUrl);
    setIsMeetingActive(true);

    const roomName = meetingUrl.split('/').pop() || '';

    setTimeout(() => {
      if (jitsiContainerRef.current) {
        // @ts-ignore
        new window.JitsiMeetExternalAPI('meet.ffmuc.net', {
          roomName: roomName,
          width: '100%',
          height: '100%',
          parentNode: jitsiContainerRef.current,
          interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS: [
              'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
              'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
              'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
              'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
              'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
              'security'
            ],
          }
        });
      }
    }, 500);
  };

  const endMeeting = () => {
    setIsMeetingActive(false);
    setCurrentMeetingUrl(null);
    if (jitsiContainerRef.current) {
      jitsiContainerRef.current.innerHTML = '';
    }
  };

  const handleUserSelect = (userId: number) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const createGroupChat = () => {
    if (!groupName.trim() || selectedUsers.length === 0) {
      toast.error('Please enter a group name and select members');
      return;
    }
    createRoomMutation.mutate({
      name: groupName,
      type: 'group',
      participantIds: selectedUsers
    });
  };

  const startDirectChat = (otherUserId: number) => {
    createRoomMutation.mutate({
      type: 'direct',
      participantIds: [otherUserId]
    });
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeRoom = rooms.find(r => r.id === activeRoomId);

  return (
    <div className="h-[calc(100vh-6.5rem)] flex bg-slate-50 dark:bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-blue-100 dark:border-slate-800">
      
      {/* Sidebar: Rooms and User list */}
      <div className={`w-full md:w-80 border-r border-blue-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col ${activeRoomId && !isCreatingGroup ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Header with Search */}
        <div className="p-4 border-b border-blue-50 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-black text-blue-950 dark:text-white flex items-center gap-2">
              <MessageSquare className="text-blue-600 w-6 h-6" />
              Workspace
            </h1>
            <div className="flex gap-2">
              <button 
                onClick={() => setIsCreatingGroup(!isCreatingGroup)} 
                className="p-2 bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 dark:hover:bg-slate-700 transition"
                title="Create Group Session"
              >
                <Users size={18} />
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search people..." 
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 rounded-xl border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Content Area for Sidebar */}
        <div className="flex-1 overflow-y-auto">
          {isCreatingGroup ? (
            /* Create Group Interface */
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground">Create Group Session</h3>
                <button onClick={() => setIsCreatingGroup(false)} className="text-muted-foreground hover:text-foreground">
                  <X size={18} />
                </button>
              </div>
              <input 
                type="text" 
                placeholder="Group Session Name" 
                className="w-full px-4 py-2 text-sm border border-border bg-slate-50 dark:bg-slate-800 rounded-xl outline-none focus:border-blue-500"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
              <div className="space-y-1 max-h-60 overflow-y-auto">
                <p className="text-xs font-bold text-muted-foreground mb-2">Select Members:</p>
                {users.map(u => (
                  <label key={u.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={selectedUsers.includes(u.id)}
                      onChange={() => handleUserSelect(u.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                    />
                    <div>
                      <p className="text-xs font-bold text-foreground">{u.name}</p>
                      <p className="text-[10px] text-muted-foreground">{u.role}</p>
                    </div>
                  </label>
                ))}
              </div>
              <button 
                onClick={createGroupChat}
                className="w-full py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition"
              >
                Create Session
              </button>
            </div>
          ) : searchQuery.trim() ? (
            /* User search results */
            <div className="p-2 space-y-1">
              <p className="text-xs font-bold text-muted-foreground px-3 py-2">People</p>
              {filteredUsers.map(u => (
                <button 
                  key={u.id} 
                  onClick={() => startDirectChat(u.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                    {u.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-foreground">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.role}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            /* Active Rooms */
            <div className="p-2 space-y-1">
              {roomsLoading ? (
                <div className="text-center py-8 text-muted-foreground text-sm">Loading chats…</div>
              ) : rooms.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">No active chats. Search users above to start.</div>
              ) : rooms.map(room => {
                const isGroup = room.type === 'group';
                const otherMember = room.members.find(m => m.id !== user?.id);
                const title = isGroup ? room.name : (otherMember?.name || 'Direct Chat');

                return (
                  <button 
                    key={room.id} 
                    onClick={() => setActiveRoomId(room.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 ${activeRoomId === room.id ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${activeRoomId === room.id ? 'bg-white/20 text-white' : 'bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400'}`}>
                      {isGroup ? <Users size={18} /> : title.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{title}</p>
                      <p className={`text-xs truncate ${activeRoomId === room.id ? 'text-white/80' : 'text-muted-foreground'}`}>
                        {room.last_message?.content || (isGroup ? 'Group Chat' : 'Start messaging')}
                      </p>
                    </div>
                    <ChevronRight size={14} className={`opacity-50 ${activeRoomId === room.id ? 'text-white' : ''}`} />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat / Meeting Area */}
      <div className={`flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 relative ${!activeRoomId && !isCreatingGroup ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
        
        {isMeetingActive && (
          /* Jitsi Meeting Overlay */
          <div className="absolute inset-0 z-50 bg-black flex flex-col">
            <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white">
              <span className="text-sm font-bold flex items-center gap-2">
                <Video className="text-green-400 animate-pulse" /> Meeting In Progress
              </span>
              <button 
                onClick={endMeeting} 
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition"
              >
                Leave Meeting
              </button>
            </div>
            <div ref={jitsiContainerRef} className="flex-1 w-full bg-slate-900" id="jitsi-container"></div>
          </div>
        )}

        {activeRoomId ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-blue-50 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveRoomId(null)} className="md:hidden p-2 text-muted-foreground hover:text-foreground">
                  <X size={20} />
                </button>
                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  {activeRoom?.type === 'group' ? <Users size={18} /> : (activeRoom?.members.find(m => m.id !== user?.id)?.name || 'Direct Chat').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    {activeRoom?.type === 'group' ? activeRoom.name : activeRoom?.members.find(m => m.id !== user?.id)?.name}
                  </h3>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-widest">
                    <Lock size={10} /> Encrypted Workspace
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex gap-2">
                <button 
                  onClick={startMeeting}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-2xl shadow-md hover:bg-blue-700 transition"
                >
                  <Video size={16} /> Meeting
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messagesLoading ? (
                <div className="text-center py-4 text-muted-foreground text-sm">Loading messages…</div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm flex flex-col items-center gap-2">
                  <Shield size={32} className="text-blue-200 dark:text-blue-800" />
                  Messages are end-to-end encrypted in the database.
                </div>
              ) : messages.map((msg) => {
                const isMe = msg.sender_id === user?.id;
                
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl p-3 px-4 shadow-sm ${
                      isMe 
                        ? 'bg-blue-600 text-white rounded-br-none' 
                        : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-bl-none border border-blue-50 dark:border-slate-800'
                    }`}>
                      {!isMe && (
                        <span className="block text-[10px] font-bold text-blue-500 dark:text-blue-400 mb-1">
                          {msg.sender_name}
                        </span>
                      )}

                      {msg.message_type === 'text' && (
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      )}

                      {msg.message_type === 'document' && (
                        <div className="flex flex-col gap-2">
                          {msg.file_url && (msg.file_name?.match(/\.(jpeg|jpg|png|gif|webp)$/i)) && (
                            <div className="rounded-xl overflow-hidden max-w-[220px] max-h-[220px] border border-black/10 dark:border-white/10 shadow-sm bg-black/5 mt-1">
                              <img 
                                src={`${API_URL}${msg.file_url}`} 
                                alt={msg.file_name} 
                                className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition"
                                onClick={() => window.open(`${API_URL}${msg.file_url}`, '_blank')}
                              />
                            </div>
                          )}
                          <div className="flex items-center gap-3 bg-black/10 dark:bg-white/10 p-2 rounded-xl">
                            <File size={24} className={isMe ? 'text-white' : 'text-blue-500'} />
                            <div className="text-left min-w-0">
                              <p className="text-xs font-bold truncate max-w-[150px]">{msg.file_name || 'Document'}</p>
                              <p className="text-[9px] opacity-70">
                                {msg.file_size ? `${Math.round(msg.file_size / 1024)} KB` : ''}
                              </p>
                            </div>
                            <a 
                              href={`${API_URL}${msg.file_url}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className={`p-1.5 rounded-lg text-xs font-bold underline ${isMe ? 'hover:bg-white/20' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                            >
                              Download
                            </a>
                          </div>
                        </div>
                      )}

                      {msg.message_type === 'meeting' && (
                        <div className="flex flex-col gap-2 bg-black/10 dark:bg-white/10 p-3 rounded-xl border border-dashed border-white/40">
                          <div className="flex items-center gap-2 text-xs font-bold">
                            <Video size={16} />
                            Conference Group Session
                          </div>
                          <button 
                            onClick={() => msg.meeting_link && joinMeeting(msg.meeting_link)}
                            className={`w-full py-2 text-xs font-bold rounded-lg transition ${
                              isMe 
                                ? 'bg-white text-blue-600 hover:bg-slate-50' 
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            Join Session
                          </button>
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-1 mt-1 text-[9px] opacity-80">
                        <span>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isMe && (
                          <span title={msg.is_read ? "Seen" : "Delivered"}>
                            {msg.is_read ? (
                              <CheckCheck size={12} className="text-blue-200 dark:text-blue-100 font-bold" />
                            ) : (
                              <CheckCheck size={12} className="text-slate-300/80" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Attachment preview */}
            {file && (
              <div className="p-2 px-4 bg-blue-50 dark:bg-slate-900 border-t border-blue-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium">
                  <File size={16} /> {file.name}
                </span>
                <button onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="p-1 rounded-full text-red-500 hover:bg-red-50">
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-blue-50 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3">
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-2xl transition"
                title="Share Document"
              >
                <Paperclip size={20} />
              </button>

              <input 
                type="text" 
                placeholder="Type your encrypted message…" 
                className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 rounded-2xl outline-none transition"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={sendMessageMutation.isPending}
              />

              <button 
                type="submit" 
                disabled={sendMessageMutation.isPending || (!newMessage.trim() && !file)}
                className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-md disabled:opacity-50 transition"
              >
                <Send size={20} />
              </button>
            </form>
          </>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center gap-4 text-center max-w-sm">
            <div className="p-4 bg-blue-50 dark:bg-slate-900 rounded-full text-blue-600">
              <Shield size={40} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Secure Workspace Chat</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Exchange encrypted messages, share financial documents, and launch secure group video sessions with any colleague.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
