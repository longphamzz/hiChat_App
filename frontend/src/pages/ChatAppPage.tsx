import React from 'react'
import Logout from '@/components/auth/Logout'
import { useAuthStore } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import api from '@/lib/axios';

const ChatAppPage = () => {
  const user = useAuthStore(s => s.user);

  const handleOnClick = async () => {
    try {
      await api.get("/users/test", { withCredentials: true })
      toast.success("ok")
    } catch (error) {
      console.error(error)
      toast.error("false")
    }
  }
  return (
    <div>
      {user?.username}
      <Logout />

      <Button onClick={handleOnClick}>
        test
      </Button>
    </div>
  )
}

export default ChatAppPage
