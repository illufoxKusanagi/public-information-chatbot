"use client";

import Image from "next/image";
import ChatInput from "./chat-input";
import { useChat } from "@/hooks/use-chat";

export default function MainContent() {
  const { isLoading, handleSendMessage } = useChat();
  return (
    <div className="flex-1 flex flex-col gap-12 items-center h-full justify-center w-full">
      <div className="flex flex-col w-full max-w-[40rem] gap-4 items-center text-center">
        <Image
          alt="Logo Pemerintah Kabupaten Madiun"
          src="/Logo_kabupaten_madiun.png"
          width={100}
          height={100}
          priority
          sizes="(max-width: 640px) 64px, 100px"
        />
        <h1 className="heading-1 text-wrap">
          Portal Informasi Publik Kabupaten Madiun
        </h1>
      </div>
      <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
}
