import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CircleQuestionMark } from "lucide-react";
import { Button } from "./button";
import Link from "next/link";

export default function HelpButton() {
  return (
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
  );
}
