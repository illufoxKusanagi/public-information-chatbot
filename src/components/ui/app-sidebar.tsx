// // Add this to your existing AppSidebar component

// import { useAuth } from "@/app/context/auth-context";
// import { Button } from "@/components/ui/button";
// import { LogOut, User } from "lucide-react";

// // Edited Here: Add user section to sidebar
// export function AppSidebar() {
//   const { user, logout, isAuthenticated } = useAuth();

//   return (
//     <div className="sidebar">
//       {/* ...existing sidebar content... */}

//       {/* Edited Here: Add user section at bottom of sidebar */}
//       {isAuthenticated && user && (
//         <div className="mt-auto p-4 border-t">
//           <div className="flex items-center gap-2 mb-2">
//             <User className="h-4 w-4" />
//             <span className="text-sm font-medium">{user.name}</span>
//           </div>
//           <div className="text-xs text-muted-foreground mb-2">{user.email}</div>
//           <Button
//             variant="outline"
//             size="sm"
//             onClick={logout}
//             className="w-full"
//           >
//             <LogOut className="h-4 w-4 mr-2" />
//             Logout
//           </Button>
//         </div>
//       )}
//     </div>
//   );
// }

"use client";
import { LogOut, Plus, User } from "lucide-react";

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
import { useAuth } from "@/app/context/auth-context";

interface ChatHistoryItem {
  id: number;
  title: string;
  userId: number;
  createdAt: string;
}

export function AppSidebar() {
  const { open } = useSidebar();
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const data = {
    user: {
      name: user?.name || "Guest",
      email: user?.email || "guest@example.com",
      avatar: "/avatars/shadcn.jpg",
    },
  };

  useEffect(() => {
    const fetchChatHistory = async () => {
      // Edited Here: Only fetch chat history if user is authenticated
      if (!isAuthenticated || !user) {
        setChatHistory([]);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/chat/history");
        if (!response.ok) {
          if (response.status === 401) {
            console.warn("Unauthorized access to chat history");
            setChatHistory([]);
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setChatHistory(data);
      } catch (error) {
        console.error("Failed to fetch chat history:", error);
        setChatHistory([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChatHistory();
  }, [isAuthenticated, user]); // Edited Here: Added auth dependencies

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
              {isAuthenticated && (
                <SidebarGroup>
                  <SidebarGroupLabel>Chat History</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {isLoading ? (
                        <SidebarMenuItem>
                          <SidebarMenuButton disabled>
                            <span>Loading...</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ) : chatHistory.length > 0 ? (
                        chatHistory.map((chat) => (
                          <SidebarMenuItem key={chat.id}>
                            <SidebarMenuButton asChild>
                              <Link href={`/chat?id=${chat.id}`}>
                                <span className="truncate">{chat.title}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))
                      ) : (
                        <SidebarMenuItem>
                          <SidebarMenuButton disabled>
                            <span>No chats yet</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
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
