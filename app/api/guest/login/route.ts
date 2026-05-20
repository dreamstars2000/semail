import { NextResponse } from "next/server"
import { createDb } from "@/lib/db"
import { emails, emailShares } from "@/lib/schema"
import { eq, sql } from "drizzle-orm"
import { nanoid } from "nanoid"

export const runtime = "edge"

export async function POST(request: Request) {
  try {    
    const { address, password } = await request.json() as { address?: string; password?: string }

    if (!address || !password) {
      return NextResponse.json({ error: "邮箱和密码不能为空" }, { status: 400 })
    }

    const db = createDb()
    
    // 1. 查找邮箱记录（忽略大小写）
    const emailRecord = await db.query.emails.findFirst({
      where: eq(sql`LOWER(${emails.address})`, address.toLowerCase())
    })

    if (!emailRecord) {
      return NextResponse.json({ error: "该邮箱不存在或已过期" }, { status: 404 })
    }

    // 2. 验证密码核心逻辑：有密码验证真实密码，无密码验证 8888
    const expectedPassword = emailRecord.password || "8888"
    if (password !== expectedPassword) {
      return NextResponse.json({ error: "邮箱密码错误" }, { status: 401 })
    }

    // 3. 验证成功，为该邮箱生成一个 Share Token (利用原生分享功能)
    const shareToken = nanoid(32)
    const now = new Date()
    
    await db.insert(emailShares).values({
      emailId: emailRecord.id,
      token: shareToken,
      createdAt: now,
      // 可选：设置这个游客链接 1 小时后失效，保护隐私
      expiresAt: new Date(now.getTime() + 60 * 60 * 1000) 
    })

    // 4. 返回 Token 给前端
    return NextResponse.json({ token: shareToken })

  } catch (error) {
    console.error('Guest login error:', error)
    return NextResponse.json({ error: "系统内部错误" }, { status: 500 })
  }
}