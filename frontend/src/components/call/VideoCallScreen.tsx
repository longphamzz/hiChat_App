"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Maximize2, Minimize2 } from 'lucide-react';
import { useCall } from '@/contexts/CallContext';
import { useChatStore } from '@/stores/useChatStore';
import UserAvatar from '@/components/chat/UserAvatar';

const ACTIVE_STATUSES = ['calling', 'connecting', 'connected'];

function formatDuration(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function VideoCallScreen() {
  const { localStream, remoteStream, callType, status, remoteUserId, incomingCall, toggleCamera, toggleMic, endCall } = useCall();
  const { conversations } = useChatStore();

  const localRef = useRef<HTMLVideoElement | null>(null);
  const remoteRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const isVideo = callType === 'video';

  // resolve the peer's display name / avatar from loaded conversations
  const peer = useMemo(() => {
    if (remoteUserId) {
      for (const c of conversations) {
        const p = c.participants?.find((x) => x._id === remoteUserId);
        if (p) return { name: p.displayName, avatarUrl: p.avatarUrl ?? undefined };
      }
    }
    if (incomingCall?.callerName) return { name: incomingCall.callerName, avatarUrl: undefined };
    return { name: 'Đang gọi', avatarUrl: undefined };
  }, [remoteUserId, conversations, incomingCall]);

  useEffect(() => {
    if (localRef.current && localStream) {
      localRef.current.srcObject = localStream;
      localRef.current.muted = true;
      localRef.current.play().catch(() => {});
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteRef.current && remoteStream) {
      remoteRef.current.srcObject = remoteStream;
      remoteRef.current.play().catch(() => {});
    }
  }, [remoteStream]);

  // call duration timer (only while connected)
  useEffect(() => {
    if (status !== 'connected') {
      setSeconds(0);
      return;
    }
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [status]);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  if (!ACTIVE_STATUSES.includes(status)) return null;

  const statusText =
    status === 'calling' ? 'Đang gọi...' :
    status === 'connecting' ? 'Đang kết nối...' :
    formatDuration(seconds);

  const showRemoteVideo = isVideo && status === 'connected' && Boolean(remoteStream);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen().catch(() => {});
    else document.exitFullscreen().catch(() => {});
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95">
      <div
        ref={containerRef}
        className="relative h-full w-full overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900"
      >
        {/* Remote video element is always mounted so call audio plays even for voice calls */}
        <video
          ref={remoteRef}
          autoPlay
          playsInline
          className={`h-full w-full object-cover ${showRemoteVideo ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* Avatar / status overlay (voice calls, or before remote video arrives) */}
        {!showRemoteVideo && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 text-white">
            <div className="rounded-full ring-4 ring-white/15">
              <UserAvatar type="profile" name={peer.name} avatarUrl={peer.avatarUrl} className="size-32 text-5xl" />
            </div>
            <div className="text-2xl font-semibold">{peer.name}</div>
            <div className="flex items-center gap-2 text-sm text-white/70">
              {isVideo ? <Video className="size-4" /> : <Mic className="size-4" />}
              <span>{statusText}</span>
            </div>
          </div>
        )}

        {/* Top bar with name + duration once the remote video is showing */}
        {showRemoteVideo && (
          <div className="absolute left-0 right-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent p-5 text-white">
            <div className="font-semibold">{peer.name}</div>
            <div className="rounded-full bg-black/40 px-3 py-1 text-sm tabular-nums">{statusText}</div>
          </div>
        )}

        {/* Local preview (video calls only) */}
        {isVideo && (
          <div className="absolute right-4 top-4 h-40 w-28 overflow-hidden rounded-xl border border-white/20 bg-black/60 shadow-lg sm:h-44 sm:w-32">
            <video ref={localRef} autoPlay playsInline muted className="h-full w-full object-cover" />
            {!camOn && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white/70">
                <VideoOff className="size-6" />
              </div>
            )}
          </div>
        )}

        {/* Controls */}
        <div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 items-center gap-4">
          <button
            type="button"
            onClick={() => { toggleMic(!micOn); setMicOn(!micOn); }}
            aria-label={micOn ? 'Tắt mic' : 'Bật mic'}
            className={`flex size-14 items-center justify-center rounded-full text-white transition ${micOn ? 'bg-white/15 hover:bg-white/25' : 'bg-white/90 text-slate-900 hover:bg-white'}`}
          >
            {micOn ? <Mic className="size-6" /> : <MicOff className="size-6" />}
          </button>

          {isVideo && (
            <button
              type="button"
              onClick={() => { toggleCamera(!camOn); setCamOn(!camOn); }}
              aria-label={camOn ? 'Tắt camera' : 'Bật camera'}
              className={`flex size-14 items-center justify-center rounded-full text-white transition ${camOn ? 'bg-white/15 hover:bg-white/25' : 'bg-white/90 text-slate-900 hover:bg-white'}`}
            >
              {camOn ? <Video className="size-6" /> : <VideoOff className="size-6" />}
            </button>
          )}

          <button
            type="button"
            onClick={() => endCall()}
            aria-label="Kết thúc cuộc gọi"
            className="flex size-16 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition hover:bg-red-700"
          >
            <PhoneOff className="size-7" />
          </button>

          {isVideo && (
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label="Toàn màn hình"
              className="flex size-14 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
            >
              {isFullscreen ? <Minimize2 className="size-6" /> : <Maximize2 className="size-6" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
