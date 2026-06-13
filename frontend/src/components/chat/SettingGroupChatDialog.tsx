import React, { useState } from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogClose } from '../ui/dialog';
import { Button } from '../ui/button';
import { MoreHorizontal, Plus, UserMinus, ChevronLeft } from 'lucide-react';
import AddMemberDialog from './AddMemberDialog';
import DeleteMemberDialog from './DeleteMemberDialog';

interface Props {
  conversationId: string;
}

const SettingGroupChatDialog: React.FC<Props> = ({ conversationId }) => {
  const [mode, setMode] = useState<'home' | 'add' | 'remove'>('home');

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" aria-label="Group settings">
          <MoreHorizontal />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md glass">
        <DialogHeader>
          {mode === 'home' ? (
            <DialogTitle>Group Settings</DialogTitle>
          ) : (
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon-sm" onClick={() => setMode('home')}>
                <ChevronLeft />
              </Button>
              <DialogTitle>{mode === 'add' ? 'Thêm thành viên' : 'Xóa thành viên'}</DialogTitle>
            </div>
          )}
        </DialogHeader>

        <div className="mt-2">
          {mode === 'home' && (
            <div className="grid grid-cols-1 gap-3">
              <Button onClick={() => setMode('add')} className="justify-start" variant="outline">
                <span className="flex items-center gap-2"><Plus /> Thêm thành viên</span>
              </Button>

              <Button onClick={() => setMode('remove')} className="justify-start" variant="destructive">
                <span className="flex items-center gap-2"><UserMinus /> Xóa thành viên</span>
              </Button>
            </div>
          )}

          {mode === 'add' && (
            <div className="mt-3">
              <AddMemberDialog conversationId={conversationId} asPanel onClose={() => setMode('home')} />
            </div>
          )}

          {mode === 'remove' && (
            <div className="mt-3">
              <DeleteMemberDialog conversationId={conversationId} asPanel onClose={() => setMode('home')} />
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <DialogClose asChild>
            <Button variant="ghost">Close</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingGroupChatDialog;
