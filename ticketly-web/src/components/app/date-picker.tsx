import { useState } from "react"
import { CalendarIcon } from "lucide-react"
import { ptBR } from "react-day-picker/locale"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { formatDateLong } from "@/utils"

export function DatePicker({
  id,
  value,
  onChange,
  invalid,
  placeholder = "Escolha a data",
}: {
  id?: string
  value?: Date
  onChange: (date: Date | undefined) => void
  invalid?: boolean
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            variant="outline"
            aria-invalid={invalid}
            className={cn(
              "w-full justify-start font-normal",
              !value && "text-muted-foreground"
            )}
          />
        }
      >
        <CalendarIcon data-icon="inline-start" />
        <span className="truncate first-letter:uppercase">
          {value ? formatDateLong(value) : placeholder}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          locale={ptBR}
          selected={value}
          defaultMonth={value}
          onSelect={(date) => {
            onChange(date)
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
