# AdditionalResources Component

The `AdditionalResources` component is a versatile resource viewer that can handle multiple file types including PDFs, videos, images, and other documents.

## Features

- **Multi-format Support**: Automatically detects and handles different file types
- **PDF Viewer**: Built-in PDF viewer with navigation controls
- **Video Player**: Custom video player with controls and fullscreen support
- **Image Display**: Direct image preview for supported formats
- **Download Fallback**: Provides download links for unsupported file types
- **Responsive Design**: Works on both desktop and mobile devices

## Supported File Types

### Video Files

- **Extensions**: `.mp4`, `.webm`, `.ogg`, `.mov`, `.avi`, `.mkv`, `.m4v`
- **Hosts**: `videos.ctfassets.net`, `youtube.com`, `vimeo.com`, `dailymotion.com`
- **Features**: Play/pause, volume control, progress bar, fullscreen, restart

### PDF Files

- **Extensions**: `.pdf`
- **Features**: Page navigation, zoom, text selection, search

### Image Files

- **Extensions**: `.jpg`, `.jpeg`, `.png`, `.gif`, `.svg`, `.webp`
- **Features**: Direct display with responsive sizing

### Other Files

- **Fallback**: Download link for unsupported formats
- **Supported**: Excel, Word, PowerPoint, and other document types

## Usage

```tsx
import AdditionalResources from '@/components/AdditionalResources'

const documents = [
  {
    fields: {
      file: {
        fileName: 'tutorial.pdf',
        url: 'https://example.com/tutorial.pdf',
      },
    },
  },
  {
    fields: {
      file: {
        fileName: 'demo-video.mp4',
        url: 'https://videos.ctfassets.net/demo-video.mp4',
      },
    },
  },
]

export default function MyComponent() {
  return <AdditionalResources documents={documents} />
}
```

## Component Structure

```
AdditionalResources
├── Resource List (Buttons with file type icons)
└── Resource Viewer
    ├── Video Player (for video files)
    ├── PDF Viewer (for PDF files)
    ├── Image Display (for image files)
    └── Download Fallback (for other files)
```

## File Type Detection

The component automatically detects file types using:

1. **File Extensions**: Checks the filename for known extensions
2. **URL Patterns**: Identifies video hosting domains
3. **Fallback Logic**: Defaults to document type for unknown files

## Customization

### Adding New File Types

To support additional file types, update the `detectFileType` function in `src/lib/utils.ts`:

```tsx
export function detectFileType(url: string, fileName: string): FileType {
  // Add new extensions or hosts here
  const newExtensions = ['.newformat']
  const newHosts = ['newhost.com']

  // ... existing logic
}
```

### Custom Viewers

To add custom viewers for specific file types:

1. Create a new viewer component
2. Import it dynamically in `AdditionalResources.tsx`
3. Add a new case in the switch statement

## Dependencies

- **react-pdf**: For PDF viewing
- **lucide-react**: For icons
- **@/components/ui/button**: For UI components
- **@/components/Field**: For consistent styling

## Browser Support

- **Modern Browsers**: Full support for all features
- **PDF**: Requires PDF.js support
- **Video**: Native HTML5 video support
- **Fullscreen**: Uses Fullscreen API

## Performance Considerations

- **Dynamic Imports**: Components are loaded only when needed
- **Lazy Loading**: PDF and video components are dynamically imported
- **Memory Management**: Proper cleanup of event listeners and resources

## Accessibility

- **Keyboard Navigation**: All controls are keyboard accessible
- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Focus Management**: Logical tab order and focus indicators
- **High Contrast**: Supports high contrast mode

## Error Handling

- **Network Errors**: Graceful fallback for failed loads
- **Unsupported Formats**: Clear messaging and download options
- **Loading States**: Visual feedback during resource loading
