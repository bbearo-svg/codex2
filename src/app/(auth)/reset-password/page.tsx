"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import AuthCard from "@/components/auth/auth-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { resetPasswordSchema, resetPasswordConfirmSchema } from "@/schemas/auth";
import type { z } from "zod";

const RequestSchema = resetPasswordSchema;
type RequestValues = z.infer<typeof RequestSchema>;
const ConfirmSchema = resetPasswordConfirmSchema;
type ConfirmValues = z.infer<typeof ConfirmSchema>;

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestForm = useForm<RequestValues>({ resolver: zodResolver(RequestSchema) });
  const confirmForm = useForm<ConfirmValues>({ resolver: zodResolver(ConfirmSchema), defaultValues: { token: token ?? "" } });

  const handleRequest = requestForm.handleSubmit(async (values) => {
    setError(null);
    setMessage(null);
    const response = await fetch("/api/auth/reset/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!response.ok) {
      const body = await response.json();
      setError(body.error ?? "Unable to send reset email");
      return;
    }
    setMessage("If an account exists for that email, a reset link has been sent.");
  });

  const handleConfirm = confirmForm.handleSubmit(async (values) => {
    setError(null);
    setMessage(null);
    const response = await fetch("/api/auth/reset/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!response.ok) {
      const body = await response.json();
      setError(body.error ?? "Unable to reset password");
      return;
    }
    setMessage("Password updated! You can now sign in.");
    setTimeout(() => router.push("/auth/login"), 1500);
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <AuthCard
        title={token ? "Choose a new password" : "Reset your password"}
        description={token ? "Enter a new password below." : "We will email you a secure reset link."}
      >
        {token ? (
          <form className="space-y-4" onSubmit={handleConfirm}>
            <Input type="hidden" {...confirmForm.register("token")} />
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="password">
                New password
              </label>
              <Input id="password" type="password" {...confirmForm.register("password")} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="confirmPassword">
                Confirm password
              </label>
              <Input id="confirmPassword" type="password" {...confirmForm.register("confirmPassword")} required />
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {message ? <p className="text-sm text-green-600">{message}</p> : null}
            <Button type="submit" className="w-full" disabled={confirmForm.formState.isSubmitting}>
              {confirmForm.formState.isSubmitting ? "Updating..." : "Update password"}
            </Button>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={handleRequest}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="email">
                Email
              </label>
              <Input id="email" type="email" {...requestForm.register("email")} required />
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {message ? <p className="text-sm text-green-600">{message}</p> : null}
            <Button type="submit" className="w-full" disabled={requestForm.formState.isSubmitting}>
              {requestForm.formState.isSubmitting ? "Sending..." : "Send reset link"}
            </Button>
          </form>
        )}
      </AuthCard>
    </div>
  );
}
