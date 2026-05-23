import { GuestLoginForm } from "@/components/auth/guest-login-form"
import { Header } from "@/components/layout/header"

export const runtime = "edge"

export default function GuestLoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* 由于 Header 是 fixed 定位，它会悬浮在页面最上方。
        我们不需要再给它包 container，它已经在 Header 组件里处理好了。
      */}
      <Header />

      {/* 给 main 增加 padding-top: 4rem (16) 
        因为 Header 高度是 16 (64px)，不加这个的话表单会被 Header 遮住。
      */}
      <main className="pt-16 min-h-screen flex items-center justify-center px-4">
        <GuestLoginForm />
      </main>
    </div>
  )
}