import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <p>&copy; {new Date().getFullYear()} Green Leaf Catering. All rights reserved.</p>
        <div className="flex gap-6">
          <Link href="/privacy" className="hover:text-brand">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-brand">
            Terms
          </Link>
          <a href="mailto:catering@example.com" className="hover:text-brand">
            catering@example.com
          </a>
        </div>
      </div>
    </footer>
  );
}
