import { ArrowUp, Lightbulb } from "lucide-react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import AddAttachment from "./add-attachment";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ChatInput() {
  const [inputValue, setInputValue] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    // Redirect to the chat page with the message as a query parameter
    router.push(`/chat?message=${encodeURIComponent(inputValue)}`);
  };
  return (
    <form
      onSubmit={handleSubmit}
      className="relative w-full max-w-3xl min-h-32 justify-center"
    >
      <div className="absolute bottom-5 right-5">
        <Button type="submit" size="icon" className="rounded-lg">
          <ArrowUp className="h-5 w-5" />
          <span className="sr-only">Send</span>
        </Button>
      </div>
      <div className="absolute bottom-5 left-5 flex gap-2">
        <AddAttachment />
        <Button variant="outline" size="icon" className="rounded-lg w-18 ml-1">
          <p className="body-medium-regular">FAQ</p>
        </Button>
        <Button variant="outline" size="icon">
          <Lightbulb />
        </Button>
      </div>
      <Textarea
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Tanyakan apapun tentang Kabupaten Madiun..."
        className="min-h-32 w-full resize-none rounded-xl p-5 pr-16 pb-20"
      />
    </form>
  );
}
