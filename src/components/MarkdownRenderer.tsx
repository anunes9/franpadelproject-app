'use client'

import ReactMarkdown from 'react-markdown'
import { cn } from '@/lib/utils'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn(
      "prose prose-slate max-w-none prose-headings:text-p-blue prose-headings:font-bold prose-p:text-p-blue/70 prose-li:text-p-blue/70 prose-strong:text-p-blue prose-strong:font-bold prose-img:rounded-3xl",
      className
    )}>
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  )
}
