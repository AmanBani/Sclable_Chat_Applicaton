import { RegisterForm } from "@/components/register-form"

export default function RegisterPage() {
  return (
    <div className="min-h-svh bg-chat-sidebar flex flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-xl border border-white/20 rounded-2xl p-2">
        <RegisterForm />
      </div>
    </div>
  )
}
