"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import type { CallInfo, CallStatus, CallType } from '@/types/call';
import { useSocketStore } from '@/stores/useSocketStore';
import useWebRTC from '@/hooks/useWebRTC';

interface CallContextValue {
  incomingCall: CallInfo | null;
  status: CallStatus;
  callType: CallType;
  remoteUserId: string | null;
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
  // keep a stable ref to the latest webrtc helpers so socket handlers
  // (registered once per socket) always use current functions/refs
  const webrtcRef = useRef(webrtc);
  webrtcRef.current = webrtc;

  const [incomingCall, setIncomingCall] = useState<CallInfo | null>(null);
  const [status, setStatus] = useState<CallStatus>('idle');
  const [callType, setCallType] = useState<CallType>('voice');
  const [remoteUserId, setRemoteUserId] = useState<string | null>(null);
  const [localStreamState, setLocalStreamState] = useState<MediaStream | null>(null);
  const [remoteStreamState, setRemoteStreamState] = useState<MediaStream | null>(null);

  const callRef = useRef<CallInfo | null>(null);
  const incomingCallRef = useRef<CallInfo | null>(null);
  const remoteUserRef = useRef<string | null>(null);

  const resetCallState = () => {
    webrtcRef.current.stop();
    setStatus('idle');
    setIncomingCall(null);
    setLocalStreamState(null);
    setRemoteStreamState(null);
    setRemoteUserId(null);
    callRef.current = null;
    incomingCallRef.current = null;
    remoteUserRef.current = null;
  };

  useEffect(() => {
    if (!socket) return;

    socket.on('incoming-call', (data: CallInfo) => {
      incomingCallRef.current = data;
      setIncomingCall(data);
      setCallType(data.callType || 'voice');
      setRemoteUserId(data.from);
      remoteUserRef.current = data.from;
      setStatus('ringing');
    });

    // callee accepted -> caller creates the offer using the ORIGINAL call type
    socket.on('accept-call', async ({ callId, from }) => {
      remoteUserRef.current = from;
      setRemoteUserId(from);
      const type: CallType = callRef.current?.callType || 'voice';
      setCallType(type);
      callRef.current = { ...(callRef.current as CallInfo), callId, from, callType: type };

      const local = await webrtcRef.current.createLocalStream(type);
      setLocalStreamState(local);
      const pc = webrtcRef.current.createPeer(
        from,
        (s) => setRemoteStreamState(s),
        (candidate) => socket.emit('ice-candidate', { to: from, candidate, callId })
      );
      const offer = await webrtcRef.current.createOffer(from, pc);
      socket.emit('offer', { to: from, offer, callId });
    });

    socket.on('reject-call', () => {
      setStatus('rejected');
      resetCallState();
    });

    // callee receives the offer -> answer using the incoming call's type
    socket.on('offer', async ({ from, offer, callId }) => {
      remoteUserRef.current = from;
      setRemoteUserId(from);
      const type: CallType = incomingCallRef.current?.callType || 'voice';
      setCallType(type);

      const local = await webrtcRef.current.createLocalStream(type);
      setLocalStreamState(local);
      const pc = webrtcRef.current.createPeer(
        from,
        (s) => setRemoteStreamState(s),
        (candidate) => socket.emit('ice-candidate', { to: from, candidate, callId })
      );
      const answer = await webrtcRef.current.handleRemoteOffer(from, offer, pc);
      socket.emit('answer', { to: from, answer, callId });
      setStatus('connected');
    });

    socket.on('answer', async ({ from, answer }) => {
      const pc = webrtcRef.current.peersRef?.current?.[from];
      if (pc) await webrtcRef.current.handleRemoteAnswer(from, answer, pc);
      setStatus('connected');
    });

    socket.on('ice-candidate', async ({ from, candidate }) => {
      await webrtcRef.current.addIceCandidate(from, candidate);
    });

    socket.on('end-call', () => {
      resetCallState();
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
  }, [socket]);

  const startCall = async (to: string, type: CallType, metadata?: any) => {
    let sock = socket;
    if (!sock) {
      const connect = useSocketStore.getState().connectSocket;
      if (connect) connect();
      sock = await new Promise<any>((resolve) => {
        const unsub = useSocketStore.subscribe((s) => {
          if (s.socket) {
            unsub();
            resolve(s.socket);
          }
        });
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

    // record the call type up front so the accept-call handler can reuse it
    callRef.current = { callId: '', from: '', callType: type } as CallInfo;
    remoteUserRef.current = to;
    setRemoteUserId(to);
    setCallType(type);
    setStatus('calling');

    sock.emit('call-user', { to, callType: type, metadata }, (res: any) => {
      if (!res?.ok) {
        resetCallState();
      } else {
        callRef.current = { ...(callRef.current as CallInfo), callId: res.callId };
      }
    });
  };

  const acceptCall = async () => {
    if (!socket || !incomingCall) return;
    socket.emit('accept-call', { callId: incomingCall.callId, to: incomingCall.from });
    // offer/answer flow will create streams and move status to 'connected'
    setStatus('connecting');
    setIncomingCall(null);
  };

  const rejectCall = () => {
    if (!socket || !incomingCall) return;
    socket.emit('reject-call', { callId: incomingCall.callId, to: incomingCall.from });
    resetCallState();
  };

  const endCall = () => {
    if (!socket) return;
    const otherUser = remoteUserRef.current || incomingCall?.from || undefined;
    socket.emit('end-call', {
      callId: callRef.current?.callId,
      to: otherUser,
      status: 'completed',
      duration: 0,
      callType,
      otherUser,
    });
    resetCallState();
  };

  const toggleMic = (enabled: boolean) => webrtcRef.current.toggleTrack('audio', enabled);
  const toggleCamera = (enabled: boolean) => webrtcRef.current.toggleTrack('video', enabled);

  const value: CallContextValue = {
    incomingCall,
    status,
    callType,
    remoteUserId,
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
