# Courses Feature

The courses feature provides a structured learning experience organized by skill levels (Beginner, Intermediate, Advanced). Each course contains multiple modules (mesociclos) that students progress through sequentially, with progress tracking, status management, and rich content including presentations, exercises, quizzes, and additional resources.

## Overview

Courses are the primary organizational structure for the learning platform. They group related modules by skill level and provide a clear learning path for students. Each course includes:

- **Level-based Organization**: Courses are categorized by Beginner, Intermediate, and Advanced levels
- **Module Progression**: Sequential modules that students complete in order
- **Progress Tracking**: Real-time tracking of student completion status
- **Status Management**: Modules can be locked, available, in progress, or completed
- **Rich Content**: Each module includes presentations, exercises, quizzes, and additional resources
- **Localization**: Full support for multiple languages (Portuguese, English)

## Content Model

### Module Content Type

The module content type in Contentful defines the structure for each course module:

```json
{
  "id": "title",
  "name": "Title",
  "type": "Symbol",
  "localized": true,
  "required": true
},
{
  "id": "externalId",
  "name": "External Id",
  "type": "Symbol",
  "localized": false,
  "required": true
},
{
  "id": "description",
  "name": "Description",
  "type": "Text",
  "localized": true,
  "required": false
},
{
  "id": "topics",
  "name": "Topics",
  "type": "Array",
  "localized": true,
  "items": {
    "type": "Symbol"
  }
},
{
  "id": "duration",
  "name": "Duration",
  "type": "Symbol",
  "localized": true
},
{
  "id": "level",
  "name": "Level",
  "type": "Symbol",
  "validations": [
    {
      "in": ["Beginner", "Intermediate", "Advanced"]
    }
  ]
},
{
  "id": "content",
  "name": "Content",
  "type": "Text",
  "localized": true
},
{
  "id": "presentation",
  "name": "Presentation",
  "type": "Link",
  "linkType": "Asset"
},
{
  "id": "documents",
  "name": "Documents",
  "type": "Array",
  "items": {
    "type": "Link",
    "linkType": "Asset"
  }
},
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
},
{
  "id": "questions",
  "name": "Questions",
  "type": "Array",
  "items": {
    "type": "Link",
    "linkType": "Entry",
    "validations": [
      {
        "linkContentType": ["questions"]
      }
    ]
  }
}
```

## Component Structure

### CourseHeader Component

The `CourseHeader` component displays course-level information including:

- **Course Title**: Level-specific title (e.g., "Metodologia - Iniciado")
- **Course Description**: Brief description of the course level
- **Progress Indicator**: Visual progress bar showing completion percentage
- **Module Count**: Total number of modules in the course
- **Next Module**: Display of the next module to complete
- **Level-specific Styling**: Color-coded by course level (green for Beginner, orange for Intermediate, blue for Advanced)

### CourseCard Component

Each module is displayed as a card with:

- **Status Icon**: Visual indicator (checkmark for completed, play for in progress, lock for locked)
- **Module Title**: Clear title of the module
- **Description**: Brief description of module content
- **Topics**: Badge display of module topics
- **Duration**: Estimated time to complete
- **Action Button**: Context-aware button text (Iniciar, Continuar, Revisitar, Bloqueado)
- **Status-based Styling**: Visual feedback based on module status
- **Hover Effects**: Interactive feedback on hover

### PageHeader Component

The module detail page header displays:

- **Module Title and Description**: Combined title and description
- **Level Badge**: Visual indicator of course level
- **Duration Badge**: Time estimate for completion
- **Topics Badge**: List of module topics
- **Progress Information**: Optional progress percentage and completion count
- **Back Navigation**: Link to return to course overview

## Usage

### Course Listing Pages

Courses are displayed on level-specific pages:

```tsx
// Beginner course page
import { getBeginnerModules } from '@/lib/contentful/modules-delivery'
import { CourseHeader } from '@/components/courses/CourseHeader'
import { CourseCard } from '@/components/courses/CourseCard'

const modules = await getBeginnerModules(locale)
const userProgress = await getAllUserModuleProgress()

return (
  <>
    <CourseHeader modules={modules} level="Beginner" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {modules.map((module) => {
        const status = getModuleStatus(module.externalId)
        return <CourseCard key={module.id} status={status} module={module} />
      })}
    </div>
  </>
)
```

