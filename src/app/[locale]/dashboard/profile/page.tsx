import { getTranslations, getLocale } from 'next-intl/server'
import { getUserProfile, getCompletionStats } from '../actions'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Mail, Building2, Calendar, GraduationCap, Dumbbell } from 'lucide-react'
import Image from 'next/image'
import { getBeginnerModules, getIntermediateModules } from '@/lib/contentful/modules-delivery'
import { getAllExercises } from '@/lib/contentful/exercises-delivery'

export default async function ProfilePage() {
  const locale = await getLocale()
  const t = await getTranslations('profile')
  const tDashboard = await getTranslations('dashboard')
  
  const profile = await getUserProfile()

  if (!profile) {
    redirect('/dashboard')
  }

  // Get completion stats
  const { modulesCompleted, exercisesCompleted } = await getCompletionStats()
  
  // Get total counts for progress display
  const beginnerModules = await getBeginnerModules(locale as any)
  const intermediateModules = await getIntermediateModules(locale as any)
  const exercises = await getAllExercises(locale as any)
  
  const totalModules = beginnerModules.length + intermediateModules.length
  const totalExercises = exercises.length


  return (
    <div className="flex flex-col gap-8 pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-p-blue md:text-4xl">
          {t('profile')}
        </h1>
        <p className="text-p-blue/60 text-lg">
          {t('viewAndManage')}
        </p>
      </div>

      {/* Profile Card */}
      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl text-p-blue">{t('accountInformation')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Image and Basic Info */}
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="relative">
              {profile.avatar_url ? (
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-p-gray">
                  <Image
                    src={profile.avatar_url}
                    alt={profile.full_name || 'Profile picture'}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-p-blue flex items-center justify-center border-4 border-p-gray">
                  <User className="h-12 w-12 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-p-blue mb-2">
                {profile.full_name || t('noNameSet')}
              </h2>
              <p className="text-sm text-p-blue/60">{profile.email}</p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {/* Email */}
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-p-gray/50">
              <div className="p-2 bg-p-blue/10 rounded-xl">
                <Mail className="h-5 w-5 text-p-blue" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-p-blue/40 uppercase tracking-widest mb-1">
                  {t('emailAddress')}
                </p>
                <p className="text-sm font-medium text-p-blue">{profile.email}</p>
              </div>
            </div>

            {/* Club */}
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-p-gray/50">
              <div className="p-2 bg-p-green/10 rounded-xl">
                <Building2 className="h-5 w-5 text-p-green" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-p-blue/40 uppercase tracking-widest mb-1">
                  {t('club')}
                </p>
                {profile.club_name ? (
                  <div className="flex items-center gap-2">
                    {profile.club_avatar_url && (
                      <div className="relative w-6 h-6 rounded overflow-hidden">
                        <Image
                          src={profile.club_avatar_url}
                          alt={profile.club_name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <p className="text-sm font-medium text-p-blue">{profile.club_name}</p>
                  </div>
                ) : (
                  <p className="text-sm text-p-blue/60 italic">{t('noClubAssigned')}</p>
                )}
              </div>
            </div>

            {/* Modules Completed */}
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-p-gray/50">
              <div className="p-2 bg-p-green/10 rounded-xl">
                <GraduationCap className="h-5 w-5 text-p-green" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-p-blue/40 uppercase tracking-widest mb-1">
                  {tDashboard('modulesComplete')}
                </p>
                <p className="text-sm font-medium text-p-blue">
                  {modulesCompleted} / {totalModules}
                </p>
              </div>
            </div>

            {/* Exercises Completed */}
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-p-gray/50">
              <div className="p-2 bg-p-blue/10 rounded-xl">
                <Dumbbell className="h-5 w-5 text-p-blue" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-p-blue/40 uppercase tracking-widest mb-1">
                  {tDashboard('exercisesComplete')}
                </p>
                <p className="text-sm font-medium text-p-blue">
                  {exercisesCompleted} / {totalExercises}
                </p>
              </div>
            </div>

            {/* Member Since */}
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-p-gray/50">
              <div className="p-2 bg-purple-100 rounded-xl">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-p-blue/40 uppercase tracking-widest mb-1">
                  {t('memberSince')}
                </p>
                <p className="text-sm font-medium text-p-blue">
                  {profile.created_at 
                    ? new Date(profile.created_at).toLocaleDateString(locale === 'pt' ? 'pt-PT' : 'en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
