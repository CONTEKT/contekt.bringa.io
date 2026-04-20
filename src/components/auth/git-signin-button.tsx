import React, { useEffect } from "react";

import { supabase } from "@/lib/supabaseclient";
import { Button } from "@/components/ui/button";

type Props = {
    auto?: boolean;
    redirectTo?: string;
    disabled?: boolean;
};

export default function GitSignInButton({ auto = false, redirectTo = "/dashboard", disabled = false }: Props) {
    const handleSignIn = async () => {
        try {
            const finalRedirect =
                typeof window !== "undefined" && redirectTo.startsWith("/")
                    ? window.location.origin + redirectTo
                    : redirectTo;

            const { error } = await supabase.auth.signInWithOAuth({
                provider: "github",
                options: {
                    redirectTo: finalRedirect,
                },
            });

            if (error) console.error("Error during GitHub sign-in:", error.message);
        } catch (err) {
            console.error("GitSignInButton sign-in error", err);
        }
    };

    useEffect(() => {
        if (auto) {
            handleSignIn();
        }
    }, [auto]);

    return (
        <Button onClick={handleSignIn} variant="outline" disabled={disabled}>
            Sign in with GitHub
        </Button>
    );
}