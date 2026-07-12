'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  // If login fails (e.g., account does not exist), try to auto-create it!
  if (error) {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signUpError) {
      let friendlyMessage = signUpError.message;
      if (signUpError.message.toLowerCase().includes('rate limit')) {
        friendlyMessage = 'Rate limit exceeded! Please wait 60 seconds, or disable "Confirm Email" & increase rate limits in your Supabase Auth Settings to bypass this.';
      }
      redirect('/login?error=' + encodeURIComponent(friendlyMessage))
    }

    // If email confirmation is enabled on this project, we must display the check email message
    if (signUpData.user && !signUpData.session) {
      redirect('/login?error=' + encodeURIComponent('Account created! Please check your email for a confirmation link, or disable "Confirm Email" in your Supabase Dashboard to log in instantly.'))
    }

    // If auto-logged in, proceed to home
    revalidatePath('/', 'layout')
    redirect('/')
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    redirect('/login?error=' + encodeURIComponent(error.message))
  }

  // If email confirmation is enabled, session will be null
  if (data.user && !data.session) {
    redirect('/login?error=' + encodeURIComponent('Signup successful! Please check your email for a confirmation link, or disable "Confirm Email" in your Supabase Auth settings.'))
  }

  revalidatePath('/', 'layout')
  redirect('/')
}
