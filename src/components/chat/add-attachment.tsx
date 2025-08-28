import { Plus, Image as ImageIcon, Paperclip } from "lucide-react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export default function AddAttachment() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Plus className="h-5 w-5" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuItem>
          <ImageIcon />
          Tambahkan gambar
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Paperclip />
          Tambahkan dokumen
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
