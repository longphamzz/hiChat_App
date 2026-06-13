"use client";

import React from 'react';
import { useCall } from '@/contexts/CallContext';
import { Button } from '@/components/ui/button';

export default function CallDialog() {
  const { status, endCall } = useCall();

  if (status === 'idle') return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-popover p-3 rounded shadow flex items-center gap-3">
        <div>
          <div className="text-sm">{status === 'calling' ? 'Calling...' : status}</div>
        </div>
        <div>
          <Button variant="destructive" onClick={() => endCall()}>End</Button>
        </div>
      </div>
    </div>
  );
}
