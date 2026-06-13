import React, { useMemo, useState } from 'react';
import { DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import UserAvatar from './UserAvatar';
import { useFriendStore } from '@/stores/useFriendStore';
import { useChatStore } from '@/stores/useChatStore';
import { chatService } from '@/services/chatService';

interface AddMemberDialogProps {
  conversationId: string;
  onClose?: () => void;
  asPanel?: boolean; // when true, render inner panel without DialogContent wrapper
}

const AddMemberDialog: React.FC<AddMemberDialogProps> = ({ conversationId, onClose, asPanel = false }) => {
  const { friends } = useFriendStore();
  const { conversations } = useChatStore();
  const convo = conversations.find((c) => c._id === conversationId);

  const existingIds = useMemo(() => (convo?.participants || []).map((p: any) => p._id?.toString()), [convo]);

  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return friends
      .filter((f: any) => !existingIds.includes(f._id))
      .filter((f: any) => (f.displayName || '').toLowerCase().includes(q) || (f.username || '').toLowerCase().includes(q));
  }, [friends, existingIds, query]);

  const toggle = (id: string) => {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  const handleConfirm = async () => {
    if (selected.length === 0) return;
    setLoading(true);
    try {
      const res = await chatService.addMembersToConversation(conversationId, selected);
      if (res && res.conversation) {
        useChatStore.getState().updateConversation(res.conversation);
      }
      onClose && onClose();
    } catch (err) {
      console.error('Failed to add members', err);
    } finally {
      setLoading(false);
    }
  };

  const panel = (
    <div className="p-2">
      <div className="mb-2 font-medium">Thêm thành viên</div>
      <Input placeholder="Tìm kiếm bạn bè" value={query} onChange={(e) => setQuery(e.target.value)} />

      <div className="mt-3 max-h-60 overflow-y-auto space-y-2">
        {candidates.map((f: any) => (
          <div key={f._id} className="flex items-center gap-3 p-2 rounded hover:bg-muted/30 cursor-pointer" onClick={() => toggle(f._id)}>
            <div className="relative">
              <UserAvatar type="sidebar" name={f.displayName} avatarUrl={f.avatarUrl} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">{f.displayName}</div>
              <div className="text-sm text-muted-foreground">@{f.username}</div>
            </div>
            <div>
              <input type="checkbox" checked={selected.includes(f._id)} readOnly />
            </div>
          </div>
        ))}

        {candidates.length === 0 && (
          <div className="text-center text-muted-foreground py-8">Không có bạn bè hợp lệ</div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <Button variant="ghost" onClick={() => onClose && onClose()}>Hủy</Button>
        <Button onClick={handleConfirm} disabled={selected.length === 0 || loading}>
          {loading ? 'Đang thêm...' : `Thêm (${selected.length})`}
        </Button>
      </div>
    </div>
  );

  if (asPanel) return panel;

  return (
    <DialogContent className="max-w-md glass">
      <DialogHeader>
        <DialogTitle className="text-lg">Thêm thành viên</DialogTitle>
      </DialogHeader>
      {panel}
    </DialogContent>
  );
};

export default AddMemberDialog;
