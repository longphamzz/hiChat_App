"use client";

import React from 'react';
import { useCall } from '@/contexts/CallContext';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function IncomingCallModal() {
  const { incomingCall, acceptCall, rejectCall, status } = useCall();

  if (!incomingCall) return null;

  return (
    <Dialog open={status === 'ringing'} onOpenChange={() => {}}>
      <DialogContent>
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Incoming {incomingCall.callType} call</h3>
          <p className="text-sm text-muted-foreground">{incomingCall.callerName ?? 'Unknown'}</p>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={rejectCall}>Reject</Button>
            <Button onClick={acceptCall}>Accept</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
