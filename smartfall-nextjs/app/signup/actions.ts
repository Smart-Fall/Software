'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { data: userData, error } = await supabase.auth.signUp(data)

  if (error || !userData.user) {
    redirect('/error')
  }

  // optional: revalidate home page
  revalidatePath('/', 'layout')

  // Redirect based on accountType if you pass it in the form
  const accountType = formData.get('accountType') as string
  if (accountType === 'user') {
    redirect('/user-dashboard')
  } else if (accountType === 'caregiver') {
    redirect('/caregiver-dashboard')
  } else {
    redirect('/') // fallback
  }
}



// 'use server'

// import { redirect } from 'next/navigation'
// import { createClient } from '@/utils/supabase/server'

// interface SignUpData {
//   firstName: string
//   lastName: string
//   dob: string
//   email: string
//   password: string
//   accountType: string
// }

// export async function signup(formData: FormData) {
//   const supabase = await createClient()

//   const data: SignUpData = {
//     firstName: formData.get('firstName') as string,
//     lastName: formData.get('lastName') as string,
//     dob: formData.get('dob') as string,
//     email: formData.get('email') as string,
//     password: formData.get('password') as string,
//     accountType: formData.get('accountType') as string,
//   }

// // 1. Sign up the user
// const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
//   email: data.email,
//   password: data.password,
// });

// if (signUpError) {
//   throw signUpError;
// }

// // 2. Insert profile using the exact user ID returned
// const { error: profileError } = await supabase
//   .from('user_profiles')
//   .insert({
//     auth_id: signUpData.user?.id,      // must match auth.uid()
//     firstname: data.firstName,
//     lastname: data.lastName,
//     dob: data.dob,
//     account_type: data.accountType,
//   });

// if (profileError) {
//   throw profileError;
// }


//   // 3️⃣ Redirect to dashboard
//   if (data.accountType === 'user') {
//     redirect('/user-dashboard')
//   } else {
//     redirect('/caregiver-dashboard')
//   }
// }



// // 'use server'

// // import { createClient } from '@/utils/supabase/server'
// // import { redirect } from 'next/navigation'

// // interface SignUpFormData {
// //   email: string
// //   password: string
// //   firstName: string
// //   lastName: string
// //   dob: string
// //   accountType: string
// // }

// // export async function signup(formData: SignUpFormData) {
// //   const supabase = await createClient()

// //   const { data: userData, error } = await supabase.auth.signUp({
// //     email: formData.email,
// //     password: formData.password,
// //   })

// //   if (error) {
// //     throw new Error(error.message)
// //   }

// //   // store extra info in a profiles table
// //   const { error: profileError } = await supabase.from('user_profiles').insert([
// //     {
// //       id: userData.user?.id,
// //       firstname: formData.firstName,
// //       lastname: formData.lastName,
// //       dob: formData.dob,
// //       account_type: formData.accountType,
// //     },
// //   ])

// //   if (profileError) {
// //     throw new Error(profileError.message)
// //   }

// //   // redirect to dashboard
// //   if (formData.accountType === 'user') {
// //     redirect('/user-dashboard')
// //   } else {
// //     redirect('/caregiver-dashboard')
// //   }
// // }
