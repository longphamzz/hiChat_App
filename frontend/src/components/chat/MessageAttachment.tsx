import { FileIcon, DownloadIcon } from "lucide-react";

interface Props {
  url: string;
}

export const MessageAttachment = ({ url }: Props) => {
  const extension = url.split('.').pop()?.toLowerCase();

  // Xử lý hiển thị Video
  if (['mp4', 'webm', 'ogg'].includes(extension || "")) {
    return (
      <video controls className="max-w-[300px] rounded-lg shadow-md">
        <source src={url} type={`video/${extension}`} />
        Trình duyệt của bạn không hỗ trợ xem video.
      </video>
    );
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