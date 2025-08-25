import { UserRole } from "@/lib/definitions";

export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  profileUrl?: string;
}
