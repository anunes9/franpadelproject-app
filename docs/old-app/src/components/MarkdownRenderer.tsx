import ReactMarkdown from 'react-markdown'

// Helper function to normalize URLs (convert protocol-relative to absolute)
function normalizeUrl(url: string | undefined): string {
  if (!url) return ''
  if (url.startsWith('//')) {
    return `https:${url}`
  }
  return url
}

interface MarkdownRendererProps {
  content: string
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      components={{
        h1: ({ children }) => <h1 className="text-4xl font-bold text-p-blue mt-8 mb-4 leading-tight">{children}</h1>,
        h2: ({ children }) => <h2 className="text-3xl font-bold text-p-blue mt-6 mb-3 leading-tight">{children}</h2>,
        h3: ({ children }) => <h3 className="text-2xl font-bold text-p-blue mt-5 mb-2 leading-tight">{children}</h3>,
        h4: ({ children }) => <h4 className="text-xl font-bold text-p-blue mt-4 mb-2 leading-tight">{children}</h4>,
        p: ({ children }) => <p className="text-p-blue/70 mb-4 leading-7">{children}</p>,
        ul: ({ children }) => <ul className="list-disc pl-6 my-4 space-y-2">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-6 my-4 space-y-2">{children}</ol>,
        li: ({ children }) => <li className="text-p-blue/70 leading-7">{children}</li>,
        strong: ({ children }) => <strong className="font-bold text-p-blue">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        blockquote: ({ children }) => <blockquote className="border-l-4 border-p-green pl-4 italic text-p-blue/60 my-6">{children}</blockquote>,
        code: ({ children, className }) => {
          const isInline = !className
          return isInline ? (
            <code className="bg-p-gray px-1.5 py-0.5 rounded text-sm text-p-blue">{children}</code>
          ) : (
            <code className={className}>{children}</code>
          )
        },
        pre: ({ children }) => (
          <pre className="bg-p-gray p-4 rounded-xl overflow-x-auto my-6">
            {children}
          </pre>
        ),
        img: ({ src, alt }) =>
          typeof src === 'string' ? (
            <img
              src={normalizeUrl(src)}
              alt={alt || ''}
              className="rounded-3xl my-6 max-w-full h-auto"
            />
          ) : null,
        a: ({ href, children }) => (
          <a
            href={typeof href === 'string' ? normalizeUrl(href) : undefined}
            className="text-p-green underline hover:text-p-blue"
          >
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
