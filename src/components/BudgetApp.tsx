'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import Onboarding from './Onboarding'
import Dashboard from './Dashboard'
import { getFamilyData } from '@/app/actions'

export interface Profile {
  id: string
  user_id: string
  family_id: string
  name: string
  role: 'admin' | 'member'
  created_at: string
}

export interface Family {
  id: string
  name: string
  admin_id: string
  created_at: string
}

export interface Budget {
  id: string
  family_id: string
  month: number
  year: number
  income: number
  currency: string
  cycle_1_budget: number
  cycle_2_budget: number
  cycle_3_budget: number
  created_at: string
}

export interface Expense {
  id: string
  family_id: string
  amount: number
  category: string
  description: string
  date: string
  paid_by: string
  split_members: string[]
  cycle: number
  is_extra_expense: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export interface ActivityLog {
  id: string
  family_id: string
  user_id: string
  action: string
  details: {
    amount?: number
    category?: string
    paid_by_name?: string
    income?: number
    currency?: string
  }
  created_at: string
}

export interface FamilyData {
  user: { id: string; email?: string }
  profile: Profile
  family: Family
  members: Profile[]
  budget: Budget | null
  expenses: Expense[]
  logs: ActivityLog[]
}

interface BudgetAppProps {
  initialData: FamilyData | null
}

export default function BudgetApp({ initialData }: BudgetAppProps) {
  const [data, setData] = useState<FamilyData | null>(initialData)
  const supabase = createClient()
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
          (registration) => {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
          },
          (err) => {
            console.log('ServiceWorker registration failed: ', err);
          }
        );
      });
    }
  }, []);
  useEffect(() => {
    if (!data?.family?.id) return

    // Create a real-time channel to listen to database inserts/updates
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses',
          filter: `family_id=eq.${data.family.id}`
        },
        async () => {
          // Re-fetch data on any expense change
          const freshData = await getFamilyData()
          if (freshData) setData(freshData)
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activity_logs',
          filter: `family_id=eq.${data.family.id}`
        },
        async () => {
          const freshData = await getFamilyData()
          if (freshData) setData(freshData)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [data?.family?.id])

  const handleOnboardingComplete = async () => {
    const freshData = await getFamilyData()
    if (freshData) setData(freshData)
  }

  if (!data || !data.budget) {
    return <Onboarding onComplete={handleOnboardingComplete} />
  }

  return <Dashboard initialData={data} />
}
