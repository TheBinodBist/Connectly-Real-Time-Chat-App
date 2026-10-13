import { Archive, LogOut, Settings, UsersRound } from "lucide-react";

import { Avatar, AvatarFallback } from "#components/ui/avatar";
import { Button } from "#components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "#components/ui/tooltip";
import { useChatStore } from "#lib/chatStore";
import { cn } from "#lib/utils";

import { SIGNAL_BLUE } from "../../lib/constants";

type Props = {
  onLogout: () => void;
};

export default function Header({ onLogout }: Props) {
  const setGroupDialogOpen = useChatStore((s) => s.setGroupDialogOpen);

  return (
    <div className="flex items-center gap-2 px-4 pb-2 pt-4">
      <DropdownMenu>
        <DropdownMenuTrigger>
          <button
            aria-label="Account menu"
            className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Avatar className="h-9 w-9">
              <AvatarFallback
                className={cn("text-xs font-semibold text-white", SIGNAL_BLUE)}
              >
                ME
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Archive className="mr-2 h-4 w-4" />
            Archived chats
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onLogout}
            className="text-destructive focus:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <h1 className="flex-1 text-xl font-bold">Chats</h1>

      <Tooltip>
        <TooltipTrigger>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            aria-label="New group"
            onClick={() => setGroupDialogOpen(true)}
          >
            <UsersRound className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>New group</TooltipContent>
      </Tooltip>
    </div>
  );
}
