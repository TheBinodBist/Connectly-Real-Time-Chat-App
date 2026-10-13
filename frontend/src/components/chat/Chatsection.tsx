import { useEffect, useMemo, useState } from "react";
import {
  MessageCircle,
  Mic,
  MoreVertical,
  Paperclip,
  Phone,
  Search,
  Send,
  Smile,
  Video,
} from "lucide-react";

import { Button } from "#components/ui/button";
import { Input } from "#components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "#components/ui/tooltip";
import { useChatStore } from "#lib/chatStore";
import { cn } from "#lib/utils";
import { SIGNAL_BLUE } from "../../lib/constants";
import ConversationAvatar from "./ConversationAvatar";

export default function ChatSection() {
  const users = useChatStore((s) => s.users);
  const groups = useChatStore((s) => s.groups);
  const selectedKey = useChatStore((s) => s.selectedKey);

  const conversation = useMemo(
    () => [...groups, ...users].find((c) => c.key === selectedKey) ?? null,
    [groups, users, selectedKey],
  );

  const [message, setMessage] = useState("");

  // Don't carry a half-typed draft into another chat.
  useEffect(() => setMessage(""), [selectedKey]);

  const sendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!message.trim()) return;
    // TODO: send the message to your messages API once it exists.
    setMessage("");
  };

  if (!conversation) {
    return (
      <main className="hidden min-w-0 flex-1 flex-col bg-background md:flex">
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <div
            className={cn(
              "flex h-16 w-16 items-center justify-center rounded-full text-white",
              SIGNAL_BLUE,
            )}
          >
            <MessageCircle className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-semibold">Connectly</h2>
          <p className="max-w-xs text-sm text-muted-foreground">
            Select a chat from the list to start messaging.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="hidden min-w-0 flex-1 flex-col bg-background md:flex">
      {/* Header */}
      <header className="flex items-center gap-3 border-b bg-card px-4 py-3 sm:px-6">
        <ConversationAvatar conversation={conversation} className="h-10 w-10" />

        <div className="min-w-0 flex-1">
          <h2 className="truncate font-semibold leading-tight">
            {conversation.name}
          </h2>
          {conversation.subtitle && (
            <p className="truncate text-xs text-muted-foreground">
              {conversation.subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Video className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Video call</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Phone className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Voice call</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Search className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Search</TooltipContent>
          </Tooltip>
          <Button variant="ghost" size="icon" className="rounded-full">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Messages placeholder */}
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <ConversationAvatar
          conversation={conversation}
          className="h-20 w-20"
          textClassName="text-2xl"
          iconClassName="h-9 w-9"
        />
        <h3 className="text-lg font-semibold">{conversation.name}</h3>
        <p className="max-w-xs text-sm text-muted-foreground">
          No messages yet. Say hello 👋
        </p>
      </div>

      {/* Composer */}
      <form
        onSubmit={sendMessage}
        className="border-t bg-card px-4 py-3 sm:px-6"
      >
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 rounded-full"
            aria-label="Attach"
          >
            <Paperclip className="h-5 w-5" />
          </Button>

          <div className="relative flex-1">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Send a message"
              className="h-11 rounded-full border-0 bg-muted pl-4 pr-11 shadow-none focus-visible:ring-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full"
              aria-label="Emoji"
            >
              <Smile className="h-5 w-5" />
            </Button>
          </div>

          {message.trim() ? (
            <Button
              type="submit"
              size="icon"
              className={cn(
                "h-11 w-11 shrink-0 rounded-full text-white hover:bg-[#2459c9]",
                SIGNAL_BLUE,
              )}
              aria-label="Send message"
            >
              <Send className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-11 w-11 shrink-0 rounded-full"
              aria-label="Voice message"
            >
              <Mic className="h-5 w-5" />
            </Button>
          )}
        </div>
      </form>
    </main>
  );
}