### Module Detail Page

Individual modules display their full content:

```tsx
import { getModuleByExternalId } from '@/lib/contentful/modules-delivery'
import PageHeader from '@/components/PageHeader'
import AdditionalResources from '@/components/AdditionalResources'
import Exercises from '@/components/Exercises'
import QuizComponent from '@/components/QuizComponent'

const course = await getModuleByExternalId(externalId, locale)

return (
  <>
    <PageHeader
      title={`${course.title} - ${course.description}`}
      level={course.level}
      duration={course.duration}
      topics={course.topics}
    />
    <div className="space-y-6">
      {course.presentation && <PDFViewerWrapper url={course.presentation.fields.file.url} />}
      <AdditionalResources documents={course.documents} />
      <Exercises exercises={course.exercises} />
      {course.questions && <QuizComponent questions={course.questions} />}
    </div>
  </>
)
```

## Data Flow

1. **Contentful**: Modules are created and organized by level in Contentful
2. **API Layer**: Contentful Delivery API fetches module data with included linked entries
3. **Processing**: Module data is processed, sorted, and formatted
4. **Progress Integration**: User progress is fetched from database and merged with module data
5. **Status Calculation**: Module status is determined based on progress (locked, available, in_progress, completed)
6. **Display**: Course components render the module list with appropriate status indicators
7. **Navigation**: Users navigate to individual modules to view full content

## Module Status Management

### Status Types

- **Locked**: Module is not yet available (prerequisites not met)
- **Available**: Module is ready to be started
- **In Progress**: Module has been started but not completed
- **Completed**: Module has been fully completed

### Status Calculation

Module status is determined by:

```tsx
const getModuleStatus = (moduleExternalId: string) => {
  const progress = userProgress.find(
    (p) => p.module_external_id === moduleExternalId
  )

  if (progress?.status === 'completed') return 'completed'
  else if (progress?.status === 'in_progress') return 'in-progress'

  return 'available'
}
```

### Status Visual Indicators

- **Completed**: Green checkmark icon, green button with "Revisitar" text
- **In Progress**: Play icon, blue button with "Continuar" text
- **Available**: Play icon, green button with "Iniciar" text
- **Locked**: Lock icon, gray button with "Bloqueado" text, reduced opacity

## Module Ordering

Modules are automatically sorted by:

1. **Level**: Beginner → Intermediate → Advanced
2. **External ID**: Numeric ordering within each level
3. **Title**: Alphabetical fallback for non-numeric external IDs

```tsx
.sort((a: Module, b: Module) => {
  const levelOrder = { Beginner: 1, Intermediate: 2, Advanced: 3 }
  const aLevel = levelOrder[a.level as keyof typeof levelOrder] || 4
  const bLevel = levelOrder[b.level as keyof typeof levelOrder] || 4

  if (aLevel !== bLevel) {
    return aLevel - bLevel
  }

  const aId = parseInt(a.externalId) || 0
  const bId = parseInt(b.externalId) || 0
  if (aId && bId) {
    return aId - bId
  }
  return a.title.localeCompare(b.title)
})
```

## Content Types

### Presentation

- **Format**: PDF files
- **Display**: Embedded PDF viewer with navigation controls
- **Purpose**: Main instructional content for the module

### Additional Resources

- **Formats**: PDFs, videos, images, documents
- **Display**: Multi-format resource viewer
- **Purpose**: Supplementary learning materials

### Exercises

- **Type**: Linked exercise entries
- **Display**: Exercise cards with image viewing
- **Purpose**: Practical application of module concepts

### Quizzes

- **Type**: Linked question entries
- **Display**: Interactive quiz component
- **Purpose**: Knowledge assessment and reinforcement

## Progress Tracking

### Progress Calculation

Course progress is calculated based on:

- **Completed Modules**: Count of modules with status "completed"
- **Total Modules**: Total number of modules in the course
- **Percentage**: (Completed / Total) × 100

### Progress Display

- **Progress Bar**: Visual indicator showing completion percentage
- **Module Counter**: "X of Y mesociclos completos" display
- **Next Module**: Indication of the next module to complete

## Localization

Courses support full localization:

