import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials } from "@/utils"

export function ArtistAvatar({
  name,
  imageUrl,
  size = "default",
  className,
}: {
  name: string
  imageUrl?: string
  size?: "default" | "sm" | "lg"
  className?: string
}) {
  return (
    <Avatar size={size} className={className}>
      {imageUrl && <AvatarImage src={imageUrl} alt={name} />}
      <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
        {getInitials(name) || "?"}
      </AvatarFallback>
    </Avatar>
  )
}
