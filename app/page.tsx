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
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                  P
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl font-bold text-foreground truncate">Parts Hub</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">B2B Phone Repair Platform</p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
                <div className="flex flex-col sm:flex-row sm:items-center items-start gap-0 sm:gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {isAdminView ? 'Supplier View' : 'Client View'}
                  </span>
                  <span className="text-xs text-muted-foreground truncate max-w-[120px] sm:max-w-xs">
                    ({user.email})
                  </span>
                </div>

                <LogoutButton />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="mx-auto max-w-7xl px-0 sm:px-4 py-4 sm:py-8 lg:px-8">
          {isAdminView ? <SupplierAdminView /> : <RepairShopView />}
        </div>
      </main>
    )
  } catch {
    return redirect('/login')
  }
}
