export { cn } from "cn";

import { AVATAR_COLORS } from "./constants";
import type { ApiGroup, ApiUser, Conversation } from "../components/chat/types";

const hashString = (value: string) =>
  Array.from(value).reduce((acc, char) => acc + char.charCodeAt(0), 0);

const pickColor = (seed: string) =>
  AVATAR_COLORS[hashString(seed) % AVATAR_COLORS.length];

export const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "?";

export const userToConversation = (user: ApiUser): Conversation => {
  const fullName = [user.first_name, user.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  const name = fullName || user.username || user.email || `User ${user.id}`;
  const key = `user:${user.id}`;

  return {
    key,
    apiId: user.id,
    kind: "user",
    name,
    subtitle: user.email || (user.username ? `@${user.username}` : ""),
    initials: getInitials(name),
    color: pickColor(key),
  };
};

export const groupToConversation = (group: ApiGroup): Conversation => {
  const name =
    group.display_name?.trim() || group.name?.trim() || `Group ${group.id}`;
  const count = group.members_count ?? group.members?.length;
  const key = `group:${group.id}`;

  return {
    key,
    apiId: group.id,
    kind: "group",
    name,
    subtitle:
      count != null ? `${count} member${count === 1 ? "" : "s"}` : "Group",
    initials: getInitials(name),
    color: pickColor(key),
  };
};

// Supports both a plain array and a paginated { results: [] } response.
export function extractList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  return (data as { results?: T[] } | null)?.results ?? [];
}

// Surfaces DRF errors: {"detail": "..."} or field errors like {"name": ["..."]}.
export const getErrorMessage = (err: unknown, fallback: string) => {
  const data = (err as { response?: { data?: unknown } })?.response?.data;

  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    if (typeof record.detail === "string") return record.detail;

    const first = Object.values(record)[0];
    const message = Array.isArray(first) ? first[0] : first;
    if (typeof message === "string") return message;
  }

  return fallback;
};
