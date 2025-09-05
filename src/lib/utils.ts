import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// File type detection utilities
export const FILE_TYPES = {
  VIDEO: 'video',
  PDF: 'pdf',
  IMAGE: 'image',
  DOCUMENT: 'document',
  UNKNOWN: 'unknown',
} as const

export type FileType = (typeof FILE_TYPES)[keyof typeof FILE_TYPES]

export function detectFileType(url: string, fileName: string): FileType {
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.m4v']
  const videoHosts = ['videos.ctfassets.net', 'youtube.com', 'vimeo.com', 'dailymotion.com']

  const pdfExtensions = ['.pdf']
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp']

  const lowerUrl = url.toLowerCase()
  const lowerFileName = fileName.toLowerCase()

  // Check video files
  const hasVideoExtension = videoExtensions.some((ext) => lowerFileName.includes(ext) || lowerUrl.includes(ext))
  const hasVideoHost = videoHosts.some((host) => lowerUrl.includes(host))

  if (hasVideoExtension || hasVideoHost) {
    return FILE_TYPES.VIDEO
  }

  // Check PDF files
  if (pdfExtensions.some((ext) => lowerFileName.includes(ext) || lowerUrl.includes(ext))) {
    return FILE_TYPES.PDF
  }

  // Check image files
  if (imageExtensions.some((ext) => lowerFileName.includes(ext) || lowerUrl.includes(ext))) {
    return FILE_TYPES.IMAGE
  }

  // Default to document for other file types
  return FILE_TYPES.DOCUMENT
}

export function getFileTypeIcon(fileType: FileType) {
  switch (fileType) {
    case FILE_TYPES.VIDEO:
      return 'VideoIcon'
    case FILE_TYPES.PDF:
      return 'FileTextIcon'
    case FILE_TYPES.IMAGE:
      return 'ImageIcon'
    case FILE_TYPES.DOCUMENT:
      return 'FileTextIcon'
    default:
      return 'FileTextIcon'
  }
}
