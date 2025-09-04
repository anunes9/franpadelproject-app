export const Stats = ({ label, value }: { label: string; value: number }) => (
  <div className="text-center p-6 bg-card rounded-lg border border-border">
    <div className="text-2xl font-bold text-primary mb-1">{value}</div>
    <div className="text-sm text-muted-foreground">{label}</div>
  </div>
)

export const StatsRow = () => {
  const stats = [
    { label: 'Módulos Completos', value: 0 },
    { label: 'Exercícios Completos', value: 0 },
    { label: 'Horas Praticadas', value: 0 },
    { label: 'Progresso Geral', value: 0 },
  ]

  return (
    <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Stats key={stat.label} label={stat.label} value={stat.value} />
      ))}
    </div>
  )
}
