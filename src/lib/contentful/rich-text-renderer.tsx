import { documentToReactComponents } from '@contentful/rich-text-react-renderer'
import { Document } from '@contentful/rich-text-types'

interface RichTextRendererProps {
  content: Document
  className?: string
}

// Custom renderers for different node types
const renderers = {
  paragraph: ({ children }: any) => <p className="mb-4 text-muted-foreground leading-relaxed">{children}</p>,
  heading1: ({ children }: any) => <h1 className="text-2xl font-bold text-foreground mb-4">{children}</h1>,
  heading2: ({ children }: any) => <h2 className="text-xl font-semibold text-foreground mb-3">{children}</h2>,
  heading3: ({ children }: any) => <h3 className="text-lg font-medium text-foreground mb-2">{children}</h3>,
  heading4: ({ children }: any) => <h4 className="text-base font-medium text-foreground mb-2">{children}</h4>,
  heading5: ({ children }: any) => <h5 className="text-sm font-medium text-foreground mb-2">{children}</h5>,
  heading6: ({ children }: any) => <h6 className="text-xs font-medium text-foreground mb-2">{children}</h6>,
  ul_list: ({ children }: any) => (
    <ul className="list-disc list-inside mb-4 space-y-1 text-muted-foreground">{children}</ul>
  ),
  ol_list: ({ children }: any) => (
    <ol className="list-decimal list-inside mb-4 space-y-1 text-muted-foreground">{children}</ol>
  ),
  list_item: ({ children }: any) => <li className="text-muted-foreground">{children}</li>,
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-4 border-primary/20 pl-4 italic text-muted-foreground mb-4">{children}</blockquote>
  ),
  hyperlink: ({ children, data }: any) => (
    <a
      href={data.uri}
      className="text-primary hover:text-primary/80 underline transition-colors"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  text: ({ children, marks }: any) => {
    let className = ''

    if (marks.includes('bold')) {
      className += 'font-bold '
    }
    if (marks.includes('italic')) {
      className += 'italic '
    }
    if (marks.includes('underline')) {
      className += 'underline '
    }
    if (marks.includes('code')) {
      className += 'bg-muted px-1 py-0.5 rounded text-sm font-mono '
    }

    return <span className={className}>{children}</span>
  },
}

export function RichTextRenderer({ content, className = '' }: RichTextRendererProps) {
  if (!content) {
    return null
  }

  return <div className={className}>{documentToReactComponents(content, { renderers })}</div>
}

// Helper function to check if content is rich text
export function isRichText(content: any): content is Document {
  return content && typeof content === 'object' && 'nodeType' in content && content.nodeType === 'document'
}

// Helper function to render content that might be rich text or plain text
export function renderContent(content: any, className?: string) {
  if (isRichText(content)) {
    return <RichTextRenderer content={content} className={className} />
  }

  if (typeof content === 'string') {
    return <p className={`text-muted-foreground leading-relaxed ${className || ''}`}>{content}</p>
  }

  return null
}
