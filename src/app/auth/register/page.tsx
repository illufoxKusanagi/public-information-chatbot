"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { UserRole } from "@/lib/definitions";

type FormData = z.infer<typeof schema>;

const staticUser = {
  id: 1,
  username: "Illufox Kasunagi",
  email: "test@gmail.com",
  password: "password",
  role: UserRole.User,
  profileUrl: "https://avatars.githubusercontent.com/u/12345678?v=4",
};

const schema = z.object({
  username: z
    .string()
    .min(4, "Username minimal 4 karakter")
    .max(20, "Username maksimal 20 karakter"),
  email: z.string().email("Alamat email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
});

export default function RegisterPage() {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
    resolver: zodResolver(schema),
  });
  const onSubmit: SubmitHandler<FormData> = async (data) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      //   throw new Error("Simulated server error"); // Simulate an error for demonstration
      toast.success(
        `User ${data.username} berhasil terdaftar dengan : ${data.email} dengan password: ${data.password}`
      );
      console.log(staticUser);
    } catch (error) {
      setError("email", {
        type: "manual",
        message: "Email sudah terdaftar",
      });
      toast.error("Gagal mendaftar, silakan coba lagi.");
    }
  };
  return (
    <div className="flex h-screen items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>
            Enter your details below to create your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  {...register("username")}
                  id="username"
                  type="input"
                  placeholder="John Doe"
                />
                {errors.username && (
                  <p className="text-xs text-red-500">
                    {errors.username.message}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  {...register("email")}
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                />
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  {...register("password")}
                  id="password"
                  type="password"
                />
                {errors.password && (
                  <p className="text-xs text-red-500">
                    {errors.password.message}
                  </p>
                )}
              </div>
              <Button disabled={isSubmitting} type="submit" className="w-full">
                {isSubmitting ? "Membuat akun..." : "Daftar"}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex-col gap-2">
          {/* <form onSubmit={handleSubmit(onSubmit)}></form> */}
          {/* <CardDescription> */}
          {/* <div className="flex flex-row w-32"> */}
          <Separator className="self-center" />
          {/* <p>Or</p>
              <Separator className="self-center w-2" />
            </div>
          </CardDescription> */}
          <Button variant="outline" className="w-full">
            Sign Up with Google
          </Button>
          <CardDescription className="text-center">
            Already have an account?{" "}
            <span className="text-primary hover:underline">
              <Link href={"login"}>login</Link>
            </span>
          </CardDescription>
        </CardFooter>
      </Card>
    </div>
  );
}
