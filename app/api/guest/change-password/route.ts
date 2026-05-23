import { NextResponse } from "next/server"
import { createDb } from "@/lib/db"
import { emails } from "@/lib/schema"
import { eq, sql } from "drizzle-orm"

export const runtime = "edge"

export async function POST(request: Request) {
    try {
        const { address, currentPassword, newPassword } = await request.json() as {
            address?: string;
            currentPassword?: string;
            newPassword?: string;
        }

        if (!address || !currentPassword || !newPassword) {
            return NextResponse.json({ error: "请填写完整信息" }, { status: 400 })
        }

        const db = createDb()
        
        // 1. 查找邮箱记录（忽略大小写）
        const emailRecord = await db.query.emails.findFirst({
            where: eq(sql`LOWER(${emails.address})`, address.toLowerCase())
        })

        if (!emailRecord) {
            return NextResponse.json({ error: "该邮箱不存在或已过期" }, { status: 404 })
        }

        // 2. 验证原密码
        const expectedPassword = emailRecord.password || "8888"
        if (currentPassword !== expectedPassword) {
            return NextResponse.json({ error: "原密码错误" }, { status: 401 })
        }

        // 3. 更新为新密码
        await db.update(emails)
            .set({ password: newPassword })
            .where(eq(emails.id, emailRecord.id))

        return NextResponse.json({ success: true, message: "密码修改成功" })

    } catch (error) {
        console.error('Change password error:', error)
        return NextResponse.json({ error: "系统内部错误" }, { status: 500 })
    }
}