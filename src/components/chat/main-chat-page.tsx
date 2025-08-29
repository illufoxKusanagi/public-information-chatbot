"use client";

import Image from "next/image";
import ChatInput from "./chat-input";
import { useChat } from "@/hooks/use-chat";
import { Message } from "@/lib/types/chat";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

// --- Komponen TextBubble kita pindahkan ke sini ---
function TextBubble({
  role,
  content,
  isThinking = false,
}: Message & { isThinking?: boolean }) {
  return (
    <div
      className={cn(
        "flex w-full items-start gap-4",
        role === "user" ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-2xl rounded-lg p-3",
          role === "user"
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground",
          isThinking && "animate-pulse" // Efek berdenyut saat loading
        )}
      >
        <section className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown>{content}</ReactMarkdown>
        </section>
      </div>
    </div>
  );
}

// --- Komponen Utama ---
export default function MainContent() {
  const { messages, isLoading, handleSendMessage } = useChat();

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 && !isLoading ? (
          // --- Tampilan Awal (jika tidak ada pesan) ---
          <div className="flex flex-col gap-12 items-center justify-center h-full">
            <div className="flex flex-col w-full max-w-md gap-4 items-center text-center">
              <Image
                alt="logo kabupaten"
                src={"/Logo_kabupaten_madiun.png"}
                width={100}
                height={100}
              />
              <h1 className="text-3xl font-bold text-wrap">
                Portal Informasi Publik Kabupaten Madiun
              </h1>
              <p className="text-muted-foreground">
                Tanyakan apapun kepada asisten AI kami.
              </p>
            </div>
          </div>
        ) : (
          // --- Tampilan Chat Aktif (langsung render di sini) ---
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <TextBubble key={index} role={msg.role} content={msg.content} />
            ))}
            {/* Tampilkan gelembung "berpikir" jika sedang loading balasan */}
            {isLoading && (
              <TextBubble
                role="bot"
                content="Bot sedang berpikir..."
                isThinking
              />
            )}
          </div>
        )}
      </div>

      <div className="flex p-4 justify-center w-full bg-background border-t">
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
}

// import Image from "next/image";
// import ChatInput from "./chat-input";

// export default function MainContent() {
//   return (
//     <div className="flex-1 flex flex-col gap-12 items-center h-full justify-center w-full">
//       <div className="flex flex-col w-[40rem] gap-4 items-center text-center">
//         <Image
//           alt="logo kabupaten"
//           src={"/Logo_kabupaten_madiun.png"}
//           width={100}
//           height={100}
//         />
//         <h1 className="heading-1 text-wrap">
//           Portal Informasi Publik Kabupaten Madiun
//         </h1>
//       </div>
//       <ChatInput />
//     </div>
//   );
// }
