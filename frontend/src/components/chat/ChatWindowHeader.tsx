import { useChatStore } from '@/stores/useChatStore'
import type { Conversation } from '@/types/chat'
import { SidebarTrigger } from '../ui/sidebar';
import { useAuthStore } from '@/stores/useAuthStore';
import { Separator } from '../ui/separator';
import UserAvatar from './UserAvatar';
import StatusBadge from './StatusBadge';
import GroupChatAvatar from './GroupChatAvatar';
import { useSocketStore } from '@/stores/useSocketStore';
import { Button } from '../ui/button';
import { PhoneCall, Video } from 'lucide-react';
import { useCall } from '@/contexts/CallContext';
import SettingGroupChatDialog from './SettingGroupChatDialog';


const ChatWindowHeader = ({chat} : {chat? : Conversation}) => {
  const {conversations, activeConversationId} = useChatStore();
  const {user} = useAuthStore(); 
  const {onlineUsers} = useSocketStore();
  let otherUser;

  chat = chat ?? conversations.find((c) => c._id === activeConversationId);

  if(!chat) {
    return (
      <header className='sticky top-0 z-10 flex items-center gap-2 px-4 py-2 w-full'>
        <SidebarTrigger className='-ml-1 text-foreground' />
          
      </header>
    )
  }

  if(chat.type === "direct") {
 
    const otherUsers = chat.participants.filter((p) => p._id !== user?._id);
    otherUser = otherUsers.length > 0 ? otherUsers[0] : null;

    if(!user || !otherUser) return;
  }

  const call = useCall();

  return (
  <header className='sticky top-0 z-10 px-4 py-2 flex  items-center bg-background' >
    <div className='flex items-center gap-2 '>

      <SidebarTrigger className='-ml-1 text-foreground' />
      <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
    </div>

    <div className='p-2 w-full flex items-center gap-3 '>
      {/* avatar */}
      <div className='relative'>
        { 
          chat.type === 'direct' ? (
            <>
            <UserAvatar type={"sidebar"}
            name={otherUser?.displayName || "Roger"}
            avatarUrl={otherUser?.avatarUrl || undefined} />
            {/* // todo: socket io  */}
             <StatusBadge status={onlineUsers.includes(otherUser?._id ?? "") ? "online" : "offline"} />

            </>
            
          ) : (
            <GroupChatAvatar participants={chat.participants}
            type='sidebar'
            />
          )
        }
      </div>

        {/* name  */}
        <h2 className='font-semibold text-foreground'>
          {chat.type === "direct" ? otherUser?.displayName : chat.group?.name}
        </h2>
        {chat.type === 'direct' && otherUser && (
          <div className='ml-auto flex gap-2'>
            <Button variant='ghost' onClick={() => { console.log('call voice clicked', otherUser._id); call.startCall(otherUser._id, 'voice'); }}>
              <PhoneCall />
            </Button>
            <Button variant='ghost' onClick={() => { console.log('call video clicked', otherUser._id); call.startCall(otherUser._id, 'video'); }}>
              <Video />
            </Button>
          </div>
        )}
        {chat.type === 'group' && (
          // show Add Member button only for admins
          (() => {
            const userId = user?._id?.toString();
            const createdBy = String(chat.group?.createdBy || '');
            const admins = (chat.group?.admins || []).map((a: any) => String(a));
            const isAdmin = userId && (userId === createdBy || admins.includes(userId));

            if (!isAdmin) return null;

            return (
              <div className='ml-auto'>
                <SettingGroupChatDialog conversationId={chat._id} />
              </div>
            )
          })()
        )}
    </div>

  </header>
  )
}

export default ChatWindowHeader
