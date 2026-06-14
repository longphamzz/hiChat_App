import { useChatStore } from "@/stores/useChatStore"
import GroupChatCard from "./GroupChatCard";

const GroupChatList = () => {
   const {conversations, searchQuery} = useChatStore();

  if(!conversations) return;

  const query = searchQuery.trim().toLowerCase();

  const groupchats = conversations
    .filter((convo) => convo.type === 'group')
    .filter((convo) => !query || (convo.group?.name ?? "").toLowerCase().includes(query))
 
  return (
   <div className='flex-1 overflow-y-auto p-2 space-y-2'>
        {
          groupchats.map((convo) => (
            <GroupChatCard convo={convo} key={convo._id} />
          ))
        }
    
    </div>
  )
}

export default GroupChatList
