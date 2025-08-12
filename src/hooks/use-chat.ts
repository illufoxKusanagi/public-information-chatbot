import { Message } from "@/types/chat";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const initialMessage = searchParams.get("message");
  const initialMessageSent = useRef(false);

  const sendMessageToServer = async (message: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
      const data = await response.json();
      setMessages((prev) => [...prev, { role: "bot", content: data.reply }]);
      toast.success("Balasan Diterima");
    } catch (error) {
      console.error("Error handling initial message:", error);
      setMessages((prev) => [
        ...prev,
        { role: "bot", content: "Maaf, terjadi kesalahan" },
      ]);
      toast.error("Terjadi kesalahan saat memproses pesan.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialMessage && !initialMessageSent.current) {
      initialMessageSent.current = true;
      setMessages([{ role: "user", content: initialMessage }]);
      sendMessageToServer(initialMessage);
    }
  }, [initialMessage]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    const newUserMessage: Message = { role: "user", content: message };
    setMessages((prev) => [...prev, newUserMessage]);
    await sendMessageToServer(message);
  };

  return {
    messages,
    isLoading,
    handleSendMessage,
  };
}
