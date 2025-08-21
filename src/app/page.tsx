"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/ui/app-sidebar";
import { ModeToggle } from "@/components/ui/dark-mode-toggle";
import MainContent from "@/components/chat/main-chat-page";
import { Button } from "@/components/ui/button";
import { Bubbles, CircleQuestionMark } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Home() {
  const isOpen: boolean = true; // This can be controlled by state or props if needed
  const [dbStatus, setDbStatus] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const testDatabaseConnection = async () => {
    setIsLoading(true);
    setDbStatus("Testing...");

    try {
      const response = await fetch("/api/test-db");
      const data = await response.json();

      if (data.status === "success") {
        setDbStatus("✅ Database Connected!");
      } else {
        setDbStatus("❌ Connection Failed");
      }
    } catch (error) {
      setDbStatus("❌ Error occurred");
      console.error("API call failed:", error);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="flex flex-col h-screen relative">
      <div className="flex gap-4 absolute top-4 right-4">
        <ModeToggle />
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href="/help">
              <Button variant="outline" size={"icon"} className="p-2">
                <CircleQuestionMark size="icon" />
              </Button>
            </Link>
          </TooltipTrigger>
          <TooltipContent>
            <p>Bantuan</p>
          </TooltipContent>
        </Tooltip>
      </div>
      <SidebarProvider defaultOpen={true}>
        <div className="flex flex-row h-full w-full">
          {isOpen && <AppSidebar />}
          <main className="flex-1 overflow-y-auto">
            <MainContent />
          </main>
        </div>
      </SidebarProvider>
      <footer className="flex flex-col w-full items-center absolute h-fit bottom-0">
        <p className="body-small-regular">Made with 💗 by Illufox Kasunagi</p>
        {/* {dbStatus && <p className="text-sm font-medium">{dbStatus}</p>}
        <Button
          onClick={testDatabaseConnection}
          disabled={isLoading}
          variant="outline"
        >
          <Bubbles size="icon" className="m-2" />
          {isLoading ? "Testing..." : "Test Database"}
        </Button> */}
      </footer>
    </div>
  );
}
