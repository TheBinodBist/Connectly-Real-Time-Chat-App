import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";

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
import {
  createConversation,
  createMessage,
  getMessages,
} from "#lib/messageApi";

import ConversationAvatar from "./ConversationAvatar";
import type { ChatMessage, Conversation } from "./types";

type ResolvedConversation = {
  key: string;
  id: string;
};

type ConversationCreateResponse = {
  id?: string | number;
  conversation_id?: string | number;
  conversation?: {
    id?: string | number;
    conversation_id?: string | number;
  };
};

export default function ChatSection() {
  const users = useChatStore((s) => s.users);
  const groups = useChatStore((s) => s.groups);
  const selectedKey = useChatStore((s) => s.selectedKey);

  const conversation = useMemo(
    () =>
      [...groups, ...users].find((item) => item.key === selectedKey) ?? null,
    [groups, users, selectedKey],
  );

  const [resolved, setResolved] = useState<ResolvedConversation | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [opening, setOpening] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeConversationRef = useRef<string | null>(null);

  const conversationId =
    conversation?.conversationId ??
    (conversation?.kind === "group" ? conversation.apiId : null) ??
    (resolved?.key === selectedKey ? resolved.id : null);

  activeConversationRef.current = conversationId;

  // Open a direct conversation if this user does not already have one.
  useEffect(() => {
    let active = true;

    setMessages([]);
    setMessage("");
    setError("");
    setResolved(null);

    if (!conversation) {
      setOpening(false);
      setLoading(false);
      return;
    }

    // Capture a non-null value for use in the async function.
    const selectedConversation: Conversation = conversation;

    if (
      selectedConversation.kind === "group" ||
      selectedConversation.conversationId
    ) {
      setOpening(false);
      return;
    }

    setOpening(true);

    async function openDirectConversation() {
      try {
        const data = (await createConversation(
          String(selectedConversation.apiId),
        )) as ConversationCreateResponse;

        const rawId =
          data.id ??
          data.conversation_id ??
          data.conversation?.id ??
          data.conversation?.conversation_id;

        if (
          rawId === undefined ||
          rawId === null ||
          String(rawId).length === 0
        ) {
          console.error("Unexpected conversation API response:", data);
          throw new Error("The API did not return a conversation UUID.");
        }

        if (active) {
          setResolved({
            key: selectedConversation.key,
            id: String(rawId),
          });
        }
      } catch (err) {
        console.error("Failed to open conversation:", err);

        if (active) {
          setError(
            "Could not open this chat. Check the conversation API and try again.",
          );
        }
      } finally {
        if (active) {
          setOpening(false);
        }
      }
    }

    void openDirectConversation();

    return () => {
      active = false;
    };
  }, [
    selectedKey,
    conversation?.key,
    conversation?.apiId,
    conversation?.kind,
    conversation?.conversationId,
  ]);

  // Fetch messages once the conversation UUID is available.
  useEffect(() => {
    let active = true;

    setMessages([]);
    setLoading(false);

    if (!conversationId) {
      return;
    }

    // TypeScript now knows this is a string.
    const id = conversationId;

    async function fetchMessages() {
      setLoading(true);

      try {
        const data = await getMessages(id);

        if (active) {
          setMessages(data);
          setError("");
        }
      } catch (err) {
        console.error("Failed to fetch messages:", err);

        if (active) {
          setError("Failed to load messages.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void fetchMessages();

    return () => {
      active = false;
    };
  }, [conversationId, selectedKey]);

  // Scroll to the newest message.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages]);

  // Send a message.
  const sendMessage = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const content = message.trim();

    if (!content || sending) return;

    if (!conversationId) {
      setError(
        opening
          ? "Opening conversation. Please wait..."
          : "This chat has no conversation ID yet.",
      );
      return;
    }

    const targetConversationId = conversationId;
    const targetKey = selectedKey;

    setSending(true);
    setError("");

    try {
      const newMessage = await createMessage(targetConversationId, content);

      if (
        activeConversationRef.current === targetConversationId &&
        targetKey === selectedKey
      ) {
        setMessages((prev) =>
          prev.some((item) => item.id === newMessage.id)
            ? prev
            : [...prev, newMessage],
        );

        setMessage((current) => (current === content ? "" : current));
      }
    } catch (err) {
      console.error("Failed to send message:", err);

      if (activeConversationRef.current === targetConversationId) {
        setError("Failed to send message. Please try again.");
      }
    } finally {
      setSending(false);
    }
  };

  // No chat selected.
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
    <main className="hidden min-h-0 min-w-0 flex-1 flex-col bg-background md:flex">
      {/* Header */}
      <header className="flex items-center gap-3 border-b bg-card px-4 py-3 sm:px-6">
        <ConversationAvatar Conversation={conversation} className="h-10 w-10" />

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
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-full"
                aria-label="Video call"
              >
                <Video className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Video call</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-full"
                aria-label="Voice call"
              >
                <Phone className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Voice call</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-full"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Search</TooltipContent>
          </Tooltip>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full"
            aria-label="More options"
          >
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
        {opening ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Opening conversation...
            </p>
          </div>
        ) : loading ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-muted-foreground">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <ConversationAvatar
              Conversation={conversation}
              className="h-20 w-20"
              textClassName="text-2xl"
              iconClassName="h-9 w-9"
            />

            <h3 className="text-lg font-semibold">{conversation.name}</h3>

            <p className="max-w-xs text-sm text-muted-foreground">
              {conversationId
                ? "No messages yet. Say hello 👋"
                : "Open a conversation to start messaging."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((msg) => (
              <div key={msg.id} className="flex justify-start">
                <div className="max-w-[75%] rounded-2xl bg-muted px-4 py-2">
                  <p className="break-words text-sm">{msg.content}</p>

                  <p className="mt-1 text-right text-[10px] text-muted-foreground">
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>
        )}

        {error && (
          <p role="alert" className="mt-3 text-center text-sm text-red-500">
            {error}
          </p>
        )}
      </div>

      {/* Message composer */}
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
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                opening ? "Opening conversation..." : "Send a message"
              }
              disabled={opening || !conversationId}
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
              disabled={sending || opening || !conversationId}
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
