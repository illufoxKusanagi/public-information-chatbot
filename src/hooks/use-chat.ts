import { useAuth } from "@/app/context/auth-context";
import { Message } from "@/lib/types/chat";
import { useSearchParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

export function useChat() {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
  });
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();
  const chatId = searchParams.get("id");

  const apiCall = useCallback(
    async (endpoint: string, options: RequestInit = {}) => {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(endpoint, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer: ${token}` }),
          ...options.headers,
        },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      return response.json();
    },
    []
  );

  useEffect(() => {
    const loadHistory = async () => {
      if (!isAuthenticated || !chatId) {
        setState((prev) => ({ ...prev, messages: [], isLoading: false }));
        return;
      }
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const data = await apiCall(`/api/chat/${chatId}`);
        setState((prev) => ({
          ...prev,
          messages: data.messages || [],
          isLoading: false,
        }));
      } catch (error) {
        console.error("Error loading chat history: ", error);
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "Failed to load chat",
          isLoading: false,
          messages: [],
        }));
        toast.error("Tidak dapat memuat riwayat percakapan");
      }
      // if (chatId) {
      //   console.log("Loading chat history for ID:", chatId);
      //   setIsLoading(true);
      //   try {
      //     const response = await fetch(`/api/chat/${chatId}`);
      //     if (!response.ok) {
      //       throw new Error(`Failed to fetch: ${response.statusText}`);
      //     }
      //     const data = await response.json();
      //     console.log("Loaded chat data:", data);
      //     const loadedMessages = data.messages || [];
      //     console.log("Setting messages:", loadedMessages);
      //     setMessages(loadedMessages);
      //   } catch (error) {
      //     console.error("Error loading chat history:", error);
      //     toast.error("Tidak dapat memuat riwayat percakapan");
      //     setMessages([]);
      //   } finally {
      //     setIsLoading(false);
      //   }
      // } else {
      //   setMessages([]);
      // }
    };
    loadHistory();
  }, [chatId, isAuthenticated, apiCall]);

  const handleSendMessage = useCallback(
    async (newUserMessage: string) => {
      if (!newUserMessage.trim() || state.isLoading) return;
      const userMessage: Message = {
        role: "user",
        content: newUserMessage,
        timestamp: new Date().toISOString(),
      };
      if (chatId) {
        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, userMessage],
        }));
      }
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const data = await apiCall("/api/chat", {
          method: "POST",
          body: JSON.stringify({
            messages: newUserMessage.trim(),
            chatId: chatId ? parseInt(chatId) : undefined,
          }),
        });
        const botMessage: Message = {
          role: "bot",
          content: data.content,
          timestamp: new Date().toISOString(),
          sources: data.sources,
        };

        if (data.chatId && !chatId) {
          router.push(`/chat/id=${data.chatId}`);
        } else {
          setState((prev) => ({
            ...prev,
            messages: [...prev.messages, botMessage],
            isLoading: false,
          }));
        }

        if (data.sources && data.sources.length > 0) {
          console.log("Data sources used : ", data.sources);
        }
      } catch (error) {
        console.error("error sending message: ", error);
        if (chatId) {
          setState((prev) => ({
            ...prev,
            error:
              error instanceof Error ? error.message : "Failed to send message",
            isLoading: false,
          }));
        }
        toast.error("Gagal mengirim pesan");
      }
      // try {
      //   const response = await fetch("/api/chat", {
      //     method: "POST",
      //     headers: { "Content-Type": "application/json" },
      //     body: JSON.stringify({
      //       message: newUserMessage,
      //       chatId: chatId ? parseInt(chatId) : undefined,
      //     }),
      //   });

      //   if (!response.ok) throw new Error(`API Error: ${response.statusText}`);

      //   const data = await response.json();
      //   console.log("API Response:", data);

      //   if (data.chatId && !chatId) {
      //     console.log("Redirecting to new chat:", data.chatId);
      //     router.push(`/chat?id=${data.chatId}`);
      //   } else {
      //     setMessages((prev) => [
      //       ...prev,
      //       { role: "bot", content: data.content },
      //     ]);
      //   }

      //   if (data.sources && data.sources.length > 0) {
      //     console.log("Data sources used:", data.sources);
      //   }
      // } catch (error) {
      //   console.error("Error sending message:", error);
      //   toast.error("Gagal mengirim pesan.");
      //   if (chatId) {
      //     setMessages((prev) => prev.slice(0, -1));
      //   }
      // } finally {
      //   setIsLoading(false);
      // }
    },
    [state.isLoading, chatId, router, isAuthenticated, apiCall]
  );

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);
  return {
    messages: state.messages,
    isLoading: state.isLoading,
    handleSendMessage,
    clearError,
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

//         // Use the enhanced chat endpoint
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

//         // Show source information if available
//         if (data.sources && data.sources.length > 0) {
//           console.log("Data sources used:", data.sources);
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

// // import { Message } from "@/lib/types/chat";
// // import { useSearchParams, useRouter } from "next/navigation";
// // import { useCallback, useEffect, useState } from "react";
// // import { toast } from "sonner";

// // export function useChat() {
// //   const [messages, setMessages] = useState<Message[]>([]);
// //   const [isLoading, setIsLoading] = useState(false);
// //   const router = useRouter();
// //   const searchParams = useSearchParams();
// //   const chatId = searchParams.get("id");

// //   useEffect(() => {
// //     const loadHistory = async () => {
// //       if (chatId) {
// //         console.log("Loading chat history for ID:", chatId);
// //         setIsLoading(true);
// //         try {
// //           const response = await fetch(`/api/chat/${chatId}`);
// //           if (!response.ok) {
// //             throw new Error(`Failed to fetch: ${response.statusText}`);
// //           }
// //           const data = await response.json();
// //           console.log("Loaded chat data:", data);

// //           const loadedMessages = data.messages || [];
// //           console.log("Setting messages:", loadedMessages);

// //           setMessages(loadedMessages);
// //         } catch (error) {
// //           console.error("Error loading chat history:", error);

// //           toast.error("Tidak dapat memuat riwayat percakapan");
// //           setMessages([]);
// //         } finally {
// //           setIsLoading(false);
// //         }
// //       } else {
// //         console.log("No chatId, clearing messages");
// //         setMessages([]);
// //       }
// //     };

// //     loadHistory();
// //   }, [chatId]);

// //   const handleSendMessage = useCallback(
// //     async (message: string) => {
// //       if (!message.trim() || isLoading) return;

// //       const newUserMessage: Message = { role: "user", content: message };

// //       if (chatId) {
// //         setMessages((prev) => [...prev, newUserMessage]);
// //       }

// //       setIsLoading(true);

// //       try {
// //         console.log("Sending message:", { message: newUserMessage, chatId });

// //         const response = await fetch("/api/test", {
// //           method: "POST",
// //           headers: { "Content-Type": "application/json" },
// //           body: JSON.stringify({ message: newUserMessage, chatId }),
// //         });

// //         if (!response.ok) throw new Error(`API Error: ${response.statusText}`);

// //         const data = await response.json();
// //         console.log("API Response:", data);

// //         if (data.chatId && !chatId) {
// //           // New chat created - redirect
// //           console.log("Redirecting to new chat:", data.chatId);
// //           router.push(`/chat?id=${data.chatId}`);
// //         } else {
// //           // Existing chat - add bot response
// //           setMessages((prev) => [
// //             ...prev,
// //             { role: "bot", content: data.content },
// //           ]);
// //         }
// //       } catch (error) {
// //         console.error("Error sending message:", error);
// //         toast.error("Gagal mengirim pesan.");
// //         // Remove the failed user message on error (only if we added it)
// //         if (chatId) {
// //           setMessages((prev) => prev.slice(0, -1));
// //         }
// //       } finally {
// //         setIsLoading(false);
// //       }
// //     },
// //     [isLoading, chatId, router]
// //   );

// //   return {
// //     messages,
// //     isLoading,
// //     handleSendMessage,
// //   };
// // }
