import { CheckIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { SECTOR_COLOR_PRESETS } from "@/constants"
import { cn } from "@/lib/utils"
import { getReadableTextColor } from "@/utils"

const HEX = /^#[0-9a-fA-F]{6}$/

/**
 * Cores prontas + campo para um #RRGGBB qualquer. Nada de input nativo de
 * cor: o seletor do navegador destoa do resto e muda de um sistema pra outro.
 */
export function ColorPicker({
  id,
  value,
  onChange,
  invalid,
}: {
  id?: string
  value: string
  onChange: (value: string) => void
  invalid?: boolean
}) {
  const current = value.toUpperCase()
  const valid = HEX.test(value)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {SECTOR_COLOR_PRESETS.map((color) => (
          <Button
            key={color}
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label={`Cor ${color}`}
            aria-pressed={current === color}
            className={cn(
              "rounded-full border-transparent hover:opacity-90",
              current === color &&
                "ring-2 ring-ring ring-offset-2 ring-offset-background"
            )}
            style={{
              backgroundColor: color,
              color: getReadableTextColor(color),
            }}
            onClick={() => onChange(color)}
          >
            {current === color && <CheckIcon />}
          </Button>
        ))}
      </div>

      <InputGroup>
        <InputGroupAddon>
          <span
            className="size-4 rounded-full border"
            style={{ backgroundColor: valid ? value : "transparent" }}
          />
        </InputGroupAddon>
        <InputGroupInput
          id={id}
          value={value}
          maxLength={7}
          placeholder="#7C3AED"
          aria-invalid={invalid}
          onChange={(event) => onChange(event.target.value.trim())}
        />
      </InputGroup>
    </div>
  )
}
