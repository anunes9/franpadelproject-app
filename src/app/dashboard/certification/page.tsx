import { Award } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import BackNavigation from '@/components/BackNavigation'
import { Field } from '@/components/Field'

// const certificationRequirements = [
//   {
//     id: 1,
//     title: 'Complete Beginner Course',
//     description: 'Finish all 10 modules of the beginner course',
//     completed: true,
//     progress: 100,
//     icon: CheckCircle,
//   },
//   {
//     id: 2,
//     title: 'Pass Practical Assessment',
//     description: 'Demonstrate skills in a practical on-court evaluation',
//     completed: true,
//     progress: 100,
//     icon: CheckCircle,
//   },
//   {
//     id: 3,
//     title: 'Complete Final Exam',
//     description: 'Pass the written exam with a score of 80% or higher',
//     completed: false,
//     progress: 0,
//     icon: FileText,
//   },
// ]

// const availableCertifications = [
//   {
//     id: 1,
//     title: 'Padel Fundamentals Certificate',
//     level: 'Beginner',
//     description: 'Demonstrates mastery of basic padel techniques and rules',
//     requirements: ['Complete beginner course', 'Pass practical assessment', 'Pass final exam'],
//     status: 'available',
//     completedRequirements: 2,
//     totalRequirements: 3,
//     estimatedTime: '2-3 weeks',
//     badge: '🥉',
//   },
//   {
//     id: 2,
//     title: 'Intermediate Player Certificate',
//     level: 'Intermediate',
//     description: 'Advanced techniques and tactical understanding',
//     requirements: ['Complete intermediate course', 'Tournament participation', 'Advanced assessment'],
//     status: 'locked',
//     completedRequirements: 0,
//     totalRequirements: 3,
//     estimatedTime: '4-6 weeks',
//     badge: '🥈',
//   },
//   {
//     id: 3,
//     title: 'Padel Instructor Certificate',
//     level: 'Advanced',
//     description: 'Qualified to teach padel to beginners and intermediate players',
//     requirements: ['Complete all courses', 'Teaching methodology', 'Instructor assessment'],
//     status: 'locked',
//     completedRequirements: 0,
//     totalRequirements: 3,
//     estimatedTime: '8-12 weeks',
//     badge: '🥇',
//   },
// ]

// const achievements = [
//   {
//     id: 1,
//     title: 'First Steps',
//     description: 'Completed your first module',
//     earned: true,
//     date: '2024-01-15',
//     icon: Star,
//   },
//   {
//     id: 2,
//     title: 'Dedicated Learner',
//     description: 'Completed 5 modules in a row',
//     earned: true,
//     date: '2024-01-22',
//     icon: Trophy,
//   },
//   {
//     id: 3,
//     title: 'Exercise Enthusiast',
//     description: 'Completed 10 exercises',
//     earned: true,
//     date: '2024-01-28',
//     icon: Award,
//   },
//   {
//     id: 4,
//     title: 'Course Master',
//     description: 'Completed the entire beginner course',
//     earned: false,
//     date: null,
//     icon: CheckCircle,
//   },
// ]

