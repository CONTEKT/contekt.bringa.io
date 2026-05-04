"use client"

import { useState } from "react";
import GitSignInButton from "@/components/auth/git-signin-button";
import GoogleSignInButton from "@/components/auth/google-signin-button";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { appConfig } from "@/lib/app-config";

export default function LoginPage() {
  const [termsAccepted, setTermsAccepted] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="p-6 bg-card rounded-lg shadow max-w-md w-full">
        <h1 className="text-xl font-semibold mb-4">Sign in</h1>

        <div className="mb-4 flex items-start gap-3">
          <Checkbox
            id="terms"
            checked={termsAccepted}
            onCheckedChange={(checked: boolean) => setTermsAccepted(checked)}
            className="mt-1"
          />
          <label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
            I accept the{" "}
            <Link
              href={appConfig.legal.termsPath}
              target="_blank"
              className="text-primary hover:underline font-medium"
            >
              Terms and Privacy Notes
            </Link>
          </label>
        </div>

        <div className="flex flex-col gap-2">
          <GitSignInButton disabled={!termsAccepted} />
          <GoogleSignInButton disabled={!termsAccepted} />
        </div>
      </div>
    </div>
  );
}
