import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  lang = signal<'en' | 'pt'>(this.detectBrowserLanguage());
  toggle() { this.lang.update(l => l === 'en' ? 'pt' : 'en'); }
  
  private detectBrowserLanguage(): 'en' | 'pt' {
    if (typeof navigator !== 'undefined' && navigator.language) {
      return navigator.language.toLowerCase().startsWith('pt') ? 'pt' : 'en';
    }
    return 'en'; // Safe fallback
  }
  
  private translations: Record<string, Record<'en' | 'pt', string>> = {
    // Navbar
    'nav.articles':  { en: 'articles',    pt: 'blog'  },
    'nav.reviews':   { en: 'reviews',    pt: 'críticas' },
    'nav.about':     { en: 'about',      pt: 'sobre'    },
    'nav.home':      { en: 'home',       pt: 'início'   },
    'nav.lightMode': { en: 'light mode', pt: 'modo claro' },
    'nav.darkMode':  { en: 'dark mode',  pt: 'modo escuro' },

    // Home
    'home.newAlbumReview': { en: 'New Album Review',  pt: 'Novo Álbum'   },
    'home.weeklyUpdate':   { en: 'Weekly Update',     pt: 'Atualização Semanal'     },
    'home.latestPosts':    { en: 'Latest Posts',      pt: 'Últimos Posts'     },
    'home.latestTrack':    { en: 'Latest Track',      pt: 'Última Faixa'            },
    'home.byAuthor':       { en: 'By Pedro Isaia',    pt: 'Por Pedro Isaia'         },

    // Articles
    'articles.title':             { en: 'Articles',                               pt: 'Publicações'                              },
    'articles.searchPlaceholder': { en: 'Search articles, reviews and more...',   pt: 'Pesquisar posts, reviews mais...' },
    'articles.showMore':          { en: 'Show More',                              pt: 'Ver Mais'                             },
    'articles.byAuthor':          { en: 'By Pedro Isaia',                         pt: 'Por Pedro Isaia'                      },

    // Post
    'post.byAuthor':          { en: 'By Pedro Isaia',                 pt: 'Por Pedro Isaia'                            },
    'post.defaultReadTime':   { en: '5 min read',                     pt: 'Tempo de leitura: 5 min'                           },
    'post.comments':          { en: 'Comments',                       pt: 'Comentários'                                },
    'post.commentPlaceholder':{ en: 'Share your thoughts...',         pt: 'Compartilhe o que está pensando...'            },
    'post.postComment':       { en: 'Post comment',                   pt: 'Publicar comentário'                        },
    'post.posting':           { en: 'Posting...',                     pt: 'Publicando...'                              },
    'post.beFirst':           { en: 'Be the first to comment.',       pt: 'Seja o primeiro a comentar.'               },
    'post.writingPlaceholder':{ en: 'This article is currently being written. Please check back later for the full story.', pt: 'Este artigo está sendo escrito. Volte mais tarde para a história completa.' },
    'post.notFound':          { en: 'Article Not Found',              pt: 'Publicação Não Encontrada'                      },
    'post.returnToArticles':  { en: '← Return to Articles',          pt: '← Voltar à Publicações'                       },

    // About
    'about.title':        { en: 'About',        pt: 'Sobre Nós'                 },
    'about.occupation':   { en: 'OCCUPATION:',  pt: 'OCUPAÇÃO:'             },
    'about.occValue':     { en: 'Programmer',   pt: 'Programador'           },
    'about.sign':         { en: 'SIGN:',        pt: 'SIGNO:'                },
    'about.hobbies':      { en: 'HOBBIES:',     pt: 'HOBBIES:'              },
    'about.hobbiesValue': { en: 'Music, Chess, Coding', pt: 'Música, Xadrez, Codar' },
    'about.toolsHeader':  { en: 'KNOW MY TOOLS',        pt: 'MINHAS FERRAMENTAS' },
    'about.tool1':        { en: '1. Company Laptop',    pt: '1. Notebook da Empresa'     },
    'about.tool1Sub':     { en: '(better than my own)', pt: '(melhor que o meu)'         },
    'about.tool2':        { en: '2. YouTube Playlists', pt: '2. Playlists do YouTube'    },
    'about.tool3':        { en: '3. Instant Coffee',    pt: '3. Café Instantâneo'        },
    'about.factsHeader':  { en: 'AND SOME FUN FACTS',   pt: 'E ALGUMAS CURIOSIDADES'   },
    'about.fact1':        { en: 'My Letterboxd top 4',  pt: 'Meu top 4 no Letterboxd'   },
    'about.fact2':        { en: 'Favorite food',        pt: 'Comida favorita'            },
    'about.fact2Sub':     { en: '(lamen)',               pt: '(lámen)'                    },
    'about.fact3':        { en: 'Next travel destination', pt: 'Próximo destino' },
    'about.fact3Sub':     { en: '(China)',               pt: '(China)'                    },
    'about.fact4':        { en: 'My pets',               pt: 'Meus pets'                  },
    'about.projects':     { en: 'Other Projects',        pt: 'Mais Projetos'            },
    'about.proj1Desc':    { en: 'Graduate research on monitoring medical data through streaming pipeline.', pt: 'Pesquisa de pós-graduação sobre monitoramento de dados médicos em streaming.' },
    'about.proj2Desc':    { en: 'Shows cool basketball data and predicts future winners and awards.',       pt: 'Estatísticas de basquete e prevê futuros campeões.'                  },
    'about.proj3Desc':    { en: 'Automated list that is connected to whatsapp for fast editing.',          pt: 'Chatbot de WhatsApp para compras de mercado.'                   },
    'about.proj4Desc':    { en: 'See my experience and connect.',                                          pt: 'Veja minhas experiências profissionais e conecte-se comigo.'                                           },

    // Review page
    'review.backLink':      { en: 'Albums',                              pt: 'Álbuns'                                  },
    'review.introduction':  { en: 'Introduction',                        pt: 'Introdução'                              },
    'review.review':        { en: 'Review',                              pt: 'Análise'                                 },
    'review.conclusion':    { en: 'Conclusion',                          pt: 'Conclusão'                               },
    'review.score':         { en: 'Recommendation Score',                pt: 'Nota de Recomendação'               },
    'review.tracklist':     { en: 'Tracklist & Details',                 pt: 'Faixas & Detalhes'                       },
    'review.duration':      { en: 'Total Duration',                      pt: 'Duração Total'                           },
    'review.producer':      { en: 'Producer',                            pt: 'Produtor'                                },
    'review.recordedAt':    { en: 'Recorded at',                         pt: 'Gravado em'                              },
    'review.similar':       { en: 'Similar Albums You Might Enjoy',      pt: 'Álbuns Similares'   },
    'review.notFound':      { en: 'Review not found',                    pt: 'Crítica não encontrada'                  },
    'review.notFoundDesc':  { en: 'This review could not be found in our database.', pt: 'Esta crítica não foi encontrada em nosso banco de dados.' },
  // --- 10.0 to 9.0: The Masterpiece Tier ---
  'review.score_10.0': { en: 'Artistic Singularity', pt: 'Singularidade Artística' },
  'review.score_9.9': { en: 'Boundless Resonance', pt: 'Ressonância Ilimitada' },
  'review.score_9.8': { en: 'Cultural Pillar', pt: 'Marco Cultural' },
  'review.score_9.7': { en: 'Soul-Shifting Journey', pt: 'Jornada Transformadora' },
  'review.score_9.6': { en: 'Emotional Clarity', pt: 'Clareza Emocional' },
  'review.score_9.5': { en: 'Moving Poetry', pt: 'Poesia Comovente' },
  'review.score_9.4': { en: 'Masterful Tapestry', pt: 'Trama Magistral' },
  'review.score_9.3': { en: 'Radiant Vision', pt: 'Visão Radiante' },
  'review.score_9.2': { en: 'Tonal Depth', pt: 'Profundidade Tonal' },
  'review.score_9.1': { en: 'Vivid Orchestration', pt: 'Orquestração Vívida' },
  'review.score_9.0': { en: 'Essential Expression', pt: 'Expressão Essencial' },

  // --- 8.9 to 8.0: The Excellent Tier ---
  'review.score_8.9': { en: 'Phenomenal Texture', pt: 'Textura Fenomenal' },
  'review.score_8.8': { en: 'Deeply Mesmerizing', pt: 'Profundamente Fascinante' },
  'review.score_8.7': { en: 'Sculpted Soundscapes', pt: 'Paisagens Sonoras Esculpidas' },
  'review.score_8.6': { en: 'Superb Phrasing', pt: 'Fraseado Soberbo' },
  'review.score_8.5': { en: 'Vibrant Vitality', pt: 'Energia Vibrante' },
  'review.score_8.4': { en: 'Harmonic Motion', pt: 'Movimento Harmônico' },
  'review.score_8.3': { en: 'Consistently Evocative', pt: 'Constantemente Evocativo' },
  'review.score_8.2': { en: 'Strikingly Poignant', pt: 'Impressionantemente Comovente' },
  'review.score_8.1': { en: 'Triumphant Melody', pt: 'Melodia Triunfante' },
  'review.score_8.0': { en: 'Wonderfully Resonant', pt: 'Maravilhosamente Ressonante' },

  // --- 7.9 to 7.0: The Good & Recommended Tier ---
  'review.score_7.9': { en: 'Highly Expressive', pt: 'Altamente Expressivo' },
  'review.score_7.8': { en: 'Joyful Pulse', pt: 'Pulsação Contagiante' },
  'review.score_7.7': { en: 'Thematic Charm', pt: 'Encanto Temático' },
  'review.score_7.6': { en: 'Sonic Warmth', pt: 'Aconchego Sonoro' },
  'review.score_7.5': { en: 'Crafted Elegance', pt: 'Elegância Refinada' },
  'review.score_7.4': { en: 'Endearing Concept', pt: 'Conceito Cativante' },
  'review.score_7.3': { en: 'Painted Mood', pt: 'Retrato Atmosférico' },
  'review.score_7.2': { en: 'Melodic Sparks', pt: 'Centelhas Melódicas' },
  'review.score_7.1': { en: 'Graceful Flow', pt: 'Fluxo Gracioso' },
  'review.score_7.0': { en: 'Pleasant Harmony', pt: 'Harmonia Agradável' },

  // --- 6.9 to 6.0: The Decent / Flawed Tier ---
  'review.score_6.9': { en: 'Unanchored Focus', pt: 'Foco Disperso' },
  'review.score_6.8': { en: 'Safe Acoustics', pt: 'Sonoridade Segura' },
  'review.score_6.7': { en: 'Fleeting Brilliance', pt: 'Brilhantismo Fugaz' },
  'review.score_6.6': { en: 'Fading Echo', pt: 'Eco Evanescente' },
  'review.score_6.5': { en: 'Mixed Palette', pt: 'Paleta Irregular' },
  'review.score_6.4': { en: 'Fractured Playfulness', pt: 'Ludicidade Fraturada' },
  'review.score_6.3': { en: 'Approaching Clarity', pt: 'Buscando Clareza' },
  'review.score_6.2': { en: 'Drifting Threads', pt: 'Linhas à Deriva' },
  'review.score_6.1': { en: 'Quietly Subdued', pt: 'Discretamente Contido' },
  'review.score_6.0': { en: 'Finding Footing', pt: 'Buscando Equilíbrio' },

  // --- 5.9 to 5.0: The Average / Mediocre Tier ---
  'review.score_5.9': { en: 'Searching Identity', pt: 'Em Busca de Identidade' },
  'review.score_5.8': { en: 'Muted Colors', pt: 'Tons Opacos' },
  'review.score_5.7': { en: 'Paused Transition', pt: 'Transição Suspensa' },
  'review.score_5.6': { en: 'Gentle Neutrality', pt: 'Suave Neutralidade' },
  'review.score_5.5': { en: 'Uneven Landscape', pt: 'Paisagem Irregular' },
  'review.score_5.4': { en: 'Drifting Focus', pt: 'Atenção à Deriva' },
  'review.score_5.3': { en: 'Familiar Echoes', pt: 'Ecos Familiares' },
  'review.score_5.2': { en: 'Pale Strokes', pt: 'Traços Pálidos' },
  'review.score_5.1': { en: 'Faint Footprint', pt: 'Rastro Tênue' },
  'review.score_5.0': { en: 'Baseline Rest', pt: 'Repouso Básico' },

  // --- 4.9 to 4.0: The Below Average / Boring Tier ---
  'review.score_4.9': { en: 'Clouded Vision', pt: 'Visão Turva' },
  'review.score_4.8': { en: 'Unrealized Potential', pt: 'Potencial Desperdiçado' },
  'review.score_4.7': { en: 'Waiting to Bloom', pt: 'À Espera de Florescer' },
  'review.score_4.6': { en: 'Fragile Structure', pt: 'Estrutura Frágil' },
  'review.score_4.5': { en: 'Quietly Unfulfilled', pt: 'Discretamente Incompleto' },
  'review.score_4.4': { en: 'Distant Connection', pt: 'Conexão Distante' },
  'review.score_4.3': { en: 'Borrowed Inspiration', pt: 'Inspiração Emprestada' },
  'review.score_4.2': { en: 'Tangled Lines', pt: 'Linhas Emaranhadas' },
  'review.score_4.1': { en: 'Weary Pacing', pt: 'Ritmo Fatigado' },
  'review.score_4.0': { en: 'Searching Spark', pt: 'Em Busca de uma Centelha' },

  // --- 3.9 to 3.0: The Disappointing / Bad Tier ---
  'review.score_3.9': { en: 'Dimmed Light', pt: 'Luz Ofuscada' },
  'review.score_3.8': { en: 'Struggling Breath', pt: 'Fôlego Ofegante' },
  'review.score_3.7': { en: 'Lost in Fog', pt: 'Perdido na Névoa' },
  'review.score_3.6': { en: 'Disjointed Harmony', pt: 'Harmonia Desconexa' },
  'review.score_3.5': { en: 'Misaligned Intentions', pt: 'Intenções Desalinhadas' },
  'review.score_3.4': { en: 'Sadly Discordant', pt: 'Lamentavelmente Discordante' },
  'review.score_3.3': { en: 'Aimless Wandering', pt: 'Devaneio Sem Rumo' },
  'review.score_3.2': { en: 'Quickly Fading', pt: 'Apagando-se Rapidamente' },
  'review.score_3.1': { en: 'Stumbling Steps', pt: 'Passos Trôpegos' },
  'review.score_3.0': { en: 'Unreachable Resonance', pt: 'Ressonância Inalcançável' },

  // --- 2.9 to 2.0: The Awful Tier ---
  'review.score_2.9': { en: 'Veiled Dissonance', pt: 'Dissonância Velada' },
  'review.score_2.8': { en: 'Heavy Silence', pt: 'Silêncio Pesado' },
  'review.score_2.7': { en: 'Abrasive Textures', pt: 'Texturas Abrasivas' },
  'review.score_2.6': { en: 'Barren Soundscape', pt: 'Paisagem Sonora Árida' },
  'review.score_2.5': { en: 'Chaotic Scattering', pt: 'Dispersão Caótica' },
  'review.score_2.4': { en: 'Empty Canvas', pt: 'Tela Vazia' },
  'review.score_2.3': { en: 'Misguided Frequencies', pt: 'Frequências Desajustadas' },
  'review.score_2.2': { en: 'Fragmented Silence', pt: 'Silêncio Fragmentado' },
  'review.score_2.1': { en: 'Uncalibrated Tone', pt: 'Tom Descalibrado' },
  'review.score_2.0': { en: 'Lost Artistry', pt: 'Maestria Perdida' },

  // --- 1.9 to 1.0: The Terrible Tier ---
  'review.score_1.9': { en: 'Sonic Confusion', pt: 'Confusão Sonora' },
  'review.score_1.8': { en: 'Deeply Opaque', pt: 'Profundamente Opaco' },
  'review.score_1.7': { en: 'Uncomfortable Stillness', pt: 'Quietude Desconfortável' },
  'review.score_1.6': { en: 'Untamed Static', pt: 'Estática Indomável' },
  'review.score_1.5': { en: 'Beyond Reach', pt: 'Inatingível' },
  'review.score_1.4': { en: 'Exhausted Acoustics', pt: 'Acústica Exausta' },
  'review.score_1.3': { en: 'Shadowed Resonance', pt: 'Ressonância Obscurecida' },
  'review.score_1.2': { en: 'Hollow Echo', pt: 'Eco Oco' },
  'review.score_1.1': { en: 'Uncomfortably Exposed', pt: 'Desconfortavelmente Exposto' },
  'review.score_1.0': { en: 'Devoid of Melody', pt: 'Desprovido de Melodia' },

  // --- 0.9 to 0.0: The Bottomless Pit Tier ---
  'review.score_0.9': { en: 'Formless Void', pt: 'Vazio Informe' },
  'review.score_0.8': { en: 'Deeply Discordant', pt: 'Profundamente Discordante' },
  'review.score_0.7': { en: 'Wilted Inspiration', pt: 'Inspiração Murcha' },
  'review.score_0.6': { en: 'Resisting Form', pt: 'Resistência à Forma' },
  'review.score_0.5': { en: 'Artistic Eclipse', pt: 'Eclipse Artístico' },
  'review.score_0.4': { en: 'Scattered Ash', pt: 'Cinzas Espalhadas' },
  'review.score_0.3': { en: 'Profound Disconnect', pt: 'Desconexão Profunda' },
  'review.score_0.2': { en: 'Silence Preferred', pt: 'Preferível o Silêncio' },
  'review.score_0.1': { en: 'Complete Dissolution', pt: 'Dissolução Completa' },
  'review.score_0.0': { en: 'Absolute Zero', pt: 'Zero Absoluto' },

    // Search
    'search.label':      { en: 'search',                                        pt: 'procurar'                                              },
    'search.noResults':  { en: 'No post found',                                 pt: 'Nenhum resultado encontrado'                        },
    'search.articles':   { en: 'Articles',                                      pt: 'Publicações'                                            },
    'search.reviews':    { en: 'Reviews',                                       pt: 'Críticas'                                           },
    'search.descFallback':{ en: 'A brief explanation of the review goes here.', pt: 'Em breve uma descrição da crítica aqui.'              },
    'search.showMore':   { en: 'Show More',                                     pt: 'Ver Mais'                                           },
    'search.placeholder':{ en: 'Search articles...',                            pt: 'Pesquisar publicações...'                               },

    // Collection
    'collection.title':         { en: 'Albums',             pt: 'Álbuns'             },
    'collection.searchPh':      { en: 'search...',          pt: 'pesquisar...'       },
    'collection.genre':         { en: 'Genre',              pt: 'Gênero'             },
    'collection.decade':        { en: 'Decade',             pt: 'Década'             },
    'collection.allDecades':    { en: 'All Decades',        pt: 'Todas as Décadas'   },
    'collection.year':          { en: 'Year',               pt: 'Ano'                },
    'collection.allYears':      { en: 'All Years',          pt: 'Todos os Anos'      },
    'collection.country':       { en: 'Country',            pt: 'País'               },
    'collection.hideFilters':   { en: '- Hide Filters',     pt: '- Ocultar Filtros'  },
    'collection.showFilters':   { en: '+ Show Filters',     pt: '+ Mostrar Filtros'  },
    'collection.gridSize':      { en: 'Grid Size',          pt: 'Tamanho da Matriz'   },
    'collection.mostRecent':    { en: 'Most Recent',        pt: 'Mais Recentes'      },
    'collection.alphabetical':  { en: 'Alphabetical (A-Z)', pt: 'Alfabético (A-Z)'   },
    'collection.score':         { en: 'Score',              pt: 'Pontuação'          },
    'collection.previous':      { en: 'Previous',           pt: 'Anterior'           },
    'collection.next':          { en: 'Next',               pt: 'Próximo'            },
    'collection.readFull':      { en: 'Read Full Review',   pt: 'Ler Crítica Completa' },
    'collection.noReviews':     { en: 'No reviews found',   pt: 'Nenhuma crítica encontrada' },
    'collection.today':         { en: 'Today',              pt: 'Hoje'               },
    'collection.yesterday':     { en: 'Yesterday',          pt: 'Ontem'              },
  };

  t(key: string): string {
    const entry = this.translations[key];
    if (!entry) return key;
    return entry[this.lang()];
  }

  private labelMap: Record<string, Record<'en' | 'pt', string>> = {
    // Article themes
    'All':        { en: 'All',        pt: 'Todos'      },
    'Music':      { en: 'Music',      pt: 'Música'     },
    'Technology': { en: 'Technology', pt: 'Tecnologia' },
    'Literature': { en: 'Literature', pt: 'Literatura' },
    'Travel':     { en: 'Travel',     pt: 'Viagem'    },
    'Fashion':    { en: 'Fashion',    pt: 'Moda'       },
    // Genres (only those that differ)
    'Electronica':{ en: 'Electronica',pt: 'Eletrônica' },
    'Classical':  { en: 'Classical',  pt: 'Clássica'   },
    // Countries
    'US':         { en: 'US',         pt: 'EUA'          },
    'UK':         { en: 'UK',         pt: 'Reino Unido'  },
    'Brazil':     { en: 'Brazil',     pt: 'Brasil'       },
    'Japan':      { en: 'Japan',      pt: 'Japão'        },
    'Germany':    { en: 'Germany',    pt: 'Alemanha'     },
    'France':     { en: 'France',     pt: 'França'       },
    'Canada':     { en: 'Canada',     pt: 'Canadá'       },
  };

  label(value: string): string {
    const entry = this.labelMap[value];
    if (!entry) return value;
    return entry[this.lang()];
  }
}
