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
export function AppSidebar() {
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
  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          open ? "px-4 pt-4 pb-2 block opacity-100" : "p-0 opacity-0 hidden"
        )}
      >
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="hover:bg-accent/50 h-16">
              <Link href="/">
                <h1 className="body-big-bold text-primary text-center">
                  Portal Informasi Publik
                </h1>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent
        className={cn(
          "flex flex-col gap-4 transition-all duration-300",
          open ? "px-4 py-2" : "p-2"
        )}
      >
        <SidebarMenu>
          <SidebarMenuButton
            variant="block"
            className="h-10 px-4 py-3 justify-start gap-3 transition-colors"
            asChild
          >
            <Link href="/">
              <Plus size="icon" className="shrink-0" />
              {open && (
                <span className="body-medium-bold">Percakapan Baru</span>
              )}
            </Link>
          </SidebarMenuButton>

          <SidebarGroup className="mt-2">
            <SidebarGroupLabel className="px-2 py-2">
              <span className="body-small-bold text-muted-foreground uppercase ">
                History
              </span>
            </SidebarGroupLabel>
            <SidebarGroupContent className="space-y-1">
              {isLoading ? (
                <div className="py-4 text-center">
                  {" "}
                  <p className="text-sm text-muted-foreground">
                    Loading...
                  </p>{" "}
                </div>
              ) : history.length > 0 ? (
                history.map((chat) => (
                  <SidebarMenuItem key={chat.id}>
                    <Link href={`/chat/${chat.id}`}>
                      <SidebarMenuButton
                        className={cn(
                          "transition-colors",
                          open
                            ? "w-full h-10 px-3 py-2 justify-start text-left hover:bg-accent/50 rounded-md"
                            : "h-10 w-10 p-0 justify-center hover:bg-accent/50 rounded-md mx-auto"
                        )}
                      >
                        <span className="truncate body-medium-regular">
                          {chat.title}
                        </span>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                ))
              ) : (
                <div className="py-6 text-center">
                  {" "}
                  <p className="body-small-regular text-muted-foreground">
                    {" "}
                    No chat history
                  </p>
                </div>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter
        className={cn(
          "absolute bottom-0 w-full border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
          open ? "p-3" : "p-2"
        )}
      >
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
