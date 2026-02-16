import { RegisterForm } from "@/components/register-form";

export default function RegisterPage() {
  return (
    <div className="min-h-svh flex flex-col items-center justify-center p-6 md:p-10 bg-black">
      <div className="w-full max-w-sm md:max-w-xl">
        <RegisterForm />
      </div>
    </div>
  );
}
