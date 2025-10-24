"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";

export default function SocialSignIn() {
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full border-slate-300 text-slate-700"
      onClick={() => signIn("google")}
    >
      <FcGoogle className="mr-2" /> Continue with Google
    </Button>
  );
}
