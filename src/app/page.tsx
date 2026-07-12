import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { getFamilyData } from './actions'
import BudgetApp from '@/components/BudgetApp'

export default async function Home() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const initialData = await getFamilyData()

  return (
    <main className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <BudgetApp initialData={initialData} />
    </main>
  )
}
