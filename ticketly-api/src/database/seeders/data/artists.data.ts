import type { TSocialLinks } from '../../../artists/dto/create-artist.dto';

export interface IArtistSeed {
  name: string;
  legalName: string;
  genre: string;
  bio: string;
  socialLinks: TSocialLinks;
  photoUrl: string;
}

const unsplash = (id: string) =>
  `https://images.unsplash.com/${id}?w=800&auto=format&fit=crop&q=80`;

export const ARTISTS: IArtistSeed[] = [
  {
    name: 'Luna Marés',
    legalName: 'Helena Albuquerque Duarte',
    genre: 'Indie Pop',
    bio: 'Nascida em Florianópolis, Luna Marés mescla texturas etéreas de sintetizadores dos anos 80 com elementos de dream pop e violão acústico. Começou gravando demos no quarto e conquistou público fiel com letras confessionais sobre desilusões amorosas, autodescoberta e noites litorâneas.',
    socialLinks: {
      instagram: 'https://instagram.com/lunamaresoficial',
      spotify: 'https://open.spotify.com/artist/lunamares',
      tiktok: 'https://tiktok.com/@lunamares',
    },
    photoUrl: unsplash('photo-1534528741775-53994a69daeb'),
  },
  {
    name: 'V$TOR',
    legalName: 'Vitor Gabriel de Castro',
    genre: 'Trap',
    bio: 'Expoente do subgênero melódico nascido na Zona Leste de São Paulo, V$TOR traz graves distorcidos e autotune calibrado para falar de ambição, vivências urbanas e lealdade às raízes. Seus lançamentos independentes acumulam milhões de reproduções orgânicas nas plataformas de streaming.',
    socialLinks: {
      instagram: 'https://instagram.com/vstornobeat',
      youtube: 'https://youtube.com/c/VSTOROficial',
      spotify: 'https://open.spotify.com/artist/vstor',
    },
    photoUrl: unsplash('photo-1507003211169-0a1dd7228f2d'),
  },
  {
    name: 'Marina Silveira',
    legalName: 'Marina Silveira Fontes',
    genre: 'Nova MPB',
    bio: 'Cantora e multi-instrumentista de Salvador, combina samba, jazz e afro-grooves contemporâneos em arranjos repletos de sopros e percussão orgânica. Sua voz aveludada transita entre a reverência aos clássicos dos anos 70 e crônicas modernas sobre o cotidiano brasileiro.',
    socialLinks: {
      instagram: 'https://instagram.com/marinasilveiramusic',
      spotify: 'https://open.spotify.com/artist/marinasilveira',
    },
    photoUrl: unsplash('photo-1517841905240-472988babdf9'),
  },
  {
    name: 'Chuva Ácida',
    legalName: 'Rodrigo Mendes Santana',
    genre: 'Post-Punk',
    bio: 'Projeto solo do guitarrista e produtor curitibano Rodrigo Santana. Caracterizado por linhas de baixo pulsantes, guitarras cheias de chorus e baterias eletrônicas minimalistas, o projeto resgata o espírito obscuro e introspectivo do pós-punk oitentista com letras em português.',
    socialLinks: {
      bandcamp: 'https://chuvaacidamusic.bandcamp.com',
      instagram: 'https://instagram.com/chuvaacidaproject',
    },
    photoUrl: unsplash('photo-1500648767791-00dcc994a43e'),
  },
  {
    name: 'KAYRA',
    legalName: 'Karina Ramos Almeida',
    genre: 'Pop',
    bio: 'Cantora, dançarina e compositora carioca, KAYRA une a batida de funk carioca, batidão pop e estética visual futurista. Ganhou tração após coreografias autorais viralizarem nas redes, consolidando-se como uma força performática e autêntica do pop nacional.',
    socialLinks: {
      tiktok: 'https://tiktok.com/@kayraqueen',
      instagram: 'https://instagram.com/kayramusic',
      youtube: 'https://youtube.com/@kayraofficial',
    },
    photoUrl: unsplash('photo-1524504388940-b1c1722653e1'),
  },
  {
    name: 'Theo Vasconcellos',
    legalName: 'Theodoro Vasconcellos Prado',
    genre: 'Folk',
    bio: 'Com violão dedilhado, gaita e letras poéticas sobre passagens do tempo e nostalgia do interior de Minas Gerais, Theo faz apresentações intimistas que cativam fãs de indie-folk e MPB raiz.',
    socialLinks: {
      spotify: 'https://open.spotify.com/artist/theovasconcellos',
      instagram: 'https://instagram.com/theovascoacustico',
    },
    photoUrl: unsplash('photo-1539571696357-5a69c17a67c6'),
  },
  {
    name: 'Aura Beat',
    legalName: 'Camila Nunes Peixoto',
    genre: 'Eletrônica',
    bio: 'DJ e produtora musical pioneira em sets híbridos de Afro-House e Melodic Techno. Formada em produção musical em Berlim, Aura Beat é presença constante em festivais underground e eventos de arte contemporânea.',
    socialLinks: {
      soundcloud: 'https://soundcloud.com/aurabeatofficial',
      instagram: 'https://instagram.com/aurabeatlive',
    },
    photoUrl: unsplash('photo-1573496359142-b8d87734a5a2'),
  },
  {
    name: 'Bento & Os Canibais',
    legalName: 'Bento Siqueira Moreira',
    genre: 'Rock Alternativo',
    bio: 'Projeto liderado por Bento Siqueira que recupera a crueza do garage rock dos anos 90. Guitarras ruidosas, vocais rasgados e uma energia contagiante em palcos pequenos marcam a assinatura do grupo em São Paulo.',
    socialLinks: {
      instagram: 'https://instagram.com/bentooscanibais',
      youtube: 'https://youtube.com/@bentocanibais',
    },
    photoUrl: unsplash('photo-1506794778202-cad84cf45f1d'),
  },
  {
    name: 'Dandara Sol',
    legalName: 'Dandara Nascimento Ferreira',
    genre: 'R&B',
    bio: 'A voz doce e potente de Dandara une o neo-soul ao R&B contemporâneo cantado em português. Suas músicas exploram vulnerabilidade emocional, relacionamentos modernos e afirmação de identidade.',
    socialLinks: {
      instagram: 'https://instagram.com/dandarasolmusic',
      spotify: 'https://open.spotify.com/artist/dandarasol',
    },
    photoUrl: unsplash('photo-1531746020798-e6953c6e8e04'),
  },
  {
    name: 'MC Pardal',
    legalName: 'Lucas Henrique de Souza',
    genre: 'Funk',
    bio: 'Destaque do funk consciente da Baixada Santista, MC Pardal compõe rimas afiadas narrando a superação diária e a realidade periférica, combinando beats pesados a refrões melódicos fáceis de memorizar.',
    socialLinks: {
      instagram: 'https://instagram.com/mcpardalofc',
      youtube: 'https://youtube.com/@mcpardal',
      tiktok: 'https://tiktok.com/@mcpardalofc',
    },
    photoUrl: unsplash('photo-1522075469751-3a6694fb2f61'),
  },
  {
    name: 'Aurora Fria',
    legalName: 'Renata Lins Fagundes',
    genre: 'Dark Wave',
    bio: 'Com synths analógicos sombrios e temáticas líricas existenciais, Aurora Fria explora o lado atmosférico da música eletrônica independente, criando trilhas cinematográficas perfeitas para fones de ouvido.',
    socialLinks: {
      bandcamp: 'https://aurorafria.bandcamp.com',
      instagram: 'https://instagram.com/aurorafriamusic',
    },
    photoUrl: unsplash('photo-1544005313-94ddf0286df2'),
  },
  {
    name: 'Zeus da Rima',
    legalName: 'Wesley dos Santos Carvalho',
    genre: 'Boom Bap',
    bio: 'Cria das batalhas de freestyle de Belo Horizonte, Zeus da Rima traz o clássico hip hop 90 BPM com samples de jazz e rimas com métricas complexas sobre política, resistência e vida urbana.',
    socialLinks: {
      instagram: 'https://instagram.com/zeusdarima',
      spotify: 'https://open.spotify.com/artist/zeusdarima',
    },
    photoUrl: unsplash('photo-1492562080023-ab3db95bfbce'),
  },
  {
    name: 'Brisa Tropical',
    legalName: 'Clara Vasconcelos Ribeiro',
    genre: 'Reggae',
    bio: 'Natural de Recife, une o roots reggae ao dub eletrônico e elementos de maracatu. Suas faixas transmitem mensagens de preservação ambiental, espiritualidade e paz através de linhas de baixo envolventes.',
    socialLinks: {
      instagram: 'https://instagram.com/brisatropicalreggae',
      youtube: 'https://youtube.com/@brisatropical',
    },
    photoUrl: unsplash('photo-1519699047748-de8e457a634e'),
  },
  {
    name: 'Túlio & Murilo',
    legalName: 'Túlio Arantes / Murilo Arantes',
    genre: 'Sertanejo Universitário',
    bio: 'Irmãos nascidos em Goiânia com presença constante nos palcos do Centro-Oeste. A dupla equilibra baladas românticas acústicas com hits dançantes de festa que dialogam com a juventude universitária.',
    socialLinks: {
      instagram: 'https://instagram.com/tulioemurilooficial',
      youtube: 'https://youtube.com/@tulioemurilomusic',
    },
    photoUrl: unsplash('photo-1501196354995-cbb51c65aaea'),
  },
  {
    name: 'Nômade Estelar',
    legalName: 'Eduardo Brandão Coutinho',
    genre: 'Lo-Fi Hip Hop',
    bio: 'Produtor beatmaker e multi-instrumentista focado em texturas nostálgicas, ruídos de vinil e guitarras lentas. Suas faixas instrumentais figuram com frequência em playlists de estudo e relaxamento global.',
    socialLinks: {
      spotify: 'https://open.spotify.com/artist/nomadeestelar',
      youtube: 'https://youtube.com/@nomadeestelarlofi',
    },
    photoUrl: unsplash('photo-1506794778202-cad84cf45f1d'),
  },
];
