"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import AuthCard from "@/components/auth/auth-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { registerSchema, type RegisterSchema } from "@/schemas/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const form = useForm<RegisterSchema>({ resolver: zodResolver(registerSchema) });

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    setSuccess(null);
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const body = await response.json();
      setError(body.error ?? "Unable to create account");
      return;
    }

    setSuccess("Account created! You can now sign in.");
    form.reset();
    setTimeout(() => router.push("/auth/login"), 1200);
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <AuthCard title="Create your account" description="Save favorite menus and manage orders">
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="name">
              Full name
            </label>
            <Input id="name" {...form.register("name")} placeholder="Alex Rivera" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="email">
              Email
            </label>
            <Input id="email" type="email" {...form.register("email")}
              placeholder="you@example.com" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="password">
              Password
            </label>
            <Input id="password" type="password" {...form.register("password")} required />
            <p className="text-xs text-slate-500">At least 8 characters with one uppercase letter.</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="confirmPassword">
              Confirm password
            </label>
            <Input id="confirmPassword" type="password" {...form.register("confirmPassword")} required />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {success ? <p className="text-sm text-green-600">{success}</p> : null}
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Creating..." : "Create account"}
          </Button>
        </form>
        <p className="text-sm text-slate-600">
          Already have an account? {" "}
          <Link href="/auth/login" className="font-medium text-brand hover:underline">
            Sign in
          </Link>
        </p>
      </AuthCard>
    </div>
  );
}
