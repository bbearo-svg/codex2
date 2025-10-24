"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Input } from "@/components/ui/input";

export default function SearchFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row"
      role="search"
      onSubmit={(event) => event.preventDefault()}
    >
      <label className="flex flex-1 flex-col gap-2 text-sm text-slate-600">
        Search menu
        <Input
          name="q"
          defaultValue={searchParams.get("q") ?? ""}
          placeholder="Search for dishes, ingredients, or dietary tags"
          onChange={(event) => {
            const params = new URLSearchParams(searchParams.toString());
            if (event.target.value) {
              params.set("q", event.target.value);
            } else {
              params.delete("q");
            }
            startTransition(() => {
              router.push(`/menu?${params.toString()}`);
            });
          }}
          aria-label="Search menu"
        />
      </label>
      {isPending ? <p className="text-sm text-slate-500">Updating menu…</p> : null}
    </form>
  );
}
