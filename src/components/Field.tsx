import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

export const Field = ({
  children,
  icon,
  title,
}: {
  children: React.ReactNode
  icon?: React.ReactNode
  title: string
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center space-x-2">
        {icon}
        <span>{title}</span>
      </CardTitle>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
)
