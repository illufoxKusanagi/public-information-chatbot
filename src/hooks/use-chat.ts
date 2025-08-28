import { Message } from "@/lib/types/chat";
import { useSearchParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const chatId = searchParams.get("id");
  const initialMessage = searchParams.get("message");
  const hasProcessedInitialMessage = useRef(false);

  // const sendMessageToServer = useCallback(
  //   async (currentMessages: Message[]) => {
  //     const userMessage = currentMessages.findLast(
  //       (m) => m.role === "user"
  //     )?.content;
  //     if (!userMessage) return;

  //     setIsLoading(true);
  //     try {
  //       const response = await fetch("/api/chat", {
  //         method: "POST",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify({ message: userMessage }),
  //       });
  //       if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
  //       const data = await response.json();
  //       setMessages((prev) => [
  //         ...prev,
  //         { role: "bot", content: data.content },
  //       ]);
  //     } catch (error) {
  //       console.error("Error sending message:", error);
  //       setMessages((prev) => [
  //         ...prev,
  //         { role: "bot", content: "Maaf, terjadi kesalahan" },
  //       ]);
  //       toast.error("Terjadi kesalahan saat memproses pesan.");
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   },
  //   []
  // );

  const handleSendMessage = useCallback(
    async (message: string) => {
      if (!message.trim() || isLoading) return;

      const newUserMessage: Message = { role: "user", content: message };

      const updatedMessages = [...messages, newUserMessage];
      setMessages(updatedMessages);
      setIsLoading(true);
      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: newUserMessage }),
        });
        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
        const data = await response.json();
        setMessages((prev) => [
          ...prev,
          { role: "bot", content: data.content },
        ]);
      } catch (error) {
        console.error("Error sending message:", error);
        setMessages((prev) => [
          ...prev,
          { role: "bot", content: "Gagal mengirim pesan" },
        ]);
        toast.error("Terjadi kesalahan saat memproses pesan.");
      } finally {
        setIsLoading(false);
      }
      // if (chatId) {
      //   await sendMessageToServer(updatedMessages);
      // } else {
      //   const newChatId = `${Date.now()}-${Math.random()
      //     .toString(36)
      //     .substr(2, 9)}`;
      //   const newMessages = [newUserMessage];

      //   // localStorage.setItem(`chat_${newChatId}`, JSON.stringify(newMessages));
      //   router.replace(`/chat?id=${newChatId}`);
      //   await sendMessageToServer(newMessages);
      // }
    },
    [messages, isLoading]
  );

  // useEffect(() => {
  //   if (chatId) {
  //     hasProcessedInitialMessage.current = false;
  //     const storedMessages = localStorage.getItem(`chat_${chatId}`);
  //     if (storedMessages) {
  //       const parsedMessages = JSON.parse(storedMessages);
  //       setMessages(parsedMessages);
  //     } else {
  //       setMessages([]);
  //     }
  //   } else {
  //     setMessages([]);
  //   }
  // }, [chatId]);

  // useEffect(() => {
  //   if (initialMessage && !chatId && !hasProcessedInitialMessage.current) {
  //     hasProcessedInitialMessage.current = true;
  //     handleSendMessage(initialMessage);
  //   }
  // }, [initialMessage, chatId, handleSendMessage]);

  // useEffect(() => {
  //   if (chatId && messages.length > 0) {
  //     localStorage.setItem(`chat_${chatId}`, JSON.stringify(messages));
  //   }
  // }, [messages, chatId]);

  return {
    messages,
    isLoading,
    handleSendMessage,
  };
}
