
import { useChatStore } from '@/stores/useChatStore'
import { useAuthStore } from '@/stores/useAuthStore';
import DirectMessageCard from './DirectMessageCard';

const DirectMessageList = () => {
  const {conversations, searchQuery} = useChatStore();
  const {user} = useAuthStore();

  if(!conversations) return;

  const query = searchQuery.trim().toLowerCase();

  const directConversations = conversations
    .filter((convo) => convo.type === 'direct')
    .filter((convo) => {
      if (!query) return true;
      const otherUser = convo.participants.find((p) => p._id !== user?._id);
      return (otherUser?.displayName ?? "").toLowerCase().includes(query);
    });
 
  return (
      <div className='flex-1 overflow-y-auto p-2 space-y-2'>
        {
          directConversations.map((convo) => (
            <DirectMessageCard convo={convo} key={convo._id}/>
          ))
        }
    
    </div>
  )
}

export default DirectMessageList
