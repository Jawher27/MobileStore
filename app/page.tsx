import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RepairShopView } from '@/components/repair-shop-view'
import { SupplierAdminView } from '@/components/supplier-admin-view'
import { LogoutButton } from '@/components/logout-button'

export default async function Page() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return redirect('/login')
    }

    // Get user role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdminView = profile?.role === 'supplier'

    return (
      <main className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-border bg-card shadow-sm">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                  P
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Parts Hub</h1>
                  <p className="text-sm text-muted-foreground">B2B Phone Repair Platform</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {isAdminView ? 'Supplier View' : 'Client View'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({user.email})
                  </span>
                </div>

                <LogoutButton />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {isAdminView ? <SupplierAdminView /> : <RepairShopView />}
        </div>
      </main>
    )
  } catch {
    return redirect('/login')
  }
}
