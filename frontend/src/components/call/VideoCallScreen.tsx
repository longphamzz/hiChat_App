"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useCall } from '@/contexts/CallContext';
import { Button } from '@/components/ui/button';

export default function VideoCallScreen() {
  const { localStream, remoteStream, toggleCamera, toggleMic, endCall } = useCall();
  const { status } = useCall();
  const localRef = useRef<HTMLVideoElement | null>(null);
  const remoteRef = useRef<HTMLVideoElement | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

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

  if (status !== 'connected') return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
      <div className="w-full h-full relative">
        <video ref={remoteRef} className="w-full h-full object-cover" autoPlay playsInline />
        <div className="absolute top-4 right-4 w-40 h-28 bg-black/40 rounded overflow-hidden">
          <video ref={localRef} className="w-full h-full object-cover" autoPlay playsInline muted />
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
          <Button onClick={() => { toggleMic(!micOn); setMicOn(!micOn); }}>{micOn ? 'Mute' : 'Unmute'}</Button>
          <Button onClick={() => { toggleCamera(!camOn); setCamOn(!camOn); }}>{camOn ? 'Camera Off' : 'Camera On'}</Button>
          <Button variant="destructive" onClick={() => endCall()}>End</Button>
          <Button onClick={() => {
            const el = document.fullscreenElement;
            const container = remoteRef.current?.parentElement;
            if (!el && container) container.requestFullscreen().catch(() => {});
            else document.exitFullscreen().catch(() => {});
          }}>Fullscreen</Button>
        </div>
      </div>
    </div>
  );
}
