import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Play, CheckCircle, Lock, Clock } from "lucide-react"
import Link from "next/link"

const modules = [
  {
    id: 1,
    title: "Introduction to Padel",
    description: "Learn the basics of padel, court dimensions, and equipment",
    duration: "15 min",
    status: "completed",
    topics: ["Court layout", "Equipment overview", "Basic rules"],
  },
  {
    id: 2,
    title: "Grip and Stance",
    description: "Master the fundamental grip techniques and proper stance",
    duration: "20 min",
    status: "completed",
    topics: ["Continental grip", "Ready position", "Footwork basics"],
  },
  {
    id: 3,
    title: "Basic Strokes",
    description: "Learn forehand and backhand techniques",
    duration: "25 min",
    status: "completed",
    topics: ["Forehand drive", "Backhand slice", "Contact points"],
  },
  {
    id: 4,
    title: "Serving Fundamentals",
    description: "Develop consistent and effective serving technique",
    duration: "18 min",
    status: "in-progress",
    topics: ["Service motion", "Ball placement", "Service variations"],
  },
  {
    id: 5,
    title: "Net Play Basics",
    description: "Introduction to volleys and net positioning",
    duration: "22 min",
    status: "locked",
    topics: ["Volley technique", "Net positioning", "Quick reactions"],
  },
  {
    id: 6,
    title: "Wall Play Techniques",
    description: "Learn to use the walls effectively in your game",
    duration: "30 min",
    status: "locked",
    topics: ["Wall rebounds", "Angle control", "Defensive walls"],
  },
  {
    id: 7,
    title: "Court Positioning",
    description: "Strategic positioning and movement patterns",
    duration: "25 min",
    status: "locked",
    topics: ["Court coverage", "Partner coordination", "Movement patterns"],
  },
  {
    id: 8,
    title: "Basic Strategy",
    description: "Fundamental tactical concepts and game plans",
    duration: "20 min",
    status: "locked",
    topics: ["Point construction", "Shot selection", "Court geometry"],
  },
  {
    id: 9,
    title: "Doubles Communication",
    description: "Effective communication and teamwork in doubles",
    duration: "15 min",
    status: "locked",
    topics: ["Partner signals", "Court responsibilities", "Team tactics"],
  },
  {
    id: 10,
    title: "Match Play Preparation",
    description: "Putting it all together for competitive play",
    duration: "35 min",
    status: "locked",
    topics: ["Warm-up routines", "Mental preparation", "Match strategy"],
  },
]

export default function BeginnerCoursePage() {
  const completedModules = modules.filter((m) => m.status === "completed").length
  const totalModules = modules.length
  const progressPercentage = (completedModules / totalModules) * 100

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link
              href="/dashboard"
              className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Course Header */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Beginner Course</h1>
              <p className="text-muted-foreground text-lg mb-4">
                Master the fundamentals of padel with our comprehensive 10-module course
              </p>
              <div className="flex items-center space-x-4">
                <Badge variant="secondary">
                  {completedModules}/{totalModules} Modules
                </Badge>
                <Badge variant="outline">{Math.round(progressPercentage)}% Complete</Badge>
              </div>
            </div>
            <div className="mt-6 md:mt-0">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-1">{Math.round(progressPercentage)}%</div>
                <div className="text-sm text-muted-foreground">Progress</div>
                <div className="w-24 bg-muted rounded-full h-2 mt-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => (
            <Card
              key={module.id}
              className={`hover:shadow-lg transition-all duration-200 ${
                module.status === "locked" ? "opacity-60" : "cursor-pointer hover:scale-105"
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2 rounded-lg ${
                        module.status === "completed"
                          ? "bg-green-100 text-green-600"
                          : module.status === "in-progress"
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {module.status === "completed" ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : module.status === "in-progress" ? (
                        <Play className="h-5 w-5" />
                      ) : (
                        <Lock className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg">Module {module.id}</CardTitle>
                      <CardDescription className="text-sm">{module.title}</CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant={
                      module.status === "completed"
                        ? "default"
                        : module.status === "in-progress"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {module.status === "completed"
                      ? "Complete"
                      : module.status === "in-progress"
                        ? "In Progress"
                        : "Locked"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{module.description}</p>

                <div className="flex items-center space-x-2 mb-4">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{module.duration}</span>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-foreground mb-2">Topics covered:</h4>
                  <div className="flex flex-wrap gap-1">
                    {module.topics.map((topic, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button
                  className="w-full"
                  disabled={module.status === "locked"}
                  variant={module.status === "completed" ? "outline" : "default"}
                  asChild={module.status !== "locked"}
                >
                  {module.status !== "locked" ? (
                    <Link href={`/dashboard/beginner-course/${module.id}`}>
                      {module.status === "completed"
                        ? "Review Module"
                        : module.status === "in-progress"
                          ? "Continue Module"
                          : "Start Module"}
                    </Link>
                  ) : (
                    "Locked"
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Course Stats */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-6 bg-card rounded-lg border border-border">
            <div className="text-2xl font-bold text-green-600 mb-1">{completedModules}</div>
            <div className="text-sm text-muted-foreground">Completed Modules</div>
          </div>
          <div className="text-center p-6 bg-card rounded-lg border border-border">
            <div className="text-2xl font-bold text-primary mb-1">1</div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </div>
          <div className="text-center p-6 bg-card rounded-lg border border-border">
            <div className="text-2xl font-bold text-muted-foreground mb-1">{totalModules - completedModules - 1}</div>
            <div className="text-sm text-muted-foreground">Remaining</div>
          </div>
          <div className="text-center p-6 bg-card rounded-lg border border-border">
            <div className="text-2xl font-bold text-accent mb-1">4.2h</div>
            <div className="text-sm text-muted-foreground">Total Duration</div>
          </div>
        </div>
      </main>
    </div>
  )
}
