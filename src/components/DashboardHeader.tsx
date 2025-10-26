'use client'

import { useAuth } from '@/hooks/useAuth'
import Image from 'next/image'

export const DashboardHeader = () => {
  const { user, userProfile } = useAuth()

  return (
    <div className="mb-8 flex flex-col md:flex-row gap-8 justify-between items-center">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Bem-vindo, {userProfile?.full_name || user?.email || ''}
        </h2>
        <p className="text-muted-foreground text-lg">Continua a tua jornada no padel com nosso programa de treino</p>
      </div>

      {userProfile?.club_avatar_url && (
        <div>
          <Image
            src={userProfile?.club_avatar_url || ''}
            alt="Clube"
            width={320}
            height={320}
            className="w-full max-h-32"
          />
        </div>
      )}
    </div>
  )
}
