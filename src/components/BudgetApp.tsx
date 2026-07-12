'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import Onboarding from './Onboarding'
import Dashboard from './Dashboard'
import { getFamilyData } from '@/app/actions'

interface BudgetAppProps {
  initialData: any
}

export default function BudgetApp({ initialData }: BudgetAppProps) {
  const [data, setData] = useState(initialData)
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
