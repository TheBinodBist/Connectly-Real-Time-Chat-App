
export type ApiUser = {
  id: number | string;
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
};

export type ApiGroup = {
  id: number | string;
  conversation_type?: "direct" | "group";
  name?: string | null;
  display_name?: string;
  members?: unknown[];
  members_count?: number;
};

export type ConversationKind = "user" | "group";


export type Conversation = {
  key: string; // unique across kinds, e.g. "user:1" / "group:1"
  apiId: number | string;
  kind: ConversationKind;
  name: string;
  subtitle: string;
  initials: string;
  color: string;
};
