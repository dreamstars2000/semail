import { NextResponse } from "next/server"
import { createDb } from "@/lib/db"
import { emails, messages } from "@/lib/schema"
import { eq, and, lt, or, sql, ne, isNull } from "drizzle-orm"
import { encodeCursor, decodeCursor } from "@/lib/cursor"
import { getUserId } from "@/lib/apiKey"
import { checkBasicSendPermission } from "@/lib/send-permissions"

export const runtime = "edge"

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const userId = await getUserId()

    try {
        const db = createDb()
        const { id } = await params
        const decodedId = decodeURIComponent(id)
        
        // 查找邮箱：DELETE 保持安全机制，同时支持按 ID 或按 Address 查找
        let email = await db.query.emails.findFirst({
            where: and(
                eq(emails.id, decodedId),
                eq(emails.userId, userId!)
            )
        })

        if (!email && decodedId.includes('@')) {
            email = await db.query.emails.findFirst({
                where: and(
                    eq(emails.address, decodedId),
                    eq(emails.userId, userId!)
                )
            })
        }

        if (!email) {
            return NextResponse.json(
                { error: "邮箱不存在或无权限删除" },
                { status: 403 }
            )
        }
        
        await db.delete(messages)
            .where(eq(messages.emailId, email.id))

        await db.delete(emails)
            .where(eq(emails.id, email.id))

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to delete email:', error)
        return NextResponse.json(
            { error: "删除邮箱失败" },
            { status: 500 }
        )
    }
} 

const PAGE_SIZE = 20

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { searchParams } = new URL(request.url)
    const cursorStr = searchParams.get('cursor')
    const messageType = searchParams.get('type')
    
    // 脚本与游客查询所需的专属参数
    const mode = searchParams.get('mode')
    const password = searchParams.get('password')

  try {
        const db = createDb()
        const { id } = await params
        const decodedId = decodeURIComponent(id)
        const userId = await getUserId()

        if (messageType === 'sent') {
            const permissionResult = await checkBasicSendPermission(userId!)
            if (!permissionResult.canSend) {
                if (mode === 'code') {
                    return new NextResponse("UNAUTHORIZED_SEND", { status: 200 })
                }
                return NextResponse.json(
                    { error: permissionResult.error || "您没有查看发送邮件的权限" },
                    { status: 403 }
                )
            }
        }

        // 1. 灵活查出邮箱：支持传入 UUID (网页端) 或 邮箱地址 (Lua脚本/游客输入)
        let email = await db.query.emails.findFirst({
            where: eq(emails.id, decodedId)
        })

        if (!email && decodedId.includes('@')) {
            email = await db.query.emails.findFirst({
                where: eq(emails.address, decodedId)
            })
        }

        if (!email) {
            if (mode === 'code') {
                return new NextResponse("NO_EMAIL", { status: 200 })
            }
            return NextResponse.json(
                { error: "邮箱不存在" },
                { status: 404 }
            )
        }

        // 2. 核心多态鉴权：满足“是创建者”或“密码正确”均予以放行
        let isAuthorized = false

        if (userId && email.userId === userId) {
            // 通道 A：验证系统创建者账号归属 (系统登录或 API_KEY 访问)
            isAuthorized = true
        } else if (password && email.password === password) {
            // 通道 B：验证显式设置的游客/脚本密码
            isAuthorized = true
        } else if (password === "8888" && !email.password) {
            // 通道 C：若数据库密码字段为空 (NULL)，自动使用 8888 作为兜底通行证
            isAuthorized = true
        }

        if (!isAuthorized) {
            if (mode === 'code') {
                return new NextResponse("UNAUTHORIZED", { status: 200 })
            }
            return NextResponse.json(
                { error: "无权限查看" },
                { status: 403 }
            )
        }

        // 3. 查出邮件列表：使用查找到的 email.id 确保不论传入何种格式均能精准对齐
        const baseConditions = and(
            eq(messages.emailId, email.id),
            messageType === 'sent' 
                ? eq(messages.type, "sent") 
                : or(
                    ne(messages.type, "sent"),
                    isNull(messages.type)
                )
        )

        const totalResult = await db.select({ count: sql<number>`count(*)` })
            .from(messages)
            .where(baseConditions)
        const totalCount = Number(totalResult[0].count)

        const conditions = [baseConditions]

        if (cursorStr) {
            const { timestamp, id: cursorId } = decodeCursor(cursorStr)
            const orderByTime = messageType === 'sent' ? messages.sentAt : messages.receivedAt
            conditions.push(
                or(
                    lt(orderByTime, new Date(timestamp)),
                    and(
                        eq(orderByTime, new Date(timestamp)),
                        lt(messages.id, cursorId)
                    )
                )
            )
        }

        const orderByTime = messageType === 'sent' ? messages.sentAt : messages.receivedAt
        
        const results = await db.query.messages.findMany({
            where: and(...conditions),
            orderBy: (messages, { desc }) => [
                desc(orderByTime),
                desc(messages.id)
            ],
            limit: PAGE_SIZE + 1
        })
        
        const hasMore = results.length > PAGE_SIZE
        const messageList = hasMore ? results.slice(0, PAGE_SIZE) : results

        // ==========================================
        // 定制过滤层：脚本专属的部落冲突验证码返回模式
        // ==========================================
        if (mode === 'code') {
            if (messageList.length > 0) {
                const latestMsg = messageList[0]
                
                // 拼接标题、文本正文和 HTML，确保能全方位搜索
                const searchTarget = `${latestMsg.subject} ${latestMsg.content} ${latestMsg.html || ''}`
                
                // 正则捕获连续 6 位纯数字验证码
                const codeMatch = searchTarget.match(/\d{6}/)
                
                if (codeMatch) {
                    return new NextResponse(codeMatch[0], {
                        status: 200,
                        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
                    })
                }
                
                // 如果实在没找到 6 位数字，将标题直接传回给脚本作为替代方案
                return new NextResponse(latestMsg.subject, {
                    status: 200,
                    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
                })
            }
            
            return new NextResponse("EMPTY", { status: 200 })
        }

        // ==========================================
        // 原生结构返回：提供给网页端正常浏览渲染使用
        // ==========================================
        const nextCursor = hasMore 
            ? encodeCursor(
                messageType === 'sent' 
                    ? results[PAGE_SIZE - 1].sentAt!.getTime()
                    : results[PAGE_SIZE - 1].receivedAt.getTime(),
                results[PAGE_SIZE - 1].id
            )
            : null

        return NextResponse.json({ 
            messages: messageList.map(msg => ({
                id: msg.id,
                from_address: msg?.fromAddress,
                to_address: msg?.toAddress,
                subject: msg.subject,
                content: msg.content,
                html: msg.html,
                sent_at: msg.sentAt?.getTime(),
                received_at: msg.receivedAt?.getTime()
            })),
            nextCursor,
            total: totalCount
        })
    } catch (error) {
        console.error('Failed to fetch messages:', error)
        if (searchParams.get('mode') === 'code') {
            return new NextResponse("ERROR", { status: 500 })
        }
        return NextResponse.json(
            { error: "Failed to fetch messages" },
            { status: 500 }
        )
    }
}