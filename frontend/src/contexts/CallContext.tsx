"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import type { CallInfo, CallStatus, CallType } from '@/types/call';
import { useSocketStore } from '@/stores/useSocketStore';
import useWebRTC from '@/hooks/useWebRTC';

interface CallContextValue {
  incomingCall: CallInfo | null;
  status: CallStatus;
  startCall: (to: string, callType: CallType, metadata?: any) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: (reason?: string) => void;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  toggleMic: (enabled: boolean) => void;
  toggleCamera: (enabled: boolean) => void;
}

const CallContext = createContext<CallContextValue | undefined>(undefined);

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const socket = useSocketStore((s) => s.socket);
  const webrtc = useWebRTC();
  const webrtcRef = webrtc;
  const [incomingCall, setIncomingCall] = useState<CallInfo | null>(null);
  const [status, setStatus] = useState<CallStatus>('idle');
  const [localStreamState, setLocalStreamState] = useState<MediaStream | null>(null);
  const [remoteStreamState, setRemoteStreamState] = useState<MediaStream | null>(null);
  const callRef = useRef<CallInfo | null>(null);
  const remoteUserRef = useRef<string | null>(null);

  useEffect(() => {
    console.log('CallContext: socket changed', socket);
    if (!socket) return;

    socket.on('incoming-call', (data: CallInfo) => {
      setIncomingCall(data);
      setStatus('ringing');
    });

    socket.on('accept-call', async ({ callId, from }) => {
      // callee accepted: caller should create offer
      setStatus('calling');
      callRef.current = { callId, from, callType: 'voice', callerName: undefined } as CallInfo;
      // create local stream and peer
      const callType: CallType = (callRef.current as any).callType || 'voice';
      const local = await webrtc.createLocalStream(callType);
      setLocalStreamState(local);
      const pc = webrtc.createPeer(from, (s) => { setRemoteStreamState(s); }, (candidate) => {
        socket.emit('ice-candidate', { to: from, candidate, callId });
      });
      const offer = await webrtc.createOffer(from, pc);
      socket.emit('offer', { to: from, offer, callId });
    });

    socket.on('reject-call', ({ callId, from }) => {
      setStatus('rejected');
      setIncomingCall(null);
    });

    socket.on('offer', async ({ from, offer, callId }) => {
      // callee receives offer
      remoteUserRef.current = from;
      const callType: CallType = (incomingCall && incomingCall.callType) || 'voice';
      const local = await webrtc.createLocalStream(callType);
      setLocalStreamState(local);
      const pc = webrtc.createPeer(from, (s) => { setRemoteStreamState(s); }, (candidate) => {
        socket.emit('ice-candidate', { to: from, candidate, callId });
      });
      const answer = await webrtc.handleRemoteOffer(from, offer, pc);
      socket.emit('answer', { to: from, answer, callId });
      setStatus('connected');
    });

    socket.on('answer', async ({ from, answer, callId }) => {
      // caller receives answer
      const pc = (webrtcRef as any).peersRef?.current?.[from];
      if (pc) await webrtc.handleRemoteAnswer(from, answer, pc);
      setStatus('connected');
    });

    socket.on('ice-candidate', async ({ from, candidate }) => {
      await webrtc.addIceCandidate(from, candidate);
    });

    socket.on('end-call', ({ callId, status: callStatus }) => {
      webrtc.stop();
      setStatus('idle');
      setIncomingCall(null);
      callRef.current = null;
      setLocalStreamState(null);
      setRemoteStreamState(null);
    });

    return () => {
      socket.off('incoming-call');
      socket.off('accept-call');
      socket.off('reject-call');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      socket.off('end-call');
    };
  }, [socket, webrtc, incomingCall]);

  const startCall = async (to: string, callType: CallType, metadata?: any) => {
    console.log('startCall invoked', { to, callType, socket });
    // ensure socket is connected; if not, trigger connect and wait
    let sock = socket;
    if (!sock) {
      const connect = useSocketStore.getState().connectSocket;
      if (connect) connect();

      // wait for socket to become available (timeout 5s)
      sock = await new Promise<any>((resolve) => {
        const unsub = useSocketStore.subscribe((s) => s.socket, (next) => {
          if (next) {
            unsub();
            resolve(next);
          }
        });
        // fallback timeout
        setTimeout(() => {
          unsub();
          resolve(useSocketStore.getState().socket);
        }, 5000);
      });
    }

    if (!sock) {
      setStatus('idle');
      return;
    }

    setStatus('calling');
    console.log('emitting call-user', { to, callType, sockId: sock.id });
    sock.emit('call-user', { to, callType, metadata }, (res: any) => {
      console.log('call-user callback', res);
      if (!res?.ok) {
        setStatus('idle');
      } else {
        callRef.current = { callId: res.callId, from: sock.id, callType } as CallInfo;
      }
    });
  };

  const acceptCall = async () => {
    if (!socket || !incomingCall) return;
    socket.emit('accept-call', { callId: incomingCall.callId, to: incomingCall.from });
    // the offer/answer flow will set connected and streams
    setIncomingCall(null);
  };

  const rejectCall = () => {
    if (!socket || !incomingCall) return;
    socket.emit('reject-call', { callId: incomingCall.callId, to: incomingCall.from });
    setIncomingCall(null);
    setStatus('idle');
  };

  const endCall = (reason?: string) => {
    if (!socket) return;
    const otherUser = remoteUserRef.current || incomingCall?.from || undefined;
    socket.emit('end-call', { callId: callRef.current?.callId, to: otherUser, status: 'completed', duration: 0, otherUser });
    webrtc.stop();
    setStatus('idle');
    setIncomingCall(null);
    callRef.current = null;
    setLocalStreamState(null);
    setRemoteStreamState(null);
  };

  const toggleMic = (enabled: boolean) => {
    webrtc.toggleTrack('audio', enabled);
  };

  const toggleCamera = (enabled: boolean) => {
    webrtc.toggleTrack('video', enabled);
  };

  const value: CallContextValue = {
    incomingCall,
    status,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    localStream: localStreamState,
    remoteStream: remoteStreamState,
    toggleMic,
    toggleCamera,
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};

export const useCall = () => {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error('useCall must be used within CallProvider');
  return ctx;
};

export default CallContext;
