// "use client";

// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { Button } from "@/components/ui/button";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { useAuth } from "@/app/context/auth-context";
// import { LogOut, Settings, User } from "lucide-react";
// import Link from "next/link";

// // Edited Here: Created NavUser component to show user info and logout option
// export function NavUser() {
//   const { user, logout, isAuthenticated } = useAuth();

//   if (!isAuthenticated || !user) {
//     return (
//       <div className="flex gap-2">
//         <Link href="/auth/login">
//           <Button variant="ghost" size="sm">
//             Login
//           </Button>
//         </Link>
//         <Link href="/auth/register">
//           <Button variant="outline" size="sm">
//             Register
//           </Button>
//         </Link>
//       </div>
//     );
//   }

//   const initials = user.name
//     .split(" ")
//     .map((n) => n[0])
//     .join("")
//     .toUpperCase();

//   return (
//     <DropdownMenu>
//       <DropdownMenuTrigger asChild>
//         <Button variant="ghost" className="relative h-10 w-10 rounded-full">
//           <Avatar>
//             <AvatarImage src={user.avatar || ""} alt={user.name} />
//             <AvatarFallback>{initials}</AvatarFallback>
//           </Avatar>
//         </Button>
//       </DropdownMenuTrigger>
//       <DropdownMenuContent align="end">
//         <div className="flex items-center justify-start gap-2 p-2">
//           <div className="flex flex-col space-y-0.5 leading-none">
//             <p className="font-medium text-sm">{user.name}</p>
//             <p className="text-xs text-muted-foreground">{user.email}</p>
//           </div>
//         </div>
//         <DropdownMenuItem asChild>
//           <Link href="/profile">
//             <User className="h-4 w-4 mr-2" />
//             Profile
//           </Link>
//         </DropdownMenuItem>
//         <DropdownMenuItem asChild>
//           <Link href="/settings">
//             <Settings className="h-4 w-4 mr-2" />
//             Settings
//           </Link>
//         </DropdownMenuItem>
//         <DropdownMenuItem onClick={() => logout()}>
//           <LogOut className="h-4 w-4 mr-2" />
//           Logout
//         </DropdownMenuItem>
//       </DropdownMenuContent>
//     </DropdownMenu>
//   );
// }

"use client";

import { ChevronsUpDown, LogOut, Settings, User } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { useAuth } from "@/app/context/auth-context";

export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  const { logout } = useAuth();
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">IK</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate body-small-regular">{user.name}</span>
                <span className="truncate body-small-regular">
                  {user.email}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side="top"
            align="end"
            sideOffset={4}
          >
            <DropdownMenuItem asChild>
              <Link href="/profile">
                <User className="h-4 w-4 mr-2" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex flex-row"
              onClick={() => logout()}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
