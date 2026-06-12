import { useFriendStore } from "@/stores/useFriendStore"
import FriendRequestItem from "./FriendRequestItem"
import { Button } from "../ui/button"
import { toast } from "sonner"

const ReceivedRequest = () => {
    const { acceptRequest, refuseRequest, loading, receivedList } = useFriendStore()

    if (!receivedList || receivedList.length === 0) {
        return (
            <p className='text-sm text-muted-foreground'>
                Bạn chưa có yêu cầu kết bạn nào
            </p>
        )
    }

    const handleAccept = async (requestId: string) => {
        try {
            await acceptRequest(requestId);
            toast.success("Đã chấp nhận yêu cầu kết bạn");
        } catch (error) {
            console.error(error);

        }
    }

    const handleRefuse = async (requestId: string) => {
        try {
            await refuseRequest(requestId);
            toast.info("Đã từ chối yêu cầu kết bạn");
        } catch (error) {
            console.error(error);
        }
    }
 return (
    <div className="space-y-3 mt-4">
      {receivedList.map((req) => (
        <FriendRequestItem
          key={req._id}
          requestInfo={req}
          actions={
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="primary"
                onClick={() => handleAccept(req._id)}
                disabled={loading}
              >
                Chấp nhận
              </Button>
              <Button
                size="sm"
                variant="destructiveOutline"
                onClick={() => handleRefuse(req._id)}
                disabled={loading}
              >
                Từ chối
              </Button>
            </div>
          }
          type="received"
        />
      ))}
    </div>
  );
};

export default ReceivedRequest
