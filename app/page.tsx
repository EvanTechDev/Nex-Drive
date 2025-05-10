"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import MisskeyFileManager from "@/components/misskey-file-manager"

export default function Home() {
  const [userId, setUserId] = useState<string>("")
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isCheckingEnv, setIsCheckingEnv] = useState<boolean>(true)
  const [envError, setEnvError] = useState<string | null>(null)

  useEffect(() => {
    // Check if MISSKEY environment variables are set
    const checkEnvVars = async () => {
      try {
        const response = await fetch("/api/check-env")
        const data = await response.json()

        if (!data.success) {
          setEnvError(
            "MISSKEY API configuration is missing. Please set MISSKEY_API_URL and MISSKEY_API_KEY environment variables.",
          )
        }
      } catch (error) {
        setEnvError("Failed to check environment variables. Please refresh the page.")
      } finally {
        setIsCheckingEnv(false)
      }
    }

    checkEnvVars()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!userId.trim()) {
      setError("Please enter a username")
      setIsLoading(false)
      return
    }

    try {
      // Validate if the user exists or can be created
      const response = await fetch("/api/validate-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to validate user")
      }

      // Set the user as logged in
      setIsLoggedIn(true)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (isCheckingEnv) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-4" />
          <p>Checking environment configuration...</p>
        </div>
      </main>
    )
  }

  if (envError) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Configuration Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center mb-4">{envError}</p>
            <p className="text-sm text-gray-500 text-center">
              Please make sure you've added the required environment variables to your project.
            </p>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-0 bg-gray-50">
      {!isLoggedIn ? (
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">MISSKEY Drive Manager</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Input
                  id="userId"
                  placeholder="Enter your username"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  disabled={isLoading}
                />
                {error && <p className="text-sm text-red-500">{error}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Continue"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="w-full h-full">
          <MisskeyFileManager userId={userId} />
        </div>
      )}
    </main>
  )
}
