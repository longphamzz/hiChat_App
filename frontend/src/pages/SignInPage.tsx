
import { SigninForm } from '@/components/auth/signin-form'
import React from 'react'

const SignInPage = () => {
  return (
      // <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      //       <div className="w-full max-w-none md:max-w-4xl">
      //         <SignupForm />
      //       </div>
      //     </div>
          <div className="flex min-h-screen items-center justify-center bg-muted p-6 md:p-10">
    <div className="w-full max-w-4xl">
      <SigninForm/>
    </div>
  </div>
    )
}

export default SignInPage
