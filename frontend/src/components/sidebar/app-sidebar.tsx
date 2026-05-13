
import { NavUser } from "@/components/sidebar/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Moon, Sun } from "lucide-react"
import { Switch } from "../ui/switch"
import CreateNewChat from "../chat/CreateNewChat"
import NewGroupChatModel from "../chat/NewGroupChatModel"
import GroupChatList from "../chat/GroupChatList"
import AddFriendModal from "../chat/AddFriendModal"
import DirectMessageList from "../chat/DirectMessageList"
import { useThemeStore } from "@/stores/useThemeStore"
import { useAuthStore } from "@/stores/useAuthStore"




export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
 const {isDark, toggleTheme} = useThemeStore();
 const {user} = useAuthStore();
 
  return (
    <Sidebar variant="inset" {...props}>

      {/*  */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="bg-gradient-primary">
              <a href="#">
                <div className="flex w-full items-center px-2 justify-between">
                  <h1 className="text-xl font-bold text-white"> aChatApp</h1>
                  <div className="flex items-center gap-2">
                    <Sun className="size-4 text-white/75" />
                    <Switch
                      checked={isDark}
                      onCheckedChange={toggleTheme}
                      className="data-[state=checked]:bg-background/75"
                    />
                    <Moon className="size-4 text-white/75" />
                  </div>
                </div>

              </a>

            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/*  */}
      <SidebarContent >
        {/* SingleChat  */}
        <SidebarGroup>
          <SidebarGroupContent>
            <CreateNewChat />

          </SidebarGroupContent>
        </SidebarGroup>



        {/* GroupChat */}
        <SidebarGroup>
          <SidebarGroupLabel className="uppercase">
            Nhóm chat
          </SidebarGroupLabel>

          <SidebarGroupAction title="Tạo nhóm" className="cursor-pointer">
            <NewGroupChatModel />
          </SidebarGroupAction>
          <SidebarGroupContent>

            <GroupChatList />
          </SidebarGroupContent>

        </SidebarGroup>




        {/* Dirrect Message  */}
        <SidebarGroup>
          <SidebarGroupLabel className="uppercase">
            Bạn bè
          </SidebarGroupLabel>

          <SidebarGroupAction title="Kết Bạn" className="cursor-pointer">
            <AddFriendModal/>
          </SidebarGroupAction>
          <SidebarGroupContent>

            <DirectMessageList/>
          </SidebarGroupContent>

        </SidebarGroup>




      </SidebarContent>

      {/*  */}
      <SidebarFooter>
        {user && 
        <NavUser user={user} />}
      </SidebarFooter>
    </Sidebar>
  )
}
