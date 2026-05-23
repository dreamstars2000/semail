import { GuestLoginForm } from "@/components/auth/guest-login-form"

export const runtime = "edge"

export default function GuestLoginPage() {
  return (
    // 这里完全复用了主登录页面的背景和居中布局
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <GuestLoginForm />
    </div>
  )
}