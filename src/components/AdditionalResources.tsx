'use client'

import { Button } from '@/components/ui/button'
import { NotebookTextIcon, X, VideoIcon, FileTextIcon, ImageIcon } from 'lucide-react'
import { Field } from '@/components/Field'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import { detectFileType, FILE_TYPES } from '@/lib/utils'
import Image from 'next/image'

const PDFViewer = dynamic(() => import('@/components/PDFViewer'), {
  ssr: false,
})

const VideoPlayer = dynamic(() => import('@/components/VideoPlayer'), {
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

// Function to get appropriate icon for file type
const getFileIcon = (fileType: string) => {
  switch (fileType) {
    case FILE_TYPES.VIDEO:
      return <VideoIcon className="h-4 w-4 mr-2" />
    case FILE_TYPES.IMAGE:
      return <ImageIcon className="h-4 w-4 mr-2" />
    case FILE_TYPES.PDF:
    case FILE_TYPES.DOCUMENT:
    default:
      return <FileTextIcon className="h-4 w-4 mr-2" />
  }
}

export default function AdditionalResources({ documents }: AdditionalResourcesProps) {
  const [selectedResource, setSelectedResource] = useState<Document | null>(null)

  const handleResourceClick = (document: Document) => {
    setSelectedResource(document)
  }

  const closeViewer = () => {
    setSelectedResource(null)
  }

  if (!documents?.length) return null

  return (
    <Field title="Documentos e Correções Técnicas" icon={<NotebookTextIcon className="h-5 w-5" />}>
      <div className="flex flex-wrap gap-2">
        {documents?.map((document, index) => {
          const fileType = detectFileType(document.fields.file.url, document.fields.file.fileName)
          return (
            <Button
              variant="outline"
              className="justify-start cursor-pointer"
              key={index}
              onClick={() => handleResourceClick(document)}
            >
              {getFileIcon(fileType)}
              {document.fields.file.fileName}
            </Button>
          )
        })}
      </div>

      {/* Resource Viewer - shown when a resource is selected */}
      {selectedResource && (
        <div className="mt-6">
          {(() => {
            const fileType = detectFileType(selectedResource.fields.file.url, selectedResource.fields.file.fileName)

            switch (fileType) {
              case FILE_TYPES.VIDEO:
                return (
                  <VideoPlayer
                    url={selectedResource.fields.file.url}
                    title={selectedResource.fields.file.fileName}
                    onClose={closeViewer}
                  />
                )
              case FILE_TYPES.PDF:
                return (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium">{selectedResource.fields.file.fileName}</h3>
                      <Button variant="outline" onClick={closeViewer}>
                        <X className="h-4 w-4" /> Close
                      </Button>
                    </div>
                    <PDFViewer url={selectedResource.fields.file.url} />
                  </div>
                )
              case FILE_TYPES.IMAGE:
                return (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium">{selectedResource.fields.file.fileName}</h3>
                      <Button variant="outline" onClick={closeViewer}>
                        <X className="h-4 w-4" /> Close
                      </Button>
                    </div>
                    <div className="flex justify-center">
                      <Image
                        src={selectedResource.fields.file.url}
                        alt={selectedResource.fields.file.fileName}
                        className="max-w-full h-auto rounded-lg shadow-lg"
                      />
                    </div>
                  </div>
                )
              default:
                return (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium">{selectedResource.fields.file.fileName}</h3>
                      <Button variant="outline" onClick={closeViewer}>
                        <X className="h-4 w-4" /> Close
                      </Button>
                    </div>
                    <div className="p-6 text-center bg-gray-50 rounded-lg">
                      <p className="text-gray-600 mb-4">This file type is not supported for preview.</p>
                      <Button asChild>
                        <a href={selectedResource.fields.file.url} target="_blank" rel="noopener noreferrer">
                          Download File
                        </a>
                      </Button>
                    </div>
                  </div>
                )
            }
          })()}
        </div>
      )}
    </Field>
  )
}
