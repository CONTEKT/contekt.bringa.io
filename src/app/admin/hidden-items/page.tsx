"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Eye, EyeOff, History, Loader2, Package } from "lucide-react"
import ProtectedRoute from "@/components/auth/protected-route"
import { AppImage } from "@/components/ui/app-image"
import { Button } from "@/components/ui/button"
import { useIsAdmin } from "@/hooks/useIsAdmin"
import { supabase } from "@/lib/supabaseclient"
import { buildAdminRouteGate } from "@/lib/admin-route-gate"
import {
    ADMIN_HIDDEN_ITEM_SELECT,
    buildAdminHiddenItems,
    type AdminHiddenItem,
    type AdminHiddenItemEntry,
} from "@/lib/admin-hidden-items"

type OwnerName = { id: string; display_name: string | null; display_surname: string | null; email: string | null }

function profileName(profile: OwnerName | undefined): string {
    if (!profile) return ""
    const name = `${profile.display_name || ""} ${profile.display_surname || ""}`.trim()
    return name || profile.email || ""
}

function formatDate(value: string | null | undefined): string {
    if (!value) return "Unknown date"
    const date = new Date(value)
    if (!Number.isFinite(date.getTime())) return "Unknown date"
    return date.toISOString().split("T")[0]
}

function ownerLabel(item: AdminHiddenItem, ownerNames: Map<string, OwnerName>): string {
    if (item.owner_kind === "profile") {
        return item.owner_profile_id ? profileName(ownerNames.get(item.owner_profile_id)) || "Profile owner" : "Profile owner"
    }
    if (item.owner_kind === "free_text") return item.owner_label || "Free-text owner"
    return item.owner_label || "Operator"
}

