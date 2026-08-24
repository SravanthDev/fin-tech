import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ChatMessage } from "@/types"

export function ChatMessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user"
  return (
    <div className={cn("flex items-start gap-3", isUser && "flex-row-reverse")}>
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Sparkles className="h-4 w-4" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser ? "bg-primary text-primary-foreground" : "border border-border bg-white text-foreground",
        )}
      >
        {message.content}
      </div>
    </div>
  )
}
