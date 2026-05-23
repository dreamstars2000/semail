import { GuestLoginForm } from "@/components/auth/guest-login-form"
import { FloatingLanguageSwitcher } from "@/components/layout/floating-language-switcher"

export const runtime = "edge"

export default function GuestLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <GuestLoginForm />
      
      {/* 👇 引入悬浮的语言切换按钮 👇 */}
      <FloatingLanguageSwitcher />
    </div>
  )
}