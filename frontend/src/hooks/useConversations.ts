import { useCallback, useEffect, useMemo, useState } from "react";
import type { ApiGroup, ApiUser, Conversation } from "../components/chat/types";

import api from "#lib/axiosInstance";
import {
  extractList,
  getErrorMessage,
  groupToConversation,
  userToConversation,
} from "#lib/utils";
import {
  CONVERSATIONS_ENDPOINT,
  CREATE_CONVERSATION_ENDPOINT,
  USERS_ENDPOINT,
} from "#lib/constants";

export function useConversations() {
  const [users, setUsers] = useState<Conversation[]>([]);
  const [groups, setGroups] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);

    const [usersRes, conversationsRes] = await Promise.allSettled([
      api.get(USERS_ENDPOINT, { signal }),
      api.get(CONVERSATIONS_ENDPOINT, { signal }),
    ]);

    if (signal?.aborted) return;


    if (conversationsRes.status === "rejected") {
      console.error("Couldn't load conversations:", conversationsRes.reason);
    }

    if (usersRes.status === "fulfilled") {
      setUsers(
        extractList<ApiUser>(usersRes.value.data).map(userToConversation),
      );
    } else {
      setError(
        getErrorMessage(
          usersRes.reason,
          "Couldn't load your chats. Please try again.",
        ),
      );
    }


    if (conversationsRes.status === "fulfilled") {
      setGroups(
        extractList<ApiGroup>(conversationsRes.value.data)
          .filter((c) => c.Conversation_type === "group")
          .map(groupToConversation),
      );
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchAll(controller.signal);
    return () => controller.abort();
  }, [fetchAll]);

  const addGroup = useCallback((group: Conversation) => {
    setGroups((prev) => [group, ...prev.filter((g) => g.key !== group.key)]);
  }, []);


  const createGroup = useCallback(
    async (name: string, memberKeys: string[]) => {
      const memberIds = users
        .filter((u) => memberKeys.includes(u.key))
        .map((u) => u.apiId);

      const { data } = await api.post(CREATE_CONVERSATION_ENDPOINT, {
        conversation_type: "group",
        name,
        member_ids: memberIds,
      });

      const group = groupToConversation(data);
      addGroup(group);
      return group;
    },
    [users, addGroup],
  );

  const conversations = useMemo(() => [...groups, ...users], [groups, users]);

  return {
    users,
    conversations,
    loading,
    error,
    refetch: () => fetchAll(),
    addGroup,
    createGroup,
  };
}
