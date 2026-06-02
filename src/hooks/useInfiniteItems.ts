"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import type { ItemDb } from "@/app/model/model"
import { ITEM_LIST_PAGE_SIZE } from "@/lib/dashboard-item-query"

/**
 * The columns selected for list rendering (ITEM_LIST_SELECT). This is exactly
 * what an ItemListCard needs, and matches the narrowed shape the Supabase client
 * infers from `.select(ITEM_LIST_SELECT)` — so paged rows assign cleanly without
 * pretending to be a full ItemDb.
 */
export type ItemListRow = Pick<ItemDb, "id" | "name" | "description" | "image_url" | "thumbnail_url" | "status">

type ItemsQueryResult = { data: ItemListRow[] | null; error: { message: string } | null }

/**
 * Builds the Supabase query for a single page. The caller is responsible for
 * applying `.select()`, filters and ordering; this hook only supplies the
 * `from`/`to` window and awaits the result. The returned builder is awaited,
 * so a Supabase query builder (which is thenable) satisfies this type.
 */
export type BuildItemsPageQuery = (range: { from: number; to: number }) => PromiseLike<ItemsQueryResult>

export type UseInfiniteItemsResult = {
  items: ItemListRow[]
  hasMore: boolean
  /** True during an initial load or a reset (page 0). */
  loading: boolean
  /** True while appending a subsequent page. */
  loadingMore: boolean
  /** Reload from page 0, replacing the current list. Returns when settled. */
  reset: () => Promise<void>
  /** Append the next page if one is available and not already loading. */
  loadMore: () => Promise<void>
  /** Clear the list without hitting the network (e.g. a filter with no possible results). */
  setEmpty: () => void
}

/**
 * Generic offset-paginated item loader with the correctness guards the
 * dashboard council called out:
 *  - a request-sequence guard so out-of-order responses (fast typing, tab
 *    switches, refreshes racing appends) never clobber newer results;
 *  - de-duplication on append so a row that drifts across an offset boundary
 *    after an insert/delete is not rendered twice;
 *  - stable page/hasMore tracking via refs so `loadMore` keeps a stable
 *    identity for the IntersectionObserver effect.
 *
 * Ordering stability (a tie-break column) is the caller's responsibility.
 */
export function useInfiniteItems(buildQuery: BuildItemsPageQuery): UseInfiniteItemsResult {
  const [items, setItems] = useState<ItemListRow[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  // Refs keep loadMore/reset stable and let us read live values inside async work.
  const buildQueryRef = useRef(buildQuery)
  useEffect(() => {
    buildQueryRef.current = buildQuery
  })
  const pageRef = useRef(0)
  const seqRef = useRef(0)
  const hasMoreRef = useRef(true)
  const inFlightRef = useRef(false)

  const updateHasMore = useCallback((value: boolean) => {
    hasMoreRef.current = value
    setHasMore(value)
  }, [])

  const run = useCallback(
    async (page: number, mode: "reset" | "append") => {
      const seq = ++seqRef.current
      inFlightRef.current = true
      if (mode === "reset") setLoading(true)
      else setLoadingMore(true)

      try {
        const from = page * ITEM_LIST_PAGE_SIZE
        const to = from + ITEM_LIST_PAGE_SIZE - 1
        const { data, error } = await buildQueryRef.current({ from, to })
        if (error) throw new Error(error.message)
        if (seq !== seqRef.current) return // a newer request superseded this one

        const rows = data ?? []
        pageRef.current = page
        updateHasMore(rows.length === ITEM_LIST_PAGE_SIZE)
        setItems((previous) => {
          if (mode === "reset") return rows
          const seen = new Set(previous.map((row) => row.id))
          return [...previous, ...rows.filter((row) => !seen.has(row.id))]
        })
      } catch (err) {
        console.error("Error fetching items:", err)
        if (seq === seqRef.current && mode === "reset") {
          setItems([])
          updateHasMore(false)
        }
      } finally {
        // Only the latest request clears in-flight/loading state. A superseded
        // request must NOT clear inFlightRef, or it could let a new fetch start
        // while the request that replaced it is still running.
        if (seq === seqRef.current) {
          setLoading(false)
          setLoadingMore(false)
          inFlightRef.current = false
        }
      }
    },
    [updateHasMore],
  )

  const reset = useCallback(() => {
    pageRef.current = 0
    return run(0, "reset")
  }, [run])

  const loadMore = useCallback(() => {
    if (inFlightRef.current || !hasMoreRef.current) return Promise.resolve()
    return run(pageRef.current + 1, "append")
  }, [run])

  const setEmpty = useCallback(() => {
    seqRef.current += 1 // invalidate any in-flight request
    inFlightRef.current = false
    pageRef.current = 0
    setItems([])
    updateHasMore(false)
    setLoading(false)
    setLoadingMore(false)
  }, [updateHasMore])

  return { items, hasMore, loading, loadingMore, reset, loadMore, setEmpty }
}
