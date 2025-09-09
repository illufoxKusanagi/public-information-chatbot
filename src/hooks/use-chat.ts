import { Message } from "@/lib/types/chat";
import { useSearchParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const chatId = searchParams.get("id");

  useEffect(() => {
    const loadHistory = async () => {
      if (chatId) {
        console.log("Loading chat history for ID:", chatId);
        setIsLoading(true);
        try {
          const response = await fetch(`/api/chat/${chatId}`);
          if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.statusText}`);
          }
          const data = await response.json();
          console.log("Loaded chat data:", data);

          const loadedMessages = data.messages || [];
          console.log("Setting messages:", loadedMessages);

          setMessages(loadedMessages);
        } catch (error) {
          console.error("Error loading chat history:", error);
          toast.error("Tidak dapat memuat riwayat percakapan");
          setMessages([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        console.log("No chatId, clearing messages");
        setMessages([]);
      }
    };

    loadHistory();
  }, [chatId]);

  const handleSendMessage = useCallback(
    async (message: string) => {
      if (!message.trim() || isLoading) return;

      const newUserMessage: Message = { role: "user", content: message };

      if (chatId) {
        setMessages((prev) => [...prev, newUserMessage]);
      }

      setIsLoading(true);

      try {
        console.log("Sending message:", { message: newUserMessage, chatId });

        // Use the enhanced chat endpoint
        const response = await fetch("/api/test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: newUserMessage, chatId }),
        });

        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);

        const data = await response.json();
        console.log("API Response:", data);

        if (data.chatId && !chatId) {
          // New chat created - redirect
          console.log("Redirecting to new chat:", data.chatId);
          router.push(`/chat?id=${data.chatId}`);
        } else {
          // Existing chat - add bot response
          setMessages((prev) => [
            ...prev,
            { role: "bot", content: data.content },
          ]);
        }

        // Show source information if available
        if (data.sources && data.sources.length > 0) {
          console.log("Data sources used:", data.sources);
        }
      } catch (error) {
        console.error("Error sending message:", error);
        toast.error("Gagal mengirim pesan.");
        // Remove the failed user message on error (only if we added it)
        if (chatId) {
          setMessages((prev) => prev.slice(0, -1));
        }
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, chatId, router]
  );

  return {
    messages,
    isLoading,
    handleSendMessage,
  };
}

// import { Message } from "@/lib/types/chat";
// import { useSearchParams, useRouter } from "next/navigation";
// import { useCallback, useEffect, useState } from "react";
// import { toast } from "sonner";

// export function useChat() {
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const chatId = searchParams.get("id");

//   useEffect(() => {
//     const loadHistory = async () => {
//       if (chatId) {
//         console.log("Loading chat history for ID:", chatId);
//         setIsLoading(true);
//         try {
//           const response = await fetch(`/api/chat/${chatId}`);
//           if (!response.ok) {
//             throw new Error(`Failed to fetch: ${response.statusText}`);
//           }
//           const data = await response.json();
//           console.log("Loaded chat data:", data);

//           const loadedMessages = data.messages || [];
//           console.log("Setting messages:", loadedMessages);

//           setMessages(loadedMessages);
//         } catch (error) {
//           console.error("Error loading chat history:", error);

//           toast.error("Tidak dapat memuat riwayat percakapan");
//           setMessages([]);
//         } finally {
//           setIsLoading(false);
//         }
//       } else {
//         console.log("No chatId, clearing messages");
//         setMessages([]);
//       }
//     };

//     loadHistory();
//   }, [chatId]);

//   const handleSendMessage = useCallback(
//     async (message: string) => {
//       if (!message.trim() || isLoading) return;

//       const newUserMessage: Message = { role: "user", content: message };

//       if (chatId) {
//         setMessages((prev) => [...prev, newUserMessage]);
//       }

//       setIsLoading(true);

//       try {
//         console.log("Sending message:", { message: newUserMessage, chatId });

//         const response = await fetch("/api/test", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ message: newUserMessage, chatId }),
//         });

//         if (!response.ok) throw new Error(`API Error: ${response.statusText}`);

//         const data = await response.json();
//         console.log("API Response:", data);

//         if (data.chatId && !chatId) {
//           // New chat created - redirect
//           console.log("Redirecting to new chat:", data.chatId);
//           router.push(`/chat?id=${data.chatId}`);
//         } else {
//           // Existing chat - add bot response
//           setMessages((prev) => [
//             ...prev,
//             { role: "bot", content: data.content },
//           ]);
//         }
//       } catch (error) {
//         console.error("Error sending message:", error);
//         toast.error("Gagal mengirim pesan.");
//         // Remove the failed user message on error (only if we added it)
//         if (chatId) {
//           setMessages((prev) => prev.slice(0, -1));
//         }
//       } finally {
//         setIsLoading(false);
//       }
//     },
//     [isLoading, chatId, router]
//   );

//   return {
//     messages,
//     isLoading,
//     handleSendMessage,
//   };
// }
