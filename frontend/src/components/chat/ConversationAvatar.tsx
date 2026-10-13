import { Users } from "lucide-react";

import { Avatar, AvatarFallback } from "#components/ui/avatar";
import { cn } from "#lib/utils";

import type { Conversation } from "./types";

type Props = {
  conversation: Pick<Conversation, "kind" | "initials" | "color">;
  className?: string; // size, e.g. "h-12 w-12"
  textClassName?: string; // initials size, e.g. "text-2xl"
  iconClassName?: string; // group icon size, e.g. "h-6 w-6"
};

export default function ConversationAvatar({
  conversation,
  className,
  textClassName,
  iconClassName = "h-1/2 w-1/2",
}: Props) {
  return (
    <Avatar className={className}>
      <AvatarFallback
        className={cn(
          "font-semibold text-white",
          textClassName,
          conversation.color,
        )}
      >
        {conversation.kind === "group" ? (
          <Users className={iconClassName} />
        ) : (
          conversation.initials
        )}
      </AvatarFallback>
    </Avatar>
  );
}
