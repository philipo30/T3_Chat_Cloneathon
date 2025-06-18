"use client"

import { Card, CardContent } from "@/components/ui/card"
import { useState, useRef, useEffect } from "react"
import { Moon, Sun, ArrowLeft, Eye, EyeOff, Copy, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogoutButton } from "@/components/logout-button"
import { useTheme } from "next-themes"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useApiKey } from "@/hooks/useApiKey"
import { OpenRouterClient } from "@/lib/api/openrouter"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"

const tabs = ["Overview", "API Keys", "Usage", "Settings"]

interface User {
  id: string
  email?: string
  user_metadata: {
    full_name?: string
    avatar_url?: string
  }
}

interface AccountPageClientProps {
  user: User
}

interface CreditsData {
  total_credits: number
  total_usage: number
}

export function AccountPageClient({ user }: AccountPageClientProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [hoverStyle, setHoverStyle] = useState({})
  const [activeStyle, setActiveStyle] = useState({ left: "0px", width: "0px" })
  const [showApiKey, setShowApiKey] = useState(false)
  const [newApiKey, setNewApiKey] = useState("")
  const tabRefs = useRef<(HTMLDivElement | null)[]>([])
  const { theme, setTheme } = useTheme()
  const { apiKey, saveApiKey, removeApiKey } = useApiKey()

  // Fetch OpenRouter credits
  const { data: creditsData, isLoading: creditsLoading, error: creditsError } = useQuery<CreditsData>({
    queryKey: ['openrouter-credits', apiKey],
    queryFn: async () => {
      if (!apiKey) throw new Error('No API key available')
      const client = new OpenRouterClient(apiKey)
      const response = await fetch('https://openrouter.ai/api/v1/credits', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      })
      if (!response.ok) throw new Error('Failed to fetch credits')
      const result = await response.json()
      return result.data
    },
    enabled: !!apiKey,
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  useEffect(() => {
    if (hoveredIndex !== null) {
      const hoveredElement = tabRefs.current[hoveredIndex]
      if (hoveredElement) {
        const { offsetLeft, offsetWidth } = hoveredElement
        setHoverStyle({
          left: `${offsetLeft}px`,
          width: `${offsetWidth}px`,
        })
      }
    }
  }, [hoveredIndex])

  useEffect(() => {
    const activeElement = tabRefs.current[activeIndex]
    if (activeElement) {
      const { offsetLeft, offsetWidth } = activeElement
      setActiveStyle({
        left: `${offsetLeft}px`,
        width: `${offsetWidth}px`,
      })
    }
  }, [activeIndex])

  useEffect(() => {
    requestAnimationFrame(() => {
      const overviewElement = tabRefs.current[0]
      if (overviewElement) {
        const { offsetLeft, offsetWidth } = overviewElement
        setActiveStyle({
          left: `${offsetLeft}px`,
          width: `${offsetWidth}px`,
        })
      }
    })
  }, [])

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const handleSaveApiKey = () => {
    if (newApiKey.trim()) {
      saveApiKey(newApiKey.trim())
      setNewApiKey("")
      toast.success("API key saved successfully")
    }
  }

  const handleRemoveApiKey = () => {
    removeApiKey()
    toast.success("API key removed")
  }

  const copyApiKey = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey)
      toast.success("API key copied to clipboard")
    }
  }

  const renderTabContent = () => {
    switch (activeIndex) {
      case 0: // Overview
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Section */}
            <div className="lg:col-span-1">
              <Card className="border-0 bg-[rgb(31,26,36)]/80 dark:bg-[rgb(31,26,36)]/80 bg-white/80 text-[rgb(231,208,221)] dark:text-[rgb(231,208,221)] text-[rgb(59,28,62)] backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={user.user_metadata.avatar_url} alt={user.user_metadata.full_name} />
                      <AvatarFallback className="text-lg">{user.user_metadata.full_name?.[0] ?? 'U'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-xl font-semibold">{user.user_metadata.full_name}</h3>
                      <p className="text-[rgb(231,208,221)]/70 dark:text-[rgb(231,208,221)]/70 text-[rgb(59,28,62)]/70 text-sm">{user.email}</p>
                    </div>
                    <div className="w-full pt-4 border-t border-[rgb(50,32,40)] dark:border-[rgb(50,32,40)] border-[rgb(233,224,236)]">
                      <LogoutButton />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Usage Stats */}
            <div className="lg:col-span-2">
              <Card className="border-0 bg-[rgb(31,26,36)]/80 dark:bg-[rgb(31,26,36)]/80 bg-white/80 text-[rgb(231,208,221)] dark:text-[rgb(231,208,221)] text-[rgb(59,28,62)] backdrop-blur-sm">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Usage Overview</h3>
                  {apiKey ? (
                    creditsLoading ? (
                      <div className="space-y-3">
                        <div className="h-4 bg-[rgb(50,32,40)] dark:bg-[rgb(50,32,40)] bg-[rgb(233,224,236)] rounded animate-pulse" />
                        <div className="h-4 bg-[rgb(50,32,40)] dark:bg-[rgb(50,32,40)] bg-[rgb(233,224,236)] rounded animate-pulse w-3/4" />
                      </div>
                    ) : creditsError ? (
                      <p className="text-red-400">Failed to load usage data</p>
                    ) : creditsData ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-[rgb(19,19,20)]/50 dark:bg-[rgb(19,19,20)]/50 bg-[rgb(248,242,250)]/80 border border-[rgb(50,32,40)] dark:border-[rgb(50,32,40)] border-[rgb(233,224,236)]">
                          <p className="text-sm text-[rgb(231,208,221)]/70 dark:text-[rgb(231,208,221)]/70 text-[rgb(59,28,62)]/70">Total Credits</p>
                          <p className="text-2xl font-bold">${creditsData.total_credits.toFixed(2)}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-[rgb(19,19,20)]/50 dark:bg-[rgb(19,19,20)]/50 bg-[rgb(248,242,250)]/80 border border-[rgb(50,32,40)] dark:border-[rgb(50,32,40)] border-[rgb(233,224,236)]">
                          <p className="text-sm text-[rgb(231,208,221)]/70 dark:text-[rgb(231,208,221)]/70 text-[rgb(59,28,62)]/70">Total Usage</p>
                          <p className="text-2xl font-bold">${creditsData.total_usage.toFixed(2)}</p>
                        </div>
                        <div className="col-span-2 p-4 rounded-lg bg-[rgb(19,19,20)]/50 dark:bg-[rgb(19,19,20)]/50 bg-[rgb(248,242,250)]/80 border border-[rgb(50,32,40)] dark:border-[rgb(50,32,40)] border-[rgb(233,224,236)]">
                          <p className="text-sm text-[rgb(231,208,221)]/70 dark:text-[rgb(231,208,221)]/70 text-[rgb(59,28,62)]/70">Remaining Balance</p>
                          <p className="text-2xl font-bold text-green-400">
                            ${(creditsData.total_credits - creditsData.total_usage).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ) : null
                  ) : (
                    <p className="text-[rgb(231,208,221)]/70 dark:text-[rgb(231,208,221)]/70 text-[rgb(59,28,62)]/70">Add an API key to view usage statistics</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )

      case 1: // API Keys
        return (
          <div className="max-w-2xl">
            <Card className="border-0 bg-[rgb(31,26,36)]/80 dark:bg-[rgb(31,26,36)]/80 bg-white/80 text-[rgb(231,208,221)] dark:text-[rgb(231,208,221)] text-[rgb(59,28,62)] backdrop-blur-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">OpenRouter API Key</h3>

                {apiKey ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-[rgb(19,19,20)]/50 dark:bg-[rgb(19,19,20)]/50 bg-[rgb(248,242,250)]/80 border border-[rgb(50,32,40)] dark:border-[rgb(50,32,40)] border-[rgb(233,224,236)]">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <Label className="text-sm text-[rgb(231,208,221)]/70 dark:text-[rgb(231,208,221)]/70 text-[rgb(59,28,62)]/70">Current API Key</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="text-sm font-mono">
                              {showApiKey ? apiKey : `${'*'.repeat(20)}...${apiKey.slice(-4)}`}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowApiKey(!showApiKey)}
                              className="h-6 w-6 p-0"
                            >
                              {showApiKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={copyApiKey}
                              className="h-6 w-6 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleRemoveApiKey}
                          className="ml-4"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-[rgb(231,208,221)]/70 dark:text-[rgb(231,208,221)]/70 text-[rgb(59,28,62)]/70 text-sm">
                      Add your OpenRouter API key to start using AI models and track your usage.
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="api-key">API Key</Label>
                      <div className="flex gap-2">
                        <Input
                          id="api-key"
                          type="password"
                          placeholder="sk-or-..."
                          value={newApiKey}
                          onChange={(e) => setNewApiKey(e.target.value)}
                          className="bg-[rgb(19,19,20)]/50 dark:bg-[rgb(19,19,20)]/50 bg-[rgb(248,242,250)]/80 border-[rgb(50,32,40)] dark:border-[rgb(50,32,40)] border-[rgb(233,224,236)] text-[rgb(231,208,221)] dark:text-[rgb(231,208,221)] text-[rgb(59,28,62)]"
                        />
                        <Button onClick={handleSaveApiKey} disabled={!newApiKey.trim()}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-[rgb(231,208,221)]/50 dark:text-[rgb(231,208,221)]/50 text-[rgb(59,28,62)]/50">
                      Get your API key from{" "}
                      <a
                        href="https://openrouter.ai/keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[rgb(191,75,133)] hover:underline"
                      >
                        OpenRouter
                      </a>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )

      case 2: // Usage
        return (
          <div className="max-w-4xl">
            <Card className="border-0 bg-[rgb(31,26,36)]/80 dark:bg-[rgb(31,26,36)]/80 bg-white/80 text-[rgb(231,208,221)] dark:text-[rgb(231,208,221)] text-[rgb(59,28,62)] backdrop-blur-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Detailed Usage</h3>
                {apiKey ? (
                  creditsLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-16 bg-[rgb(50,32,40)] dark:bg-[rgb(50,32,40)] bg-[rgb(233,224,236)] rounded animate-pulse" />
                      ))}
                    </div>
                  ) : creditsError ? (
                    <p className="text-red-400">Failed to load detailed usage data</p>
                  ) : creditsData ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-lg bg-[rgb(19,19,20)]/50 dark:bg-[rgb(19,19,20)]/50 bg-[rgb(248,242,250)]/80 border border-[rgb(50,32,40)] dark:border-[rgb(50,32,40)] border-[rgb(233,224,236)]">
                          <p className="text-sm text-[rgb(231,208,221)]/70 dark:text-[rgb(231,208,221)]/70 text-[rgb(59,28,62)]/70">Credits Purchased</p>
                          <p className="text-xl font-bold">${creditsData.total_credits.toFixed(2)}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-[rgb(19,19,20)]/50 dark:bg-[rgb(19,19,20)]/50 bg-[rgb(248,242,250)]/80 border border-[rgb(50,32,40)] dark:border-[rgb(50,32,40)] border-[rgb(233,224,236)]">
                          <p className="text-sm text-[rgb(231,208,221)]/70 dark:text-[rgb(231,208,221)]/70 text-[rgb(59,28,62)]/70">Credits Used</p>
                          <p className="text-xl font-bold">${creditsData.total_usage.toFixed(2)}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-[rgb(19,19,20)]/50 dark:bg-[rgb(19,19,20)]/50 bg-[rgb(248,242,250)]/80 border border-[rgb(50,32,40)] dark:border-[rgb(50,32,40)] border-[rgb(233,224,236)]">
                          <p className="text-sm text-[rgb(231,208,221)]/70 dark:text-[rgb(231,208,221)]/70 text-[rgb(59,28,62)]/70">Usage Rate</p>
                          <p className="text-xl font-bold">
                            {creditsData.total_credits > 0
                              ? `${((creditsData.total_usage / creditsData.total_credits) * 100).toFixed(1)}%`
                              : '0%'
                            }
                          </p>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg bg-[rgb(19,19,20)]/50 dark:bg-[rgb(19,19,20)]/50 bg-[rgb(248,242,250)]/80 border border-[rgb(50,32,40)] dark:border-[rgb(50,32,40)] border-[rgb(233,224,236)]">
                        <h4 className="font-medium mb-2">Quick Actions</h4>
                        <div className="flex gap-2">
                          <Button asChild variant="outline" size="sm">
                            <a href="https://openrouter.ai/settings/credits" target="_blank" rel="noopener noreferrer">
                              Add Credits
                            </a>
                          </Button>
                          <Button asChild variant="outline" size="sm">
                            <a href="https://openrouter.ai/activity" target="_blank" rel="noopener noreferrer">
                              View Activity
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : null
                ) : (
                  <p className="text-[rgb(231,208,221)]/70 dark:text-[rgb(231,208,221)]/70 text-[rgb(59,28,62)]/70">Add an API key to view detailed usage statistics</p>
                )}
              </CardContent>
            </Card>
          </div>
        )

      case 3: // Settings
        return (
          <div className="max-w-2xl">
            <Card className="border-0 bg-[rgb(31,26,36)]/80 dark:bg-[rgb(31,26,36)]/80 bg-white/80 text-[rgb(231,208,221)] dark:text-[rgb(231,208,221)] text-[rgb(59,28,62)] backdrop-blur-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Account Settings</h3>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-[rgb(19,19,20)]/50 dark:bg-[rgb(19,19,20)]/50 bg-[rgb(248,242,250)]/80 border border-[rgb(50,32,40)] dark:border-[rgb(50,32,40)] border-[rgb(233,224,236)]">
                    <h4 className="font-medium mb-2">Account Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[rgb(231,208,221)]/70 dark:text-[rgb(231,208,221)]/70 text-[rgb(59,28,62)]/70">Name:</span>
                        <span>{user.user_metadata.full_name || 'Not set'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[rgb(231,208,221)]/70 dark:text-[rgb(231,208,221)]/70 text-[rgb(59,28,62)]/70">Email:</span>
                        <span>{user.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[rgb(231,208,221)]/70 dark:text-[rgb(231,208,221)]/70 text-[rgb(59,28,62)]/70">User ID:</span>
                        <span className="font-mono text-xs">{user.id}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-[rgb(19,19,20)]/50 dark:bg-[rgb(19,19,20)]/50 bg-[rgb(248,242,250)]/80 border border-[rgb(50,32,40)] dark:border-[rgb(50,32,40)] border-[rgb(233,224,236)]">
                    <h4 className="font-medium mb-2">Preferences</h4>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Theme</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleTheme}
                        className="flex items-center gap-2"
                      >
                        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        {theme === "dark" ? "Light" : "Dark"}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="relative min-h-screen w-full">
      {/* Background */}
      <div
        className="absolute inset-0 z-[-1]"
        style={{
          background: theme === "dark"
            ? `radial-gradient(closest-corner at 120px 36px, rgba(255, 1, 111, 0.19), rgba(255, 1, 111, 0.08)), linear-gradient(rgb(63, 51, 69) 15%, rgb(7, 3, 9))`
            : `linear-gradient(to bottom, rgb(var(--app-page-gradient-start)), rgb(var(--app-page-gradient-mid)), rgb(var(--app-page-gradient-end)))`,
        }}
      />
      <div className="absolute inset-0 z-[-1] noise-bg" />
      <div className={`absolute inset-0 z-[-1] ${theme === "dark" ? "bg-black/40" : "bg-white/20"}`} />

      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between p-4">
        <Link href="/">
          <Button variant="ghost" className="text-[rgb(212,199,225)] dark:text-[rgb(212,199,225)] text-[rgb(59,28,62)] bg-transparent hover:bg-[rgb(212,199,221)]/10 hover:text-[rgb(212,199,221)] dark:hover:bg-[rgb(212,199,221)]/10 dark:hover:text-[rgb(212,199,221)]">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="text-[rgb(212,199,225)] dark:text-[rgb(212,199,225)] text-[rgb(59,28,62)] bg-transparent hover:bg-[rgb(212,199,221)]/10 hover:text-[rgb(212,199,221)] dark:hover:bg-[rgb(212,199,221)]/10 dark:hover:text-[rgb(212,199,221)]"
        >
          {theme === "dark" ? <Sun className="h-[1.2rem] w-[1.2rem]" /> : <Moon className="h-[1.2rem] w-[1.2rem]" />}
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center py-6">
        <Card className="w-full max-w-[800px] h-[70px] border-none shadow-none relative flex items-center justify-center bg-transparent">
          <CardContent className="p-0">
            <div className="relative">
              {/* Hover Highlight */}
              <div
                className="absolute h-[30px] transition-all duration-300 ease-out bg-[#0e0f1114] dark:bg-[#ffffff1a] rounded-[6px] flex items-center"
                style={{
                  ...hoverStyle,
                  opacity: hoveredIndex !== null ? 1 : 0,
                }}
              />

              {/* Active Indicator */}
              <div
                className="absolute bottom-[-6px] h-[2px] bg-[#0e0f11] dark:bg-white transition-all duration-300 ease-out"
                style={activeStyle}
              />

              {/* Tabs */}
              <div className="relative flex space-x-[6px] items-center">
                {tabs.map((tab, index) => (
                  <div
                    key={index}
                    ref={(el) => { tabRefs.current[index] = el }}
                    className={`px-3 py-2 cursor-pointer transition-colors duration-300 h-[30px] ${
                      index === activeIndex ? "text-[#0e0e10] dark:text-white" : "text-[#0e0f1199] dark:text-[#ffffff99]"
                    }`}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onClick={() => setActiveIndex(index)}
                  >
                    <div className="text-sm font-medium leading-5 whitespace-nowrap flex items-center justify-center h-full">
                      {tab}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Area */}
      <div className="container mx-auto px-6 pb-10">
        {renderTabContent()}
      </div>
    </div>
  )
}
