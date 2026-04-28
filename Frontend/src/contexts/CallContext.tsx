import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import Peer from 'peerjs';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface CallContextType {
  peer: Peer | null;
  activeCall: any | null;
  incomingCall: any | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isCalling: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  isAudioOnly: boolean;
  isScreenSharing: boolean;
  startCall: (targetPeerId: string, audioOnly?: boolean) => Promise<void>;
  answerCall: () => Promise<void>;
  declineCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => Promise<void>;
  toggleFullscreen: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [peer, setPeer] = useState<Peer | null>(null);
  const [activeCall, setActiveCall] = useState<any>(null);
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isAudioOnly, setIsAudioOnly] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [handledCallIds, setHandledCallIds] = useState<number[]>([]);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

  const ringtoneRef = useRef<HTMLAudioElement | null>(null);

  const startRingtone = () => {
    if (!ringtoneRef.current) {
      ringtoneRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3');
      ringtoneRef.current.loop = true;
    }
    ringtoneRef.current.play().catch(e => console.log('Ringtone blocked', e));
  };

  const stopRingtone = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
  };

  useEffect(() => {
    if (!user?.id) return;

    const newPeer = new Peer(`mehar-finance-user-${user.id}`, {
      debug: 1,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      }
    });

    newPeer.on('open', () => console.log('Global Peer Connected:', newPeer.id));
    newPeer.on('call', (call) => {
      setIncomingCall({
        senderName: 'Incoming Call...',
        peerId: call.peer,
        id: Date.now(),
        callObj: call
      });
      startRingtone();
    });

    setPeer(newPeer);
    return () => { newPeer.destroy(); };
  }, [user?.id]);

  const VIDEO_CONSTRAINTS = (audioOnly: boolean) => ({
    video: audioOnly ? false : { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 24 } },
    audio: true
  });

  const startCall = async (targetPeerId: string, audioOnly = false) => {
    if (!peer) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia(VIDEO_CONSTRAINTS(audioOnly));
      setLocalStream(stream);
      setIsCalling(true);
      setIsAudioOnly(audioOnly);
      setIsVideoOff(audioOnly);
      
      const call = peer.call(targetPeerId, stream);
      setupCallHandlers(call);
      setActiveCall(call);
    } catch (err) {
      toast.error('Media access denied');
      setIsCalling(false);
    }
  };

  const setupCallHandlers = (call: any) => {
    call.on('stream', (st: MediaStream) => {
      setRemoteStream(st);
      setIsCalling(false);
    });
    call.on('close', endCall);
    call.on('error', () => { toast.error('Call failed'); endCall(); });
  };

  const answerCall = async () => {
    if (!incomingCall || !peer) return;
    stopRingtone();
    try {
      const stream = await navigator.mediaDevices.getUserMedia(VIDEO_CONSTRAINTS(false));
      setLocalStream(stream);
      if (incomingCall.callObj) {
        incomingCall.callObj.answer(stream);
        setupCallHandlers(incomingCall.callObj);
        setActiveCall(incomingCall.callObj);
        setIncomingCall(null);
      }
    } catch (err) { declineCall(); }
  };

  const declineCall = () => {
    if (incomingCall?.callObj) incomingCall.callObj.close();
    setIncomingCall(null);
    stopRingtone();
  };

  const endCall = () => {
    console.log('Ending call and stopping all media tracks...');
    
    if (activeCall) {
      try {
        activeCall.close();
      } catch (e) {
        console.error('Error closing call:', e);
      }
    }

    // Stop local camera/mic
    if (localStream) {
      localStream.getTracks().forEach(track => {
        track.stop();
        console.log(`Stopped track: ${track.kind}`);
      });
    }

    // Stop screen share if active
    if (screenStream) {
      screenStream.getTracks().forEach(track => {
        track.stop();
        console.log(`Stopped screen track: ${track.kind}`);
      });
    }

    setLocalStream(null);
    setRemoteStream(null);
    setScreenStream(null);
    setActiveCall(null);
    setIsCalling(false);
    setIncomingCall(null);
    setIsScreenSharing(false);
    stopRingtone();
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(t => t.enabled = !t.enabled);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream && !isAudioOnly) {
      localStream.getVideoTracks().forEach(t => t.enabled = !t.enabled);
      setIsVideoOff(!isVideoOff);
    }
  };

  const toggleScreenShare = async () => {
    if (!activeCall) return;
    try {
      if (!isScreenSharing) {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        setScreenStream(stream);
        const videoTrack = stream.getVideoTracks()[0];
        const sender = activeCall.peerConnection.getSenders().find((s: any) => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(videoTrack);
        setIsScreenSharing(true);
        videoTrack.onended = () => stopScreenShare();
      } else {
        stopScreenShare();
      }
    } catch (err) { console.error('Screen share failed', err); }
  };

  const stopScreenShare = () => {
    if (screenStream) { screenStream.getTracks().forEach(t => t.stop()); setScreenStream(null); }
    if (localStream && activeCall) {
      const videoTrack = localStream.getVideoTracks()[0];
      const sender = activeCall.peerConnection.getSenders().find((s: any) => s.track?.kind === 'video');
      if (sender) sender.replaceTrack(videoTrack);
    }
    setIsScreenSharing(false);
  };

  const toggleFullscreen = () => {
    const el = document.getElementById('global-call-overlay');
    if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen().catch(e => console.error(e));
    else document.exitFullscreen();
  };

  return (
    <CallContext.Provider value={{
      peer, activeCall, incomingCall, localStream, remoteStream,
      isCalling, isMuted, isVideoOff, isAudioOnly, isScreenSharing,
      startCall, answerCall, declineCall, endCall, toggleMute, toggleVideo,
      toggleScreenShare, toggleFullscreen
    }}>
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (context === undefined) throw new Error('useCall must be used within a CallProvider');
  return context;
};
