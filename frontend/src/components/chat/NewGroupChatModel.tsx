import { useFriendStore } from "@/stores/useFriendStore";
import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { UserPlus, Users } from "lucide-react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import type { Friend } from "@/types/user";
import InviteSuggestionList from "../CreateNewGroupChat.tsx/InviteSuggestionList";
import SelectedUsersList from "../CreateNewGroupChat.tsx/SelectedUsersList";
import { toast } from "sonner";
import { useChatStore } from "@/stores/useChatStore";

const NewGroupChatModel = () => {
  const [groupName, setGroupName] = useState("");
  const [search, setSearch] = useState("");
  const { friends, getFriends } = useFriendStore();
  const [invitedUsers, setInvitedUsers] = useState<Friend[]>([]);
  const {loading, createConversation} = useChatStore();

  const handleGetFriends = async () => {
    await getFriends();
  }

  const handleSelectFriend = (friend: Friend) => {
    setInvitedUsers([...invitedUsers, friend]);
    setSearch("");
  }

  const handleRemoveFriend = (friend: Friend) => {
    setInvitedUsers(invitedUsers.filter((u) => u._id !== friend._id))
  }

  const handleSubmit = async (e: React.FormEvent) => { 
    try {
      e.preventDefault();
      if(invitedUsers.length === 0) { 
        toast.warning("Vui lòng chọn ít nhất một thành viên để tạo nhóm chat.");
        return;
      }

      await createConversation(
        "group",
        groupName,
        invitedUsers.map((u) => u._id)
      );

      setSearch("");
      setInvitedUsers([]);
    } catch (error) {
      console.error("Có lỗi xảy ra khi tạo nhóm chat.");
    }
  }

  const filteredFriends = friends.filter((friend) => friend.displayName.toLowerCase().includes(search.toLowerCase()) && !invitedUsers.some((u) => u._id === friend._id))

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant='ghost' onClick={handleGetFriends} className="flex z-10 justify-center items-center size-5 rounded-full hover:bg-sidebar-accent transition cursor-pointer" >
          <Users className="size-4" />
          <span className="sr-only">Tạo nhóm chat</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px] border-none">
        <DialogHeader >
          <DialogTitle className="capitalize" >
            Tạo nhóm chat mới
          </DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit} >
          {/* ten nhom  */}
          <div className="space-y-2">
            <Label htmlFor="groupName" className="text-sm font-semibold" >
              Tên nhóm
            </Label>

            <Input id="groupName"
              placeholder="Điền tên nhóm..."
              className="glass border-border/50 focus:border-primary/50 transition-smooth  "
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
            />
          </div>

          {/* moi thanh vien  */}
          <div className="space-y-2">
            <Label htmlFor="invite"
              className="text-sm font-semibold">
              Mời thành viên

            </Label>
            <Input id="invite" placeholder="Nhập tên người dùng..."
              value={search}
              onChange={(e) => setSearch(e.target.value)} />

            {/* danh sach goi y  */}
            {search && filteredFriends.length > 0 && (
              <InviteSuggestionList
                filteredFriends={filteredFriends}
                onSelect={handleSelectFriend}
              />
            )}



            {/* danh sach user da chon  */}
            <SelectedUsersList
            invitedUsers={invitedUsers}
            onRemove={handleRemoveFriend}
            />



          </div>

            <DialogFooter>
              <Button type="submit" disabled={loading} className="flex-1 bg-gradient-chat text-white hover:opacity-90 transition-smooth">
              {
                loading ? (<span>Đang tạo...</span> )
                 : (
                  <>
                  <UserPlus className="size-4 mr-2" />
                  Tạo nhóm
                  </>
                 )
              }
              </Button>
            </DialogFooter>
        </form>

      </DialogContent>

    </Dialog>
  )
}

export default NewGroupChatModel
