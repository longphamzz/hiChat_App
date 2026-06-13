import { useRef } from 'react';

type PeerMap = Record<string, RTCPeerConnection>;

const defaultConfig: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
  ],
};

export function useWebRTC() {
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<PeerMap>({});

  const createLocalStream = async (callType: 'voice' | 'video') => {
    const constraints: MediaStreamConstraints = callType === 'video'
      ? { audio: true, video: { width: 1280, height: 720 } }
      : { audio: true, video: false };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    localStreamRef.current = stream;
    return stream;
  };

  const createPeer = (remoteUserId: string, onTrack: (stream: MediaStream) => void, onIce?: (candidate: RTCIceCandidate) => void) => {
    const pc = new RTCPeerConnection(defaultConfig);

    pc.onicecandidate = (e) => {
      if (e.candidate && onIce) onIce(e.candidate);
    };

    pc.ontrack = (e) => {
      // prefer event.streams[0]
      const s = e.streams && e.streams[0] ? e.streams[0] : new MediaStream();
      remoteStreamRef.current = s;
      onTrack(s);
    };

    // attach local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => pc.addTrack(t, localStreamRef.current as MediaStream));
    }

    peersRef.current[remoteUserId] = pc;
    return pc;
  };

  const createOffer = async (remoteUserId: string, pc: RTCPeerConnection) => {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    return offer;
  };

  const handleRemoteOffer = async (remoteUserId: string, offer: RTCSessionDescriptionInit, pc: RTCPeerConnection) => {
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    return answer;
  };

  const handleRemoteAnswer = async (remoteUserId: string, answer: RTCSessionDescriptionInit, pc: RTCPeerConnection) => {
    await pc.setRemoteDescription(new RTCSessionDescription(answer));
  };

  const addIceCandidate = async (remoteUserId: string, candidate: RTCIceCandidateInit) => {
    const pc = peersRef.current[remoteUserId];
    if (!pc) return;
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.warn('addIceCandidate failed', err);
    }
  };

  const toggleTrack = (kind: 'audio' | 'video', enabled: boolean) => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getTracks().forEach((t) => {
      if (t.kind === kind) t.enabled = enabled;
    });
  };

  const stop = () => {
    // close peers
    Object.values(peersRef.current).forEach((pc) => {
      try { pc.close(); } catch (e) {}
    });
    peersRef.current = {};

    // stop streams
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((t) => t.stop());
      remoteStreamRef.current = null;
    }
  };

  return {
    createLocalStream,
    createPeer,
    createOffer,
    handleRemoteOffer,
    handleRemoteAnswer,
    addIceCandidate,
    toggleTrack,
    stop,
    localStreamRef,
    remoteStreamRef,
    peersRef,
  };
}

export default useWebRTC;
