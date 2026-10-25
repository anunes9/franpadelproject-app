# Exercises Feature

The exercises feature allows modules to display exercise content with the correct Contentful structure including title, externalId, description, and media. Exercises are displayed as a list with clickable image viewing functionality.

## Overview

Exercises are linked to modules through the Contentful content model and provide visual learning content for students. Each exercise includes:

- **Title**: Descriptive name for the exercise
- **External ID**: Unique identifier for ordering/sequencing
- **Description**: Detailed explanation of the exercise (localized)
- **Media**: Visual content to support the exercise (optional)

## Content Model

### Module Content Type

```json
{
  "id": "exercises",
  "name": "Exercises",
  "type": "Array",
  "items": {
    "type": "Link",
    "linkType": "Entry",
    "validations": [
      {
        "linkContentType": ["exercises"]
      }
    ]
  }
}
```

### Exercise Content Type

```json
{
  "id": "title",
  "name": "Title",
  "type": "Symbol"
},
{
  "id": "externalId",
  "name": "ExternalId",
  "type": "Symbol"
},
{
  "id": "description",
  "name": "Description",
  "type": "Text",
  "localized": true
},
{
  "id": "media",
  "name": "Media",
  "type": "Link",
  "linkType": "Asset"
}
```

## Component Structure

### Exercises Component

The main `Exercises` component displays all exercises with:

- **List Display**: Clean card-based layout for all exercises
- **Interactive Elements**: "View Image" buttons for exercises with media
- **Modal Support**: Full-screen image viewing when clicked
- **Empty State**: Graceful handling when no exercises exist

### Exercise Cards

Each exercise is displayed in a card showing:

- **Header**: Exercise title, external ID, and description
- **Actions**: "View Image" button (only when media exists)
- **Badge**: Exercise type indicator
- **Layout**: Responsive design with proper spacing

## Usage in Modules

Exercises are automatically displayed in modules when they contain linked exercise entries:

```tsx
{
  /* Exercises Section */
}
;<Exercises exercises={module.exercises} />
```

## Data Flow

1. **Contentful**: Exercises are created and linked to modules
2. **API**: Module data is fetched with included exercise entries
3. **Processing**: Exercise data is processed and formatted
4. **Display**: Exercises component renders the exercise list
5. **Interaction**: Users can click to view images in modal

## Media Support

### Image Display

- **Formats**: All standard web image formats (JPG, PNG, GIF, SVG, WebP)
- **Features**: Responsive sizing with proper alt text
- **Modal View**: Full-screen image viewing with close functionality
- **Contentful Integration**: Automatic asset optimization

### Interactive Features

- **View Image Button**: Only appears for exercises with media
- **Modal Overlay**: Dark background with centered image display
- **Close Functionality**: Easy dismissal with close button
- **Responsive Modal**: Adapts to different screen sizes

## Exercise Ordering

Exercises are displayed in the order they appear in the Contentful array. The `externalId` field can be used for:

- **Sequencing**: Numeric ordering (1, 2, 3...)
- **Categorization**: Grouping exercises by type
- **Reference**: Easy identification in content management

## Accessibility Features

- **Alt Text**: Media includes descriptive alt text
- **Semantic Structure**: Proper heading hierarchy
- **Screen Reader Support**: Clear content structure
- **High Contrast**: Supports high contrast mode
- **Responsive Design**: Works on all device sizes
- **Keyboard Navigation**: Modal can be closed with keyboard

## Performance Considerations

- **Optimized Media**: Contentful handles media optimization
- **Lazy Loading**: Images load only when modal is opened
- **Responsive Sizing**: Appropriate media dimensions for different screens
- **Clean Rendering**: Efficient component updates

## Customization

### Styling Customization

The component uses Tailwind CSS classes and can be customized by:

- Modifying the Card component styling
- Updating color schemes and spacing
- Adjusting responsive breakpoints
- Customizing modal appearance

### Layout Adjustments

- **Card Spacing**: Modify spacing between exercises
- **Media Sizing**: Adjust modal dimensions and constraints
- **Typography**: Update text sizes and colors
- **Badge Styling**: Customize the exercise type badge
- **Modal Styling**: Customize overlay and image display

## Error Handling

- **Missing Media**: Graceful fallback for exercises without media
- **Network Errors**: Error states for failed media loads
- **Loading States**: Visual feedback during media loading
- **Invalid Data**: Safe handling of malformed exercise data
- **Modal Errors**: Fallback for failed image displays

## Future Enhancements

Potential improvements could include:

- **Exercise Completion Tracking**: Progress indicators
- **Interactive Elements**: Clickable image areas with annotations
- **Image Zoom**: Pan and zoom functionality in modal
- **Exercise Categories**: Grouping and filtering
- **Progress Analytics**: Exercise engagement metrics
- **Offline Support**: Cached exercise media
- **Image Gallery**: Navigation between multiple images
- **Download Options**: Save exercise images locally
