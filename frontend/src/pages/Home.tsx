import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Archive,
  LogOut,
  MessageCircle,
  Mic,
  MoreVertical,
  Paperclip,
  Phone,
  RefreshCw,
  Search,
  Send,
  Settings,
  Smile,
  SquarePen,
  Video,
} from "lucide-react";

import { Avatar, AvatarFallback } from "#components/ui/avatar";
import { Button } from "#components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#components/ui/dropdown-menu";
import { Input } from "#components/ui/input";
import { ScrollArea } from "#components/ui/scroll-area";
import { Skeleton } from "#components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "#components/ui/tooltip";
import api from "#lib/axiosInstance";
import { cn } from "#lib/utils";

// Adjust this to match your backend route.
const USERS_ENDPOINT = "/users/";

const SIGNAL_BLUE = "bg-[#2C6BED]";

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-pink-500",
  "bg-purple-500",
  "bg-emerald-500",
  "bg-orange-500",
  "bg-teal-500",
  "bg-rose-500",
  "bg-indigo-500",
];

// Shape returned by your API. Extend with whatever fields you have.
type ApiUser = {
  id: number | string;
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
};

type ChatUser = {
  id: string;
  name: string;
  subtitle: string;
  initials: string;
  color: string;
};

const hashString = (value: string) =>
  Array.from(value).reduce((acc, char) => acc + char.charCodeAt(0), 0);

const toChatUser = (user: ApiUser): ChatUser => {
  const fullName = [user.first_name, user.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  const name = fullName || user.username || user.email || `User ${user.id}`;
  const initials =
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?";
  const id = String(user.id);

  return {
    id,
    name,
    subtitle: user.email || (user.username ? `@${user.username}` : ""),
    initials,
    color: AVATAR_COLORS[hashString(id) % AVATAR_COLORS.length],
  };
};

export default function Home() {
  const navigate = useNavigate();

  const [users, setUsers] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const fetchUsers = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await api.get(USERS_ENDPOINT, { signal });
      // Supports both a plain array and a paginated { results: [] } response.
      const list: ApiUser[] = Array.isArray(data)
        ? data
        : (data?.results ?? []);
      setUsers(list.map(toChatUser));
    } catch (err: unknown) {
      if (signal?.aborted) return;
      const apiMessage = (err as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail;
      setError(apiMessage ?? "Couldn't load your chats. Please try again.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchUsers(controller.signal);
    return () => controller.abort();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.subtitle.toLowerCase().includes(query),
    );
  }, [users, search]);

  const selected = users.find((user) => user.id === selectedId) ?? null;

  const sendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!message.trim()) return;
    // TODO: send the message to your messages API once it exists.
    setMessage("");
  };

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    navigate("/login", { replace: true });
  };

  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden bg-background text-foreground">
        {/* Conversation list */}
        <aside className="flex w-full max-w-sm shrink-0 flex-col border-r bg-card md:w-[22rem] lg:w-96">
          {/* Header */}
          <div className="flex items-center gap-2 px-4 pb-2 pt-4">
            <DropdownMenu>
              <DropdownMenuTrigger>
                <button
                  aria-label="Account menu"
                  className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarFallback
                      className={cn(
                        "text-xs font-semibold text-white",
                        SIGNAL_BLUE,
                      )}
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
                  onClick={handleLogout}
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
                <Button variant="ghost" size="icon" className="rounded-full">
                  <SquarePen className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>New message</TooltipContent>
            </Tooltip>
          </div>

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

          {/* Users */}
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
                    onClick={() => fetchUsers()}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry
                  </Button>
                </div>
              )}

              {!loading &&
                !error &&
                filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => setSelectedId(user.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors",
                      selectedId === user.id
                        ? "bg-accent"
                        : "hover:bg-accent/50",
                    )}
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarFallback
                        className={cn("font-semibold text-white", user.color)}
                      >
                        {user.initials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-[15px] font-semibold">
                        {user.name}
                      </h3>
                      {user.subtitle && (
                        <p className="mt-0.5 truncate text-sm text-muted-foreground">
                          {user.subtitle}
                        </p>
                      )}
                    </div>
                  </button>
                ))}

              {!loading && !error && filteredUsers.length === 0 && (
                <p className="p-6 text-center text-sm text-muted-foreground">
                  {search ? "No chats found." : "No users yet."}
                </p>
              )}
            </div>
          </ScrollArea>
        </aside>

        {/* Chat window */}
        <main className="hidden min-w-0 flex-1 flex-col bg-background md:flex">
          {selected ? (
            <>
              {/* Header */}
              <header className="flex items-center gap-3 border-b bg-card px-4 py-3 sm:px-6">
                <Avatar className="h-10 w-10">
                  <AvatarFallback
                    className={cn("font-semibold text-white", selected.color)}
                  >
                    {selected.initials}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-semibold leading-tight">
                    {selected.name}
                  </h2>
                  {selected.subtitle && (
                    <p className="truncate text-xs text-muted-foreground">
                      {selected.subtitle}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full"
                      >
                        <Video className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Video call</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full"
                      >
                        <Phone className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Voice call</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full"
                      >
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
                <Avatar className="h-20 w-20">
                  <AvatarFallback
                    className={cn(
                      "text-2xl font-semibold text-white",
                      selected.color,
                    )}
                  >
                    {selected.initials}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-lg font-semibold">{selected.name}</h3>
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
            </>
          ) : (
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
          )}
        </main>
      </div>
    </TooltipProvider>
  );
}
