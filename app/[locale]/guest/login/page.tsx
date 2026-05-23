import { GuestLoginForm } from "@/components/auth/guest-login-form"
import { FloatingLanguageSwitcher } from "@/components/layout/floating-language-switcher"
import { ThemeToggle } from "@/components/theme/theme-toggle"

export const runtime = "edge"

export default function GuestLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* 登录表单居中 */}
      <GuestLoginForm />

      {/* 右上角工具栏：放置日夜间切换按钮 */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* 右下角悬浮：语言切换按钮 */}
      <FloatingLanguageSwitcher />
    </div>
  )
}