import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  lang = signal<'en' | 'pt'>('en');
  toggle() { this.lang.update(l => l === 'en' ? 'pt' : 'en'); }

  private translations: Record<string, Record<'en' | 'pt', string>> = {
    // Navbar
    'nav.articles':  { en: 'articles',  pt: 'artigos'  },
    'nav.reviews':   { en: 'reviews',   pt: 'resenhas' },
    'nav.about':     { en: 'about',     pt: 'sobre'    },
    'nav.home':      { en: 'home',      pt: 'início'   },

    // Home
    'home.newAlbumReview': { en: 'New Album Review',  pt: 'Nova Resenha de Álbum'   },
    'home.weeklyUpdate':   { en: 'Weekly Update',     pt: 'Atualização Semanal'     },
    'home.latestPosts':    { en: 'Latest Posts',      pt: 'Últimas Publicações'     },
    'home.latestTrack':    { en: 'Latest Track',      pt: 'Última Faixa'            },
    'home.byAuthor':       { en: 'By Pedro Isaia',    pt: 'Por Pedro Isaia'         },

    // Articles
    'articles.title':             { en: 'Articles',                               pt: 'Artigos'                              },
    'articles.searchPlaceholder': { en: 'Search articles, reviews and more...',   pt: 'Pesquisar artigos, resenhas e mais...' },
    'articles.showMore':          { en: 'Show More',                              pt: 'Ver Mais'                             },
    'articles.byAuthor':          { en: 'By Pedro Isaia',                         pt: 'Por Pedro Isaia'                      },

    // Post
    'post.byAuthor':          { en: 'By Pedro Isaia',                 pt: 'Por Pedro Isaia'                            },
    'post.defaultReadTime':   { en: '5 min read',                     pt: '5 min de leitura'                           },
    'post.comments':          { en: 'Comments',                       pt: 'Comentários'                                },
    'post.commentPlaceholder':{ en: 'Share your thoughts...',         pt: 'Compartilhe seus pensamentos...'            },
    'post.postComment':       { en: 'Post comment',                   pt: 'Publicar comentário'                        },
    'post.posting':           { en: 'Posting...',                     pt: 'Publicando...'                              },
    'post.beFirst':           { en: 'Be the first to comment.',       pt: 'Seja o primeiro a comentar.'               },
    'post.writingPlaceholder':{ en: 'This article is currently being written. Please check back later for the full story.', pt: 'Este artigo está sendo escrito. Volte mais tarde para a história completa.' },
    'post.notFound':          { en: 'Article Not Found',              pt: 'Artigo Não Encontrado'                      },
    'post.returnToArticles':  { en: '← Return to Articles',          pt: '← Voltar aos Artigos'                       },

    // About
    'about.title':        { en: 'About',        pt: 'Sobre'                 },
    'about.occupation':   { en: 'OCCUPATION:',  pt: 'OCUPAÇÃO:'             },
    'about.occValue':     { en: 'Programmer',   pt: 'Programador'           },
    'about.sign':         { en: 'SIGN:',        pt: 'SIGNO:'                },
    'about.hobbies':      { en: 'HOBBIES:',     pt: 'HOBBIES:'              },
    'about.hobbiesValue': { en: 'Music, Chess, Coding', pt: 'Música, Xadrez, Programação' },
    'about.toolsHeader':  { en: 'KNOW MY TOOLS',        pt: 'CONHEÇA MINHAS FERRAMENTAS' },
    'about.tool1':        { en: '1. Company Laptop',    pt: '1. Notebook da Empresa'     },
    'about.tool1Sub':     { en: '(better than my own)', pt: '(melhor que o meu)'         },
    'about.tool2':        { en: '2. YouTube Playlists', pt: '2. Playlists do YouTube'    },
    'about.tool3':        { en: '3. Instant Coffee',    pt: '3. Café Instantâneo'        },
    'about.factsHeader':  { en: 'AND SOME FUN FACTS',   pt: 'E ALGUNS FATOS CURIOSOS'   },
    'about.fact1':        { en: 'My Letterboxd top 4',  pt: 'Meu top 4 no Letterboxd'   },
    'about.fact2':        { en: 'Favorite food',        pt: 'Comida favorita'            },
    'about.fact2Sub':     { en: '(lamen)',               pt: '(lámen)'                    },
    'about.fact3':        { en: 'Next travel destination', pt: 'Próximo destino de viagem' },
    'about.fact3Sub':     { en: '(China)',               pt: '(China)'                    },
    'about.fact4':        { en: 'My pets',               pt: 'Meus pets'                  },
    'about.projects':     { en: 'Other Projects',        pt: 'Outros Projetos'            },
    'about.proj1Desc':    { en: 'Graduate research on monitoring medical data through streaming pipeline.', pt: 'Pesquisa de pós-graduação sobre monitoramento de dados médicos em streaming.' },
    'about.proj2Desc':    { en: 'Shows cool basketball data and predicts future winners and awards.',       pt: 'Exibe dados de basquete e prevê futuros campeões e premiações.'                  },
    'about.proj3Desc':    { en: 'Automated list that is connected to whatsapp for fast editing.',          pt: 'Lista automatizada conectada ao WhatsApp para edição rápida.'                   },
    'about.proj4Desc':    { en: 'See my experience and connect.',                                          pt: 'Veja minha experiência e conecte-se.'                                           },

    // Review page
    'review.backLink':      { en: 'Albums',                              pt: 'Álbuns'                                  },
    'review.introduction':  { en: 'Introduction',                        pt: 'Introdução'                              },
    'review.review':        { en: 'Review',                              pt: 'Resenha'                                 },
    'review.conclusion':    { en: 'Conclusion',                          pt: 'Conclusão'                               },
    'review.score':         { en: 'Recommendation Score',                pt: 'Pontuação de Recomendação'               },
    'review.tracklist':     { en: 'Tracklist & Details',                 pt: 'Faixas & Detalhes'                       },
    'review.duration':      { en: 'Total Duration',                      pt: 'Duração Total'                           },
    'review.producer':      { en: 'Producer',                            pt: 'Produtor'                                },
    'review.recordedAt':    { en: 'Recorded at',                         pt: 'Gravado em'                              },
    'review.similar':       { en: 'Similar Albums You Might Enjoy',      pt: 'Álbuns Similares que Você Pode Gostar'   },
    'review.notFound':      { en: 'Review not found',                    pt: 'Resenha não encontrada'                  },
    'review.notFoundDesc':  { en: 'This review could not be found in our database.', pt: 'Esta resenha não foi encontrada em nosso banco de dados.' },
    'review.score_masterpiece':  { en: 'An Absolute Masterpiece',        pt: 'Uma Obra-Prima Absoluta'                 },
    'review.score_essential':    { en: 'Essential Listening',            pt: 'Audição Essencial'                       },
    'review.score_recommended':  { en: 'Highly Recommended',             pt: 'Altamente Recomendado'                   },
    'review.score_solid':        { en: 'A Solid Record',                 pt: 'Um Bom Álbum'                            },
    'review.score_average':      { en: 'Average & Flawed',               pt: 'Mediano e com Falhas'                    },
    'review.score_disappointing':{ en: 'Disappointing',                  pt: 'Decepcionante'                           },
    'review.score_skip':         { en: 'Not Recommended',                pt: 'Não Recomendado'                         },

    // Search
    'search.label':      { en: 'search',                                        pt: 'busca'                                              },
    'search.noResults':  { en: 'No post found',                                 pt: 'Nenhum resultado encontrado'                        },
    'search.articles':   { en: 'Articles',                                      pt: 'Artigos'                                            },
    'search.reviews':    { en: 'Reviews',                                       pt: 'Resenhas'                                           },
    'search.descFallback':{ en: 'A brief explanation of the review goes here.', pt: 'Uma breve explicação da resenha aqui.'              },
    'search.showMore':   { en: 'Show More',                                     pt: 'Ver Mais'                                           },
    'search.placeholder':{ en: 'Search articles...',                            pt: 'Pesquisar artigos...'                               },

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
    'collection.gridSize':      { en: 'Grid Size',          pt: 'Tamanho da Grade'   },
    'collection.mostRecent':    { en: 'Most Recent',        pt: 'Mais Recentes'      },
    'collection.alphabetical':  { en: 'Alphabetical (A-Z)', pt: 'Alfabético (A-Z)'   },
    'collection.score':         { en: 'Score',              pt: 'Pontuação'          },
    'collection.previous':      { en: 'Previous',           pt: 'Anterior'           },
    'collection.next':          { en: 'Next',               pt: 'Próximo'            },
    'collection.readFull':      { en: 'Read Full Review',   pt: 'Ler Resenha Completa' },
    'collection.noReviews':     { en: 'No reviews found',   pt: 'Nenhuma resenha encontrada' },
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
    'Travel':     { en: 'Travel',     pt: 'Viagens'    },
    'Fashion':    { en: 'Fashion',    pt: 'Moda'       },
    // Genres (only those that differ)
    'Electronica':{ en: 'Electronica',pt: 'Eletrônica' },
    'Classical':  { en: 'Classical',  pt: 'Clássico'   },
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
