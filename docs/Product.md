# Fran Padel Project - Product Documentation

## Overview

**Fran Padel Project** is a comprehensive online learning platform designed specifically for padel education and training. The application provides a structured, progressive learning experience that helps players of all skill levels master padel techniques, tactics, and strategies through interactive courses, exercises, assessments, and personalized training planning.

## Mission & Focus

The platform focuses on delivering high-quality padel education through:

- **Structured Learning Paths**: Progressive courses organized by skill level (Beginner, Intermediate, Advanced)
- **Practical Application**: Hands-on exercises and drills that reinforce theoretical knowledge
- **Personalized Training**: Weekly planning tools that help students organize their practice sessions
- **Progress Tracking**: Comprehensive tracking of learning progress across all course modules and exercises
- **Assessment & Certification**: Knowledge checks and certification pathways to validate learning
- **Multilingual Support**: Full localization in Portuguese and English to serve a global audience

## Target Audience

- **Beginner Players**: New to padel, learning fundamental techniques and game basics
- **Intermediate Players**: Looking to refine skills and learn advanced tactics
- **Coaches & Instructors**: Using the platform as a teaching resource
- **Padel Clubs**: Providing structured training programs for members
- **Individual Learners**: Self-paced learning for skill development

## Core Features

### 1. Authentication & User Management

#### Authentication Methods

- **Email/Password Authentication**: Traditional login with email and password
- **OTP (One-Time Password)**: Passwordless login via email verification codes
- **User Invitations**: Admin-controlled user account creation via invitation links
- **Password Reset**: Secure password recovery via email links
- **Email Verification**: Account verification through email confirmation

#### User Roles

- **Client**: Standard user with access to courses and learning materials
- **Sales**: Sales representatives with extended access
- **Admin**: Full administrative access to manage content and users

#### User Profile Features

- **Personal Information**: Full name, email, avatar
- **Club Affiliation**: Club name and club avatar/logo
- **Member Since**: Account creation date tracking
- **Language Preferences**: User-selectable interface language
- **Progress Overview**: Visual statistics and progress tracking

### 2. Courses & Modules

#### Course Structure

Courses are organized into three skill levels:

- **Beginner Course**: Fundamentals of padel covering basic techniques and tactics

  - 8+ comprehensive mesociclos (modules)
  - Topics include: Service, Return, First Volley, Dynamic Balance, Trajectories, Launch techniques
  - Progressive learning from basic to intermediate concepts

- **Intermediate Course**: Advanced techniques and progressive transitions

  - Focus on advanced tactics and strategic play
  - Building upon beginner fundamentals

- **Advanced Course**: (Planned) Master-level techniques and strategies

#### Module Components

Each module (mesociclo) includes:

- **Title & Description**: Clear module identification and overview
- **Topics**: Tagged topics covered in the module
- **Duration**: Estimated time to complete
- **Presentation**: PDF presentations with detailed instructional content
- **Additional Resources**: Supporting documents, videos, and materials
- **Exercises**: Linked practical exercises related to module content
- **Knowledge Check**: Quiz component to assess understanding
- **Progress Tracking**: Status indicators (locked, available, in progress, completed)

#### Module Status Management

- **Locked**: Module not yet available (prerequisites not met)
- **Available**: Ready to be started
- **In Progress**: Module has been started but not completed
- **Completed**: Module fully completed with quiz passed

### 3. Exercises Library

#### Exercise Features

- **Comprehensive Library**: 50+ exercises covering technical and tactical aspects
- **Exercise Cards**: Visual cards with exercise details
- **Image Viewing**: Full-screen image viewing for exercise demonstrations
- **Categorization**: Exercises organized by type (Technical, Tactical)
- **Exercise Details**: Title, description, external ID, and media
- **Progress Tracking**: Completion status for each exercise

#### Exercise Content

Each exercise includes:

- **Title**: Descriptive name
- **External ID**: Unique identifier for ordering
- **Description**: Detailed explanation (localized)
- **Media**: Visual content (images) to support learning
- **Category**: Classification (Technical, Tactical)

### 4. Quizzes & Knowledge Checks

#### Quiz Features

- **Module Integration**: Quizzes linked to specific course modules
- **Multiple Choice Questions**: Standard question format
- **Answer Tracking**: Save and resume quiz attempts
- **Scoring System**: Percentage-based scoring with pass/fail thresholds
- **Passing Requirement**: 80% score required to pass
- **Multiple Attempts**: Ability to retake quizzes
- **Attempt History**: View previous quiz attempts and scores
- **Progress Persistence**: Answers saved between sessions

#### Quiz Functionality

- **Question Management**: Multiple questions per module
- **Answer Validation**: Ensure all questions answered before submission
- **Instant Feedback**: Immediate results after submission
- **Module Completion**: Quiz completion unlocks module completion status
- **Retry Mechanism**: Ability to review material and retake

### 5. Weekly Planning & Training Planner

#### Planning Features

