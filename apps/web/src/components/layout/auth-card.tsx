"use client";

import React, { useState } from "react";
import { LoaderCircle, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type AuthCardProps = {
  emailHint?: string;
  variant?: "default" | "marketing";
  id?: string;
  hideSignOut?: boolean;
};

export function AuthCard({
  emailHint,
  variant = "default",
  id,
  hideSignOut = false
}: AuthCardProps) {
  const isMarketing = variant === "marketing";
  const [email, setEmail] = useState(emailHint ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onOtp = async () => {
    setBusy(true);
    setMessage(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) {
        setMessage(error.message);
      } else {
        setMessage("Magic link sent. Check your inbox.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to start OTP login.");
    }

    setBusy(false);
  };

  const onSignOut = async () => {
    setBusy(true);
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      window.location.reload();
    } catch {
      setMessage("Unable to sign out.");
    }
    setBusy(false);
  };

  return (
    <Card id={id} className={cn(isMarketing ? "border-accent/35 shadow-neon" : "")}>
      <CardHeader>
        <CardTitle>{isMarketing ? "Start free with email" : "Sign in"}</CardTitle>
        <CardDescription>
          {isMarketing ? "Get instant access using a secure magic link." : "Email OTP authentication via Supabase."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
        />
        {isMarketing ? (
          <p className="text-xs text-muted">No password required. We will send you a secure sign-in link.</p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button onClick={onOtp} disabled={busy || !email}>
            {busy ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isMarketing ? "Send secure link" : "Send OTP"}
          </Button>
          {!hideSignOut ? (
            <Button variant="secondary" onClick={onSignOut} disabled={busy}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          ) : null}
        </div>
        {message ? <p className="text-sm text-muted">{message}</p> : null}
      </CardContent>
    </Card>
  );
}
