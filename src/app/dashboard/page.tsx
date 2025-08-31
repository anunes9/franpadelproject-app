import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Dumbbell, Award, User, LogOut } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-2xl font-bold text-foreground hover:text-primary transition-colors"
              >
                Padel Academy
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/profile">
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </Link>
              </Button>
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Welcome to Your Dashboard</h2>
          <p className="text-muted-foreground text-lg">
            Continue your padel journey with our comprehensive training program
          </p>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Beginner Course Card */}
          <Link href="/dashboard/beginner-course">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group h-full">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Beginner Course</CardTitle>
                    <CardDescription>Master the fundamentals</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Complete 10 comprehensive modules covering all essential padel techniques and strategies.
                </p>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted-foreground">Progress: 3/10 modules</span>
                  <span className="text-sm font-medium text-primary">30% Complete</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 mb-4">
                  <div className="bg-primary h-2 rounded-full" style={{ width: "30%" }}></div>
                </div>
                <Button className="w-full">Continue Course</Button>
              </CardContent>
            </Card>
          </Link>

          {/* Exercises List Card */}
          <Link href="/dashboard/exercises">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group h-full">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-accent/10 rounded-lg group-hover:bg-accent/20 transition-colors">
                    <Dumbbell className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Exercises</CardTitle>
                    <CardDescription>Practice drills & workouts</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Access a comprehensive library of padel exercises, drills, and fitness routines.
                </p>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted-foreground">Available exercises</span>
                  <span className="text-sm font-medium text-accent">45+ drills</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="text-center p-2 bg-muted rounded">
                    <div className="text-lg font-semibold text-foreground">12</div>
                    <div className="text-xs text-muted-foreground">Completed</div>
                  </div>
                  <div className="text-center p-2 bg-muted rounded">
                    <div className="text-lg font-semibold text-foreground">33</div>
                    <div className="text-xs text-muted-foreground">Remaining</div>
                  </div>
                </div>
                <Button variant="outline" className="w-full bg-transparent">
                  View Exercises
                </Button>
              </CardContent>
            </Card>
          </Link>

          {/* Certification Card */}
          <Link href="/dashboard/certification">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group h-full">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-yellow-500/10 rounded-lg group-hover:bg-yellow-500/20 transition-colors">
                    <Award className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Certification</CardTitle>
                    <CardDescription>Earn your credentials</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Complete assessments and earn official padel academy certifications.
                </p>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted-foreground">Requirements</span>
                  <span className="text-sm font-medium text-yellow-600">2/3 Complete</span>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-muted-foreground">Complete beginner course</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-muted-foreground">Pass practical assessment</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-muted rounded-full"></div>
                    <span className="text-sm text-muted-foreground">Complete final exam</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full bg-transparent">
                  View Progress
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-6 bg-card rounded-lg border border-border">
            <div className="text-2xl font-bold text-primary mb-1">3</div>
            <div className="text-sm text-muted-foreground">Modules Completed</div>
          </div>
          <div className="text-center p-6 bg-card rounded-lg border border-border">
            <div className="text-2xl font-bold text-accent mb-1">12</div>
            <div className="text-sm text-muted-foreground">Exercises Done</div>
          </div>
          <div className="text-center p-6 bg-card rounded-lg border border-border">
            <div className="text-2xl font-bold text-yellow-600 mb-1">24</div>
            <div className="text-sm text-muted-foreground">Hours Practiced</div>
          </div>
          <div className="text-center p-6 bg-card rounded-lg border border-border">
            <div className="text-2xl font-bold text-green-600 mb-1">85%</div>
            <div className="text-sm text-muted-foreground">Overall Progress</div>
          </div>
        </div>
      </main>
    </div>
  )
}
