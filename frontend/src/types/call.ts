export type CallType = 'voice' | 'video';

export interface CallInfo {
  callId: string;
  from: string; // userId
  callerName?: string;
  callType: CallType;
  startedAt?: string;
  metadata?: any;
}

export type CallStatus = 'idle' | 'calling' | 'ringing' | 'connecting' | 'connected' | 'ended' | 'rejected' | 'missed';
