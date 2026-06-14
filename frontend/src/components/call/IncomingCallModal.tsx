"use client";

import { Phone, PhoneOff, Video } from 'lucide-react';
import { useCall } from '@/contexts/CallContext';
import UserAvatar from '@/components/chat/UserAvatar';

export default function IncomingCallModal() {
  const { incomingCall, acceptCall, rejectCall, status } = useCall();

  if (!incomingCall || status !== 'ringing') return null;

  const isVideo = incomingCall.callType === 'video';
  const name = incomingCall.callerName ?? 'Người dùng';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[320px] rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 p-7 text-center text-white shadow-2xl">
        <div className="mb-2 flex items-center justify-center gap-2 text-sm text-white/70">
          {isVideo ? <Video className="size-4" /> : <Phone className="size-4" />}
          <span>{isVideo ? 'Cuộc gọi video đến' : 'Cuộc gọi thoại đến'}</span>
        </div>

        <div className="my-5 flex flex-col items-center gap-4">
          <div className="animate-pulse rounded-full ring-4 ring-white/15">
            <UserAvatar type="profile" name={name} className="size-24 text-4xl" />
          </div>
          <div className="text-xl font-semibold">{name}</div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-10">
          <button
            type="button"
            onClick={rejectCall}
            aria-label="Từ chối"
            className="flex flex-col items-center gap-1"
          >
            <span className="flex size-14 items-center justify-center rounded-full bg-red-600 transition hover:bg-red-700">
              <PhoneOff className="size-6" />
            </span>
            <span className="text-xs text-white/70">Từ chối</span>
          </button>

          <button
            type="button"
            onClick={acceptCall}
            aria-label="Trả lời"
            className="flex flex-col items-center gap-1"
          >
            <span className="flex size-14 items-center justify-center rounded-full bg-green-600 transition hover:bg-green-700">
              {isVideo ? <Video className="size-6" /> : <Phone className="size-6" />}
            </span>
            <span className="text-xs text-white/70">Trả lời</span>
          </button>
        </div>
      </div>
    </div>
  );
}
