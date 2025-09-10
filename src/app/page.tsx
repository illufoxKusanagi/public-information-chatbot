"use client";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/ui/app-sidebar";
import MainContent from "@/components/chat/main-chat-page";
import { useState } from "react";
import Link from "next/link";
import HelpButton from "@/components/ui/help-button";
import ModeToggleButton from "@/components/ui/mode-toggle-button";
import { useAuth } from "./context/auth-context";
import { Button } from "@/components/ui/button";
import { Bubbles } from "lucide-react";

export default function Home() {
  const [isOpen, setIsOpen] = useState(true);
  const { isAuthenticated, user, isLoading } = useAuth();
  const [dbStatus, setDbStatus] = useState<string>("");
  const [isDbLoading, setIsDbLoading] = useState<boolean>(false);

  const insertTestRagData = async () => {
    setIsDbLoading(true);
    setDbStatus("");
    try {
      const response = await fetch("/api/rag/data", {
        method: "POST",
      });
      const result = await response.json();
      if (response.ok) {
        setDbStatus("Insert rag datas succesful!");
      } else {
        console.error("Error inserting data:", result.error);
        setDbStatus(`Error: ${result.message}`);
      }
    } catch (error) {
      setDbStatus(`Error: ${(error as Error).message}`);
    } finally {
      setIsDbLoading(false);
    }
  };
  return (
    <div className="flex flex-col h-screen relative">
      <div className="flex gap-4 absolute top-4 right-4">
        <ModeToggleButton />
        <HelpButton />
        {!isAuthenticated ? (
          <Link href={"/auth/login"}>
            <Button>Login</Button>
          </Link>
        ) : (
          <div className="flex items-center">
            <p className="body-medium-regular">Halo, {user?.name}</p>
          </div>
        )}
      </div>
      <SidebarProvider defaultOpen={true}>
        <div className="flex flex-row h-full w-full">
          {isOpen && <AppSidebar />}
          <SidebarTrigger className="ml-4 mt-4" size={"xl"} />
          <main className="flex-1 overflow-y-auto">
            <MainContent />
          </main>
        </div>
      </SidebarProvider>
      <footer className="flex flex-col w-full items-center absolute h-fit bg-accent p-2 bottom-0">
        <p className="body-small-regular">
          Made with 💗 by{" "}
          <span className="hover:underline">
            <Link
              href={"https://github.com/illufoxKusanagi"}
              target="_blank"
              rel="noopener noreferrer"
            >
              Illufox Kasunagi
            </Link>
          </span>
        </p>
        {dbStatus && <p className="text-sm font-medium">{dbStatus}</p>}
        <Button
          onClick={insertTestRagData}
          disabled={isLoading}
          variant="outline"
        >
          <Bubbles size="icon" className="m-2" />
          {isDbLoading ? "Testing..." : "Test Database"}
        </Button>
      </footer>
    </div>
  );
}