- **Contentful Locale Mapping**: Automatic mapping between app locales and Contentful locales
- **Localized Fields**: Title, description, topics, duration, and content are localized
- **Locale-aware Fetching**: Modules are fetched with the appropriate locale parameter

```tsx
const contentfulLocale = contentfulLocaleMap[locale] || contentfulLocaleMap.en
const entries = await getEntries({
  content_type: 'modules',
  'fields.level': 'Beginner',
  locale: contentfulLocale,
})
```

## Accessibility Features

- **Semantic Structure**: Proper heading hierarchy and HTML structure
- **Screen Reader Support**: Clear content structure and ARIA labels
- **Keyboard Navigation**: Full keyboard support for all interactive elements
- **Focus Management**: Logical tab order and visible focus indicators
- **High Contrast**: Supports high contrast mode
- **Responsive Design**: Works on all device sizes
- **Status Indicators**: Clear visual and textual status information

## Performance Considerations

- **Contentful Delivery API**: Optimized content delivery with caching
- **Lazy Loading**: Components load only when needed
- **Efficient Sorting**: Optimized sorting algorithms for module ordering
- **Progress Caching**: User progress is cached to reduce database queries
- **Responsive Images**: Optimized image loading for different screen sizes
- **Code Splitting**: Dynamic imports for heavy components

## Customization

### Styling Customization

The components use Tailwind CSS and can be customized by:

- Modifying color schemes for different course levels
- Updating card styling and spacing
- Adjusting responsive breakpoints
- Customizing status indicator colors and icons
- Updating progress bar appearance

### Layout Adjustments

- **Grid Layout**: Modify grid columns for different screen sizes
- **Card Spacing**: Adjust gap between course cards
- **Header Styling**: Customize course header appearance
- **Button Styling**: Update action button colors and text
- **Badge Display**: Customize topic and metadata badge appearance

### Status Management

- **Custom Statuses**: Add new status types as needed
- **Status Logic**: Modify status calculation logic
- **Status Icons**: Update or add new status icons
- **Status Colors**: Customize color schemes for status types

## Error Handling

- **Missing Modules**: Graceful handling when no modules are found
- **Network Errors**: Error states for failed Contentful API calls
- **Invalid Data**: Safe handling of malformed module data
- **Progress Errors**: Fallback when progress data cannot be loaded
- **Missing Content**: Graceful degradation when optional content is missing
- **404 Handling**: Proper not-found handling for invalid module IDs

## API Functions

### getBeginnerModules(locale)

Fetches all modules with level "Beginner" from Contentful.

**Parameters:**
- `locale`: Locale string (default: 'en')

**Returns:** Array of Module objects

### getIntermediateModules(locale)

Fetches all modules with level "Intermediate" from Contentful.

**Parameters:**
- `locale`: Locale string (default: 'en')

**Returns:** Array of Module objects

### getModuleByExternalId(externalId, locale)

Fetches a specific module by its external ID with all linked content.

**Parameters:**
- `externalId`: Module external ID
- `locale`: Locale string (default: 'en')

**Returns:** Module object or null

### getAllModules(locale)

Fetches all modules across all levels.

**Parameters:**
- `locale`: Locale string (default: 'en')

**Returns:** Array of Module objects sorted by level and external ID

### getModulesByLevel(level, locale)

Fetches all modules for a specific level.

**Parameters:**
- `level`: Course level string ('Beginner', 'Intermediate', 'Advanced')
- `locale`: Locale string (default: 'en')

**Returns:** Array of Module objects

## Future Enhancements

Potential improvements could include:

- **Advanced Progress Tracking**: Detailed analytics and completion metrics
- **Module Prerequisites**: Automatic locking/unlocking based on prerequisites
- **Course Certificates**: Certificate generation upon course completion
- **Offline Support**: Cached course content for offline access
- **Bookmarking**: Save favorite modules for quick access
- **Search Functionality**: Search across all course content
- **Recommendations**: Personalized module recommendations
- **Social Features**: Share progress and achievements
- **Adaptive Learning**: Dynamic module ordering based on performance
- **Video Integration**: Enhanced video content support
- **Interactive Content**: Interactive learning elements beyond quizzes
- **Mobile App**: Native mobile app for course access
- **Notifications**: Reminders for incomplete modules
- **Export Progress**: Download progress reports

