import { Calendar, Home, Inbox, Search, Settings } from "lucide-react";

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
} from "@/components/ui/sidebar";
import { ModeToggle } from "./dark-mode-toggle";

const items = [
  {
    title: "Home",
    url: "#",
    icon: Home,
  },
  {
    title: "Inbox",
    url: "#",
    icon: Inbox,
  },
  {
    title: "Calendar",
    url: "#",
    icon: Calendar,
  },
  {
    title: "Search",
    url: "#",
    icon: Search,
  },
  {
    title: "Settings",
    url: "#",
    icon: Settings,
  },
];

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent className="absolute top-10">
        <SidebarHeader>
          <h1 className="text-lg font-bold">Portal Informasi Publik</h1>
          <p className="text-sm text-gray-500">Kabupaten Madiun</p>
        </SidebarHeader>
        <SidebarGroup>
          <SidebarGroupLabel>RAG</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
            <ModeToggle />
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarFooter>
          <p className="text-sm text-gray-500">© 2023 Kabupaten Madiun</p>
        </SidebarFooter>
      </SidebarContent>
    </Sidebar>
  );
}
