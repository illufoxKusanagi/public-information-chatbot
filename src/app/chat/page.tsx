"use client";

import { AppSidebar } from "@/components/ui/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Suspense } from "react";
import { ModeToggle } from "@/components/ui/dark-mode-toggle";
import { cn } from "@/lib/utils";
import ChatInput from "@/components/chat/chat-input";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { Message } from "@/types/chat";
import { useChat } from "@/hooks/use-chat";

function TextBubble({
  role,
  content,
  isThinking = false,
}: Message & { isThinking?: boolean }) {
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
            : "bg-muted text-muted-foreground",
          isThinking && "animate-pulse"
        )}
      >
        <p className="text-sm">{content}</p>
      </div>
    </div>
  );
}

function ChatHistory({
  isLoading,
  messages,
}: {
  isLoading: boolean;
  messages: Message[];
}) {
  return (
    <div className="flex-1 space-y-4 overflow-y-auto p-4 pt-16">
      {messages.map((msg, index) => (
        <TextBubble key={index} role={msg.role} content={msg.content} />
      ))}
      {isLoading && (
        <TextBubble role="bot" content="Bot sedang berpikir..." isThinking />
      )}
    </div>
  );
}

function ChatPageContent() {
  const { messages, isLoading, handleSendMessage } = useChat();

  return (
    <div className="flex flex-col">
      <ScrollArea className="flex-1 overflow-y-auto h-full">
        <Suspense fallback={<div>Loading chat...</div>}>
          <ChatHistory isLoading={isLoading} messages={messages} />
        </Suspense>
      </ScrollArea>
      <div className="flex p-2 justify-center w-full absolute bottom-6">
        {/* This input is for follow-up messages, not implemented in this example */}
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { messages, isLoading, handleSendMessage } = useChat();
  return (
    <div className="flex flex-col h-screen relative overflow-hidden">
      <div className="absolute top-4 right-4 z-10">
        <ModeToggle />
      </div>
      <SidebarProvider defaultOpen={true}>
        <div className="flex flex-row w-full">
          <AppSidebar />
          <main className="flex flex-col w-full relative">
            <div className="flex bg-secondary min-h-16 w-full items-center justify-center">
              <p className="body-medium-bold">Chat baru</p>
            </div>
            <ScrollArea className="flex-1 overflow-y-auto">
              <Suspense fallback={<div>Loading chat...</div>}>
                <ChatHistory isLoading={isLoading} messages={messages} />
              </Suspense>
            </ScrollArea>
            <div className="flex p-2 justify-center w-full">
              {/* This input is for follow-up messages, not implemented in this example */}
              <ChatInput
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
              />
            </div>
            {/* <ChatPageContent /> */}
            <footer className="flex flex-col h-6 w-full justify-center items-center">
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
