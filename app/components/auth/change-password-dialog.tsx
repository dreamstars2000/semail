"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"

export function ChangePasswordDialog({ initialAddress = "" }: { initialAddress?: string }) {
    const [open, setOpen] = useState(false)
    const [address, setAddress] = useState(initialAddress)
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [loading, setLoading] = useState(false)
    
    const { toast } = useToast()
    const t = useTranslations("auth.changePassword")

    const handleSubmit = async () => {
        if (!address || !currentPassword || !newPassword) {
            toast({ title: t("toast.info"), description: t("toast.fillAll"), variant: "destructive" })
            return
        }

        setLoading(true)
        try {
            const response = await fetch("/api/guest/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ address, currentPassword, newPassword }),
            })

            const data = await response.json()

            if (!response.ok) {
                toast({ title: t("toast.failed"), description: data.error, variant: "destructive" })
                setLoading(false)
                return
            }

            toast({ title: t("toast.success"), description: t("toast.updated") })
            setOpen(false)
            
            setAddress(initialAddress)
            setCurrentPassword("")
            setNewPassword("")
            
        } catch (error) {
            console.error("Change password error:", error)
            toast({ title: t("toast.failed"), description: t("toast.systemError"), variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">{t("trigger")}</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t("title")}</DialogTitle>
                    <DialogDescription>
                        {t("description")}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Input
                            placeholder={t("fields.address")}
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                    <div className="space-y-2">
                        <Input
                            type="password"
                            placeholder={t("fields.currentPassword")}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                    <div className="space-y-2">
                        <Input
                            type="password"
                            placeholder={t("fields.newPassword")}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                </div>
                <div className="flex justify-end">
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t("actions.submit")}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}