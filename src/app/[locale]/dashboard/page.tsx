import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, Dumbbell, Award, Calendar } from 'lucide-react'
import { LocaleLink } from '@/components/LocaleLink'
import { getTranslations } from 'next-intl/server'
import { StatsRow } from '@/components/Stats'
import { DashboardHeader } from '@/components/DashboardHeader'

export default async function DashboardPage() {
  const t = await getTranslations('dashboard')
  return (
    <>
      <DashboardHeader />

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Beginner Course Card */}
        <LocaleLink href="/dashboard/beginner">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group h-full">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">{t('methodologyBeginner')}</CardTitle>
                  <CardDescription>{t('beginnerDescription')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col justify-between h-full">
              <p className="text-muted-foreground mb-4">{t('beginnerFullDescription')}</p>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted-foreground">{t('progress')}: 0/10 mesociclos</span>
                  <span className="text-sm font-medium text-primary">0% {t('complete')}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 mb-4">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '0%' }}></div>
                </div>

                <Button className="w-full cursor-pointer">{t('viewMore')}</Button>
              </div>
            </CardContent>
          </Card>
        </LocaleLink>

        {/* Intermediate Course Card */}
        <LocaleLink href="/dashboard/intermediate">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group h-full">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-500/10 rounded-lg group-hover:bg-orange-500/20 transition-colors">
                  <BookOpen className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">{t('methodologyIntermediate')}</CardTitle>
                  <CardDescription>{t('intermediateDescription')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col justify-between h-full">
              <p className="text-muted-foreground mb-4">{t('intermediateFullDescription')}</p>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted-foreground">{t('progress')}: 0/1 mesociclos</span>
                  <span className="text-sm font-medium text-orange-600">0% {t('complete')}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 mb-4">
                  <div className="bg-orange-500 h-2 rounded-full" style={{ width: '0%' }}></div>
                </div>

                <Button className="w-full cursor-pointer bg-orange-500 hover:bg-orange-600 text-white">{t('viewMore')}</Button>
              </div>
            </CardContent>
          </Card>
        </LocaleLink>

        {/* Weekly Planning Card */}
        <LocaleLink href="/dashboard/weekly-planning">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group h-full">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">{t('weeklyPlanning')}</CardTitle>
                  <CardDescription>{t('weeklyPlanningDescription')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col justify-between h-full">
              <p className="text-muted-foreground mb-4">{t('weeklyPlanningFullDescription')}</p>
              <Button variant="outline" className="w-full bg-transparent cursor-pointer">
                {t('managePlanning')}
              </Button>
            </CardContent>
          </Card>
        </LocaleLink>

        {/* Exercises List Card */}
        <LocaleLink href="/dashboard/exercises">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group h-full">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-accent/10 rounded-lg group-hover:bg-accent/20 transition-colors">
                  <Dumbbell className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <CardTitle className="text-xl">{t('exercises')}</CardTitle>
                  <CardDescription>{t('exercisesDescription')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col justify-between h-full">
              <p className="text-muted-foreground mb-4">{t('exercisesFullDescription')}</p>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">{t('availableExercises')}</span>
                <span className="text-sm font-medium text-accent">{t('exercisesAvailable')}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="text-center p-2 bg-muted rounded">
                  <div className="text-lg font-semibold text-foreground">0</div>
                  <div className="text-xs text-muted-foreground">{t('completed')}</div>
                </div>
                <div className="text-center p-2 bg-muted rounded">
                  <div className="text-lg font-semibold text-foreground">64</div>
                  <div className="text-xs text-muted-foreground">{t('remaining')}</div>
                </div>
              </div>
              <Button variant="outline" className="w-full bg-transparent cursor-pointer">
                {t('viewExercises')}
              </Button>
            </CardContent>
          </Card>
        </LocaleLink>

        {/* Certification Card */}
        <LocaleLink href="/dashboard/certification">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group h-full">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-500/10 rounded-lg group-hover:bg-yellow-500/20 transition-colors">
                  <Award className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">{t('certification')}</CardTitle>
                  <CardDescription>{t('certificationDescription')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col justify-between h-full">
              <p className="text-muted-foreground mb-4">{t('certificationFullDescription')}</p>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">{t('requirements')}</span>
                <span className="text-sm font-medium text-yellow-600">0/3 {t('completed')}</span>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2">
                  {/* <div className="w-2 h-2 bg-green-500 rounded-full"></div> */}
                  <div className="w-2 h-2 bg-muted rounded-full"></div>
                  <span className="text-sm text-muted-foreground">{t('completeBeginnerCourse')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-muted rounded-full"></div>
                  <span className="text-sm text-muted-foreground">{t('passPracticalAssessment')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-muted rounded-full"></div>
                  <span className="text-sm text-muted-foreground">{t('completeFinalExam')}</span>
                </div>
              </div>
              <Button variant="outline" className="w-full bg-transparent cursor-pointer">
                {t('viewProgress')}
              </Button>
            </CardContent>
          </Card>
        </LocaleLink>
      </div>

      {/* Quick Stats */}
      <StatsRow />
    </>
  )
}
