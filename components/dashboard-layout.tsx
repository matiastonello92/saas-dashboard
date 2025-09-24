"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  BarChart3,
  Users,
  DollarSign,
  TrendingUp,
  Globe,
  CreditCard,
  Activity,
  Settings,
  HelpCircle,
  Menu,
  X,
  LogOut,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { supabaseClient } from "@/lib/supabase"
import { fetchAdminStatus } from "@/lib/services/me"
import { signOut } from "@/lib/auth"

const sidebarItems = [
  { icon: BarChart3, label: "Overview", href: "/" },
  { icon: BarChart3, label: "Analytics", href: "/analytics" },
  { icon: Users, label: "Users", href: "/users" },
  { icon: DollarSign, label: "Revenue", href: "/revenue" },
  { icon: TrendingUp, label: "Growth", href: "/growth" },
  { icon: Globe, label: "Geographic", href: "/geographic" },
  { icon: CreditCard, label: "Plans", href: "/plans" },
  { icon: Activity, label: "Activity", href: "/activity" },
  { icon: Settings, label: "Settings", href: "/settings" },
  { icon: HelpCircle, label: "Help", href: "/help" },
]

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profile, setProfile] = useState<{
    email: string | null
    name: string | null
    avatarUrl: string | null
    isPlatformAdmin: boolean
  } | null>(null)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    let active = true
    const supabase = supabaseClient()

    async function loadProfile() {
      try {
        setLoadingProfile(true)
        const [{ data: userData, error: userError }, adminStatusResult] = await Promise.all([
          supabase.auth.getUser(),
          fetchAdminStatus()
            .then((value) => ({ value, error: null }))
            .catch((error: unknown) => ({
              value: null,
              error,
            })),
        ])

        if (!active) {
          return
        }

        if (userError) {
          throw userError
        }

        const user = userData?.user ?? null
        const adminStatus = adminStatusResult.value
        const email = adminStatus?.email ?? user?.email ?? null
        const name = (user?.user_metadata?.full_name as string | null | undefined) ?? null
        const avatarUrl = (user?.user_metadata?.avatar_url as string | null | undefined) ?? null

        setProfile({
          email,
          name,
          avatarUrl,
          isPlatformAdmin: Boolean(adminStatus?.isPlatformAdmin),
        })
        if (adminStatusResult.error) {
          const adminError = adminStatusResult.error
          const message = adminError instanceof Error ? adminError.message : 'Unable to verify admin status'
          setProfileError(message)
        } else {
          setProfileError(null)
        }
      } catch (error) {
        if (!active) {
          return
        }
        const message = error instanceof Error ? error.message : 'Unable to load profile'
        setProfile(null)
        setProfileError(message)
      } finally {
        if (active) {
          setLoadingProfile(false)
        }
      }
    }

    loadProfile()
    return () => {
      active = false
    }
  }, [])

  const initials = useMemo(() => {
    if (profile?.name) {
      return profile.name.trim().slice(0, 2).toUpperCase()
    }
    if (profile?.email) {
      return profile.email.slice(0, 2).toUpperCase()
    }
    return 'K'
  }, [profile])

  const accountLabel = profile?.name || profile?.email || (loadingProfile ? 'Loading…' : 'Account')

  async function handleLogout() {
    try {
      await signOut()
    } catch (error) {
      console.error('Logout failed', error)
    } finally {
      router.push('/login')
    }
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-black/20 backdrop-blur-xl border-r border-white/10 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            {/* Klyra Logo/Monogram placeholder - will be replaced with actual logo */}
            <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">K</span>
            </div>
            <div>
              <h1 className="text-white font-semibold text-lg">Klyra</h1>
              <p className="text-white/60 text-xs">Dashboard</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden text-white hover:bg-white/10"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-1">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start text-white/80 hover:text-white hover:bg-white/10",
                      isActive && "bg-blue-600 text-white hover:bg-blue-700"
                    )}
                  >
                    <item.icon className="mr-3 h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}
          </nav>
        </ScrollArea>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-black/20 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden text-white hover:bg-white/10"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-white text-xl font-semibold">Dashboard</h2>
              <p className="text-white/60 text-sm">Overview</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-white text-sm font-medium">
                {accountLabel}
              </p>
              <p className="text-white/60 text-xs">
                {profile?.email ?? (profileError ? 'Unable to load email' : loadingProfile ? 'Loading…' : '—')}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="focus-visible:outline-none"
                  aria-label="Account menu"
                >
                  <Avatar className="ring-2 ring-white/20">
                    {profile?.avatarUrl ? (
                      <AvatarImage src={profile.avatarUrl} alt={profile?.name ?? profile?.email ?? 'Profile'} />
                    ) : null}
                    <AvatarFallback className="bg-gradient-to-r from-cyan-400 to-purple-400 text-white text-sm font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Signed in</DropdownMenuLabel>
                <div className="px-2 py-1 text-xs text-muted-foreground break-words">
                  {profile?.email ?? 'Unknown user'}
                </div>
                {profile?.isPlatformAdmin ? (
                  <div className="px-2 py-1 text-[10px] uppercase tracking-wide text-green-400">
                    Platform Admin
                  </div>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
