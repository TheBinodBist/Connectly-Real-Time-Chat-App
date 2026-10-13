import { useMemo, useState } from "react";
import { Check } from "lucide-react";

import { Button } from "#components/ui/button";
import { DialogFooter } from "#components/ui/dialog";
import { Input } from "#components/ui/input";
import { ScrollArea } from "#components/ui/scroll-area";
import { useChatStore } from "#lib/chatStore";
import { cn, getErrorMessage } from "#lib/utils";
import ConversationAvatar from "./ConversationAvatar";


type Props = {
  onDone: () => void;
};

export default function CreateGroupForm({ onDone }: Props) {
  const users = useChatStore((s) => s.users);
  const createGroup = useChatStore((s) => s.createGroup);

  // Form-only state stays local; shared state lives in the store.
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(query) ||
        u.subtitle.toLowerCase().includes(query),
    );
  }, [users, search]);

  const toggle = (key: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const canSubmit = name.trim().length > 0 && selected.size > 0 && !submitting;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);

    try {
      await createGroup(name.trim(), Array.from(selected));
      onDone();
    } catch (err: unknown) {
      setError(
        getErrorMessage(err, "Couldn't create the group. Please try again."),
      );
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Group name"
        maxLength={100}
        autoFocus
      />

      <div className="space-y-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search people"
          className="h-9"
        />

        <ScrollArea className="h-56 rounded-md border">
          <div className="p-1">
            {filteredUsers.map((user) => {
              const isSelected = selected.has(user.key);
              return (
                <button
                  key={user.key}
                  type="button"
                  onClick={() => toggle(user.key)}
                  className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-accent/50"
                >
                  <ConversationAvatar
                    conversation={user}
                    className="h-9 w-9"
                    textClassName="text-xs"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{user.name}</p>
                    {user.subtitle && (
                      <p className="truncate text-xs text-muted-foreground">
                        {user.subtitle}
                      </p>
                    )}
                  </div>
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                      isSelected &&
                        "border-primary bg-primary text-primary-foreground",
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                  </span>
                </button>
              );
            })}

            {filteredUsers.length === 0 && (
              <p className="p-4 text-center text-sm text-muted-foreground">
                No people found.
              </p>
            )}
          </div>
        </ScrollArea>

        <p className="text-xs text-muted-foreground">
          {selected.size} selected
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={!canSubmit}>
          {submitting ? "Creating..." : "Create group"}
        </Button>
      </DialogFooter>
    </form>
  );
}
