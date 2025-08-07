"use client";

import { AppSidebar } from "@/components/ui/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ModeToggle } from "@/components/ui/dark-mode-toggle";
import { cn } from "@/lib/utils";
import ChatInput from "@/components/chat/chat-input";

interface Message {
  role: "user" | "bot";
  content: string;
}

function ChatMessage({ role, content }: Message) {
  return (
    <div
      className={cn(
        "flex w-full items-start gap-4 rounded-lg p-4",
        role === "user" ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-2xl rounded-lg p-3",
          role === "user"
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        )}
      >
        <p className="text-sm">{content}</p>
      </div>
    </div>
  );
}

function ChatHistory() {
  const searchParams = useSearchParams();
  const initialMessage = searchParams.get("message");
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    let timerId: NodeJS.Timeout;
    if (initialMessage) {
      // Add user's initial message
      setMessages([{ role: "user", content: initialMessage }]);

      // Mock bot response after a delay
      timerId = setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            content: "Selamat datang, apakah ada yang bisa saya bantu?",
          },
        ]);
      }, 1000);
    }

    // Cleanup function: This will run when the component unmounts
    return () => {
      clearTimeout(timerId);
    };
  }, [initialMessage]);

  return (
    <div className="flex-1 space-y-4 overflow-y-auto p-4 pt-16">
      {messages.map((msg, index) => (
        <ChatMessage key={index} role={msg.role} content={msg.content} />
      ))}
    </div>
  );
}

function ChatPageContent() {
  return (
    <div className="flex h-full flex-1 flex-col">
      <Suspense fallback={<div>Loading chat...</div>}>
        <ChatHistory />
      </Suspense>
      <div className="flex mt-auto p-6 justify-center w-full absolute bottom-2">
        {/* This input is for follow-up messages, not implemented in this example */}
        <ChatInput />
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <div className="flex flex-col h-screen relative">
      <div className="absolute top-4 right-4 z-10">
        <ModeToggle />
      </div>
      <SidebarProvider defaultOpen={true}>
        <div className="flex flex-row w-full">
          <AppSidebar />
          <main className="flex flex-col w-full relative">
            <div className="flex bg-secondary h-16 w-full items-center justify-center">
              <p className="body-medium-bold">Chat baru</p>
            </div>
            <ChatPageContent />
            <footer className="flex flex-col h-6 w-full justify-center items-center absolute bottom-0 bg-sky-800">
              <p className="body-small-regular">
                Made with 💗 by Illufox Kasunagi
              </p>
            </footer>
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
}