export default function CertificationPage() {
  // const overallProgress =
  //   (certificationRequirements.filter((req) => req.completed).length / certificationRequirements.length) * 100
  // const earnedAchievements = achievements.filter((achievement) => achievement.earned).length

  return (
    <>
      <PageHeader
        color="secondary"
        title="Centro de Certificação"
        level="Beginner"
        progressPercentage={0}
        completedCount={0}
        totalCount={8}
        progressLabel="0/8 mesociclos"
      />

      <Field title="Certificação" icon={<Award className="h-5 w-5" />}>
        Completa os mesociclos para obter certificação.
      </Field>
    </>
  )

  // return (
  //   <div className="min-h-screen bg-background">
  //     {/* Header */}
  //     <header className="border-b border-border bg-card">
  //       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  //         <div className="flex items-center h-16">
  //           <Link
  //             href="/dashboard"
  //             className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
  //           >
  //             <ArrowLeft className="h-4 w-4" />
  //             <span>Back to Dashboard</span>
  //           </Link>
  //         </div>
  //       </div>
  //     </header>

  //     {/* Page Header */}
  //     <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-b border-border">
  //       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  //         <div className="flex flex-col md:flex-row md:items-center md:justify-between">
  //           <div>
  //             <h1 className="text-3xl font-bold text-foreground mb-2">Certification Center</h1>
  //             <p className="text-muted-foreground text-lg mb-4">
  //               Earn official credentials and showcase your padel expertise
  //             </p>
  //             <div className="flex items-center space-x-4">
  //               <Badge variant="secondary">{Math.round(overallProgress)}% Complete</Badge>
  //               <Badge variant="outline">{earnedAchievements} Achievements</Badge>
  //             </div>
  //           </div>
  //           <div className="mt-6 md:mt-0">
  //             <div className="text-center">
  //               <div className="text-2xl font-bold text-yellow-600 mb-1">{Math.round(overallProgress)}%</div>
  //               <div className="text-sm text-muted-foreground">Progress</div>
  //               <div className="w-24 bg-muted rounded-full h-2 mt-2">
  //                 <div className="bg-yellow-600 h-2 rounded-full" style={{ width: `${overallProgress}%` }}></div>
  //               </div>
  //             </div>
  //           </div>
  //         </div>
  //       </div>
  //     </div>

  //     <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  //       {/* Current Progress */}
  //       <div className="mb-8">
  //         <h2 className="text-2xl font-bold text-foreground mb-4">Certification Requirements</h2>
  //         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  //           {certificationRequirements.map((requirement) => {
  //             const IconComponent = requirement.icon
  //             return (
  //               <Card key={requirement.id} className={requirement.completed ? 'ring-2 ring-green-200' : ''}>
  //                 <CardHeader className="pb-3">
  //                   <div className="flex items-center space-x-3">
  //                     <div
  //                       className={`p-2 rounded-lg ${
  //                         requirement.completed ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'
  //                       }`}
  //                     >
  //                       <IconComponent className="h-5 w-5" />
  //                     </div>
  //                     <div>
  //                       <CardTitle className="text-lg">{requirement.title}</CardTitle>
  //                     </div>
  //                   </div>
  //                 </CardHeader>
  //                 <CardContent>
  //                   <p className="text-muted-foreground mb-3">{requirement.description}</p>
  //                   <div className="flex items-center justify-between mb-2">
  //                     <span className="text-sm text-muted-foreground">Progress</span>
  //                     <span className="text-sm font-medium">{requirement.progress}%</span>
  //                   </div>
  //                   <Progress value={requirement.progress} className="h-2" />
  //                 </CardContent>
  //               </Card>
  //             )
  //           })}
  //         </div>
  //       </div>

  //       {/* Available Certifications */}
  //       <div className="mb-8">
  //         <h2 className="text-2xl font-bold text-foreground mb-4">Available Certifications</h2>
  //         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  //           {availableCertifications.map((cert) => (
  //             <Card
  //               key={cert.id}
  //               className={`hover:shadow-lg transition-all duration-200 ${
  //                 cert.status === 'locked' ? 'opacity-60' : 'cursor-pointer hover:scale-105'
  //               }`}
  //             >
  //               <CardHeader>
  //                 <div className="flex items-start justify-between">
  //                   <div className="flex items-center space-x-3">
  //                     <div className="text-3xl">{cert.badge}</div>
  //                     <div>
  //                       <CardTitle className="text-xl">{cert.title}</CardTitle>
  //                       <CardDescription>{cert.level} Level</CardDescription>
  //                     </div>
  //                   </div>
  //                   <Badge
  //                     variant={
  //                       cert.status === 'available' ? 'default' : cert.status === 'locked' ? 'secondary' : 'outline'
  //                     }
  //                   >
  //                     {cert.status === 'available' ? 'Ready' : 'Locked'}
  //                   </Badge>
  //                 </div>
  //               </CardHeader>
  //               <CardContent>
  //                 <p className="text-muted-foreground mb-4">{cert.description}</p>

  //                 <div className="mb-4">
  //                   <div className="flex items-center justify-between mb-2">
  //                     <span className="text-sm text-muted-foreground">Requirements</span>
  //                     <span className="text-sm font-medium">
  //                       {cert.completedRequirements}/{cert.totalRequirements}
  //                     </span>
  //                   </div>
  //                   <Progress
  //                     value={(cert.completedRequirements / cert.totalRequirements) * 100}
  //                     className="h-2 mb-3"
  //                   />
  //                   <ul className="space-y-1">
  //                     {cert.requirements.map((req, index) => (
  //                       <li key={index} className="flex items-center space-x-2">
  //                         <div
  //                           className={`w-2 h-2 rounded-full ${
  //                             index < cert.completedRequirements ? 'bg-green-500' : 'bg-muted'
  //                           }`}
  //                         ></div>
  //                         <span className="text-sm text-muted-foreground">{req}</span>
  //                       </li>
  //                     ))}
  //                   </ul>
  //                 </div>

  //                 <div className="flex items-center space-x-2 mb-4">
  //                   <Clock className="h-4 w-4 text-muted-foreground" />
  //                   <span className="text-sm text-muted-foreground">{cert.estimatedTime}</span>
  //                 </div>

  //                 <Button
  //                   className="w-full"
  //                   disabled={cert.status === 'locked'}
  //                   variant={cert.status === 'available' ? 'default' : 'outline'}
  //                 >
  //                   {cert.status === 'available' ? 'Start Certification' : 'Requirements Not Met'}
  //                 </Button>
  //               </CardContent>
  //             </Card>
  //           ))}
  //         </div>
  //       </div>

  //       {/* Achievements */}
  //       <div className="mb-8">
  //         <h2 className="text-2xl font-bold text-foreground mb-4">Achievements</h2>
  //         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  //           {achievements.map((achievement) => {
  //             const IconComponent = achievement.icon
  //             return (
  //               <Card
  //                 key={achievement.id}
  //                 className={`text-center ${achievement.earned ? 'ring-2 ring-yellow-200' : 'opacity-60'}`}
  //               >
  //                 <CardContent className="pt-6">
  //                   <div
  //                     className={`p-3 rounded-full w-fit mx-auto mb-3 ${
  //                       achievement.earned ? 'bg-yellow-100 text-yellow-600' : 'bg-muted text-muted-foreground'
  //                     }`}
  //                   >
  //                     <IconComponent className="h-6 w-6" />
  //                   </div>
  //                   <h3 className="font-semibold text-foreground mb-1">{achievement.title}</h3>
  //                   <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>
  //                   {achievement.earned && achievement.date && (
  //                     <Badge variant="outline" className="text-xs">
  //                       Earned {achievement.date}
  //                     </Badge>
  //                   )}
  //                 </CardContent>
  //               </Card>
  //             )
  //           })}
  //         </div>
  //       </div>

  //       {/* Action Buttons */}
  //       <div className="flex flex-col sm:flex-row gap-4 justify-center">
  //         <Button size="lg" className="flex items-center space-x-2">
  //           <FileText className="h-5 w-5" />
  //           <span>Take Final Exam</span>
  //         </Button>
  //         <Button variant="outline" size="lg" className="flex items-center space-x-2 bg-transparent">
  //           <Download className="h-5 w-5" />
  //           <span>Download Certificates</span>
  //         </Button>
  //       </div>
  //     </main>
  //   </div>
  // )
}
