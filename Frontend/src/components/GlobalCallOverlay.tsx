import React, { useRef, useEffect } from 'react';
import { useCall } from '@/contexts/CallContext';
import { 
  Video, VideoOff, Mic, MicOff, PhoneOff, 
  Maximize, Laptop, User, Check
} from 'lucide-react';

const GlobalCallOverlay: React.FC = () => {
  const { 
    activeCall, incomingCall, isCalling, localStream, remoteStream,
    isMuted, isVideoOff, isAudioOnly, isScreenSharing,
    answerCall, declineCall, endCall, toggleMute, toggleVideo, 
    toggleScreenShare, toggleFullscreen 
  } = useCall();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) remoteVideoRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  if (!activeCall && !incomingCall && !isCalling) return null;

  return (
    <div id="global-call-overlay" className="fixed inset-0 z-[9999] bg-[#0b141a]/95 backdrop-blur-2xl flex flex-col p-4 md:p-8 animate-in fade-in duration-500">
      <div className="flex-1 relative flex items-center justify-center max-w-6xl mx-auto w-full bg-black/40 rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 group">
        
        {/* Remote Video / Calling State */}
        {activeCall && remoteStream ? (
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-contain" />
        ) : (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto bg-[#00a884]/20 rounded-full flex items-center justify-center animate-pulse border-2 border-[#00a884]/30">
                <Video size={32} className="text-[#00a884]" />
            </div>
            <h2 className="text-lg font-bold mt-4 text-white uppercase tracking-widest">
              {isCalling ? 'Calling...' : incomingCall ? 'Incoming Call' : 'Connecting...'}
            </h2>
            <p className="text-white/40 text-[10px] mt-1 font-bold uppercase tracking-[0.2em]">Mehar Secure Line</p>
          </div>
        )}

        {/* Local PiP - Compact */}
        {!isAudioOnly && (
            <div className="absolute top-6 right-6 w-24 h-36 md:w-32 md:h-48 bg-slate-900/80 rounded-2xl border-2 border-white/10 overflow-hidden shadow-2xl z-20 backdrop-blur-md transition-all hover:scale-105">
                <video ref={localVideoRef} autoPlay muted playsInline className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : 'block'}`} />
                {isVideoOff && <div className="w-full h-full flex items-center justify-center"><VideoOff className="text-slate-600" size={24} /></div>}
            </div>
        )}

        {/* Call HUD Controls - Compact & Zoomed Out */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 p-3 bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/10 opacity-0 group-hover:opacity-100 transition-all shadow-2xl">
          <button onClick={toggleMute} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>
            {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          
          {!isAudioOnly && (
            <button onClick={toggleVideo} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isVideoOff ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>
              {isVideoOff ? <VideoOff size={18} /> : <Video size={18} />}
            </button>
          )}

          <button onClick={toggleScreenShare} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isScreenSharing ? 'bg-[#00a884] text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>
            <Laptop size={18} />
          </button>

          <button onClick={toggleFullscreen} className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 text-white hover:bg-white/20 transition-all">
            <Maximize size={18} />
          </button>

          <div className="w-px h-6 bg-white/10 mx-1" />

          {incomingCall ? (
            <>
              <button onClick={declineCall} className="w-10 h-10 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90"><PhoneOff size={18} /></button>
              <button onClick={answerCall} className="w-10 h-10 bg-[#00a884] hover:bg-[#008f6f] text-white rounded-full flex items-center justify-center shadow-lg animate-bounce transition-all active:scale-90"><Video size={18} /></button>
            </>
          ) : (
            <button onClick={endCall} className="w-12 h-12 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-xl transition-all active:scale-90">
              <PhoneOff size={22} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalCallOverlay;
