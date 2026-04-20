"use client"

import { useEffect, useState, useRef } from "react";
import TopBar from "@/components/layout/topbar";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabaseclient";
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "@/components/ui/popover";
import { ItemDb } from "@/app/model/model";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Item, ItemContent, ItemTitle, ItemDescription, ItemHeader, ItemActions, ItemFooter, ItemGroup, ItemSeparator } from "@/components/items/item-card";
import { User } from "@supabase/supabase-js";
import ProtectedRoute from "@/components/auth/protected-route";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export default function DashboardPage() {
    const router = useRouter();
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<ItemDb[]>([])
    const [user, setUser] = useState<User | null>(null);
    const [showAll, setShowAll] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startY, setStartY] = useState(0);
    const [scrollTop, setScrollTop] = useState(0);

    const fetchItems = async (currentUser: User | null, searchQuery: string, isViewAll: boolean) => {
        try {
            let queryBuilder = supabase.from('items').select('*');

            if (searchQuery) {
                // Global search
                queryBuilder = queryBuilder.ilike('name', `%${searchQuery}%`);
            } else if (isViewAll) {
                // Show all items
            } else {
                if (currentUser) {
                    queryBuilder = queryBuilder.eq('borrowed_by', currentUser.id);
                } else {
                    setResults([]);
                    return;
                }
            }

            const { data, error } = await queryBuilder;

            if (error) throw error;
            setResults(data || []);
        } catch (err) {
            console.error('Error fetching items:', err)
        }
    }

    useEffect(() => {
        const loadUserAndItems = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                setUser(user);
                await fetchItems(user, query, false);
            } catch (err) {
                console.error(err);
            }
        };
        loadUserAndItems();
    }, [])


    useEffect(() => {
        fetchItems(user, query, showAll);
    }, [query, user, showAll]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!scrollContainerRef.current) return;
        setIsDragging(true);
        setStartY(e.pageY - scrollContainerRef.current.offsetTop);
        setScrollTop(scrollContainerRef.current.scrollTop);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !scrollContainerRef.current) return;
        e.preventDefault();
        const y = e.pageY - scrollContainerRef.current.offsetTop;
        const walk = (y - startY) * 2;
        scrollContainerRef.current.scrollTop = scrollTop - walk;
    };

    const handleMouseUpOrLeave = () => {
        setIsDragging(false);
    };



    return (
        <ProtectedRoute>
            <div className="flex flex-col h-screen">
                {!query && !showAll && results.length === 0 && (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center text-muted-foreground flex flex-col items-center gap-2">
                            <p>You haven't borrowed any items yet.</p>
                        </div>
                    </div>
                )}

                {results.length > 0 && (
                    <div
                        ref={scrollContainerRef}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUpOrLeave}
                        onMouseLeave={handleMouseUpOrLeave}
                        className={`flex-1 min-h-0 overflow-y-auto pt-16 pb-12  touch-pan-y`}
                        style={{ userSelect: isDragging ? 'none' : 'auto' }}
                    >
                        <div className="flex flex-col items-center w-full max-w-2xl mx-auto space-y-2 px-4 pb-32">
                            {results.map((item) => (
                                <Link href={`/items/details?id=${item.id}`} key={item.id} className="w-full">
                                    <div className="w-full border rounded-lg p-4 bg-card shadow-sm hover:shadow-md transition-shadow flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            {item.image_url ? (
                                                <img
                                                    src={item.image_url}
                                                    alt={item.name}
                                                    loading="lazy"
                                                    decoding="async"
                                                    className="w-14 h-14 rounded-lg object-cover border"
                                                />
                                            ) : (
                                                <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center border text-xl">
                                                    📦
                                                </div>
                                            )}
                                            <ItemContent>
                                                <ItemTitle>{item.name}</ItemTitle>
                                                <ItemDescription>{item.description || "No description"}</ItemDescription>
                                            </ItemContent>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${item.status === 'borrowed'
                                            ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200'
                                            : 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200'
                                            }`}>
                                            {item.status === 'borrowed' ? 'Borrowed' : 'In Stock'}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 flex flex-col gap-2 ">
                    {!query && (
                        <>
                            <Button
                                variant="secondary"
                                onClick={() => setShowAll(!showAll)}
                                className="w-full shadow-lg cursor-pointer"
                            >
                                {showAll ? "Show my items" : "Browse all items"}
                            </Button>
                            <Button
                                asChild
                                variant="secondary"
                                className="w-full shadow-lg "
                            >
                                <Link href="/items/create">
                                    Create Item
                                </Link>
                            </Button>
                        </>
                    )}
                    <div className="flex items-center gap-2 bg-card border rounded-xl shadow-lg p-2">
                        <Input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            type="text"
                            placeholder="Search items..."
                            className="flex-1 border-none focus-visible:ring-0"
                        />
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