- **Weekly Calendar View**: Visual calendar showing Monday through Friday
- **Module Scheduling**: Add course modules to specific days
- **Exercise Scheduling**: Add exercises to specific days
- **Week Navigation**: Navigate between weeks and years
- **Item Management**: Add and remove modules/exercises from days
- **Visual Organization**: Clear day-by-day training schedule

#### Planning Capabilities

- **Flexible Scheduling**: Plan training for any week of the year
- **Module Selection**: Choose from available course modules
- **Exercise Selection**: Choose from available exercises library
- **Day-Specific Planning**: Organize different content for each day
- **Persistent Storage**: Plans saved and accessible across sessions

### 6. Certification System

#### Certification Features

- **Progress Tracking**: Track progress toward certification requirements
- **Requirements Display**: Clear visibility of certification requirements
- **Multi-Step Process**: Multiple requirements to complete certification
- **Visual Progress**: Progress bars and completion indicators

#### Certification Requirements

- **Complete Beginner Course**: Finish all beginner modules
- **Pass Practical Assessment**: Complete practical evaluation
- **Complete Final Exam**: Pass final comprehensive exam

### 7. Progress Tracking & Analytics

#### Progress Features

- **Module Progress**: Track completion of individual modules
- **Course Progress**: Overall course completion percentage
- **Exercise Progress**: Track completed exercises
- **Quiz Scores**: Historical quiz attempt scores
- **Visual Indicators**: Progress bars, completion badges, status icons
- **Statistics Dashboard**: Overview of learning achievements

#### Progress Metrics

- **Modules Complete**: Count of completed modules
- **Exercises Complete**: Count of completed exercises
- **Hours Practiced**: Time spent on learning (planned)
- **General Progress**: Overall learning progress percentage

### 8. Content Management

#### Content Types

- **Modules**: Course modules with rich content
- **Exercises**: Exercise entries with media
- **Questions**: Quiz questions and answers
- **Documents**: PDFs, videos, images, and other resources
- **Presentations**: PDF presentations for modules

#### Content Features

- **Contentful CMS Integration**: Headless CMS for content management
- **Localization**: Multi-language content support
- **Media Management**: Optimized image and video handling
- **Rich Text Support**: Markdown and rich text formatting
- **Asset Optimization**: Automatic optimization of media assets

### 9. Additional Resources

#### Resource Types

- **PDF Documents**: Instructional PDFs with embedded viewer
- **Videos**: Video content with custom player
- **Images**: Image resources with responsive display
- **Other Documents**: Excel, Word, PowerPoint files with download fallback

#### Resource Features

- **Multi-Format Support**: Automatic detection and handling of file types
- **PDF Viewer**: Built-in PDF viewer with navigation
- **Video Player**: Custom video player with controls
- **Image Display**: Direct image preview
- **Download Fallback**: Download links for unsupported formats
- **Responsive Design**: Works on all device sizes

### 10. Localization & Internationalization

#### Language Support

- **Portuguese (PT)**: Full interface and content localization
- **English (EN)**: Complete English translation
- **Language Switcher**: Easy language selection in user profile
- **Content Localization**: All course content available in both languages
- **Dynamic Language Switching**: Change language without page reload

#### Localization Features

- **Interface Translation**: All UI elements translated
- **Content Translation**: Course content, exercises, and quizzes localized
- **Locale-Aware Routing**: URL-based locale management
- **Contentful Locale Mapping**: Automatic mapping between app and CMS locales

### 11. User Interface & Experience

#### Design Principles

- **Mobile-First**: Responsive design optimized for mobile devices
- **Modern UI**: Clean, modern interface using Tailwind CSS
- **Accessibility**: WCAG-compliant design with keyboard navigation
- **Performance**: Optimized loading and rendering
- **User-Friendly**: Intuitive navigation and clear information hierarchy

#### UI Components

- **Dashboard**: Central hub with course overview and quick access
- **Course Cards**: Visual cards showing course/module information
- **Progress Indicators**: Visual progress bars and completion badges
- **Status Icons**: Clear visual indicators for module status
- **Navigation**: Easy navigation between sections
- **Modals**: Full-screen image viewing and interactive dialogs

### 12. Technical Architecture

#### Technology Stack

- **Frontend Framework**: Next.js 15 with React 19
- **Styling**: Tailwind CSS 4
- **Type Safety**: TypeScript
- **Content Management**: Contentful CMS (Management & Delivery APIs)
- **Backend & Auth**: Supabase (Authentication, Database, Storage)
- **Internationalization**: next-intl
- **PDF Viewing**: react-pdf
- **Form Handling**: React Hook Form
- **UI Components**: Radix UI primitives

#### Architecture Features

- **Server Components**: React Server Components for optimal performance
- **API Routes**: Next.js API routes for server-side logic
- **Database**: PostgreSQL via Supabase
- **File Storage**: Supabase Storage for user uploads
- **Content Delivery**: Contentful Delivery API for optimized content
- **Authentication**: Supabase Auth with multiple methods

