import { GuestLoginForm } from "@/components/auth/guest-login-form"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { LanguageSwitcher } from "@/components/layout/language-switcher"

export const runtime = "edge"

export default function GuestLoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* 手动构建一个简洁的顶部导航栏，只包含你需要的按钮 */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto h-full px-4 flex items-center justify-end gap-3">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>

      {/* 登录主体 */}
      <main className="pt-16 min-h-screen flex items-center justify-center px-4">
        <GuestLoginForm />
      </main>
    </div>
  )
}