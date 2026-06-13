import { cn, formatMessageTime } from "@/lib/utils";
import type { Conversation, Message, Participant } from "@/types/chat";
import UserAvatar from "./UserAvatar";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { MessageAttachment } from "./MessageAttachment";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "../ui/dropdown-menu";
import { MoreHorizontal, Edit3, Trash2, CornerUpLeft } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogFooter, DialogHeader } from "../ui/dialog";
import { Button } from "../ui/button";
import { useState } from "react";
import { chatService } from "@/services/chatService";
// socket/auth stores not directly used here
import { useChatStore } from "@/stores/useChatStore";

interface MessageItemProps {
  message: Message;
  index: number;
  messages: Message[];
  selectedConvo: Conversation;
  lastMessageStatus: "delivered" | "seen";
  showTime?: boolean;
}

const MessageItem = ({
  message,
  index,
  messages,
  selectedConvo,
  lastMessageStatus,
  showTime,
}: MessageItemProps) => {
  const prev = index + 1 < messages.length ? messages[index + 1] : undefined;

  // use showTime prop calculated in parent (based on chronological spacing)
  const isShowTime =
    showTime ??
    (index === 0 ||
      new Date(message.createdAt).getTime() -
        new Date(prev?.createdAt || 0).getTime() >
        600000);

  const isGroupBreak = isShowTime || message.senderId !== prev?.senderId;

  const participant = selectedConvo.participants.find(
    (p: Participant) => p._id.toString() === message.senderId.toString()
  );
  const chatStore = useChatStore.getState();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editContent, setEditContent] = useState(message.content ?? "");
  return (
    <>
      {message.system ? (
        <div className="w-full flex items-center justify-center my-3">
          <div className="text-xs text-muted-foreground bg-muted/20 px-3 py-1 rounded-lg">
            {message.content}
          </div>
        </div>
      ) : (

      <div
        className={cn(
          "flex gap-2 message-bounce mt-1",
          message.isOwn ? "justify-end" : "justify-start"
        )}
      >
        {/* avatar */}
        {!message.isOwn && (
          <div className="w-8">
            {isGroupBreak && (
              <UserAvatar
                type="chat"
                name={participant?.displayName ?? "Moji"}
                avatarUrl={participant?.avatarUrl ?? undefined}
              />
            )}
          </div>
        )}

        {/* tin nhắn */}
        <div
          className={cn(
            "max-w-xs lg:max-w-md space-y-1 flex flex-col",
            message.isOwn ? "items-end" : "items-start"
          )}
        >
          <div className="flex items-center group">
            {/* three-dot button to the left of bubble (owner only) */}
            {message.isOwn && (
              <div className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm" className="h-8 w-8 p-1">
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onSelect={() => { setIsEditOpen(true); setIsMenuOpen(false); }}>
                      <Edit3 className="mr-2" /> Edit Message
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={async () => {
                      setIsMenuOpen(false);
                      try {
                        await chatService.deleteMessageForMe(message._id);
                      } catch (err) {
                        console.error(err);
                      }
                    }}>
                      <Trash2 className="mr-2" /> Delete For Me
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={async () => {
                      setIsMenuOpen(false);
                      try {
                        await chatService.unsendMessage(message._id);
                      } catch (err) {
                        console.error(err);
                      }
                    }}>
                      <CornerUpLeft className="mr-2" /> Unsend For Everyone
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            <Card
              className={cn(
                // if this message only contains an attachment, remove extra padding
                message.imgUrl && !message.content ? 'p-0' : 'p-3',
                message.isOwn ? "chat-bubble-sent border-0" : "chat-bubble-received"
              )}
            >
              {message.imgUrl ? (
                <div className={message.content ? 'space-y-2' : ''}>
                  <MessageAttachment url={message.imgUrl} />
                  {message.content && (
                    <p className={message.unsent ? "text-sm leading-relaxed break-all italic text-muted-foreground/80" : "text-sm leading-relaxed break-all"}>
                      {message.content}
                    </p>
                  )}
                </div>
              ) : (
                <p className={message.unsent ? "text-sm leading-relaxed break-all italic text-muted-foreground/80" : "text-sm leading-relaxed break-all"}>
                  {message.content}{message.edited && <span className="text-xs text-muted-foreground"> (edited)</span>}
                </p>
              )}
            </Card>
          </div>

          {/* seen/ delivered */}
          {message.isOwn && message._id === selectedConvo.lastMessage?._id && (
            <Badge
              variant="outline"
              className={cn(
                "text-xs px-1.5 py-0.5 h-4 border-0",
                lastMessageStatus === "seen"
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {lastMessageStatus}
            </Badge>
          )}
        </div>
        </div>
        )}

      {/* Edit dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit message</DialogTitle>
          </DialogHeader>
          <textarea className="w-full h-28 p-2 mt-2 border rounded" value={editContent} onChange={(e) => setEditContent(e.target.value)} />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={async () => {
              try {
                const updated = await chatService.editMessage(message._id, editContent);
                // store will be updated via socket event; also update optimistically
                chatStore.updateMessage(updated);
                setIsEditOpen(false);
              } catch (err) {
                console.error(err);
              }
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

       {/* time */}
      {isShowTime && (
        <span className="flex justify-center text-xs text-muted-foreground px-1">
          {formatMessageTime(new Date(message.createdAt))}
        </span>
      )}
    </>
  );
};

export default MessageItem;