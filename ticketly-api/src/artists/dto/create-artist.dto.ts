import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const requiredText = (label: string, max: number) =>
  z
    .string({ error: `${label} é obrigatório` })
    .trim()
    .min(1, `${label} é obrigatório`)
    .max(max, `${label} deve ter no máximo ${max} caracteres`);

const httpUrl = (error: string) => z.url({ protocol: /^https?$/, error });

export const socialLinksSchema = z
  .record(z.string().trim().min(1).max(30), httpUrl('Link inválido').max(2000))
  .meta({
    example: {
      instagram: 'https://instagram.com/artista',
      spotify: 'https://open.spotify.com/artist/123',
    },
  });

export type SocialLinks = z.infer<typeof socialLinksSchema>;

export const createArtistSchema = z.strictObject({
  name: requiredText('Nome', 120).meta({ example: 'Anitta' }),
  legalName: requiredText('Nome civil', 120).meta({
    example: 'Larissa de Macedo Machado',
  }),
  genre: requiredText('Gênero', 50).meta({ example: 'Pop' }),
  bio: requiredText('Bio', 2000),
  imageUrl: httpUrl('URL da imagem inválida').meta({
    example: 'https://cdn.ticketly.dev/artists/anitta.jpg',
  }),
  socialLinks: socialLinksSchema.default({}),
});

export class CreateArtistDto extends createZodDto(createArtistSchema) {}
