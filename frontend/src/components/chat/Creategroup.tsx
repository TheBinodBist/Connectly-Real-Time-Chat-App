import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "#components/ui/dialog";
import { useChatStore } from "#lib/chatStore";
import CreateGroupForm from "./Creategroupform";



export default function CreateGroup() {
  const open = useChatStore((s) => s.groupDialogOpen);
  const setOpen = useChatStore((s) => s.setGroupDialogOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New group</DialogTitle>
          <DialogDescription>
            Name your group and pick who to add.
          </DialogDescription>
        </DialogHeader>


        {open && <CreateGroupForm onDone={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  );
}
