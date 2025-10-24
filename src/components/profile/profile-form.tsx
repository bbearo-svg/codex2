"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema } from "@/schemas/auth";
import type { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const ProfileFormSchema = profileSchema;
type ProfileValues = z.infer<typeof ProfileFormSchema>;

export default function ProfileForm({ user }: { user: { name: string | null; email: string; phone: string | null; company: string | null } }) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<ProfileValues>({
    resolver: zodResolver(ProfileFormSchema),
    defaultValues: {
      name: user.name ?? "",
      phone: user.phone ?? "",
      company: user.company ?? "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setMessage(null);
    setError(null);
    const response = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const body = await response.json();
      setError(body.error ?? "Unable to update profile");
      return;
    }

    setMessage("Profile updated");
  });

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Contact information</h2>
      <form className="mt-4 grid gap-4" onSubmit={onSubmit}>
        <label className="text-sm font-medium text-slate-700">
          Full name
          <Input {...form.register("name")} required />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Phone
          <Input {...form.register("phone")} required />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Company
          <Input {...form.register("company")} placeholder="Optional" />
        </label>
        <p className="text-xs text-slate-500">Account email {user.email} (email changes require contacting support).</p>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {message ? <p className="text-sm text-green-600">{message}</p> : null}
        <Button type="submit" className="w-full sm:w-auto" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving..." : "Save changes"}
        </Button>
      </form>
    </div>
  );
}
