"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/utils/supabase/client"

interface UserSummary {
  email: string
  id: string
}

export function UserSummary() {
  const [user, setUser] = useState<UserSummary | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient()
      const { data, error: userError } = await supabase.auth.getUser()
      if (userError || !data.user) {
        setError("Unable to load signed-in user.")
        return
      }
      setUser({ email: data.user.email ?? "Unknown", id: data.user.id })
    }

    loadUser()
  }, [])

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Signed-in User</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && <p className="text-sm text-destructive">{error}</p>}
        {user ? (
          <>
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium text-foreground">{user.email}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">User ID</p>
              <p className="text-sm text-foreground break-all">{user.id}</p>
            </div>
          </>
        ) : (
          !error && <p className="text-sm text-muted-foreground">Loading user…</p>
        )}
      </CardContent>
    </Card>
  )
}
