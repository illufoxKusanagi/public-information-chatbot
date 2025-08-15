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
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { NavUser } from "./nav-user";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const data = {
  user: {
    name: "Illufox Kasunagi",
    email: "illufox@examp.com",
    avatar: "/avatars/shadcn.jpg",
  },
};

interface ChatHistoryItem {
  id: string;
  title: string;
}

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
  const { open } = useSidebar();
  const pathname = usePathname();
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);

  useEffect(() => {
    const keys = Object.keys(localStorage).filter((key) =>
      key.startsWith("chat_")
    );
    const history = keys
      .map((key) => {
        const messages = JSON.parse(localStorage.getItem(key) || "[]");
        return {
          id: key.replace("chat_", ""),
          title: messages[0]?.content.substring(0, 25) + "..." || "New Chat",
        };
      })
      .sort((a, b) => parseInt(b.id) - parseInt(a.id));
    setChatHistory(history);
  }, [pathname]);

  // useEffect(() => {
  //   const keys = Object.keys(localStorage).filter((key) =>
  //     key.startsWith("chat_")
  //   );
  //   const history = keys.map((key) => {
  //     const messages = JSON.parse(localStorage.getItem(key) || "[]");
  //     return {
  //       id: key.replace("chat_", ""),
  //       title: messages[0]?.content.substring(0, 25) + "..." || "New Chat",
  //     };
  //   }).sort((a, b) => parseInt(b.id) - parseInt(a.id)); // Sort by newest first
  //   setChatHistory(history);
  // }, [pathname]); // Re-scan localStorage on route change

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarContent className="pt-2 relative">
        <SidebarTrigger className="m-2.5" />
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
        <SidebarMenu className="p-2">
          <SidebarMenuButton variant={"block"} className="py-4" asChild>
            <Link href="/">
              <Plus size="icon" />
              {open && <span>Percakapan Baru</span>}
            </Link>
          </SidebarMenuButton>
        </SidebarMenu>
        <SidebarGroup>
          <SidebarGroupLabel>Percakapan</SidebarGroupLabel>
          <SidebarGroupContent className="max-h-[30rem] overflow-y-auto">
            <SidebarMenu>
              {chatHistory.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton asChild>
                    <Link href={`/chat?id=${item.id}`}>
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarFooter className="absolute bottom-0 w-full">
          <NavUser user={data.user} />
        </SidebarFooter>
      </SidebarContent>
    </Sidebar>
  );
}
