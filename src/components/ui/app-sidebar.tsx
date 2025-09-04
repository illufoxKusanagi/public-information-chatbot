"use client";
import { Plus } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { NavUser } from "./nav-user";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface ChatHistoryItem {
  id: number;
  title: string;
  userId: number;
  createdAt: string;
}

const data = {
  user: {
    name: "Illufox Kasunagi",
    email: "illufox@examp.com",
    avatar: "/avatars/shadcn.jpg",
  },
};

// interface ChatHistoryItem {
//   id: string;
//   title: string;
// }

const items = [
  {
    title: "Chat 1",
    url: "#",
  },
  {
    title: "Chat 2",
    url: "#",
  },
  {
    title: "Chat 3",
    url: "#",
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { open } = useSidebar();
  const [history, setHistory] = useState<ChatHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/chat/history");
        if (!response.ok) throw new Error("Failed to fetch history");
        const data = await response.json();
        setHistory(data);
      } catch (error) {
        toast.error("Could not load chat history");
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const handleNewChat = async () => {
    try {
      const response = await fetch("/api/chat/history", { method: "POST" });
      if (!response.ok) throw new Error("Failet to create new chat");
      const newChat = await response.json();
      router.push(`/chat/${newChat.id}`);
    } catch (error) {
      toast.error("Could not create a new chat session");
    }
  };

  // useEffect(() => {
  //   const keys = Object.keys(localStorage).filter((key) =>
  //     key.startsWith("chat_")
  //   );
  //   const history = keys
  //     .map((key) => {
  //       const messages = JSON.parse(localStorage.getItem(key) || "[]");
  //       return {
  //         id: key.replace("chat_", ""),
  //         title: messages[0]?.content.substring(0, 25) + "..." || "New Chat",
  //       };
  //     })
  //     .sort((a, b) => parseInt(b.id) - parseInt(a.id));
  //   setChatHistory(history);
  // }, [pathname]);

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader
        className={cn(
          "overflow-hidden text-ellipsis whitespace-nowrap transition-all duration-500 ease-in-out",
          open ? "block max-h-12 opacity-100" : "max-h-0 opacity-0 hidden"
        )}
      >
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/">
                <h1 className="text-lg font-bold">Portal Informasi Publik</h1>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {/* NEW CHAT BUTTON */}
          <SidebarMenuButton
            // onClick={handleNewChat}
            variant={"block"}
            className="py-4"
            asChild
          >
            <Link href="/">
              <Plus size="icon" />
              {open && <span>Percakapan Baru</span>}
            </Link>
          </SidebarMenuButton>
          <SidebarGroup>
            <SidebarGroupLabel>History</SidebarGroupLabel>
            <SidebarGroupContent>
              {isLoading ? (
                <p className="p-2 body-small-regular text-muted-foreground">
                  Loading...
                </p>
              ) : history.length > 0 ? (
                history.map((chat) => (
                  <SidebarMenuItem key={chat.id}>
                    <Link href={`/chat/${chat.id}`}>
                      <SidebarMenuButton className="w-full">
                        {chat.title}
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                ))
              ) : (
                <p className="p-2 body-small-regular text-muted-foreground">
                  No chat history
                </p>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="absolute bottom-0 w-full">
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
