import { useAuthStore } from '@/stores/useAuthStore'
import type { Conversation } from '@/types/chat';
import React, { useRef, useState, useEffect } from 'react'
import { Button } from '../ui/button';
import { ImagePlus, Mic, Send } from 'lucide-react';
import { Input } from '../ui/input';
import EmojiPicker from './EmojiPicker';
import { useChatStore } from '@/stores/useChatStore';
import { toast } from 'sonner';
import { chatService } from '@/services/chatService';




const MessageInput = ({ selectedConvo }: { selectedConvo: Conversation }) => {
  const { user } = useAuthStore();
  const {sendDirectMessage, sendGroupMessage} = useChatStore();
  const [value, setValue] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<number | null>(null);


  if (!user) return;

  const sendMessage = async() => {
    if(!value.trim()) return;
    const currValue = value;
    setValue("");

    try {
      if(selectedConvo.type === 'direct'){
        const participants = selectedConvo.participants;
        const otherUser = participants.filter((p) => p._id !== user._id)[0];
        await sendDirectMessage(otherUser._id, currValue)
      } else {
        await sendGroupMessage(selectedConvo._id, currValue);
      }
    } catch (error) {
      console.error(error)
      toast.error("Có lỗi khi gửi tin nhắn");
    } 
  }

  const handleFileClick = () => {
    fileInputRef.current?.click();
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mr.onstop = async () => {
        // stop tracks
        stream.getTracks().forEach((t) => t.stop());

        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: blob.type });

        setUploading(true);
        try {
          const res = await chatService.uploadAttachment(file);
          const url = res.url || res.secure_url || res.data?.url;

          if (selectedConvo.type === 'direct') {
            const participants = selectedConvo.participants;
            const otherUser = participants.filter((p) => p._id !== user._id)[0];
            await sendDirectMessage(otherUser._id, "", url);
          } else {
            await sendGroupMessage(selectedConvo._id, "", url);
          }
        } catch (error) {
          console.error(error);
          toast.error('Có lỗi khi upload audio');
        } finally {
          setUploading(false);
        }

        setIsRecording(false);
        if (recordTimerRef.current) {
          window.clearInterval(recordTimerRef.current);
          recordTimerRef.current = null;
        }
      };

      mr.start();
      setIsRecording(true);

      // optional: could track recording duration here
    } catch (error) {
      console.error('Microphone access denied or error', error);
      toast.error('Không thể truy cập microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  useEffect(() => {
    return () => {
      if (recordTimerRef.current) window.clearInterval(recordTimerRef.current);
    };
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await chatService.uploadAttachment(file);
      const url = res.url || res.secure_url || res.data?.url;

      if (selectedConvo.type === 'direct') {
        const participants = selectedConvo.participants;
        const otherUser = participants.filter((p) => p._id !== user._id)[0];
        await sendDirectMessage(otherUser._id, "", url);
      } else {
        await sendGroupMessage(selectedConvo._id, "", url);
      }

    } catch (error) {
      console.error(error);
      toast.error('Có lỗi khi upload file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

 const handleKeyPress = (e: React.KeyboardEvent) => {
    if(e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  }

  return (

    <div className='flex items-center gap-2 p-3 min-h-[56px] bg-background'>
      <>
        <input ref={fileInputRef} onChange={handleFileChange} type='file' className='hidden' />
        <Button onClick={handleFileClick} variant='ghost' size='icon' className='hover:bg-primary/10 transiton-smooth' disabled={uploading} aria-busy={uploading} >
          <ImagePlus className='size-4' />
        </Button>

        <Button onClick={toggleRecording} variant='ghost' size='icon' className={`hover:bg-primary/10 transiton-smooth ${isRecording ? 'text-red-600' : ''}`} disabled={uploading} aria-pressed={isRecording} >
          <div className='flex items-center gap-2'>
            <Mic />
            {isRecording && <span className='w-2 h-2 bg-red-500 rounded-full animate-pulse' />}
          </div>
        </Button>
      </>
      <div className='flex-1 relative'>
        <Input  onKeyPress={handleKeyPress}
        value={value} onChange={(e) => setValue(e.target.value)}
          placeholder='...'
          className='pr-20 h-9 bg-white border-border/50 focus:border-primary/50 transition-smooth resize-none'
        >
        </Input>

        <div className='absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1'>
          <Button asChild variant='ghost' size='icon' className='size-8 hover:bg-primary/10 transition-smooth' >
            <div>
              {/* send emoji  */}
             <EmojiPicker onChange={(emoji: string) => setValue(`${value}${emoji}`)} /> 
            </div>
          </Button>
        </div>

        

      </div>
      <Button onClick={sendMessage}
       className='bg-gradient-chat hover:shadow-glow transition-smooth hover:scale-105' disabled={!value.trim()} >
          <Send className='size-4 text-white' />
        </Button>
    </div>
  )
}

export default MessageInput
