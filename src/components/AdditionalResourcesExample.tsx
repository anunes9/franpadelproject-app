'use client'

import AdditionalResources from './AdditionalResources'

// Example data showing different file types
const exampleDocuments = [
  {
    fields: {
      file: {
        fileName: 'padel-technique-guide.pdf',
        url: 'https://example.com/padel-technique-guide.pdf',
      },
    },
  },
  {
    fields: {
      file: {
        fileName: 'forehand-stroke-tutorial.mp4',
        url: 'https://videos.ctfassets.net/example/forehand-stroke-tutorial.mp4',
      },
    },
  },
  {
    fields: {
      file: {
        fileName: 'court-positioning-diagram.png',
        url: 'https://example.com/court-positioning-diagram.png',
      },
    },
  },
  {
    fields: {
      file: {
        fileName: 'training-schedule.xlsx',
        url: 'https://example.com/training-schedule.xlsx',
      },
    },
  },
]

export default function AdditionalResourcesExample() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Additional Resources Example</h2>
      <p className="text-gray-600 mb-6">
        This example demonstrates how the AdditionalResources component handles different file types:
      </p>

      <div className="space-y-4 text-sm text-gray-700">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 bg-blue-500 rounded"></span>
          <span>PDF files (.pdf) - Opens in PDF viewer</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 bg-red-500 rounded"></span>
          <span>Video files (.mp4, .webm, .ogg, .mov, .avi, .mkv) - Opens in video player</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 bg-green-500 rounded"></span>
          <span>Image files (.jpg, .png, .gif, .svg, .webp) - Displays image</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 bg-gray-500 rounded"></span>
          <span>Other files - Shows download option</span>
        </div>
      </div>

      <div className="mt-8">
        <AdditionalResources documents={exampleDocuments} />
      </div>
    </div>
  )
}
