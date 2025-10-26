'use client'

import { useCallback, useState } from 'react'
import { useResizeObserver } from '@wojtekmaj/react-hooks'
import { pdfjs, Document, Page } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

import type { PDFDocumentProxy } from 'pdfjs-dist'
import { ArrowLeft, ArrowRight } from 'lucide-react'

pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()

const options = {
  cMapUrl: '/cmaps/',
  standardFontDataUrl: '/standard_fonts/',
  wasmUrl: '/wasm/',
}

const resizeObserverOptions = {}

const maxWidth = 800

type PDFFile = string | File | null

export default function PDFViewer({ url }: { url: string }) {
  const [file, setFile] = useState<PDFFile>(url)
  const [numPages, setNumPages] = useState<number>()
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [containerRef, setContainerRef] = useState<HTMLElement | null>(null)
  const [containerWidth, setContainerWidth] = useState<number>()

  const onResize = useCallback<ResizeObserverCallback>((entries) => {
    const [entry] = entries

    if (entry) {
      setContainerWidth(entry.contentRect.width)
    }
  }, [])

  useResizeObserver(containerRef, resizeObserverOptions, onResize)

  function onDocumentLoadSuccess({ numPages: nextNumPages }: PDFDocumentProxy): void {
    setNumPages(nextNumPages)
    setCurrentPage(1) // Reset to first page when new document loads
  }

  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, numPages || 1))
  }

  const goToFirstPage = () => {
    setCurrentPage(1)
  }

  const canGoToPreviousPage = currentPage > 1
  const canGoToNextPage = numPages ? currentPage < numPages : false
  const canGoToFirstPage = currentPage > 1

  return (
    <div className="w-full" ref={setContainerRef}>
      <Document
        file={file}
        onLoadSuccess={onDocumentLoadSuccess}
        options={options}
        error="Error loading PDF"
        loading="Loading PDF..."
      >
        <Page pageNumber={currentPage} width={containerWidth ? Math.min(containerWidth, maxWidth) : maxWidth} />
      </Document>

      {/* Navigation Controls */}
      {numPages && numPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-4">
          <button
            onClick={goToFirstPage}
            disabled={!canGoToFirstPage}
            className="px-4 py-1 bg-p-green text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-green-600 transition-colors"
          >
            First Page
          </button>

          <button
            onClick={goToPreviousPage}
            disabled={!canGoToPreviousPage}
            className="px-4 py-2 bg-gray-600 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <span className="text-sm text-gray-600">
            {currentPage} of {numPages}
          </span>

          <button
            onClick={goToNextPage}
            disabled={!canGoToNextPage}
            className="px-4 py-2 bg-gray-600 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
