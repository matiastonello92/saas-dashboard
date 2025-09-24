"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { useRouter } from "next/navigation"

import { supabaseClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type AdminCheckResponse = {
  email?: string | null
  isPlatformAdmin?: boolean
  error?: string
}

export function UserChip() {
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    let active = true

    fetch("/api/qa/admin-check")
      .then(async (response) => {
        try {
          return await response.json()
        } catch {
          return {}
        }
      })
      .then((data: AdminCheckResponse) => {
        if (!active) return
        setEmail(data.email ?? null)
      })
      .catch(() => {
        if (!active) return
        setEmail(null)
      })
      .finally(() => {
        if (!active) return
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const displayName = useMemo(() => {
    if (email) {
      const [localPart] = email.split("@")
      return localPart || email
    }
    return loading ? "Loading" : "Account"
  }, [email, loading])

  const avatarInitial = useMemo(() => {
    if (email && email.length > 0) {
      return email.charAt(0).toUpperCase()
    }
    return "?"
  }, [email])

  const handleLogout = useCallback(async () => {
    const client = supabaseClient()
    await client.auth.signOut()
    router.push("/login")
  }, [router])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-3 bg-transparent px-3 py-2 text-left text-white hover:bg-white/10 focus-visible:ring-0 focus-visible:ring-offset-0"
        >
          <div className="text-right">
            <p className="text-sm font-medium text-white">{displayName}</p>
            <p className="text-xs text-white/60">
              {loading ? "Loading..." : email ?? "Not available"}
            </p>
          </div>
          <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 to-purple-400 text-sm font-semibold text-white">
            {avatarInitial}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
