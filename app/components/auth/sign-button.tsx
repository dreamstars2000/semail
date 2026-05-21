"use client"

import { Button } from "@/components/ui/button"
import Image from "next/image"
import { signOut, useSession } from "next-auth/react"
import { LogIn, Search } from "lucide-react"
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from "next-intl"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"

interface SignButtonProps {
  size?: "default" | "lg"
}

export function SignButton({ size = "default" }: SignButtonProps) {
  const router = useRouter()
  const locale = useLocale()
  const { data: session, status } = useSession()
  const t = useTranslations("auth.signButton")
  const { toast } = useToast()
  
  // 游客查询的 State
  const [isGuestDialogOpen, setIsGuestDialogOpen] = useState(false)
  const [guestEmail, setGuestEmail] = useState("")
  const [guestPassword, setGuestPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const loading = status === "loading"

  if (loading) {
    return <div className="h-9" />
  }

  const handleGuestQuery = async () => {
    if (!guestEmail || !guestPassword) {
      toast({ title: "错误", description: "请输入邮箱和密码", variant: "destructive" })
      return
    }
    
    setIsLoading(true)
    try {
      const res = await fetch("/api/guest/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: guestEmail, password: guestPassword })
      })
      
      const data = await res.json() as { error?: string; token?: string }
      
      if (!res.ok) {
        toast({ title: "查询失败", description: data.error, variant: "destructive" })
        return
      }

      // 验证成功，跳转到系统自带的免密分享页面
      toast({ title: "验证成功", description: "正在获取邮件..." })
      setIsGuestDialogOpen(false)
      router.push(`/${locale}/shared/${data.token}`)
      
    } catch {
      toast({ title: "错误", description: "网络请求失败", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  if (!session?.user) {
    return (
      <div className="flex items-center gap-2">
        {/* 游客查询按钮及弹窗 */}
        <Dialog open={isGuestDialogOpen} onOpenChange={setIsGuestDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              className={cn(
                "gap-2 border-2 border-violet-300 text-violet-600 hover:bg-violet-50 hover:text-violet-700 hover:border-violet-400 dark:border-violet-700 dark:text-violet-400 dark:hover:bg-violet-950/30", 
                size === "lg" ? "px-8" : ""
              )} 
              size={size}
            >
              <Search className={size === "lg" ? "w-5 h-5" : "w-4 h-4"} />
              游客查询
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[calc(100%-2rem)] max-w-[425px] rounded-lg p-6 my-auto">
            <DialogHeader>
              <DialogTitle>游客邮件查询</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>邮箱地址</Label>
                <Input 
                  placeholder="" 
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  autoComplete="new-password"
                  autoCorrect="off"
                  autoCapitalize="off"
                />
              </div>
              <div className="space-y-2">
                <Label>邮箱密码</Label>
                <Input 
                  type="password" 
                  placeholder="" 
                  value={guestPassword}
                  onChange={(e) => setGuestPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGuestQuery()}
                  autoComplete="new-password"
                  autoCorrect="off"
                  autoCapitalize="off"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsGuestDialogOpen(false)}>取消</Button>
              <Button onClick={handleGuestQuery} disabled={isLoading}>
                {isLoading ? "验证中..." : "立即查询"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* 原来的登录按钮 */}
        <Button onClick={() => router.push(`/${locale}/login`)} className={cn("gap-2", size === "lg" ? "px-8" : "")} size={size}>
          <LogIn className={size === "lg" ? "w-5 h-5" : "w-4 h-4"} />
          {t("login")}
        </Button>
      </div>
    )
  }

  // ... 保持已登录状态的代码不变 ...
  return (
    <div className="flex items-center gap-y-4 gap-x-3 sm:gap-x-4">
      <Link 
        href={`/${locale}/profile`}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        {session.user.image && (
          <Image
            src={session.user.image}
            alt={session.user.name || t("userAvatar")}
            width={24}
            height={24}
            className="rounded-full"
          />
        )}
        <span className="hidden sm:inline-block text-sm">{session.user.name}</span>
      </Link>
      <Button onClick={() => signOut({ callbackUrl: `/${locale}` })} variant="outline" className={cn("flex-shrink-0", size === "lg" ? "px-8" : "")} size={size}>
        {t("logout")}
      </Button>
    </div>
  )
}