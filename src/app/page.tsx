"use client";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/ui/app-sidebar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ArrowUp, Plus, Image, Paperclip } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function ChatInput() {
  return (
    <div className="relative w-full max-w-3xl min-h-32">
      <div className="absolute bottom-5 right-5">
        <Button type="submit" size="icon" className="rounded-lg">
          <ArrowUp className="h-5 w-5" />
          <span className="sr-only">Send</span>
        </Button>
      </div>
      <div className="absolute bottom-5 left-5 flex gap-2">
        <AddAttachment />
        <Button variant="outline" size="icon" className="rounded-lg w-24 ml-1">
          <p className="body-medium-regular">FAQ</p>
        </Button>
      </div>
      <Textarea
        placeholder="Tanyakan apapun tentang Kabupaten Madiun..."
        className="min-h-32 w-full resize-none rounded-xl p-5 pr-16 pb-20"
      />
    </div>
  );
}

function MainContent() {
  return (
    <div className="flex-1 flex flex-col gap-4 items-center h-full justify-center w-full">
      <div className="flex flex-col w-[40rem] gap-4 text-center">
        <p className="body-bigger-bold">Selamat Datang!!</p>
        <h1 className="title-regular text-wrap">
          Di Portal Informasi Publik Kabupaten Madiun
        </h1>
        <p className="body-big-regular">Silahkan tanyakan apapun</p>
      </div>
      <ChatInput />
    </div>
  );
}

function AddAttachment() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Plus className="h-5 w-5" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuItem>
          <Image />
          Lampirkan Foto
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Paperclip />
          Lampirkan Dokumen
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col h-screen">
      <SidebarProvider defaultOpen={true}>
        <div className="flex flex-row h-full w-full">
          <AppSidebar />
          <main className="flex-1 overflow-y-auto">
            <SidebarTrigger className="absolute top-4 left-4 z-20" />
            <MainContent />
          </main>
        </div>
      </SidebarProvider>
      <footer className="flex flex-col w-full items-center absolute bottom-0">
        <p>Made with 💗 by Illufox Kasunagi</p>
      </footer>
    </div>
  );
}
