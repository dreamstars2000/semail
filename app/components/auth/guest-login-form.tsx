"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Loader2, KeyRound, User2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface FormErrors {
    address?: string
    password?: string
}

export function GuestLoginForm() {
    const [address, setAddress] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState<FormErrors>({})
    
    const { toast } = useToast()
    const t = useTranslations("auth.guestLogin")

    const validateForm = () => {
        const newErrors: FormErrors = {}
        if (!address) newErrors.address = t("errors.addressRequired")
        if (!password) newErrors.password = t("errors.passwordRequired")
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleLogin = async () => {
        if (!validateForm()) return

        setLoading(true)
        try {
            const response = await fetch("/api/guest/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ address, password }),
            })

            // 👇 修复点：加上类型断言 as { error?: string, token?: string }
            const data = await response.json() as { error?: string; token?: string }

            if (!response.ok) {
                toast({
                    title: t("toast.loginFailed"),
                    description: data.error || t("toast.requestFailed"),
                    variant: "destructive",
                })
                setLoading(false)
                return
            }

            toast({
                title: t("toast.loginSuccess"),
                description: t("toast.redirecting"),
            })

            if (data.token) {
                window.location.href = `/shared/${data.token}`
            }

        } catch (error) {
            console.error("Login error:", error)
            toast({
                title: t("toast.loginFailed"),
                description: error instanceof Error ? error.message : t("toast.systemError"),
                variant: "destructive",
            })
            setLoading(false)
        }
    }

    return (
        <Card className="w-[95%] max-w-lg border-2 border-primary/20">
            <CardHeader className="space-y-2">
                <CardTitle className="text-2xl text-center bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                    {t("title")}
                </CardTitle>
                <CardDescription className="text-center">
                    {t("subtitle")}
                </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-8">
                <div className="space-y-4 mt-2">
                    <div className="space-y-3">
                        <div className="space-y-1.5">
                            <div className="relative">
                                <div className="absolute left-2.5 top-2 text-muted-foreground">
                                    <User2 className="h-5 w-5" />
                                </div>
                                <Input
                                    className={cn(
                                        "h-9 pl-9 pr-3",
                                        errors.address && "border-destructive focus-visible:ring-destructive"
                                    )}
                                    placeholder={t("fields.address")}
                                    value={address}
                                    onChange={(e) => {
                                        setAddress(e.target.value)
                                        setErrors((prev) => ({ ...prev, address: undefined }))
                                    }}
                                    disabled={loading}
                                />
                            </div>
                            {errors.address && (
                                <p className="text-xs text-destructive">{errors.address}</p>
                            )}
                        </div>
                        
                        <div className="space-y-1.5">
                            <div className="relative">
                                <div className="absolute left-2.5 top-2 text-muted-foreground">
                                    <KeyRound className="h-5 w-5" />
                                </div>
                                <Input
                                    className={cn(
                                        "h-9 pl-9 pr-3",
                                        errors.password && "border-destructive focus-visible:ring-destructive"
                                    )}
                                    type="password"
                                    placeholder={t("fields.password")}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value)
                                        setErrors((prev) => ({ ...prev, password: undefined }))
                                    }}
                                    disabled={loading}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            handleLogin()
                                        }
                                    }}
                                />
                            </div>
                            {errors.password && (
                                <p className="text-xs text-destructive">{errors.password}</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-3 pt-3">
                        <Button
                            className="w-full"
                            onClick={handleLogin}
                            disabled={loading}
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t("actions.login")}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}