## User Journey

### New User Flow

1. **Landing Page**: Video background with login/signup options
2. **Account Creation**: Sign up with email/password or receive invitation
3. **Email Verification**: Verify email address
4. **Dashboard Access**: View available courses and features
5. **Course Selection**: Choose Beginner or Intermediate course
6. **Module Start**: Begin first available module
7. **Content Consumption**: View presentations, resources, exercises
8. **Knowledge Check**: Complete module quiz
9. **Progress Tracking**: View progress and continue to next module

### Returning User Flow

1. **Login**: Authenticate via password or OTP
2. **Dashboard**: View progress and continue where left off
3. **Module Continuation**: Resume in-progress modules
4. **Exercise Practice**: Access exercise library for practice
5. **Weekly Planning**: Plan upcoming training sessions
6. **Progress Review**: Check certification progress and statistics

## Content Structure

### Course Hierarchy

```
Course (Beginner/Intermediate/Advanced)
  └── Module (Mesociclo)
      ├── Presentation (PDF)
      ├── Additional Resources (Documents/Videos)
      ├── Exercises (Linked Exercise Entries)
      └── Quiz (Knowledge Check Questions)
```

### Exercise Structure

```
Exercise
  ├── Title
  ├── External ID
  ├── Description (Localized)
  └── Media (Image)
```

### Quiz Structure

```
Quiz
  └── Questions
      ├── Question Text
      ├── Answers (Multiple Choice)
      └── Correct Option
```

## Data Flow

### Content Delivery

1. **Contentful CMS**: Content creators manage courses, modules, exercises
2. **Contentful Delivery API**: Published content fetched via API
3. **Next.js Server**: Server-side data fetching and processing
4. **Component Rendering**: React components render content
5. **User Display**: Content displayed to users

### User Progress

1. **User Actions**: User completes modules, exercises, quizzes
2. **Database Updates**: Progress saved to Supabase database
3. **Progress Calculation**: Status calculated based on completion
4. **UI Updates**: Progress indicators updated in real-time
5. **Analytics**: Progress data used for statistics and recommendations

## Security & Privacy

### Security Features

- **Secure Authentication**: Supabase Auth with industry-standard security
- **Password Hashing**: Secure password storage
- **Session Management**: Secure session handling
- **Row Level Security**: Database-level access control
- **HTTPS**: Encrypted data transmission
- **Input Validation**: Server-side validation of all inputs

### Privacy Features

- **User Data Control**: Users can view and manage their data
- **Privacy Policy**: Clear privacy policy and terms of service
- **Data Protection**: GDPR-compliant data handling
- **Secure Storage**: Encrypted data storage

## Performance & Optimization

### Performance Features

- **Server-Side Rendering**: Fast initial page loads
- **Static Generation**: Pre-rendered pages where possible
- **Image Optimization**: Next.js Image component optimization
- **Code Splitting**: Dynamic imports for reduced bundle size
- **Caching**: Strategic caching of content and API responses
- **Lazy Loading**: Components and images loaded on demand

### Optimization Strategies

- **Contentful CDN**: Content delivered via Contentful's CDN
- **Database Indexing**: Optimized database queries
- **API Optimization**: Efficient API calls with proper includes
- **Bundle Optimization**: Tree-shaking and code splitting

## Accessibility

### Accessibility Features

- **Semantic HTML**: Proper HTML structure
- **ARIA Labels**: Screen reader support
- **Keyboard Navigation**: Full keyboard accessibility
- **Focus Management**: Clear focus indicators
- **Color Contrast**: WCAG-compliant color contrast ratios
- **Screen Reader Support**: Compatible with assistive technologies
- **Responsive Design**: Works on all device sizes

## Future Enhancements

### Planned Features

- **Advanced Course**: Complete advanced level course content
- **Video Lessons**: Enhanced video content integration
- **Social Features**: Community features and sharing
- **Mobile App**: Native mobile application
- **Offline Mode**: Offline content access
- **Advanced Analytics**: Detailed learning analytics
- **Gamification**: Achievements and badges
- **Live Sessions**: Integration with live training sessions
- **Coach Tools**: Enhanced tools for coaches
- **Payment Integration**: Subscription and payment processing

## Support & Resources

### Documentation

- **Feature Documentation**: Detailed documentation for each feature
- **API Documentation**: Contentful and Supabase API usage
- **Component Documentation**: UI component usage guides
- **Development Guides**: Setup and development instructions

### Support Channels

- **User Support**: Support for platform users
- **Technical Support**: Technical assistance for developers
- **Content Support**: Help with content creation and management

## Conclusion

Fran Padel Project is a comprehensive, modern learning platform that combines structured education, practical exercises, progress tracking, and personalized planning to deliver an exceptional padel learning experience. With its focus on progressive learning, multilingual support, and user-friendly interface, it serves as a complete solution for padel education at all skill levels.
