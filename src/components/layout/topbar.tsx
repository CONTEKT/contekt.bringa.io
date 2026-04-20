"use client"

import React from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseclient";
import {
    Menubar,
    MenubarMenu,
    MenubarTrigger,
    MenubarContent,
    MenubarItem,
} from "@/components/ui/menubar";
import { LogOutIcon, UserIcon, ShieldCheck } from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import Link from "next/link";
import { ThemeToggle } from "../theme/theme-toggle"

export default function TopBar() {
    const router = useRouter();
    const { isAdmin } = useIsAdmin();

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
        } catch (err) {
            console.error("Sign out error", err);
        } finally {
            router.push("/login");
        }
    };

    return (
        <div className="fixed top-0 left-0 right-0 z-50 border-b bg-background">
            <Menubar className="w-full h-12 px-8 border-none">
                <div className="flex items-center justify-between w-full">
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <span className="font-semibold">Bringa</span>
                    </Link>

                    <div className="flex items-center gap-2">
                        {isAdmin && (
                            <Link href="/admin/dashboard">
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-accent transition-colors cursor-pointer">
                                    <ShieldCheck className="h-4 w-4" />
                                    <span className="text-sm font-medium">Admin View</span>
                                </div>
                            </Link>
                        )}
                        <ThemeToggle />
                        <MenubarMenu>
                            <MenubarTrigger className="rounded-full p-1">
                                <UserIcon className="h-5 w-5" />
                            </MenubarTrigger>
                            <MenubarContent align="end" className="w-56">
                                <Link href="/items/my">
                                    <MenubarItem className="flex items-center gap-2 cursor-pointer">
                                        <span>My Created Items</span>
                                    </MenubarItem>
                                </Link>
                                <Link href="/items/borrowed">
                                    <MenubarItem className="flex items-center gap-2 cursor-pointer">
                                        <span>My Borrowed Items</span>
                                    </MenubarItem>
                                </Link>
                                <div className="h-px bg-muted my-1" />
                                <Link href="/complete-profile">
                                    <MenubarItem className="flex items-center gap-2 cursor-pointer">
                                        <span>Settings</span>
                                    </MenubarItem>
                                </Link>
                                <div className="h-px bg-muted my-1" />
                                <MenubarItem onSelect={handleLogout} className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer">
                                    <LogOutIcon className="h-4 w-4" />
                                    Logout
                                </MenubarItem>
                            </MenubarContent>
                        </MenubarMenu>
                    </div>
                </div>
            </Menubar>
        </div>
    );
}
