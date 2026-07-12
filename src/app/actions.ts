'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function getFamilyData() {
  const supabase = await createClient()

  // 1. Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (!user || userError) return null

  // 2. Get profile for the user (latest)
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)

  const profile = profiles && profiles.length > 0 ? profiles[0] : null

  if (profileError || !profile) return null

  // 3. Get family
  const { data: family } = await supabase
    .from('families')
    .select('*')
    .eq('id', profile.family_id)
    .single()

  if (!family) return null

  // 4. Get all family members (profiles)
  const { data: members } = await supabase
    .from('profiles')
    .select('*')
    .eq('family_id', family.id)

  // 5. Get current budget (most recent or match month/year)
  const currentDate = new Date()
  const { data: budget } = await supabase
    .from('budgets')
    .select('*')
    .eq('family_id', family.id)
    .eq('month', currentDate.getMonth() + 1)
    .eq('year', currentDate.getFullYear())
    .single()

  // 6. Get expenses
  const { data: expenses } = await supabase
    .from('expenses')
    .select('*')
    .eq('family_id', family.id)
    .order('date', { ascending: false })

  // 7. Get activity logs
  const { data: logs } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('family_id', family.id)
    .order('created_at', { ascending: false })
    .limit(30)

  return {
    user,
    profile,
    family,
    members: members || [],
    budget: budget || null,
    expenses: expenses || [],
    logs: logs || []
  }
}

export async function setupFamilyBudget(payload: {
  income: number
  currency: string
  month: number
  year: number
  members: string[]
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // 1. Create Family
  const { data: family, error: familyError } = await supabase
    .from('families')
    .insert({
      name: 'Family Workspace',
      admin_id: user.id
    })
    .select()
    .single()

  if (familyError || !family) {
    throw new Error('Failed to create family: ' + familyError?.message)
  }

  // 2. Create Admin Profile
  const { data: adminProfile, error: adminError } = await supabase
    .from('profiles')
    .insert({
      user_id: user.id,
      family_id: family.id,
      name: 'Admin',
      role: 'admin'
    })
    .select()
    .single()

  if (adminError || !adminProfile) {
    throw new Error('Failed to create admin profile: ' + adminError?.message)
  }

  // 3. Create Member Profiles
  const memberInserts = payload.members
    .filter(name => name.trim() !== '' && name.toLowerCase() !== 'admin')
    .map(name => ({
      family_id: family.id,
      name: name.trim(),
      role: 'member'
    }))

  if (memberInserts.length > 0) {
    const { error: membersError } = await supabase
      .from('profiles')
      .insert(memberInserts)
    if (membersError) throw new Error('Failed to create members: ' + membersError.message)
  }

  // 4. Create Budget
  const cycleBudget = payload.income / 3
  const { error: budgetError } = await supabase
    .from('budgets')
    .insert({
      family_id: family.id,
      month: payload.month,
      year: payload.year,
      income: payload.income,
      currency: payload.currency,
      cycle_1_budget: cycleBudget,
      cycle_2_budget: cycleBudget,
      cycle_3_budget: cycleBudget
    })

  if (budgetError) throw new Error('Failed to create budget: ' + budgetError.message)

  // 5. Create Log
  await supabase.from('activity_logs').insert({
    family_id: family.id,
    user_id: user.id,
    action: 'SETUP_BUDGET',
    details: { income: payload.income, currency: payload.currency }
  })

  revalidatePath('/')
}

export async function addExpense(payload: {
  amount: number
  category: string
  description: string
  date: string
  paid_by: string // Profile ID
  split_members: string[] // Profile IDs
  cycle: number
  is_extra_expense: boolean
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get user's profile to retrieve family_id
  const { data: profiles } = await supabase
    .from('profiles')
    .select('family_id, name')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)

  const profile = profiles && profiles.length > 0 ? profiles[0] : null

  if (!profile) throw new Error('Profile not found')

  const { data: expense, error } = await supabase
    .from('expenses')
    .insert({
      family_id: profile.family_id,
      amount: payload.amount,
      category: payload.category,
      description: payload.description,
      date: payload.date,
      paid_by: payload.paid_by,
      split_members: payload.split_members,
      cycle: payload.cycle,
      is_extra_expense: payload.is_extra_expense,
      created_by: user.id
    })
    .select()
    .single()

  if (error) throw new Error('Failed to add expense: ' + error.message)

  // Log action
  await supabase.from('activity_logs').insert({
    family_id: profile.family_id,
    user_id: user.id,
    action: 'ADDED_EXPENSE',
    details: { amount: payload.amount, category: payload.category, paid_by_name: profile.name }
  })

  revalidatePath('/')
}
