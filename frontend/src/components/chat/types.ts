export type ApiUser = {
  id: number | string;
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
};

export type ApiGroup = {
  id: number | string;
  Conversation_type?: "direct" | "group";
  name?: string | null;
  display_name?: string;
  members?: unknown[];
  members_count?: number;
};

export type ConversationKind = "user" | "group";

export type Conversation = {
  key: string;
  apiId: string;
  conversationId?: string;
  kind: "user" | "group";
  name: string;
  subtitle?: string;
  initials: string;
  color: string;
};

export type ChatMessage = {
  id: string;
  conversation: string;
  sender: string;
  content: string;
  created_at: string;
};
