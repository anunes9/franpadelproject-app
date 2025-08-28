import { IconX } from "@tabler/icons-react"
import { MesoProps } from "@/lib/types"

interface Props {
  selectedDate: Date
  mesocycles: MesoProps[]
  onSelect: (mesocycle: MesoProps) => void
  onRemove: () => void
  onClose: () => void
  hasSelection: boolean
}

export function SelectMesocycle({
  selectedDate,
  mesocycles,
  onSelect,
  onRemove,
  onClose,
  hasSelection,
}: Props) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold">
            Selecionar Mesociclo para {selectedDate.toLocaleDateString("pt-PT")}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Fechar"
          >
            <IconX size={20} />
          </button>
        </div>
        <div className="space-y-4">
          {(["Beginner", "Intermediate", "Advanced"] as const).map((level) => (
            <div key={level}>
              <h3 className="font-semibold text-lg mb-2">{level}</h3>
              <div className="grid gap-2">
                {mesocycles
                  .filter((m) => {
                    return m.level === level
                  })
                  .map((mesocycle) => (
                    <button
                      key={mesocycle.slug}
                      onClick={() => onSelect(mesocycle)}
                      className="text-left p-3 hover:bg-gray-50 rounded-lg border"
                    >
                      <div className="font-medium">{mesocycle.title}</div>
                      <div className="text-sm text-gray-600">
                        {mesocycle.concept}
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Cancelar
          </button>
          {hasSelection && (
            <button
              onClick={onRemove}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
            >
              Remover
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
