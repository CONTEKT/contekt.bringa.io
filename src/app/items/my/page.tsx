"use client"

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseclient";
import { Loader2 } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import ProtectedRoute from "@/components/auth/protected-route";
import { ItemListCard } from "@/components/items/item-list-card";
import { ITEM_LIST_SELECT } from "@/lib/dashboard-item-query";
import { useInfiniteItems } from "@/hooks/useInfiniteItems";

export default function MyItemsPage() {
    const [user, setUser] = useState<User | null>(null);
    const [ready, setReady] = useState(false);
    const sentinelRef = useRef<HTMLDivElement>(null);

    const buildItemsQuery = useCallback(
        ({ from, to }: { from: number; to: number }) =>
            supabase
                .from('items')
                .select(ITEM_LIST_SELECT)
                .eq('created_by', user?.id ?? '')
                .order('created_at', { ascending: false })
                .order('id', { ascending: false }) // stable tie-break so paging never skips/duplicates
                .range(from, to),
        [user],
    );

    const { items, hasMore, loading, loadingMore, reset, loadMore, setEmpty } = useInfiniteItems(buildItemsQuery);

    useEffect(() => {
        let active = true;
        supabase.auth.getUser().then(({ data }) => {
            if (!active) return;
            setUser(data.user);
            setReady(true);
        });
        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        if (!ready) return;
        if (!user) setEmpty(); else reset();
    }, [ready, user, reset, setEmpty]);

    useEffect(() => {
        if (loading || !hasMore) return;
        const sentinel = sentinelRef.current;
        if (!sentinel) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) loadMore();
            },
            { rootMargin: "600px 0px", threshold: 0 },
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [loading, hasMore, loadMore, items.length]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-background pt-16 px-4 pb-20">
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-2xl font-bold mb-6">My Created Items</h1>

                    {items.length === 0 ? (
                        <div className="text-center text-muted-foreground mt-10">
                            <p>You have not created any items yet.</p>
                            <Link href="/items/create" className="text-primary hover:underline mt-2 inline-block">
                                Create your first item
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {items.map((item) => (
                                <ItemListCard item={item} key={item.id} />
                            ))}
                            <div ref={sentinelRef} className="h-px w-full" aria-hidden="true" />
                            {loadingMore && (
                                <div className="flex justify-center py-4">
                                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}
