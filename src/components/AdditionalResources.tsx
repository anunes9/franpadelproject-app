'use client'

import { Button } from '@/components/ui/button'
import { NotebookTextIcon, X, PresentationIcon } from 'lucide-react'
import { Field } from '@/components/Field'
import { useState } from 'react'
import dynamic from 'next/dynamic'

const PDFViewer = dynamic(() => import('@/components/PDFViewer'), {
  ssr: false,
})

interface Document {
  fields: {
    file: {
      fileName: string
      url: string
    }
  }
}

interface AdditionalResourcesProps {
  documents?: Document[]
}

export default function AdditionalResources({ documents }: AdditionalResourcesProps) {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)

  const handleDocumentClick = (document: Document) => {
    setSelectedDocument(document)
  }

  const closePDFViewer = () => {
    setSelectedDocument(null)
  }

  return (
    <Field title="Additional Resources" icon={<NotebookTextIcon className="h-5 w-5" />}>
      <div className="flex flex-wrap gap-2">
        {documents?.map((document, index) => (
          <Button variant="outline" className="justify-start" key={index} onClick={() => handleDocumentClick(document)}>
            <PresentationIcon className="h-4 w-4 mr-2" />
            {document.fields.file.fileName}
          </Button>
        ))}
      </div>

      {/* PDF Viewer - only shown when a document is selected */}
      {selectedDocument && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">{selectedDocument.fields.file.fileName}</h3>
            <Button variant="outline" onClick={closePDFViewer}>
              <X className="h-4 w-4" /> Close
            </Button>
          </div>
          <PDFViewer url={selectedDocument.fields.file.url} />
        </div>
      )}
    </Field>
  )
}
