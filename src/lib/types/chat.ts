export interface Message {
  content: string;
  role: "user" | "bot";
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
}

export interface ChatResponse {
  reply: string;
  status: string;
}

export interface ChatError {
  message: string;
  code?: string;
}
