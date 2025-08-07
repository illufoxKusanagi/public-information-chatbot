"use client";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/ui/app-sidebar";
import { ModeToggle } from "@/components/ui/dark-mode-toggle";
import MainContent from "@/components/chat/main-chat-page";

export default function Home() {
  return (
    <div className="flex flex-col h-screen relative">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>
      <SidebarProvider defaultOpen={true}>
        <div className="flex flex-row h-full w-full">
          <AppSidebar />
          <main className="flex-1 overflow-y-auto">
            <MainContent />
          </main>
        </div>
      </SidebarProvider>
      <footer className="flex flex-col w-full items-center absolute bottom-0">
        <p className="body-small-regular">Made with 💗 by Illufox Kasunagi</p>
      </footer>
    </div>
  );
}
