"use client"

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { appConfig } from "@/lib/app-config";
import { localDevEmailAccounts, isLocalSupabaseDevelopment } from "@/lib/local-dev-login";
import { supabase } from "@/lib/supabaseclient";

type Props = {
  termsAccepted: boolean;
};

export default function LocalDevEmailLogin({ termsAccepted }: Props) {
  const router = useRouter();
  const enabled = isLocalSupabaseDevelopment({ config: appConfig });
  const defaultAccount = localDevEmailAccounts[0];
  const [email, setEmail] = useState(defaultAccount?.email || "");
  const [password, setPassword] = useState(defaultAccount?.password || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!enabled || !defaultAccount) {
    return null;
  }

  const chooseAccount = (account: typeof localDevEmailAccounts[number]) => {
    setEmail(account.email);
    setPassword(account.password);
    setError(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!termsAccepted || loading) return;

    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.replace(appConfig.supabase.authRedirectPath);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 border-t pt-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium">
        <KeyRound className="size-4" />
        <span>Local Supabase</span>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2">
        {localDevEmailAccounts.map((account) => (
          <Button
            key={account.email}
            type="button"
            variant={email === account.email ? "secondary" : "outline"}
            onClick={() => chooseAccount(account)}
            disabled={loading}
          >
            {account.label}
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="local-dev-email">Email</Label>
          <Input
            id="local-dev-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="username"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="local-dev-password">Password</Label>
          <Input
            id="local-dev-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />
        </div>
      </div>

      {error && (
        <p className="mt-3 rounded-md bg-destructive/10 p-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" className="mt-3 w-full" disabled={!termsAccepted || loading}>
        {loading && <Loader2 className="size-4 animate-spin" />}
        Sign in locally
      </Button>
    </form>
  );
}
