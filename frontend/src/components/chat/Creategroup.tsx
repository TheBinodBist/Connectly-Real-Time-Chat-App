import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "#components/ui/dialog";
import { useChatStore } from "#lib/chatStore";
import CreateGroupForm from "./Creategroupform";



// Dialog shell only. Open/closed state lives in the store, so any component
// can open it with setGroupDialogOpen(true).
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

        {/* Mounted only while open, so its local state resets on every open. */}
        {open && <CreateGroupForm onDone={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  );
}
