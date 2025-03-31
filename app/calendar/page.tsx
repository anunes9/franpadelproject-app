import { Calendar } from "@/components/calendar/Calendar"
import { getAllMesos } from "@/lib/cms"

export default async function Page() {
  const { items: mesocycles } = await getAllMesos()
  return <Calendar initialMesocycles={mesocycles} />
}
