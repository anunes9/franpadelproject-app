import { CheckCircle, Lock, Play } from 'lucide-react'

export const getStatusText = (status: string) => {
  switch (status) {
    case 'completed':
      return 'Completo'
    case 'in-progress':
      return 'Continuar'
    case 'locked':
      return 'Bloqueado'
    default:
      return 'Iniciar'
  }
}

export const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-5 w-5" />
    case 'in-progress':
      return <Play className="h-5 w-5" />
    case 'locked':
      return <Lock className="h-5 w-5" />
    default:
      return <Play className="h-5 w-5" />
  }
}

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-600'
    case 'in_progress':
      return 'bg-blue-100 text-blue-600'
    case 'available':
      return 'bg-orange-100 text-orange-600'
    case 'locked':
      return 'bg-gray-100 text-gray-400'
    default:
      return 'bg-orange-100 text-orange-600'
  }
}
