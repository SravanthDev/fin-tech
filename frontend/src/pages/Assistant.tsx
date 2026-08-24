import { useMutation } from "@tanstack/react-query"
import { Send, Sparkles } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { ChatMessageBubble } from "@/components/chat/ChatMessageBubble"
import { TypingIndicator } from "@/components/chat/TypingIndicator"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { apiRequest, ApiError } from "@/lib/api"
import type { ChatMessage } from "@/types"

const SUGGESTED_QUESTIONS = [
  "How much did I spend this month?",
  "What are my biggest expenses?",
  "How much did I spend on salaries?",
  "Where is most of my money going?",
  "What was my largest transaction?",
  "How much did customers pay me?",
]

export default function Assistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages]);

  const chatMutation = useMutation({
    mutationFn: (payload: { message: string; history: ChatMessage[] }) =>
      apiRequest<{ reply: string }>("/api/chat", { method: "POST", body: payload }),
  })

  async function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed || chatMutation.isPending) return

    const history = messages
    const userMessage: ChatMessage = { role: "user", content: trimmed }
    setMessages([...history, userMessage])
    setInput("")

    try {
      const res = await chatMutation.mutateAsync({ message: trimmed, history })
      setMessages((prev) => [...prev, { role: "assistant", content: res.reply }])
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "The assistant is unavailable right now.")
      setMessages((prev) => prev.slice(0, -1))
    }
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="AI Finance Assistant" subtitle="Your personal finance guide, powered by your financial data" />

      <div className="flex flex-1 flex-col overflow-hidden px-6 pb-6 md:px-8">
        <div className="flex flex-1 flex-col overflow-y-auto rounded-2xl border border-border bg-white">
          {messages.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-primary">
                <Sparkles className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">How can I help?</h2>
                <p className="mt-1 text-sm text-muted-foreground">Ask anything about your finances.</p>
              </div>
              <div className="grid w-full max-w-lg grid-cols-1 gap-2 sm:grid-cols-2">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="rounded-xl border border-border bg-white px-4 py-3 text-left text-sm text-foreground transition-colors hover:border-primary/40 hover:bg-primary-soft"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 space-y-4 p-6">
              {messages.map((m, i) => (
                <ChatMessageBubble key={i} message={m} />
              ))}
              {chatMutation.isPending && <TypingIndicator />}
              <div ref={scrollRef} />
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            sendMessage(input)
          }}
          className="mt-4 flex items-center gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question here…"
            className="flex-1 rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-ring"
          />
          <Button type="submit" size="icon" className="h-11 w-11 rounded-xl" disabled={chatMutation.isPending}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          AI responses are grounded in your uploaded financial data and are informational only.
        </p>
      </div>
    </div>
  )
}
