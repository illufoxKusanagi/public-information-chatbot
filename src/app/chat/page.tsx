"use client";

import { AppSidebar } from "@/components/ui/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Suspense, useEffect, useState } from "react";
import { ModeToggle } from "@/components/ui/dark-mode-toggle";
import { cn } from "@/lib/utils";
import ChatInput from "@/components/chat/chat-input";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { Message } from "@/lib/types/chat";
import { useChat } from "@/hooks/use-chat";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import { useSearchParams, useRouter } from "next/navigation";
import ModeToggleButton from "@/components/ui/mode-toggle";
import HelpButton from "@/components/ui/help-button";
// Edited Here: Import useAuth to check authentication
import { useAuth } from "@/app/context/auth-context";

function TextBubble({
  role,
  content,
  isThinking = false,
}: Message & { isThinking?: boolean }) {
  return (
    <div
      className={cn(
        "flex w-full mb-4",
        role === "user" ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[70%] rounded-lg px-4 py-2",
          role === "user"
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground",
          isThinking && "animate-pulse"
        )}
      >
        <section className="prose prose-sm max-w-none">
          <ReactMarkdown
            rehypePlugins={[rehypeRaw, rehypeHighlight]}
            components={{
              h1: ({ node, ...props }) => (
                <h1 className="text-2xl font-bold my-2" {...props} />
              ),
              h2: ({ node, ...props }) => (
                <h2 className="text-xl font-bold my-2" {...props} />
              ),
              h3: ({ node, ...props }) => (
                <h3 className="text-lg font-bold my-2" {...props} />
              ),
              ul: ({ node, ...props }) => (
                <ul className="list-disc my-2 pl-4" {...props} />
              ),
              ol: ({ node, ...props }) => <ol className="my-2" {...props} />,
              p: ({ node, ...props }) => <p className="mb-2" {...props} />,
              a: ({ node, ...props }) => (
                <a
                  className="text-blue-500 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                  {...props}
                />
              ),
              code: ({ node, className, children, ...props }) => {
                const match = /language-(\w+)/.exec(className || "");
                return match ? (
                  <pre className="bg-gray-800 text-white p-3 my-2 rounded-md overflow-x-auto">
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                ) : (
                  <code
                    className="bg-muted px-1.5 py-0.5 rounded-md"
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </section>
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

export default function ChatPage() {
  const { messages, isLoading, handleSendMessage } = useChat();
  const searchParams = useSearchParams();
  const router = useRouter();
  const chatIdParam = searchParams.get("id");
  const chatId = chatIdParam ? parseInt(chatIdParam, 10) : null;

  const [chatTitle, setChatTitle] = useState<string>("");
  const [titleLoading, setTitleLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Edited Here: Add authentication check
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  // Edited Here: Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login");
      return;
    }
  }, [isAuthenticated, authLoading, router]);

  // ✅ Updated to use API route instead of direct database call
  useEffect(() => {
    const fetchTitle = async () => {
      if (!isAuthenticated || authLoading) {
        return;
      }
      if (chatId && !isNaN(chatId)) {
        setTitleLoading(true);
        setError(null);
        console.log(`chat id adalah: ${chatId}`);
        try {
          const response = await fetch(`/api/chat/title/${chatId}`);
          if (!response.ok) {
            if (response.status === 404) {
              throw new Error("Chat tidak ditemukan");
            } else if (response.status === 403) {
              throw new Error("Akses ditolak");
            } else {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
          }
          const data = await response.json();
          if (data.error) {
            throw new Error(data.error);
          }
          setChatTitle(data.title || `Chat #${chatId}`);
        } catch (error) {
          console.error("Failed to fetch chat title:", error);
          setChatTitle(`Chat #${chatId}`);
          setError(error instanceof Error ? error.message : "Unknown error");
        } finally {
          setTitleLoading(false);
        }
      } else {
        setChatTitle("New Chat");
        setTitleLoading(false);
      }
    };
    fetchTitle();
    console.log(`isAuthenticated is: ${isAuthenticated}`);
  }, [chatId, isAuthenticated, authLoading]);

  // Edited Here: Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }
  console.log(`Is authenticated in chat page: ${isAuthenticated}`);
  // Edited Here: Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen relative overflow-hidden">
      <div className="flex absolute gap-4 top-4 right-4 z-10">
        <ModeToggleButton />
        <HelpButton />
        {/* Edited Here: Show user info instead of login button */}
        <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-md px-2 py-1">
          <span className="text-sm">Hello, {user?.name}</span>
        </div>
      </div>
      <SidebarProvider defaultOpen={true}>
        <div className="flex flex-row w-full ">
          <AppSidebar />
          <main className="flex flex-col w-full relative">
            <div className="flex bg-secondary min-h-16 w-full items-center justify-center">
              <SidebarTrigger className="ml-4 absolute left-0 justify-center" />
              <p className="body-medium-bold">
                {titleLoading
                  ? "Memuat judul..."
                  : error
                  ? "New Chat"
                  : chatTitle}
              </p>
            </div>
            <ScrollArea className="flex-1 overflow-y-auto">
              <Suspense fallback={<div>Loading chat...</div>}>
                <ChatHistory isLoading={isLoading} messages={messages} />
              </Suspense>
            </ScrollArea>
            <div className="flex p-2 justify-center w-full">
              <ChatInput
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
              />
            </div>
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

// "use client";

// import { AppSidebar } from "@/components/ui/app-sidebar";
// import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
// import { Suspense, useEffect, useState } from "react";
// import { ModeToggle } from "@/components/ui/dark-mode-toggle";
// import { cn } from "@/lib/utils";
// import ChatInput from "@/components/chat/chat-input";
// import { ScrollArea } from "@radix-ui/react-scroll-area";
// import { Message } from "@/lib/types/chat";
// import { useChat } from "@/hooks/use-chat";
// import ReactMarkdown from "react-markdown";
// import rehypeRaw from "rehype-raw";
// import rehypeHighlight from "rehype-highlight";
// import { useSearchParams } from "next/navigation";
// import ModeToggleButton from "@/components/ui/mode-toggle";
// import HelpButton from "@/components/ui/help-button";
// import { getChatHistoryTitle } from "@/lib/services/ai/rag.service";

// function TextBubble({
//   role,
//   content,
//   isThinking = false,
// }: Message & { isThinking?: boolean }) {
//   return (
//     <div
//       className={cn(
//         "flex w-full items-start gap-4 rounded-lg p-4",
//         role === "user" ? "justify-end" : "justify-start"
//       )}
//     >
//       <div
//         className={cn(
//           "max-w-2xl rounded-lg p-3",
//           role === "user"
//             ? "bg-primary text-primary-foreground"
//             : "bg-muted text-muted-foreground",
//           isThinking && "animate-pulse"
//         )}
//       >
//         <section className="prose prose-sm dark:prose-invert max-w-none">
//           <ReactMarkdown
//             rehypePlugins={[rehypeRaw, rehypeHighlight]}
//             components={{
//               h1: ({ node, ...props }) => (
//                 <h1 className="text-2xl font-bold my-2" {...props} />
//               ),
//               h2: ({ node, ...props }) => (
//                 <h2 className="text-xl font-bold my-2" {...props} />
//               ),
//               h3: ({ node, ...props }) => (
//                 <h3 className="text-lg font-bold my-2" {...props} />
//               ),
//               ul: ({ node, ...props }) => (
//                 <ul className="list-disc my-2 pl-4" {...props} />
//               ),
//               ol: ({ node, ...props }) => <ol className="my-2" {...props} />,
//               p: ({ node, ...props }) => <p className="mb-2" {...props} />,
//               a: ({ node, ...props }) => (
//                 <a
//                   className="text-blue-500 hover:underline"
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   {...props}
//                 />
//               ),
//               code: ({ node, className, children, ...props }) => {
//                 const match = /language-(\w+)/.exec(className || "");
//                 return match ? (
//                   <pre className="bg-gray-800 text-white p-3 my-2 rounded-md overflow-x-auto">
//                     <code className={className} {...props}>
//                       {children}
//                     </code>
//                   </pre>
//                 ) : (
//                   <code
//                     className="bg-muted px-1.5 py-0.5 rounded-md"
//                     {...props}
//                   >
//                     {children}
//                   </code>
//                 );
//               },
//             }}
//           >
//             {content}
//           </ReactMarkdown>
//         </section>
//       </div>
//     </div>
//   );
// }

// function ChatHistory({
//   isLoading,
//   messages,
// }: {
//   isLoading: boolean;
//   messages: Message[];
// }) {
//   return (
//     <div className="flex-1 space-y-4 overflow-y-auto p-4 pt-16">
//       {messages.map((msg, index) => (
//         <TextBubble key={index} role={msg.role} content={msg.content} />
//       ))}
//       {isLoading && (
//         <TextBubble role="bot" content="Bot sedang berpikir..." isThinking />
//       )}
//     </div>
//   );
// }

// export default function ChatPage() {
//   const { messages, isLoading, handleSendMessage } = useChat();
//   const searchParams = useSearchParams();
//   const chatId: number = Number(searchParams.get("id"));
//   const [chatTitle, setChatTitle] = useState<string>("");
//   const [titleLoading, setTitleLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string | null>(null);

//   // ✅ Updated to use API route instead of direct database call
//   useEffect(() => {
//     const fetchTitle = async () => {
//       if (chatId && !isNaN(chatId)) {
//         setTitleLoading(true);
//         setError(null);
//         try {
//           const response = await fetch(`/api/chat/title/${chatId}`);
//           if (!response.ok) {
//             throw new Error(`HTTP error! status: ${response.status}`);
//           }
//           const data = await response.json();
//           if (data.error) {
//             throw new Error(data.error);
//           }
//           setChatTitle(data.title || `Chat #${chatId}`);
//         } catch (error) {
//           console.error("Failed to fetch chat title:", error);
//           setChatTitle(`Chat #${chatId}`);
//           setError(error instanceof Error ? error.message : "Unknown error");
//         } finally {
//           setTitleLoading(false);
//         }
//       } else {
//         setChatTitle("New Chat");
//         setTitleLoading(false);
//       }
//     };

//     fetchTitle();
//   }, [chatId]);

//   return (
//     <div className="flex flex-col h-screen relative overflow-hidden">
//       <div className="flex absolute gap-4 top-4 right-4 z-10">
//         <ModeToggleButton />
//         <HelpButton />
//       </div>
//       <SidebarProvider defaultOpen={true}>
//         <div className="flex flex-row w-full ">
//           <AppSidebar />
//           <main className="flex flex-col w-full relative">
//             <div className="flex bg-secondary min-h-16 w-full items-center justify-center">
//               <SidebarTrigger className="ml-4 absolute left-0 justify-center" />
//               <p className="body-medium-bold">
//                 {titleLoading
//                   ? "Memuat judul..."
//                   : error
//                   ? "New Chat"
//                   : chatTitle}
//               </p>
//             </div>
//             <ScrollArea className="flex-1 overflow-y-auto">
//               <Suspense fallback={<div>Loading chat...</div>}>
//                 <ChatHistory isLoading={isLoading} messages={messages} />
//               </Suspense>
//             </ScrollArea>
//             <div className="flex p-2 justify-center w-full">
//               {/* This input is for follow-up messages, not implemented in this example */}
//               <ChatInput
//                 onSendMessage={handleSendMessage}
//                 isLoading={isLoading}
//               />
//             </div>
//             <footer className="flex flex-col h-6 w-full justify-center items-center">
//               <p className="body-small-regular">
//                 Made with 💗 by Illufox Kasunagi
//               </p>
//             </footer>
//           </main>
//         </div>
//       </SidebarProvider>
//     </div>
//   );
// }
