import { create } from "zustand";

import {
  CONVERSATIONS_ENDPOINT,
  CREATE_CONVERSATION_ENDPOINT,
  USERS_ENDPOINT,
} from "../lib/constants";

import api from "#lib/axiosInstance";
import type { ApiGroup, ApiUser, Conversation } from "../components/chat/types";
import {
  extractList,
  getErrorMessage,
  groupToConversation,
  userToConversation,
} from "./utils";

type ChatState = {

  users: Conversation[];
  groups: Conversation[];
  loading: boolean;
  error: string | null;


  search: string;
  selectedKey: string | null;
  groupDialogOpen: boolean;


  fetchConversations: (signal?: AbortSignal) => Promise<void>;
  setSearch: (value: string) => void;
  selectConversation: (key: string | null) => void;
  setGroupDialogOpen: (open: boolean) => void;
  createGroup: (name: string, memberKeys: string[]) => Promise<void>;
};

export const useChatStore = create<ChatState>()((set, get) => ({
  users: [],
  groups: [],
  loading: true,
  error: null,

  search: "",
  selectedKey: null,
  groupDialogOpen: false,

  fetchConversations: async (signal) => {
    set({ loading: true, error: null });

    const [usersRes, ConversationsRes] = await Promise.allSettled([
      api.get(USERS_ENDPOINT, { signal }),
      api.get(CONVERSATIONS_ENDPOINT, { signal }),
    ]);

    if (signal?.aborted) return;

    set({
      loading: false,
      ...(usersRes.status === "fulfilled"
        ? {
            users: extractList<ApiUser>(usersRes.value.data).map(
              userToConversation,
            ),
          }
        : {
            error: getErrorMessage(
              usersRes.reason,
              "Couldn't load your chats. Please try again.",
            ),
          }),

      ...(ConversationsRes.status === "fulfilled"
        ? {
            groups: extractList<ApiGroup>(ConversationsRes.value.data)
              .filter((c) => c.Conversation_type === "group")
              .map(groupToConversation),
          }
        : {}),
    });
  },

  setSearch: (search) => set({ search }),

  selectConversation: (selectedKey) => set({ selectedKey }),

  setGroupDialogOpen: (groupDialogOpen) => set({ groupDialogOpen }),


  createGroup: async (name, memberKeys) => {
    const memberIds = get()
      .users.filter((u) => memberKeys.includes(u.key))
      .map((u) => u.apiId);

    const { data } = await api.post(CREATE_CONVERSATION_ENDPOINT, {
      Conversation_type: "group",
      name,
      member_ids: memberIds,
    });
    const group = groupToConversation(data);

    set((state) => ({
      groups: [group, ...state.groups.filter((g) => g.key !== group.key)],
      selectedKey: group.key,
    }));
  },
}));
