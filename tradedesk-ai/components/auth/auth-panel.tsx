"use client";

import Link from "next/link";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { ArrowRight, KeyRound } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";

/**
 * Supabase Auth UI, pointed at whatever project the backend team provisions.
 *
 * Until `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` exist,
 * the screen says so plainly and still lets you into the dashboard, which runs
 * on mock data anyway.
 */
export function AuthPanel({ view }: { view: "sign_in" | "sign_up" }) {
  if (!isSupabaseConfigured) {
    return (
      <div className="space-y-4">
        <Alert variant="warning">
          <KeyRound />
          <AlertTitle>Supabase isn&apos;t connected yet</AlertTitle>
          <AlertDescription>
            <p>
              This screen renders the Supabase Auth UI as soon as
              <code className="mx-1 rounded bg-black/5 px-1 py-0.5 font-mono text-xs">
                NEXT_PUBLIC_SUPABASE_URL
              </code>
              and
              <code className="mx-1 rounded bg-black/5 px-1 py-0.5 font-mono text-xs">
                NEXT_PUBLIC_SUPABASE_ANON_KEY
              </code>
              are set — see{" "}
              <code className="font-mono text-xs">.env.example</code>.
            </p>
          </AlertDescription>
        </Alert>

        <Button asChild className="w-full">
          <Link href="/dashboard">
            Open the dashboard on mock data
            <ArrowRight />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <Auth
      supabaseClient={getSupabaseBrowserClient()}
      view={view}
      // TODO(backend): confirm which providers the project enables. Email +
      // magic link only for now; add Google here once it's switched on.
      providers={[]}
      redirectTo={
        typeof window === "undefined"
          ? undefined
          : `${window.location.origin}/dashboard`
      }
      appearance={{
        theme: ThemeSupa,
        variables: {
          default: {
            colors: {
              brand: "#2b4bbf",
              brandAccent: "#243fa0",
              inputBorder: "#e3e6ec",
              inputBorderFocus: "#2b4bbf",
              inputBorderHover: "#c9cfda",
            },
            radii: {
              borderRadiusButton: "0.5rem",
              inputBorderRadius: "0.5rem",
              buttonBorderRadius: "0.5rem",
            },
            fonts: {
              bodyFontFamily: "var(--font-geist-sans), system-ui, sans-serif",
              buttonFontFamily: "var(--font-geist-sans), system-ui, sans-serif",
              inputFontFamily: "var(--font-geist-sans), system-ui, sans-serif",
              labelFontFamily: "var(--font-geist-sans), system-ui, sans-serif",
            },
          },
        },
      }}
      localization={{
        variables: {
          sign_in: {
            email_label: "Email",
            password_label: "Password",
            button_label: "Sign in",
          },
          sign_up: {
            email_label: "Email",
            password_label: "Password",
            button_label: "Create account",
          },
        },
      }}
    />
  );
}
