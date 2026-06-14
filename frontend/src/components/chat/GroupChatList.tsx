import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { useChatStore } from "@/stores/useChatStore"
import GroupChatCard from "./GroupChatCard";

const COLLAPSED_COUNT = 3;

const GroupChatList = () => {
   const {conversations} = useChatStore();
   const [expanded, setExpanded] = useState(false);

  if(!conversations) return;

  const groupchats = conversations.filter((convo) => convo.type === 'group')

  const visibleGroupchats = expanded ? groupchats : groupchats.slice(0, COLLAPSED_COUNT)
  const hiddenCount = groupchats.length - COLLAPSED_COUNT

  return (
   <div className='flex-1 overflow-y-auto p-2 space-y-2'>
        {
          visibleGroupchats.map((convo) => (
            <GroupChatCard convo={convo} key={convo._id} />
          ))
        }

        {hiddenCount > 0 && (
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="flex w-full items-center justify-center gap-1 rounded-md py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          >
            {expanded ? 'Thu gọn' : `Xem tất cả nhóm (${groupchats.length})`}
            <ChevronDown className={`size-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        )}
    </div>
  )
}

export default GroupChatList
