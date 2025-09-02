import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ModeToggle } from "./dark-mode-toggle";

export default function ModeToggleButton() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span>
          <ModeToggle />
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p>Ganti mode warna</p>
      </TooltipContent>
    </Tooltip>
  );
}
