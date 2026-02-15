import { Trophy, CheckCircle2, Lock, GraduationCap, Award } from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export default async function CertificationPage() {

  const certifications = [
    {
      id: 'beginner',
      title: 'Padel Fundamentals',
      level: 'Beginner',
      progress: 0,
      requirements: [
        { label: 'Complete all 8 Beginner Modules', status: 'pending' },
        { label: 'Pass all 8 Module Quizzes (min. 80%)', status: 'pending' },
        { label: 'Submit Practical Assessment Video', status: 'locked' }
      ],
      color: 'bg-p-blue',
      icon: <GraduationCap className="h-6 w-6 text-white" />
    },
    {
      id: 'intermediate',
      title: 'Advanced Tactics',
      level: 'Intermediate',
      progress: 0,
      requirements: [
        { label: 'Achieve Beginner Certification', status: 'locked' },
        { label: 'Complete all Intermediate Modules', status: 'locked' },
        { label: 'Pass all Intermediate Quizzes', status: 'locked' },
        { label: 'Pass Final Technical Exam', status: 'locked' }
      ],
      color: 'bg-p-green',
      icon: <Trophy className="h-6 w-6 text-white" />
    }
  ]

  return (
    <div className="flex flex-col gap-8 pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-p-blue md:text-4xl">
          Certifications
        </h1>
        <p className="text-p-blue/60 text-lg">
          Track your journey to becoming a certified padel professional.
        </p>
      </div>

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-2">
        {certifications.map((cert) => (
          <Card key={cert.id} className="border-none shadow-sm bg-white overflow-hidden flex flex-col">
            <div className={`${cert.color} p-8 text-white relative overflow-hidden`}>
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Award className="h-32 w-32" />
              </div>
              <div className="relative z-10 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                    {cert.icon}
                  </div>
                  <Badge className="bg-white/20 text-white border-none backdrop-blur-md px-3 py-1">
                    {cert.level}
                  </Badge>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{cert.title}</h2>
                  <p className="text-white/60 font-medium">Professional Certification</p>
                </div>
              </div>
            </div>

            <CardContent className="p-8 flex-1">
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-bold text-p-blue uppercase tracking-widest">Progress</span>
                    <span className="text-sm font-bold text-p-blue">{cert.progress}%</span>
                  </div>
                  <Progress value={cert.progress} className="h-3 bg-p-gray" />
                </div>

                <div className="space-y-4">
                  <p className="text-xs font-bold text-p-blue/40 uppercase tracking-widest">Requirements</p>
                  <div className="flex flex-col gap-3">
                    {cert.requirements.map((req, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-p-gray/50 border border-p-gray/20">
                        {req.status === 'completed' ? (
                          <CheckCircle2 className="h-5 w-5 text-p-green shrink-0" />
                        ) : req.status === 'locked' ? (
                          <Lock className="h-5 w-5 text-slate-300 shrink-0" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-slate-300 shrink-0" />
                        )}
                        <span className={cn(
                          "text-sm font-medium",
                          req.status === 'locked' ? "text-slate-400" : "text-p-blue/70"
                        )}>
                          {req.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="p-8 pt-0 mt-auto">
              <Button 
                disabled={cert.progress < 100}
                className={cn(
                  "w-full h-14 rounded-2xl font-bold text-base transition-all",
                  cert.progress === 100 
                    ? "bg-p-green text-white hover:bg-p-blue" 
                    : "bg-p-gray text-p-blue/20 cursor-not-allowed"
                )}
              >
                Claim Certificate
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Why get certified section */}
      <Card className="border-none shadow-sm bg-p-blue text-white overflow-hidden rounded-3xl">
        <div className="flex flex-col md:flex-row">
          <div className="flex-1 p-8 md:p-12">
            <h2 className="text-2xl font-bold mb-4">Why get Fran Padel certified?</h2>
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 mt-8">
              <div className="flex flex-col gap-2">
                <CheckCircle2 className="h-6 w-6 text-p-green" />
                <h3 className="font-bold">Official Recognition</h3>
                <p className="text-white/60 text-sm">Join an elite group of players and coaches certified by Fran methodology.</p>
              </div>
              <div className="flex flex-col gap-2">
                <CheckCircle2 className="h-6 w-6 text-p-green" />
                <h3 className="font-bold">Advanced Content</h3>
                <p className="text-white/60 text-sm">Unlock exclusive training materials and professional tactics.</p>
              </div>
              <div className="flex flex-col gap-2">
                <CheckCircle2 className="h-6 w-6 text-p-green" />
                <h3 className="font-bold">Career Opportunities</h3>
                <p className="text-white/60 text-sm">Use your certification to start coaching or improving your club position.</p>
              </div>
              <div className="flex flex-col gap-2">
                <CheckCircle2 className="h-6 w-6 text-p-green" />
                <h3 className="font-bold">Global Community</h3>
                <p className="text-white/60 text-sm">Connect with other certified professionals worldwide.</p>
              </div>
            </div>
          </div>
          <div className="md:w-1/3 bg-p-green p-12 flex flex-col items-center justify-center text-center gap-6">
            <Award className="h-24 w-24 text-white" />
            <p className="font-bold text-xl">Ready to start?</p>
            <Button className="bg-white text-p-blue hover:bg-p-blue hover:text-white font-bold rounded-2xl px-10 h-14 w-full">
              Get Started
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
