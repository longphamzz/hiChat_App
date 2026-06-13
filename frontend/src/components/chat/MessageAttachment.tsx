import { FileIcon, DownloadIcon, Play, Pause, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Props {
  url: string;
}

export const MessageAttachment = ({ url }: Props) => {
  const extension = url.split('.').pop()?.toLowerCase();

  // Xử lý hiển thị Video
  if (['mp4', 'webm', 'ogg'].includes(extension || "")) {
    return (
      <video controls className="max-w-full w-full rounded-lg shadow-md h-auto">
        <source src={url} type={`video/${extension}`} />
        Trình duyệt của bạn không hỗ trợ xem video.
      </video>
    );
  }

  // Xử lý hiển thị Audio -> custom player for better UX
  if (['mp3', 'wav', 'm4a', 'aac', 'oga', 'ogg', 'webm'].includes(extension || "")) {
    const AudioPlayer = () => {
      const audioRef = useRef<HTMLAudioElement | null>(null);
      const [playing, setPlaying] = useState(false);
      const [muted, setMuted] = useState(false);
      const [duration, setDuration] = useState<number>(0);
      const [current, setCurrent] = useState<number>(0);

      useEffect(() => {
        const a = new Audio(url);
        a.preload = 'metadata';
        audioRef.current = a;

        const onLoaded = () => setDuration(a.duration || 0);
        const onTime = () => setCurrent(a.currentTime || 0);
        const onEnd = () => setPlaying(false);

        a.addEventListener('loadedmetadata', onLoaded);
        a.addEventListener('timeupdate', onTime);
        a.addEventListener('ended', onEnd);

        return () => {
          a.pause();
          a.removeEventListener('loadedmetadata', onLoaded);
          a.removeEventListener('timeupdate', onTime);
          a.removeEventListener('ended', onEnd);
          audioRef.current = null;
        };
      }, [url]);

      const togglePlay = async () => {
        const a = audioRef.current;
        if (!a) return;
        if (playing) {
          a.pause();
          setPlaying(false);
        } else {
          try {
            await a.play();
            setPlaying(true);
          } catch (e) {
            console.error('Play error', e);
          }
        }
      };

      const handleSeek = (v: number) => {
        const a = audioRef.current;
        if (!a) return;
        a.currentTime = v;
        setCurrent(v);
      };

      const toggleMute = () => {
        const a = audioRef.current;
        if (!a) return;
        a.muted = !a.muted;
        setMuted(a.muted);
      };

      const fmt = (s: number) => {
        if (!s || Number.isNaN(s)) return '0:00';
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60).toString().padStart(2, '0');
        return `${m}:${sec}`;
      };

      return (
        <div className="inline-flex items-center gap-2 p-2 bg-secondary rounded-lg w-auto max-w-[260px] min-w-0">
          <button onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'} className="p-2 rounded-full bg-white/5">
            {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
          </button>

          <div className="flex-1 min-w-0 mx-1">
            <input
              aria-label="seek"
              type="range"
              min={0}
              max={Math.max(1, Math.floor(duration || 0))}
              value={Math.floor(current || 0)}
              onChange={(e) => handleSeek(Number(e.target.value))}
              className="w-full h-1"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
              <span className="mr-2">{fmt(current)}</span>
              <span className="ml-2">{fmt(duration)}</span>
            </div>
          </div>

          <button onClick={toggleMute} className="p-2 rounded-full bg-white/5">
            {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </button>
        </div>
      );
    };

    return <AudioPlayer />;
  }

  // Xử lý hiển thị Ảnh (vẫn dùng logic cũ nhưng trong component mới)
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || "")) {
    return <img src={url} alt="attachment" className="max-w-[300px] rounded-lg shadow-sm cursor-pointer" />;
  }

  // Xử lý hiển thị Tệp tài liệu (PDF, Word,...)
  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 bg-secondary rounded-xl hover:bg-secondary/80 transition-colors border border-border"
    >
      <div className="p-2 bg-primary/10 rounded-lg">
        <FileIcon className="size-6 text-primary" />
      </div>
      <div className="flex flex-col overflow-hidden">
        <span className="text-sm font-medium truncate">Tài liệu đính kèm</span>
        <span className="text-xs text-muted-foreground uppercase">{extension} File</span>
      </div>
      <DownloadIcon className="size-4 ml-auto text-muted-foreground" />
    </a>
  );
};