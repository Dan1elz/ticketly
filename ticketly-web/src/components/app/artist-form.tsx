import type { FormEvent, ReactNode } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { PlusIcon, Trash2Icon } from "lucide-react"
import {
  Controller,
  useFieldArray,
  useForm,
  useFormState,
  useWatch,
  type Control,
  type UseFormRegister,
} from "react-hook-form"

import { ImageUpload } from "@/components/app/image-upload"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { SOCIAL_NETWORK_LABELS } from "@/constants"
import { useArtists } from "@/hooks/use-artists"
import { cn } from "@/lib/utils"
import {
  artistSchema,
  type ArtistFormData,
  type ArtistFormOutput,
} from "@/schemas"

type TArtistFormProps = {
  defaultValues: ArtistFormData
  onSubmit: (data: ArtistFormOutput) => Promise<void> | void
  renderActions: (state: { isSubmitting: boolean }) => ReactNode
  variant?: "page" | "dialog"
  showActiveToggle?: boolean
}

/**
 * Formulário completo de artista. Usado na tela de artistas e no dialog
 * "novo artista" do lineup do show.
 */
export function ArtistForm({
  defaultValues,
  onSubmit,
  renderActions,
  variant = "page",
  showActiveToggle = false,
}: TArtistFormProps) {
  const { uploadArtistImage } = useArtists()

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ArtistFormData, unknown, ArtistFormOutput>({
    resolver: zodResolver(artistSchema),
    defaultValues,
  })

  // O dialog é renderizado num portal, mas o submit "sobe" pela árvore do
  // React até o form do show: o stopPropagation impede isso
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.stopPropagation()
    return handleSubmit(onSubmit)(event)
  }

  const imageField = (
    <Field data-invalid={!!errors.image}>
      <FieldLabel htmlFor="artist-image" className="sr-only">
        Foto
      </FieldLabel>
      <Controller
        control={control}
        name="image"
        render={({ field }) => (
          <ImageUpload
            id="artist-image"
            value={field.value}
            onChange={field.onChange}
            onUpload={uploadArtistImage}
            invalid={!!errors.image}
          />
        )}
      />
      <FieldError errors={[errors.image]} />
    </Field>
  )

  const mainFields = (
    <FieldGroup className="gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="artist-name">Nome artístico</FieldLabel>
          <Input
            id="artist-name"
            placeholder="Anitta"
            aria-invalid={!!errors.name}
            {...register("name")}
          />
          <FieldError errors={[errors.name]} />
        </Field>

        <Field data-invalid={!!errors.legalName}>
          <FieldLabel htmlFor="artist-legal-name">Nome civil</FieldLabel>
          <Input
            id="artist-legal-name"
            placeholder="Larissa de Macedo Machado"
            aria-invalid={!!errors.legalName}
            {...register("legalName")}
          />
          <FieldError errors={[errors.legalName]} />
        </Field>
      </div>

      <Field data-invalid={!!errors.genre}>
        <FieldLabel htmlFor="artist-genre">Gênero</FieldLabel>
        <Input
          id="artist-genre"
          placeholder="Pop"
          aria-invalid={!!errors.genre}
          {...register("genre")}
        />
        <FieldError errors={[errors.genre]} />
      </Field>

      <Field data-invalid={!!errors.bio}>
        <FieldLabel htmlFor="artist-bio">Bio</FieldLabel>
        <Textarea
          id="artist-bio"
          rows={variant === "page" ? 6 : 4}
          className="min-h-28"
          placeholder="Conte um pouco sobre o artista..."
          aria-invalid={!!errors.bio}
          {...register("bio")}
        />
        <BioCounter control={control} />
        <FieldError errors={[errors.bio]} />
      </Field>
    </FieldGroup>
  )

  const socialFields = (
    <SocialLinksFields control={control} register={register} />
  )

  if (variant === "dialog") {
    return (
      <form onSubmit={submit} noValidate className="contents">
        <div className="-mx-6 flex max-h-[65vh] flex-col gap-6 overflow-y-auto px-6 py-1">
          <div className="grid gap-6 sm:grid-cols-[11rem_minmax(0,1fr)]">
            {imageField}
            {mainFields}
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium">Redes sociais</p>
            {socialFields}
          </div>
        </div>
        {renderActions({ isSubmitting })}
      </form>
    )
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]"
    >
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações</CardTitle>
            <CardDescription>
              Dados exibidos na página dos shows.
            </CardDescription>
          </CardHeader>
          <CardContent>{mainFields}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Redes sociais</CardTitle>
            <CardDescription>
              Links que aparecem no perfil do artista.
            </CardDescription>
          </CardHeader>
          <CardContent>{socialFields}</CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-6 lg:sticky lg:top-20 lg:self-start">
        <Card>
          <CardHeader>
            <CardTitle>Foto</CardTitle>
            <CardDescription>Aparece no lineup e na loja.</CardDescription>
          </CardHeader>
          <CardContent>{imageField}</CardContent>
        </Card>

        {showActiveToggle && (
          <Card>
            <CardContent>
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldLabel htmlFor="artist-active">Artista ativo</FieldLabel>
                  <FieldDescription>
                    Inativos não entram em novos shows, mas continuam nos que já
                    estavam.
                  </FieldDescription>
                </FieldContent>
                <Controller
                  control={control}
                  name="isActive"
                  render={({ field }) => (
                    <Switch
                      id="artist-active"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </Field>
            </CardContent>
          </Card>
        )}

        {renderActions({ isSubmitting })}
      </div>
    </form>
  )
}

