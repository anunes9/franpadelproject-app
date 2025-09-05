'use client'

import dynamic from 'next/dynamic'

const PDFViewer = dynamic(() => import('@/components/PDFViewer'), { ssr: false })

interface PDFViewerWrapperProps {
  url: string
}

export default function PDFViewerWrapper({ url }: PDFViewerWrapperProps) {
  return <PDFViewer url={url} />
}
