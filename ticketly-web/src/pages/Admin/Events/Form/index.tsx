import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  ArmchairIcon,
  ArrowLeftIcon,
  BanIcon,
  CalendarClockIcon,
  InfoIcon,
  LayersIcon,
  MapPinIcon,
  MicVocalIcon,
  PlusIcon,
  SaveIcon,
  TriangleAlertIcon,
} from "lucide-react"
import {
  Controller,
  FormProvider,
  useFieldArray,
  useForm,
  useWatch,
  type Control,
} from "react-hook-form"
import { Link, useNavigate, useParams } from "react-router-dom"

import { ArtistForm } from "@/components/app/artist-form"
import { ConfirmDialog } from "@/components/app/confirm-dialog"
import { EventStatusBadge } from "@/components/app/event-status-badge"
import { ListError } from "@/components/app/list-states"
import { PageHeader } from "@/components/app/page-header"
import { DatePicker } from "@/components/app/date-picker"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { EVENT_EDITABLE_STATUS_LABELS } from "@/constants"
import { useArtists } from "@/hooks/use-artists"
import { useEvents } from "@/hooks/use-events"
import { useSectors } from "@/hooks/use-sectors"
import type { IEvent } from "@/interfaces"
import {
  emptyArtistForm,
  eventSchema,
  eventToForm,
  formToArtistPayload,
  formToEventPayload,
  formToEventUpdatePayload,
  newEventForm,
  newLineupItem,
  newStage,
  type ArtistFormOutput,
  type EventFormData,
  type EventFormOutput,
} from "@/schemas"
import { formatDateLong, handleError, handleSuccess } from "@/utils"
import { LineupItem } from "./components/lineup-item"
import { StageItem } from "./components/stage-item"

export function EventFormPage() {
  const { id } = useParams()
  const { selectedEvent, selectEvent } = useEvents()
  const [loadError, setLoadError] = useState(false)
  const isEdit = !!id

  // Veio da lista: o provider já tem o show e não faz requisição
  useEffect(() => {
    if (!id) return

    selectEvent(id)
      .then(() => setLoadError(false))
      .catch(() => setLoadError(true))
  }, [id, selectEvent])

  const event = isEdit && selectedEvent?.id === id ? selectedEvent : null

  const header = (
    <PageHeader
      title={isEdit ? (event?.name ?? "Editar show") : "Novo show"}
      description={
        isEdit
          ? event?.status === "CANCELLED"
            ? "Show cancelado: não pode mais ser alterado."
            : "Atualize as informações, os palcos e o lineup do show."
          : "Preencha os dados, os palcos e monte o lineup."
      }
      actions={
        <>
          <Button
            variant="ghost"
            nativeButton={false}
            render={<Link to="/admin/shows" />}
          >
            <ArrowLeftIcon data-icon="inline-start" />
            Voltar
          </Button>
          {isEdit && (
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link to={`/admin/shows/${id}/setores`} />}
            >
              <ArmchairIcon data-icon="inline-start" />
              Setores e assentos
            </Button>
          )}
        </>
      }
    />
  )

  if (isEdit && loadError) {
    return (
      <>
        {header}
        <ListError
          onRetry={() =>
            id &&
            selectEvent(id)
              .then(() => setLoadError(false))
              .catch(() => setLoadError(true))
          }
        />
      </>
    )
  }

  if (isEdit && !event) {
    return (
      <>
        {header}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="flex flex-col gap-6">
            <Skeleton className="h-56 rounded-4xl" />
            <Skeleton className="h-80 rounded-4xl" />
          </div>
          <Skeleton className="h-72 rounded-4xl" />
        </div>
      </>
    )
  }

  return (
    <>
      {header}
      <EventForm
        key={event ? `${event.id}-${event.status}` : "new"}
        event={event}
      />
    </>
  )
}