function VisibilityBadge({ value }: { value: string | null | undefined }) {
    const visibility = value || "visible"
    const pending = visibility === "pending_visible"
    return (
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${pending ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200" : "bg-muted text-muted-foreground"}`}>
            {visibility.replaceAll("_", " ")}
        </span>
    )
}

export default function AdminHiddenItemsPage() {
    const router = useRouter()
    const { isAdmin, loading: adminLoading } = useIsAdmin()
    const [items, setItems] = useState<AdminHiddenItem[]>([])
    const [ownerNames, setOwnerNames] = useState<Map<string, OwnerName>>(new Map())
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [actionError, setActionError] = useState<string | null>(null)
    const [visibilityReason, setVisibilityReason] = useState("")
    const [processingAction, setProcessingAction] = useState<string | null>(null)
    const adminGate = buildAdminRouteGate({ adminLoading, isAdmin, contentLoading: loading })

    const hiddenItems = useMemo<AdminHiddenItemEntry[]>(() => buildAdminHiddenItems(items), [items])

    useEffect(() => {
        if (adminGate.redirectTo) {
            router.push(adminGate.redirectTo)
        }
    }, [adminGate.redirectTo, router])

    useEffect(() => {
        const fetchHiddenItems = async () => {
            try {
                setLoading(true)
                setError(null)

                const { data, error: itemsError } = await supabase
                    .from("items")
                    .select(ADMIN_HIDDEN_ITEM_SELECT)
                    .neq("visibility_state", "visible")
                    .order("created_at", { ascending: false })

                if (itemsError) throw itemsError

                const rows = (data || []) as AdminHiddenItem[]
                setItems(rows)

                const ownerIds = Array.from(
                    new Set(
                        rows
                            .flatMap((item) => [item.created_by, item.owner_profile_id])
                            .filter((id): id is string => Boolean(id)),
                    ),
                )

                if (ownerIds.length > 0) {
                    const { data: profiles } = await supabase
                        .from("profiles")
                        .select("id,display_name,display_surname,email")
                        .in("id", ownerIds)

                    const map = new Map<string, OwnerName>()
                    for (const profile of (profiles || []) as OwnerName[]) {
                        map.set(profile.id, profile)
                    }
                    setOwnerNames(map)
                } else {
                    setOwnerNames(new Map())
                }
            } catch {
                setError("Hidden items are unavailable until the admin item contract is applied.")
            } finally {
                setLoading(false)
            }
        }

        if (isAdmin) {
            fetchHiddenItems()
        }
    }, [isAdmin])

    const reviewVisibility = async (item: AdminHiddenItemEntry, visibilityState: "visible" | "admin_hidden") => {
        const reason = visibilityReason.trim()
        if (reason.length < 3) {
            setActionError("Add a short visibility reason before changing this item.")
            return
        }

        const actionId = `visibility-${item.id}-${visibilityState}`
        setProcessingAction(actionId)
        setActionError(null)
        try {
            const { data, error: rpcError } = await supabase.rpc("set_item_visibility", {
                item_id_input: item.id,
                visibility_state_input: visibilityState,
                reason_input: reason,
            })

            if (rpcError) throw rpcError
            if (!data) throw new Error("Visibility change rejected")

            // Making an item visible removes it from this list; hiding keeps it with the new state.
            if (visibilityState === "visible") {
                setItems((rows) => rows.filter((row) => row.id !== item.id))
            } else {
                setItems((rows) => rows.map((row) => (
                    row.id === item.id
                        ? { ...row, visibility_state: visibilityState, visibility_reason: reason }
                        : row
                )))
            }
            setVisibilityReason("")
        } catch {
            setActionError("Could not update the item visibility.")
        } finally {
            setProcessingAction(null)
        }
    }

    if (adminGate.showLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!adminGate.render) {
        return null
    }

    return (
        <ProtectedRoute>
            <div className="flex w-full flex-col gap-5 px-4 pb-24 pt-16 sm:px-6 lg:px-8">
                <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                            <Button asChild variant="ghost" size="sm" className="mb-2 w-fit px-0">
                                <Link href="/admin/dashboard">
                                    <ArrowLeft className="h-4 w-4" />
                                    Back to dashboard
                                </Link>
                            </Button>
                            <h1 className="text-2xl font-bold">Hidden Items</h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Every item not currently visible to members · {hiddenItems.length} records
                            </p>
                        </div>
                        <Button asChild variant="outline">
                            <Link href="/admin/moderation">Moderation queue</Link>
                        </Button>
                    </div>

                    {error && (
                        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    {actionError && (
                        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                            {actionError}
                        </div>
                    )}

                    <section className="rounded-lg border bg-card p-4">
                        <label htmlFor="hidden-item-visibility-reason" className="text-sm font-medium">Visibility reason</label>
                        <textarea
                            id="hidden-item-visibility-reason"
                            value={visibilityReason}
                            onChange={(event) => setVisibilityReason(event.target.value)}
                            rows={3}
                            className="mt-2 min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            placeholder="Record why this item should become visible or stay hidden."
                        />
                        <p className="mt-2 text-xs text-muted-foreground">Required for visibility actions on this page.</p>
                    </section>

                    {hiddenItems.length === 0 && !error ? (
                        <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
                            No hidden items. Everything is visible to members.
                        </div>
                    ) : (
                        <section className="flex flex-col gap-2">
                            {hiddenItems.map((item) => (
                                <div key={item.id} className="rounded-lg border bg-card p-4">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="flex min-w-0 gap-3">
                                            {item.image_url ? (
                                                <AppImage
                                                    src={item.image_url}
                                                    alt=""
                                                    width={56}
                                                    height={56}
                                                    sizes="56px"
                                                    className="h-14 w-14 shrink-0 rounded-md border object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border bg-muted">
                                                    <Package className="h-6 w-6 text-muted-foreground" />
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <VisibilityBadge value={item.visibility_state} />
                                                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                                                        {item.status === "borrowed" ? "Borrowed" : "In stock"}
                                                    </span>
                                                </div>
                                                <h3 className="mt-2 truncate font-semibold">{item.nameLabel}</h3>
                                                <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{item.reasonLabel}</p>
                                                <p className="mt-2 text-xs text-muted-foreground">
                                                    {ownerLabel(item, ownerNames)} · Created {formatDate(item.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2 sm:max-w-64 sm:justify-end">
                                            <Button asChild variant="outline" size="sm" className="sm:shrink-0">
                                                <Link href={`/items/details?id=${item.id}`}>Open item</Link>
                                            </Button>
                                            <Button asChild variant="outline" size="sm" className="sm:shrink-0">
                                                <Link href={`/admin/item-versions?itemId=${item.id}`}>
                                                    <History className="h-4 w-4" />
                                                    Versions
                                                </Link>
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => reviewVisibility(item, "visible")}
                                                disabled={processingAction !== null || visibilityReason.trim().length < 3}
                                            >
                                                {processingAction === `visibility-${item.id}-visible` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                                                Make visible
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => reviewVisibility(item, "admin_hidden")}
                                                disabled={processingAction !== null || item.visibility_state === "admin_hidden" || visibilityReason.trim().length < 3}
                                            >
                                                {processingAction === `visibility-${item.id}-admin_hidden` ? <Loader2 className="h-4 w-4 animate-spin" /> : <EyeOff className="h-4 w-4" />}
                                                Hide
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </section>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    )
}
