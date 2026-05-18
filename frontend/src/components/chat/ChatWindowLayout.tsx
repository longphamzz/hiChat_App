import { useChatStore } from "@/stores/useChatStore"
import ChatWelcomeScreen from "./ChatWelcomeScreen";
import ChatWindowSkeleton from "./ChatWindowSkeleton";
import { SidebarInset } from "../ui/sidebar";
import ChatWindowHeader from "./ChatWindowHeader";
import ChatWindowBody from "./ChatWindowBody";
import MessageInput from "./MessageInput";
import { useEffect } from "react";


const ChatWindowLayout = () => {
  const {activeConversationId, conversations, messageLoading: loading, messages, markAsSeen} = useChatStore();

  const selectedConvo = conversations.find((c) => c._id === activeConversationId) ?? null;

  useEffect(() => {
    if(!selectedConvo) return;

  
  const markSeen = async () => {
    try {
      await markAsSeen()
    } catch (error) {
      console.error("Lỗi khi đánh dấu tin nhắn là đã đọc:", error);
      
    }
  }
  markSeen();

}, [markAsSeen, selectedConvo]
)


  if(!selectedConvo) {
    return <ChatWelcomeScreen />
  }

  if(loading) {
    return <ChatWindowSkeleton />
  }
  

  return (
   <SidebarInset className="flex flex-col h-full flex-1 overflow-hidden rounded-sm shadow-md">
    {/* header  */}
    <ChatWindowHeader chat={selectedConvo} />


    {/* body  */}
    <div  className=" flex-1 overflow-y-auto bg-primary-foreground">
      <ChatWindowBody />

    </div>

    {/* footer  */}
    <MessageInput selectedConvo={selectedConvo} />

   </SidebarInset>
  )
}

export default ChatWindowLayout
