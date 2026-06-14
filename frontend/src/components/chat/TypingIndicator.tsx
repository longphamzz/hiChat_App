import { useChatStore } from "@/stores/useChatStore";

const TypingIndicator = ({
  conversationId,
  isGroup,
}: {
  conversationId: string;
  isGroup: boolean;
}) => {
  const typingUsers = useChatStore((s) => s.typingUsers[conversationId]) ?? [];

  if (typingUsers.length === 0) return null;

  let text: string;
  if (isGroup) {
    if (typingUsers.length === 1) {
      text = `${typingUsers[0].displayName} đang soạn tin`;
    } else if (typingUsers.length === 2) {
      text = `${typingUsers[0].displayName} và ${typingUsers[1].displayName} đang soạn tin`;
    } else {
      text = `${typingUsers.length} người đang soạn tin`;
    }
  } else {
    text = "đang soạn tin";
  }

  return (
    <div className="flex items-center gap-2 px-4 py-1 text-sm text-muted-foreground">
      <span className="flex gap-1">
        <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]" />
        <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]" />
        <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" />
      </span>
      <span>{text}</span>
    </div>
  );
};

export default TypingIndicator;
