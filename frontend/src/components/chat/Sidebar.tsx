import { useMemo } from "react";
import { RefreshCw, Search } from "lucide-react";

import { Button } from "#components/ui/button";
import { Input } from "#components/ui/input";
import { ScrollArea } from "#components/ui/scroll-area";
import { Skeleton } from "#components/ui/skeleton";
import { useChatStore } from "#lib/chatStore";
import { cn } from "#lib/utils";

import ConversationAvatar from "./ConversationAvatar";
import Header from "./Header";

type Props = {
  onLogout: () => void;
};

export default function Sidebar({ onLogout }: Props) {
  const users = useChatStore((s) => s.users);
  const groups = useChatStore((s) => s.groups);
  const loading = useChatStore((s) => s.loading);
  const error = useChatStore((s) => s.error);
  const search = useChatStore((s) => s.search);
  const selectedKey = useChatStore((s) => s.selectedKey);
  const setSearch = useChatStore((s) => s.setSearch);
  const selectConversation = useChatStore((s) => s.selectConversation);
  const fetchConversations = useChatStore((s) => s.fetchConversations);

  // Derived data is computed here (not inside the store selector) so the
  // array reference stays stable between renders.
  const Conversations = useMemo(() => {
    const all = [...groups, ...users];
    const query = search.trim().toLowerCase();
    if (!query) return all;
    return all.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.subtitle.toLowerCase().includes(query),
    );
  }, [groups, users, search]);

  return (
    <aside className="flex w-full max-w-sm shrink-0 flex-col border-r bg-card md:w-[22rem] lg:w-96">
      <Header onLogout={onLogout} />

      {/* Search */}
      <div className="px-4 pb-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="h-9 rounded-full border-0 bg-muted pl-9 shadow-none focus-visible:ring-1"
          />
        </div>
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        <div className="px-2 pb-2">
          {loading &&
            Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}

          {!loading && error && (
            <div className="flex flex-col items-center gap-3 p-6 text-center">
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchConversations()}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </div>
          )}

          {!loading &&
            !error &&
            Conversations.map((Conversation) => (
              <button
                key={Conversation.key}
                onClick={() => selectConversation(Conversation.key)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors",
                  selectedKey === Conversation.key
                    ? "bg-accent"
                    : "hover:bg-accent/50",
                )}
              >
                <ConversationAvatar
                  Conversation={Conversation}
                  className="h-12 w-12"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-[15px] font-semibold">
                    {Conversation.name}
                  </h3>
                  {Conversation.subtitle && (
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {Conversation.subtitle}
                    </p>
                  )}
                </div>
              </button>
            ))}

          {!loading && !error && Conversations.length === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">
              {search.trim() ? "No chats found." : "No chats yet."}
            </p>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}
