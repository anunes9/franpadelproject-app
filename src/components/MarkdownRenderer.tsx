import ReactMarkdown from 'react-markdown'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  if (!content) {
    return null
  }

  return (
    <div className={`prose max-w-none ${className}`}>
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  )
}