function EventForm({ event }: { event: IEvent | null }) {
  const { createEvent, updateEvent, cancelEvent } = useEvents()
  const { createArtist } = useArtists()
  const { sectors, sectorsEventId, sectorsLoading, loadSectors } = useSectors()
  const navigate = useNavigate()

  const isEdit = !!event
  const eventId = event?.id
  const readOnly = event?.status === "CANCELLED"

  const [artistDialogIndex, setArtistDialogIndex] = useState<number | null>(
    null
  )
  const [stageToRemove, setStageToRemove] = useState<{
    index: number
    name: string
    usage: number
  } | null>(null)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [defaultValues] = useState(() =>
    event ? eventToForm(event) : newEventForm()
  )

  const form = useForm<EventFormData, unknown, EventFormOutput>({
    resolver: zodResolver(eventSchema),
    defaultValues,
  })

  const {
    control,
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors, isSubmitting },
  } = form

  const {
    fields: stageFields,
    append: appendStage,
    remove: removeStage,
    move: moveStage,
  } = useFieldArray({ control, name: "stages" })

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "lineup",
  })

  // Só pra saber se dá pra publicar; se falhar, a API continua barrando
  useEffect(() => {
    if (!eventId) return

    loadSectors(eventId).catch(() => undefined)
  }, [eventId, loadSectors])

  const eventSectors = eventId && sectorsEventId === eventId ? sectors : null
  const availableSeats =
    eventSectors?.reduce(
      (sum, sector) => sum + sector.seatCounts.AVAILABLE,
      0
    ) ?? null

  const onSubmit = async (data: EventFormOutput) => {
    try {
      if (event) {
        await updateEvent(event.id, formToEventUpdatePayload(data))
        handleSuccess("Show atualizado")
        navigate("/admin/shows")
        return
      }

      const created = await createEvent(formToEventPayload(data))
      handleSuccess("Show criado. Agora cadastre os setores e os assentos.")
      navigate(`/admin/shows/${created.id}/setores`)
    } catch (err) {
      handleError(err, "Não foi possível salvar o show")
    }
  }

  const saveNewArtist = async (data: ArtistFormOutput) => {
    if (artistDialogIndex === null) return

    const path = `lineup.${artistDialogIndex}` as const

    try {
      const artist = await createArtist(formToArtistPayload(data))

      setValue(`${path}.artistName`, artist.name)
      setValue(`${path}.artistImageUrl`, artist.imageUrl)
      setValue(`${path}.artistId`, artist.id, { shouldValidate: true })
      setArtistDialogIndex(null)
      handleSuccess(`${artist.name} foi cadastrado`)
    } catch (err) {
      handleError(err, "Não foi possível cadastrar o artista")
    }
  }

  const requestRemoveStage = (index: number) => {
    const stage = getValues(`stages.${index}`)
    const usage = getValues("lineup").filter(
      (item) => item.stageId === stage.id
    ).length

    if (usage === 0) {
      removeStage(index)
      return
    }

    setStageToRemove({
      index,
      name: stage.name.trim() || `Palco ${index + 1}`,
      usage,
    })
  }

  // O palco some e quem estava nele fica sem palco, marcado pra escolher outro
  const confirmRemoveStage = async () => {
    if (!stageToRemove) return

    const stageId = getValues(`stages.${stageToRemove.index}.id`)

    removeStage(stageToRemove.index)

    getValues("lineup").forEach((item, index) => {
      if (item.stageId === stageId) {
        setValue(`lineup.${index}.stageId`, "", { shouldValidate: true })
      }
    })
  }

  const handleCancelEvent = async () => {
    if (!event) return

    try {
      await cancelEvent(event.id)
      handleSuccess(`${event.name} foi cancelado`)
    } catch (err) {
      handleError(err, "Não foi possível cancelar o show")
      throw err
    }
  }

  const lineupError = errors.lineup?.root?.message ?? errors.lineup?.message
  const stagesError = errors.stages?.root?.message ?? errors.stages?.message

  return (
    <FormProvider {...form}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]"
      >
        <fieldset
          disabled={readOnly}
          className="m-0 flex min-w-0 flex-col gap-6 border-0 p-0"
        >
          <Card>
            <CardHeader>
              <CardTitle>Informações</CardTitle>
              <CardDescription>
                Nome do show e onde ele acontece.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup className="gap-5">
                <Field data-invalid={!!errors.name}>
                  <FieldLabel htmlFor="event-name">Nome do show</FieldLabel>
                  <Input
                    id="event-name"
                    placeholder="Anitta - Turnê Funk Generation"
                    aria-invalid={!!errors.name}
                    {...register("name")}
                  />
                  <FieldError errors={[errors.name]} />
                </Field>

                <Field data-invalid={!!errors.venue}>
                  <FieldLabel htmlFor="event-venue">Local</FieldLabel>
                  <InputGroup>
                    <InputGroupAddon>
                      <MapPinIcon />
                    </InputGroupAddon>
                    <InputGroupInput
                      id="event-venue"
                      placeholder="Allianz Parque"
                      aria-invalid={!!errors.venue}
                      {...register("venue")}
                    />
                  </InputGroup>
                  <FieldError errors={[errors.venue]} />
                </Field>

                <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_9rem]">
                  <Field data-invalid={!!errors.date}>
                    <FieldLabel htmlFor="event-date">Data</FieldLabel>
                    <Controller
                      control={control}
                      name="date"
                      render={({ field }) => (
                        <DatePicker
                          id="event-date"
                          value={field.value}
                          onChange={field.onChange}
                          invalid={!!errors.date}
                        />
                      )}
                    />
                    <FieldError errors={[errors.date]} />
                  </Field>

                  <Field data-invalid={!!errors.time}>
                    <FieldLabel htmlFor="event-time">Abertura</FieldLabel>
                    <Input
                      id="event-time"
                      type="time"
                      aria-invalid={!!errors.time}
                      {...register("time")}
                    />
                    <FieldError errors={[errors.time]} />
                  </Field>
                </div>
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Palcos</CardTitle>
              <CardDescription>
                Onde as apresentações acontecem. A ordem da lista é a ordem de
                exibição.
              </CardDescription>
              <CardAction>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendStage(newStage())}
                >
                  <PlusIcon data-icon="inline-start" />
                  Palco
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {stageFields.length === 0 && (
                <Empty className="border border-dashed py-10">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <LayersIcon />
                    </EmptyMedia>
                    <EmptyTitle>Nenhum palco</EmptyTitle>
                    <EmptyDescription>
                      O lineup precisa de ao menos um palco para apontar.
                    </EmptyDescription>
                  </EmptyHeader>
                  <Button type="button" onClick={() => appendStage(newStage())}>
                    <PlusIcon data-icon="inline-start" />
                    Adicionar palco
                  </Button>
                </Empty>
              )}

              {stageFields.map((field, index) => (
                <StageItem
                  key={field.id}
                  index={index}
                  total={stageFields.length}
                  onMove={moveStage}
                  onRemove={requestRemoveStage}
                />
              ))}

              <FieldError>{stagesError}</FieldError>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lineup</CardTitle>
              <CardDescription>
                A ordem da lista é a ordem de apresentação. Horários antes da
                abertura contam como madrugada do dia seguinte.
              </CardDescription>
              {fields.length > 0 && (
                <CardAction>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      append(newLineupItem(getValues("stages.0.id") ?? ""))
                    }
                  >
                    <PlusIcon data-icon="inline-start" />
                    Artista
                  </Button>
                </CardAction>
              )}
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {fields.length === 0 ? (
                <Empty className="border border-dashed py-10">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <MicVocalIcon />
                    </EmptyMedia>
                    <EmptyTitle>Lineup vazio</EmptyTitle>
                    <EmptyDescription>
                      Adicione quem vai se apresentar. Dá pra escolher um
                      artista cadastrado ou cadastrar um novo aqui mesmo.
                    </EmptyDescription>
                  </EmptyHeader>
                  <Button
                    type="button"
                    onClick={() =>
                      append(newLineupItem(getValues("stages.0.id") ?? ""))
                    }
                  >
                    <PlusIcon data-icon="inline-start" />
                    Adicionar artista
                  </Button>
                </Empty>
              ) : (
                fields.map((field, index) => (
                  <LineupItem
                    key={field.id}
                    index={index}
                    total={fields.length}
                    onMove={move}
                    onRemove={remove}
                    onCreateArtist={setArtistDialogIndex}
                  />
                ))
              )}

              <FieldError>{lineupError}</FieldError>
            </CardContent>
          </Card>
        </fieldset>

        <div className="flex flex-col gap-6 lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle>Publicação</CardTitle>
              <CardDescription>
                Só shows publicados aparecem na loja.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              {readOnly ? (
                <Alert variant="destructive">
                  <BanIcon />
                  <AlertTitle>Show cancelado</AlertTitle>
                  <AlertDescription>
                    Um show cancelado não pode ser alterado nem voltar para a
                    loja.
                  </AlertDescription>
                </Alert>
              ) : event ? (
                <Field>
                  <FieldLabel htmlFor="event-status">Status</FieldLabel>
                  <Controller
                    control={control}
                    name="status"
                    render={({ field }) => (
                      <Select
                        items={EVENT_EDITABLE_STATUS_LABELS}
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger id="event-status" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent alignItemWithTrigger={false}>
                          {Object.entries(EVENT_EDITABLE_STATUS_LABELS).map(
                            ([value, label]) => (
                              <SelectItem
                                key={value}
                                value={value}
                                disabled={
                                  value === "PUBLISHED" &&
                                  availableSeats === 0 &&
                                  event.status !== "PUBLISHED"
                                }
                              >
                                {label}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FieldDescription>
                    Rascunho fica visível só aqui no painel.
                  </FieldDescription>
                </Field>
              ) : (
                <p className="text-sm text-muted-foreground">
                  O show é criado como rascunho. Depois de cadastrar os setores
                  e gerar os assentos, publique pela edição.
                </p>
              )}

              <Separator />
              <EventSummary control={control} cancelled={readOnly} />
            </CardContent>
          </Card>

          {event && !readOnly && (
            <Card>
              <CardHeader>
                <CardTitle>Setores e assentos</CardTitle>
                <CardDescription>
                  Para publicar, o show precisa de ao menos um ingresso
                  disponível.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {sectorsLoading && !eventSectors ? (
                  <Skeleton className="h-10 rounded-2xl" />
                ) : eventSectors ? (
                  <p className="text-sm">
                    <span className="font-medium">
                      {eventSectors.length} setor
                      {eventSectors.length === 1 ? "" : "es"}
                    </span>{" "}
                    <span className="text-muted-foreground">
                      · {availableSeats} ingresso
                      {availableSeats === 1 ? "" : "s"} disponíve
                      {availableSeats === 1 ? "l" : "is"}
                    </span>
                  </p>
                ) : null}

                {availableSeats === 0 && event.status !== "PUBLISHED" && (
                  <Alert>
                    <TriangleAlertIcon />
                    <AlertDescription>
                      Ainda não dá para publicar: nenhum ingresso disponível.
                      Cadastre um setor e gere os assentos.
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  type="button"
                  variant="outline"
                  nativeButton={false}
                  render={<Link to={`/admin/shows/${event.id}/setores`} />}
                >
                  <ArmchairIcon data-icon="inline-start" />
                  Gerenciar setores e assentos
                </Button>
              </CardContent>
            </Card>
          )}

          {!isEdit && (
            <Alert>
              <InfoIcon />
              <AlertDescription>
                Setores e assentos são configurados logo depois que o show for
                criado.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-2">
            {!readOnly && (
              <Button type="submit" size="lg" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <SaveIcon data-icon="inline-start" />
                )}
                {isEdit ? "Salvar alterações" : "Criar show"}
              </Button>
            )}
            <Button
              variant="ghost"
              nativeButton={false}
              render={<Link to="/admin/shows" />}
            >
              {readOnly ? "Voltar" : "Cancelar"}
            </Button>
          </div>

          {event && !readOnly && (
            <Button
              type="button"
              variant="outline"
              className="text-destructive"
              onClick={() => setCancelOpen(true)}
            >
              <BanIcon data-icon="inline-start" />
              Cancelar show
            </Button>
          )}
        </div>
      </form>

      <Dialog
        open={artistDialogIndex !== null}
        onOpenChange={(open) => !open && setArtistDialogIndex(null)}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cadastrar artista</DialogTitle>
            <DialogDescription>
              O artista é cadastrado assim que você concluir aqui, mesmo que o
              show não chegue a ser salvo. Ele fica na lista de artistas.
            </DialogDescription>
          </DialogHeader>
          {artistDialogIndex !== null && (
            <ArtistForm
              key={artistDialogIndex}
              variant="dialog"
              defaultValues={emptyArtistForm}
              onSubmit={saveNewArtist}
              renderActions={({ isSubmitting: saving }) => (
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={saving}
                    onClick={() => setArtistDialogIndex(null)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving && <Spinner data-icon="inline-start" />}
                    Cadastrar e adicionar
                  </Button>
                </DialogFooter>
              )}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!stageToRemove}
        onOpenChange={(open) => !open && setStageToRemove(null)}
        title={`Remover ${stageToRemove?.name ?? "palco"}?`}
        description={
          stageToRemove
            ? `${stageToRemove.usage} apresentação${stageToRemove.usage === 1 ? "" : "ões"} do lineup ${stageToRemove.usage === 1 ? "usa" : "usam"} este palco. Se remover, ${stageToRemove.usage === 1 ? "ela fica" : "elas ficam"} sem palco e você precisa escolher outro antes de salvar.`
            : ""
        }
        confirmLabel="Remover palco"
        cancelLabel="Manter palco"
        onConfirm={confirmRemoveStage}
      />

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title={`Cancelar ${event?.name ?? "o show"}?`}
        description="O show sai da loja e não pode mais ser alterado nem voltar a ser publicado. Só é possível cancelar se não houver ingresso reservado ou vendido. Alterações não salvas deste formulário serão perdidas."
        confirmLabel="Cancelar show"
        cancelLabel="Voltar"
        onConfirm={handleCancelEvent}
      />
    </FormProvider>
  )
}

function EventSummary({
  control,
  cancelled,
}: {
  control: Control<EventFormData>
  cancelled: boolean
}) {
  const [date, time, status, stages, lineup] = useWatch({
    control,
    name: ["date", "time", "status", "stages", "lineup"],
  })

  const confirmed = lineup?.filter((item) => item.status === "CONFIRMED") ?? []

  return (
    <dl className="flex flex-col gap-3 text-sm">
      <div className="flex items-center justify-between gap-2">
        <dt className="text-muted-foreground">Status</dt>
        <dd>
          <EventStatusBadge
            status={cancelled ? "CANCELLED" : (status ?? "DRAFT")}
          />
        </dd>
      </div>
      <div className="flex items-start justify-between gap-2">
        <dt className="flex items-center gap-1.5 text-muted-foreground">
          <CalendarClockIcon className="size-4" />
          Quando
        </dt>
        <dd className="text-right first-letter:uppercase">
          {date ? `${formatDateLong(date)}, ${time || "--:--"}` : "—"}
        </dd>
      </div>
      <div className="flex items-center justify-between gap-2">
        <dt className="flex items-center gap-1.5 text-muted-foreground">
          <LayersIcon className="size-4" />
          Palcos
        </dt>
        <dd>{stages?.length ?? 0}</dd>
      </div>
      <div className="flex items-center justify-between gap-2">
        <dt className="flex items-center gap-1.5 text-muted-foreground">
          <MicVocalIcon className="size-4" />
          Artistas
        </dt>
        <dd>
          {confirmed.length} confirmado{confirmed.length === 1 ? "" : "s"}
          {lineup &&
            lineup.length > confirmed.length &&
            ` · ${lineup.length - confirmed.length} cancelado${lineup.length - confirmed.length === 1 ? "" : "s"}`}
        </dd>
      </div>
    </dl>
  )
}