function BioCounter({ control }: { control: Control<ArtistFormData> }) {
  const bio = useWatch({ control, name: "bio" }) ?? ""

  return (
    <FieldDescription
      className={cn(
        "text-right text-xs",
        bio.length > 2000 && "text-destructive"
      )}
    >
      {bio.length}/2000
    </FieldDescription>
  )
}

function SocialLinksFields({
  control,
  register,
}: {
  control: Control<ArtistFormData>
  register: UseFormRegister<ArtistFormData>
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "socialLinks",
  })
  const { errors } = useFormState({ control, name: "socialLinks" })
  const links = useWatch({ control, name: "socialLinks" }) ?? []

  const used = new Set(links.map((link) => link.network))
  const available = Object.keys(SOCIAL_NETWORK_LABELS).filter(
    (network) => !used.has(network)
  )

  return (
    <div className="flex flex-col gap-3">
      {fields.length === 0 && (
        <p className="rounded-2xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
          Nenhuma rede social cadastrada.
        </p>
      )}

      {fields.map((field, index) => {
        const rowErrors = errors.socialLinks?.[index]

        return (
          <div
            key={field.id}
            className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:grid-cols-[11rem_minmax(0,1fr)_auto]"
          >
            <Field data-invalid={!!rowErrors?.network} className="gap-1">
              <Controller
                control={control}
                name={`socialLinks.${index}.network`}
                render={({ field: networkField }) => (
                  <Select
                    items={SOCIAL_NETWORK_LABELS}
                    value={networkField.value || null}
                    onValueChange={(value) =>
                      networkField.onChange(value ?? "")
                    }
                  >
                    <SelectTrigger
                      className="w-full"
                      aria-label="Rede"
                      aria-invalid={!!rowErrors?.network}
                    >
                      <SelectValue placeholder="Rede" />
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false}>
                      {Object.entries(SOCIAL_NETWORK_LABELS).map(
                        ([value, label]) => (
                          <SelectItem
                            key={value}
                            value={value}
                            disabled={
                              used.has(value) && value !== networkField.value
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
              <FieldError errors={[rowErrors?.network]} />
            </Field>
            <Field
              data-invalid={!!rowErrors?.url}
              className="order-3 col-span-2 gap-1 sm:order-none sm:col-span-1"
            >
              <Input
                placeholder="https://..."
                aria-label="Link"
                aria-invalid={!!rowErrors?.url}
                {...register(`socialLinks.${index}.url`)}
              />
              <FieldError errors={[rowErrors?.url]} />
            </Field>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Remover rede"
              onClick={() => remove(index)}
            >
              <Trash2Icon />
            </Button>
          </div>
        )
      })}

      <FieldError>
        {errors.socialLinks?.root?.message ?? errors.socialLinks?.message}
      </FieldError>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        disabled={available.length === 0}
        onClick={() => append({ network: available[0] ?? "", url: "" })}
      >
        <PlusIcon data-icon="inline-start" />
        Adicionar rede
      </Button>
    </div>
  )
}
