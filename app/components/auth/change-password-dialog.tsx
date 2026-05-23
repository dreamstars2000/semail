"use client"

import { useState } from "react"
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

export function ChangePasswordDialog() {
    const [open, setOpen] = useState(false)
    const [address, setAddress] = useState("")
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const { toast } = useToast()

    const handleSubmit = async () => {
        if (!address || !currentPassword || !newPassword) {
            toast({ title: "提示", description: "请填写完整信息", variant: "destructive" })
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
                toast({ title: "修改失败", description: data.error, variant: "destructive" })
                setLoading(false)
                return
            }

            toast({ title: "修改成功", description: "密码已更新" })
            setOpen(false) // 关闭弹窗
            
            // 清空表单
            setAddress("")
            setCurrentPassword("")
            setNewPassword("")
            
        } catch (error) {
            toast({ title: "修改失败", description: "系统异常", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">修改密码</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>修改提取密码</DialogTitle>
                    <DialogDescription>
                        请输入需要修改密码的邮箱账号及原密码进行验证。
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Input
                            placeholder="邮箱账号"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                    <div className="space-y-2">
                        <Input
                            type="password"
                            placeholder="原密码"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                    <div className="space-y-2">
                        <Input
                            type="password"
                            placeholder="新密码"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                </div>
                <div className="flex justify-end">
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        确认修改
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}