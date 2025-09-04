import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, User, Trophy, Target, Clock, Edit, Save, Camera } from 'lucide-react'
import Link from 'next/link'

const userStats = [
  { label: 'Modules Completed', value: '3/10', color: 'text-primary' },
  { label: 'Exercises Done', value: '12', color: 'text-accent' },
  { label: 'Hours Practiced', value: '24', color: 'text-yellow-600' },
  { label: 'Overall Progress', value: '85%', color: 'text-green-600' },
]

const recentActivity = [
  { date: '2024-01-28', activity: 'Completed Module 3: Basic Strokes', type: 'course' },
  { date: '2024-01-27', activity: 'Finished Wall Return Practice exercise', type: 'exercise' },
  { date: '2024-01-26', activity: 'Started Module 4: Serving Fundamentals', type: 'course' },
  { date: '2024-01-25', activity: 'Completed Forehand Drive Drill', type: 'exercise' },
  { date: '2024-01-24', activity: "Earned 'Exercise Enthusiast' achievement", type: 'achievement' },
]

const skillLevels = [
  { skill: 'Forehand', level: 75, color: 'bg-primary' },
  { skill: 'Backhand', level: 60, color: 'bg-accent' },
  { skill: 'Serving', level: 45, color: 'bg-yellow-500' },
  { skill: 'Net Play', level: 30, color: 'bg-orange-500' },
  { skill: 'Wall Play', level: 55, color: 'bg-green-500' },
  { skill: 'Court Movement', level: 70, color: 'bg-blue-500' },
]

export default function ProfilePage() {
  return (
    <>
      {/* Back Navigation */}
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Profile Header */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 border-b border-border -mx-8 px-8 py-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center">
                <User className="h-12 w-12 text-primary" />
              </div>
              <Button size="sm" className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0">
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Alex Rodriguez</h1>
              <p className="text-muted-foreground text-lg mb-2">Beginner Player</p>
              <div className="flex items-center space-x-4">
                <Badge variant="secondary">Member since Jan 2024</Badge>
                <Badge variant="outline">Level 1</Badge>
              </div>
            </div>
          </div>
          <div className="mt-6 md:mt-0">
            <Button className="flex items-center space-x-2">
              <Edit className="h-4 w-4" />
              <span>Edit Profile</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Personal Info & Settings */}
        <div className="lg:col-span-1 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Personal Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" defaultValue="Alex Rodriguez" />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="alex.rodriguez@email.com" />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" defaultValue="+1 (555) 123-4567" />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input id="location" defaultValue="Miami, FL" />
              </div>
              <div>
                <Label htmlFor="birthDate">Date of Birth</Label>
                <Input id="birthDate" type="date" defaultValue="1990-05-15" />
              </div>
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about your padel journey..."
                  defaultValue="Passionate about padel and eager to improve my game. Started playing 6 months ago and loving every minute of it!"
                />
              </div>
              <Button className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </CardContent>
          </Card>

          {/* Skill Levels */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>Skill Assessment</span>
              </CardTitle>
              <CardDescription>Your current skill levels across different areas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {skillLevels.map((skill) => (
                  <div key={skill.skill}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-foreground">{skill.skill}</span>
                      <span className="text-sm text-muted-foreground">{skill.level}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className={`h-2 rounded-full ${skill.color}`} style={{ width: `${skill.level}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Stats & Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="h-5 w-5" />
                <span>Progress Overview</span>
              </CardTitle>
              <CardDescription>Your learning journey at a glance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {userStats.map((stat, index) => (
                  <div key={index} className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className={`text-2xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Recent Activity</span>
              </CardTitle>
              <CardDescription>Your latest learning activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div
                      className={`p-2 rounded-full ${
                        item.type === 'course'
                          ? 'bg-primary/10 text-primary'
                          : item.type === 'exercise'
                          ? 'bg-accent/10 text-accent'
                          : 'bg-yellow-100 text-yellow-600'
                      }`}
                    >
                      {item.type === 'course' ? (
                        <Target className="h-4 w-4" />
                      ) : item.type === 'exercise' ? (
                        <Clock className="h-4 w-4" />
                      ) : (
                        <Trophy className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{item.activity}</p>
                      <p className="text-xs text-muted-foreground">{item.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Goals & Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Goals & Preferences</CardTitle>
              <CardDescription>Customize your learning experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="goal">Primary Goal</Label>
                <Input id="goal" defaultValue="Complete beginner course and earn certification" />
              </div>
              <div>
                <Label htmlFor="practiceTime">Preferred Practice Time</Label>
                <Input id="practiceTime" defaultValue="30 minutes per day" />
              </div>
              <div>
                <Label htmlFor="playingLevel">Target Playing Level</Label>
                <Input id="playingLevel" defaultValue="Intermediate recreational player" />
              </div>
              <Button variant="outline" className="w-full bg-transparent">
                Update Preferences
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
