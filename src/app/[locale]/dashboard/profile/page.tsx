'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Trophy, Target, Clock, Save, Globe } from 'lucide-react'
import { StatsRow } from '@/components/Stats'
import { useAuth } from '@/hooks/useAuth'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useTranslations } from 'next-intl'
import Image from 'next/image'

const recentActivity = [] as any[]
// const recentActivity = [
//   { date: '2024-01-28', activity: 'Completed Module 3: Basic Strokes', type: 'course' },
//   { date: '2024-01-27', activity: 'Finished Wall Return Practice exercise', type: 'exercise' },
//   { date: '2024-01-26', activity: 'Started Module 4: Serving Fundamentals', type: 'course' },
//   { date: '2024-01-25', activity: 'Completed Forehand Drive Drill', type: 'exercise' },
//   { date: '2024-01-24', activity: "Earned 'Exercise Enthusiast' achievement", type: 'achievement' },
// ]

const skillLevels = [
  { skill: 'Forehand', level: 75, color: 'bg-primary' },
  { skill: 'Backhand', level: 60, color: 'bg-accent' },
  { skill: 'Serving', level: 45, color: 'bg-yellow-500' },
  { skill: 'Net Play', level: 30, color: 'bg-orange-500' },
  { skill: 'Wall Play', level: 55, color: 'bg-green-500' },
  { skill: 'Court Movement', level: 70, color: 'bg-blue-500' },
]

export default function ProfilePage() {
  const { user, userProfile, loading } = useAuth()
  const t = useTranslations('profile')

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading profile...</div>
        </div>
      </>
    )
  }

  return (
    <>
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 border-b border-border -mx-8 px-8 py-8 mb-8">
        <div className="flex justify-center">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
                {userProfile?.avatar_url ? (
                  <Image src={userProfile.avatar_url} alt="User Avatar" width={64} height={64} />
                ) : (
                  <User className="h-12 w-12 text-primary" />
                )}
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {userProfile?.full_name || user?.email || 'User'}
              </h1>
              <p className="text-muted-foreground text-lg mb-2">
                {userProfile?.role === 'client'
                  ? 'Client'
                  : userProfile?.role === 'admin'
                  ? 'Administrator'
                  : userProfile?.role === 'sales'
                  ? 'Sales Representative'
                  : 'User'}
              </p>
              <div className="flex items-center space-x-4">
                <Badge variant="secondary">
                  Member since{' '}
                  {userProfile?.created_at
                    ? new Date(userProfile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                    : 'Unknown'}
                </Badge>
              </div>
            </div>
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
                <span>Informação Pessoal</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="fullName">Nome Completo</Label>
                <Input id="fullName" defaultValue={userProfile?.full_name || ''} />
              </div>
              <div>
                <Label htmlFor="email">Endereço de Email</Label>
                <Input disabled id="email" type="email" defaultValue={userProfile?.email || user?.email || ''} />
              </div>
              <div>
                <Label htmlFor="clubName">Clube</Label>
                <Input disabled id="clubName" type="text" defaultValue={userProfile?.club_name || ''} />
                {userProfile?.club_avatar_url && (
                  <Image
                    src={userProfile?.club_avatar_url || ''}
                    alt="Clube"
                    width={720}
                    height={720}
                    className="w-full"
                  />
                )}
              </div>
              <div>
                <Label htmlFor="createdAt">Membro Desde</Label>
                <Input
                  id="createdAt"
                  defaultValue={userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString() : ''}
                  disabled
                />
              </div>

              <Button className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Guardar Alterações
              </Button>
            </CardContent>
          </Card>

          {/* Language Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>Idioma / Language</span>
              </CardTitle>
              <CardDescription>Seleciona o teu idioma preferido / Select your preferred language</CardDescription>
            </CardHeader>
            <CardContent>
              <LanguageSwitcher />
            </CardContent>
          </Card>

          {/* Skill Levels */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>Avaliação de Habilidades</span>
              </CardTitle>
              <CardDescription>EM ATUALIZAÇÃO - Os teus níveis de habilidade em diferentes áreas</CardDescription>
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
                <span>Visão Geral de Progresso</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StatsRow />
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Actividade Recente</span>
              </CardTitle>
              <CardDescription>As tuas últimas actividades de aprendizagem</CardDescription>
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
        </div>
      </div>
    </>
  )
}
