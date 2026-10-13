import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "#components/chat/Sidebar";
import { TooltipProvider } from "#components/ui/tooltip";
import { useChatStore } from "#lib/chatStore";
import ChatSection from "#components/chat/Chatsection";
import CreateGroup from "#components/chat/Creategroup";

export default function Home() {
  const navigate = useNavigate();
  const fetchConversations = useChatStore((s) => s.fetchConversations);

  useEffect(() => {
    const controller = new AbortController();
    fetchConversations(controller.signal);
    return () => controller.abort();
  }, [fetchConversations]);

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    navigate("/login", { replace: true });
  };

  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden bg-background text-foreground">
        <Sidebar onLogout={handleLogout} />
        <ChatSection />
      </div>
      <CreateGroup />
    </TooltipProvider>
  );
}
