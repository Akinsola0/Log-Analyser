"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";

import { Logo } from "@/components/site/logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

/** Both audiences are one click from the first screen — neither is buried. */
const navLinks = [
  { href: "/find", label: "Find a tradesman" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#compare", label: "Compare" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-background/92 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-[86rem] items-center justify-between gap-4 px-4 sm:px-8">
        <Logo />

        <nav
          aria-label="Main"
          className="hidden items-center gap-8 text-sm font-medium md:flex"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-primary rounded underline-offset-4 transition-colors hover:underline"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <Link
            href="/login"
            className="hover:text-primary rounded text-sm font-medium underline-offset-4 transition-colors hover:underline"
          >
            Sign in
          </Link>
          <Button asChild size="sm">
            <Link href="/signup">Get started</Link>
          </Button>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="outline" size="icon" aria-label="Open menu">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <nav aria-label="Mobile" className="flex flex-col gap-1 px-4">
              {navLinks.map((link) => (
                <SheetClose asChild key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:bg-secondary rounded px-3 py-2 font-medium"
                  >
                    {link.label}
                  </Link>
                </SheetClose>
              ))}
            </nav>
            <div className="mt-auto flex flex-col gap-2 p-4">
              <SheetClose asChild>
                <Button asChild variant="outline">
                  <Link href="/login">Sign in</Link>
                </Button>
              </SheetClose>
              <SheetClose asChild>
                <Button asChild>
                  <Link href="/signup">Get started</Link>
                </Button>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
