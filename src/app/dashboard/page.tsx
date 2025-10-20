import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, Dumbbell, Award, Calendar } from 'lucide-react'
import Link from 'next/link'
import { StatsRow } from '@/components/Stats'
import { DashboardHeader } from '@/components/DashboardHeader'

export default function DashboardPage() {
  return (
    <>
      <DashboardHeader />

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Beginner Course Card */}
        <Link href="/dashboard/beginner">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group h-full">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Metodologia - Iniciado</CardTitle>
                  <CardDescription>Aprende os fundamentos do padel</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col justify-between h-full">
              <p className="text-muted-foreground mb-4">
                Completa 8 mesociclos abrangentes que cobrem todas as técnicas e táticas fundamentais do padel.
              </p>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted-foreground">Progresso: 0/10 mesociclos</span>
                  <span className="text-sm font-medium text-primary">0% Completo</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 mb-4">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '0%' }}></div>
                </div>

                <Button className="w-full cursor-pointer">Ver mais</Button>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Intermediate Course Card */}
        <Link href="/dashboard/intermediate">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group h-full">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-500/10 rounded-lg group-hover:bg-orange-500/20 transition-colors">
                  <BookOpen className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Metodologia - Intermédio</CardTitle>
                  <CardDescription>Desenvolve técnicas avançadas</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col justify-between h-full">
              <p className="text-muted-foreground mb-4">
                Avança para o próximo nível com mesociclos que focam em transições progressivas e técnicas avançadas.
              </p>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted-foreground">Progresso: 0/1 mesociclos</span>
                  <span className="text-sm font-medium text-orange-600">0% Completo</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 mb-4">
                  <div className="bg-orange-500 h-2 rounded-full" style={{ width: '0%' }}></div>
                </div>

                <Button className="w-full cursor-pointer bg-orange-500 hover:bg-orange-600 text-white">Ver mais</Button>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Weekly Planning Card */}
        <Link href="/dashboard/weekly-planning">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group h-full">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Planeamento Semanal</CardTitle>
                  <CardDescription>Organiza os teus treinos semanais</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col justify-between h-full">
              <p className="text-muted-foreground mb-4">
                Planeia os teus módulos de treino para cada dia da semana e mantém-te organizado.
              </p>
              <Button variant="outline" className="w-full bg-transparent cursor-pointer">
                Gerir Planeamento
              </Button>
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
                  <CardTitle className="text-xl">Exercícios</CardTitle>
                  <CardDescription>Pratica exercícios e dinâmicas</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col justify-between h-full">
              <p className="text-muted-foreground mb-4">
                Acede a uma biblioteca abrangente de exercícios e dinâmicas de padel.
              </p>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">Exercícios disponíveis</span>
                <span className="text-sm font-medium text-accent">+50 exercícios</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="text-center p-2 bg-muted rounded">
                  <div className="text-lg font-semibold text-foreground">0</div>
                  <div className="text-xs text-muted-foreground">Completos</div>
                </div>
                <div className="text-center p-2 bg-muted rounded">
                  <div className="text-lg font-semibold text-foreground">64</div>
                  <div className="text-xs text-muted-foreground">Restantes</div>
                </div>
              </div>
              <Button variant="outline" className="w-full bg-transparent cursor-pointer">
                Visualizar Exercícios
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
                  <CardTitle className="text-xl">Certificação</CardTitle>
                  <CardDescription>Ganha as tuas certificações</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col justify-between h-full">
              <p className="text-muted-foreground mb-4">
                Completa avaliações e ganha certificações oficiais da academia de padel.
              </p>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">Requisitos</span>
                <span className="text-sm font-medium text-yellow-600">0/3 Completos</span>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2">
                  {/* <div className="w-2 h-2 bg-green-500 rounded-full"></div> */}
                  <div className="w-2 h-2 bg-muted rounded-full"></div>
                  <span className="text-sm text-muted-foreground">Completa curso Iniciado</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-muted rounded-full"></div>
                  <span className="text-sm text-muted-foreground">Passa avaliação prática</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-muted rounded-full"></div>
                  <span className="text-sm text-muted-foreground">Completa exame final</span>
                </div>
              </div>
              <Button variant="outline" className="w-full bg-transparent cursor-pointer">
                Visualizar Progresso
              </Button>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Quick Stats */}
      <StatsRow />
    </>
  )
}
