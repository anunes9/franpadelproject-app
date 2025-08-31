import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Play, Clock, BookOpen, Award } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

const modules = [
  {
    id: 1,
    title: "Introduction to Padel",
    description: "Learn the basics of padel, court dimensions, and equipment",
    duration: "15 min",
    status: "completed",
    topics: ["Court layout", "Equipment overview", "Basic rules"],
    content: {
      overview:
        "Welcome to the world of padel! This module introduces you to the fundamentals of this exciting racquet sport that combines elements of tennis and squash.",
      sections: [
        {
          title: "What is Padel?",
          content:
            "Padel is a racquet sport played in doubles on an enclosed court roughly one-third the size of a tennis court. The court is surrounded by walls of glass and metallic mesh, which players can use during play.",
        },
        {
          title: "Court Dimensions",
          content:
            "A padel court measures 20m x 10m and is divided by a net. The court is enclosed by walls: 3-4m high at the back and 3m high at the sides.",
        },
        {
          title: "Essential Equipment",
          content:
            "You'll need a padel racquet (solid, perforated), padel balls (similar to tennis balls but with less pressure), and appropriate court shoes.",
        },
      ],
    },
  },
  {
    id: 4,
    title: "Serving Fundamentals",
    description: "Develop consistent and effective serving technique",
    duration: "18 min",
    status: "in-progress",
    topics: ["Service motion", "Ball placement", "Service variations"],
    content: {
      overview:
        "Master the art of serving in padel. A good serve sets the tone for the entire point and gives you a strategic advantage.",
      sections: [
        {
          title: "Service Rules",
          content:
            "In padel, you must serve underhand, bouncing the ball once before hitting it. The ball must land in the opponent's service box and can hit the side wall after bouncing.",
        },
        {
          title: "Service Motion",
          content:
            "Start with feet behind the service line, drop the ball and hit it below waist level with an upward motion. Follow through towards your target.",
        },
        {
          title: "Strategic Placement",
          content:
            "Vary your serves between the center and wide angles. Use different speeds and spins to keep opponents guessing.",
        },
      ],
    },
  },
]

const quizQuestions = [
  {
    id: 1,
    question: "What are the dimensions of a standard padel court?",
    options: ["20m x 10m", "18m x 9m", "23m x 11m", "21m x 10.5m"],
    correct: 0,
  },
  {
    id: 2,
    question: "How high are the back walls in a padel court?",
    options: ["2-3 meters", "3-4 meters", "4-5 meters", "5-6 meters"],
    correct: 1,
  },
  {
    id: 3,
    question: "What type of serve is required in padel?",
    options: ["Overhand", "Underhand", "Side-arm", "Any style"],
    correct: 1,
  },
  {
    id: 4,
    question: "Can you use the walls during play in padel?",
    options: ["No, never", "Only defensive shots", "Yes, strategically", "Only on serves"],
    correct: 2,
  },
  {
    id: 5,
    question: "What is the maximum number of players on a padel court?",
    options: ["2 players", "3 players", "4 players", "6 players"],
    correct: 2,
  },
  {
    id: 6,
    question: "How does a padel ball differ from a tennis ball?",
    options: ["Same pressure", "Higher pressure", "Lower pressure", "Different material"],
    correct: 2,
  },
  {
    id: 7,
    question: "What grip is most commonly used in padel?",
    options: ["Eastern grip", "Western grip", "Continental grip", "Semi-western grip"],
    correct: 2,
  },
  {
    id: 8,
    question: "Can the ball hit the net during play?",
    options: ["Yes, always allowed", "No, never allowed", "Only on serves", "Only if it goes over"],
    correct: 1,
  },
  {
    id: 9,
    question: "What happens if the ball hits the opponent's wall before bouncing?",
    options: ["Point continues", "Point lost", "Replay point", "Depends on situation"],
    correct: 1,
  },
  {
    id: 10,
    question: "How many serves do you get per point in padel?",
    options: ["One serve", "Two serves", "Three serves", "Unlimited"],
    correct: 1,
  },
]

export default function ModuleViewPage({ params }: { params: { moduleId: string } }) {
  const moduleId = Number.parseInt(params.moduleId)
  const module = modules.find((m) => m.id === moduleId)

  if (!module) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link
              href="/dashboard/beginner-course"
              className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Course</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Module Header */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start space-x-4">
            <div className="p-3 rounded-lg bg-primary/10 text-primary">
              <BookOpen className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-2xl font-bold text-foreground">Module {module.id}</h1>
                <Badge variant={module.status === "completed" ? "default" : "secondary"}>
                  {module.status === "completed" ? "Completed" : "In Progress"}
                </Badge>
              </div>
              <h2 className="text-xl text-foreground mb-2">{module.title}</h2>
              <p className="text-muted-foreground mb-4">{module.description}</p>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{module.duration}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {module.topics.map((topic, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Module Content */}
        <div className="space-y-8">
          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Play className="h-5 w-5 text-primary" />
                <span>Module Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">{module.content.overview}</p>
            </CardContent>
          </Card>

          {/* Content Sections */}
          {module.content.sections.map((section, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg">{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{section.content}</p>
              </CardContent>
            </Card>
          ))}

          {/* Quiz Section */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-primary" />
                <span>Module Quiz</span>
              </CardTitle>
              <CardDescription>
                Complete this 10-question quiz to test your knowledge and earn your certificate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {quizQuestions.map((question, index) => (
                  <div key={question.id} className="space-y-3">
                    <h4 className="font-medium text-foreground">
                      {index + 1}. {question.question}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {question.options.map((option, optionIndex) => (
                        <label
                          key={optionIndex}
                          className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                        >
                          <input
                            type="radio"
                            name={`question-${question.id}`}
                            value={optionIndex}
                            className="text-primary focus:ring-primary"
                          />
                          <span className="text-sm">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="pt-6 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">Complete all questions to submit your quiz</div>
                    <Button className="px-8">Submit Quiz</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between pt-8">
            <Button variant="outline" asChild>
              <Link href="/dashboard/beginner-course">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Course
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/beginner-course">
                Continue Course
                <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
