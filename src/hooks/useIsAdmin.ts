"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseclient"

export function useIsAdmin() {
    const [isAdmin, setIsAdmin] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const checkAdminStatus = async () => {
            try {
                const { data, error } = await supabase.rpc('is_admin')

                if (error) {
                    setIsAdmin(false)
                } else {
                    setIsAdmin(Boolean(data))
                }
            } catch {
                // Ignore error to prevent leak
                setIsAdmin(false)
            } finally {
                setLoading(false)
            }
        }

        checkAdminStatus()
    }, [])

    return { isAdmin, loading }
}
