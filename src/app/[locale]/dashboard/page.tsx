import { getTranslations, getLocale } from 'next-intl/server'
import { getBeginnerModules, getIntermediateModules } from '@/lib/contentful/modules-delivery'
import { getAllExercises } from '@/lib/contentful/exercises-delivery'
import {
  GraduationCap,
  Trophy,
  Dumbbell,
  Calendar,
  ArrowRight,
  CheckCircle2,
  Clock,
  Layout
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LocaleLink } from '@/components/LocaleLink'

export default async function DashboardPage() {
  const locale = await getLocale()
  const t = await getTranslations('dashboard')

  // Fetch data from Contentful
  const beginnerModules = await getBeginnerModules(locale as any)
  const intermediateModules = await getIntermediateModules(locale as any)
  const exercises = await getAllExercises(locale as any)

  const stats = [
    {
      label: t('modulesComplete'),
      value: '0',
      total: beginnerModules.length + intermediateModules.length,
      icon: <GraduationCap className="h-5 w-5 text-p-green" />,
      color: 'bg-p-green-light'
    },
    {
      label: t('exercisesComplete'),
      value: '0',
      total: exercises.length,
      icon: <Dumbbell className="h-5 w-5 text-p-blue" />,
      color: 'bg-blue-50'
    },
    {
      label: t('hoursPracticed'),
      value: '12',
      icon: <Clock className="h-5 w-5 text-orange-500" />,
      color: 'bg-orange-50'
    }
  ]

  const sections = [
    {
      id: 'beginner',
      title: t('methodologyBeginner'),
      description: t('beginnerDescription'),
      fullDescription: t('beginnerFullDescription'),
      icon: <GraduationCap className="h-8 w-8 text-white" />,
      href: '/dashboard/beginner',
      count: beginnerModules.length,
      color: 'bg-p-blue',
      badge: 'Level 1'
    },
    {
      id: 'intermediate',
      title: t('methodologyIntermediate'),
      description: t('intermediateDescription'),
      fullDescription: t('intermediateFullDescription'),
      icon: <Trophy className="h-8 w-8 text-white" />,
      href: '/dashboard/intermediate',
      count: intermediateModules.length,
      color: 'bg-p-green',
      badge: 'Level 2'
    },
    {
      id: 'planning',
      title: t('weeklyPlanning'),
      description: t('weeklyPlanningDescription'),
      fullDescription: t('weeklyPlanningFullDescription'),
      icon: <Calendar className="h-8 w-8 text-white" />,
      href: '/dashboard/weekly-planning',
      color: 'bg-slate-700',
      badge: 'Personalized'
    },
    {
      id: 'exercises',
      title: t('exercises'),
      description: t('exercisesDescription'),
      fullDescription: t('exercisesFullDescription'),
      icon: <Dumbbell className="h-8 w-8 text-white" />,
      href: '/dashboard/exercises',
      count: exercises.length,
      color: 'bg-indigo-600',
      badge: 'Library'
    }
  ]

  return (
    <div className="flex flex-col gap-8 pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-p-blue md:text-4xl">
          {t('welcome')}!
        </h1>
        <p className="text-p-blue/60 text-lg">
          {t('welcomeMessage')}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm bg-white overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-p-blue/60 mb-1">{stat.label}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-p-blue">{stat.value}</span>
                    {stat.total && (
                      <span className="text-sm text-p-blue/40">/ {stat.total}</span>
                    )}
                  </div>
                </div>
                <div className={`p-3 rounded-2xl ${stat.color} transition-transform group-hover:scale-110`}>
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Sections */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {sections.map((section) => (
          <Card key={section.id} className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all">
            <div className="flex flex-col md:flex-row h-full">
              <div className={`w-full md:w-32 lg:w-40 ${section.color} flex items-center justify-center p-6 shrink-0`}>
                {section.icon}
              </div>
              <div className="flex-1 flex flex-col p-6">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="secondary" className="bg-p-gray text-p-blue/60 hover:bg-p-gray font-semibold">
                    {section.badge}
                  </Badge>
                  {section.count !== undefined && (
                    <span className="text-xs font-bold text-p-blue/40 uppercase tracking-wider">
                      {section.count} {section.id === 'exercises' ? 'Dynamics' : 'Modules'}
                    </span>
                  )}
                </div>
                <CardHeader className="p-0 mb-2">
                  <CardTitle className="text-xl text-p-blue">{section.title}</CardTitle>
                  <CardDescription className="text-p-blue/60 line-clamp-2">
                    {section.fullDescription}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="p-0 mt-auto pt-6">
                  <LocaleLink href={section.href} className="w-full">
                    <Button className="w-full bg-p-gray text-p-blue hover:bg-p-blue hover:text-white border-none shadow-none rounded-xl font-bold py-6 transition-all group-hover:bg-p-blue group-hover:text-white">
                      {section.id === 'planning' ? t('managePlanning') : t('viewMore')}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </LocaleLink>
                </CardFooter>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Progress Card */}
      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 text-p-green mb-1">
            <Layout className="h-5 w-5" />
            <span className="text-sm font-bold uppercase tracking-wider">{t('generalProgress')}</span>
          </div>
          <CardTitle className="text-2xl text-p-blue">{t('progress')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-p-blue/60 font-medium">Certification Pathway</span>
                <span className="text-p-blue font-bold">12%</span>
              </div>
              <div className="h-3 bg-p-gray rounded-full overflow-hidden">
                <div className="h-full bg-p-green w-[12%]" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-p-gray/50">
                <CheckCircle2 className="h-5 w-5 text-p-green shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-p-blue">Beginner Level</p>
                  <p className="text-xs text-p-blue/60">0 of 8 modules complete</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-p-gray/50">
                <CheckCircle2 className="h-5 w-5 text-slate-300 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-p-blue">Intermediate Level</p>
                  <p className="text-xs text-p-blue/60">Not started</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-p-gray/50">
                <CheckCircle2 className="h-5 w-5 text-slate-300 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-p-blue">Certification</p>
                  <p className="text-xs text-p-blue/60">Requirements pending</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-p-blue p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <p className="text-p-green text-sm font-bold uppercase tracking-widest mb-1">Academy Pro</p>
            <p className="text-white font-medium">Unlock all features and get certified!</p>
          </div>
          <Button className="bg-p-green text-white hover:bg-white hover:text-p-blue border-none rounded-xl px-8 font-bold py-6">
            Get Certified
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

