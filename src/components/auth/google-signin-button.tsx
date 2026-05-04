import React, { useEffect } from "react";

import { supabase } from "@/lib/supabaseclient";
import { appConfig } from "@/lib/app-config";
import { Button } from "@/components/ui/button";

type Props = {
    auto?: boolean;
    redirectTo?: string;
    disabled?: boolean;
};

export default function GoogleSignInButton({ auto = false, redirectTo = appConfig.supabase.authRedirectPath, disabled = false }: Props) {
    const handleSignIn = async () => {
        try {
            const finalRedirect =
                typeof window !== "undefined" && redirectTo.startsWith("/")
                    ? window.location.origin + redirectTo
                    : redirectTo;

            const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: finalRedirect,
                },
            });

            if (error) console.error("Error during Google sign-in:", error.message);
        } catch (err) {
            console.error("GoogleSignInButton sign-in error", err);
        }
    };

    useEffect(() => {
        if (auto) {
            handleSignIn();
        }
    }, [auto]);

    return (
        <Button onClick={handleSignIn} variant="outline" disabled={disabled}>
            Sign in with Google
        </Button>
    );
}
