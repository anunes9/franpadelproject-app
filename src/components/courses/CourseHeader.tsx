import { BookOpen } from 'lucide-react'
import { Progress } from '../ui/progress'

interface CourseHeaderProps {
  modules: any[]
  level: 'Beginner' | 'Intermediate' | 'Advanced'
}

const getCourseColors = (level: 'Beginner' | 'Intermediate' | 'Advanced') => {
  switch (level) {
    case 'Beginner':
      return { bg: 'bg-green-500/10', border: 'border-green-200', text: 'text-green' }
    case 'Intermediate':
      return { bg: 'bg-orange-500/10', border: 'border-orange-200', text: 'text-orange' }
    case 'Advanced':
      return { bg: 'bg-blue-500/10', border: 'border-blue-200', text: 'text-blue' }
  }
}

const getCourseTitle = (level: 'Beginner' | 'Intermediate' | 'Advanced') => {
  switch (level) {
    case 'Beginner':
      return 'Metodologia - Iniciado'
    case 'Intermediate':
      return 'Metodologia - Intermédio'
    case 'Advanced':
      return 'Metodologia - Avançado'
  }
}

const getCourseDescription = (level: 'Beginner' | 'Intermediate' | 'Advanced') => {
  switch (level) {
    case 'Beginner':
      return 'Desenvolve os fundamentos do padel'
    case 'Intermediate':
      return 'Desenvolve técnicas avançadas e transições progressivas'
    case 'Advanced':
      return 'Desenvolve técnicas avançadas'
  }
}

export const CourseHeader = ({ modules, level }: CourseHeaderProps) => {
  const colors = getCourseColors(level)

  return (
    <div className="mb-8">
      <div className="flex items-center space-x-3 mb-4">
        <div className={`p-3 ${colors.bg} rounded-lg`}>
          <BookOpen className={`h-8 w-8 ${colors.text}-600`} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">{getCourseTitle(level)}</h1>
          <p className="text-muted-foreground text-lg">{getCourseDescription(level)}</p>
        </div>
      </div>

      <div className={`${colors.bg} border ${colors.border} rounded-lg p-6`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className={`text-lg font-semibold ${colors.text}-900`}>Progresso do Curso</h3>
            <p className={`${colors.text}-700`}>Avança através dos mesociclos</p>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${colors.text}-900`}>0%</div>
            <div className={`text-sm ${colors.text}-700`}>Completo</div>
          </div>
        </div>

        <Progress value={0} className="h-3" />

        <div className={`flex justify-between text-sm ${colors.text}-700 mt-2`}>
          <span>0 de {modules.length} mesociclos completos</span>
          <span className="font-bold">
            Próximo: {modules.length > 0 ? modules[0].title : 'Nenhum módulo disponível'}
          </span>
        </div>
      </div>
    </div>
  )
}
