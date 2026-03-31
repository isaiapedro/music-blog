export interface ArticleBlock {
  type: 'heading' | 'paragraph' | 'image';
  content?: string;
  imageUrl?: string;
  caption?: string;
}

export interface Article {
  id: number;
  title: string;
  keywords: string;
  description: string;
  date: string;
  image: string;
  readingTime?: string;
  views?: number;
  likes?: number;
  contentBlocks?: ArticleBlock[];
}

export const ARTICLES: Article[] = [
  {
    id: 1,
    title: "The Future of Digital Sound",
    keywords: "Technology",
    description: "Exploring how AI is reshaping the way we produce and consume music in the modern era.",
    date: "2024-05-20",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: 2,
    title: "Vinyl's Great Comeback",
    keywords: "Music",
    description: "Why physical media is seeing a massive surge in the digital age among younger collectors.",
    date: "2024-05-18",
    image: "https://images.unsplash.com/photo-1603048588665-791ca8aea617?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: 3,
    title: "Modern Minimalist Fashion",
    keywords: "Fashion",
    description: "How simplicity became the ultimate statement in the early 2020s fashion scene.",
    date: "2024-05-15",
    image: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: 4,
    title: "Hidden Gems of Kyoto",
    keywords: "Travel",
    description: "A guide to the quietest temples and best hidden tea houses in the heart of Japan.",
    date: "2024-05-10",
    image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: 5,
    title: "The Rise of Cyberpunk Literature",
    keywords: "Literature",
    description: "Analyzing the neon-soaked roots and the philosophical weight of modern sci-fi writing.",
    date: "2024-05-05",
    image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: 6,
    title: "Sustainable Travel Tips",
    keywords: "Travel",
    description: "Practical ways to explore the world while maintaining a low environmental footprint.",
    date: "2024-05-01",
    image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: 7,
    title: "Studio Design Evolution",
    keywords: "Technology",
    description: "How home studios are matching the quality of professional recording environments.",
    date: "2024-04-28",
    image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: 8,
    title: "The Jazz Renaissance",
    keywords: "Music",
    description: "A new generation of musicians is bringing jazz back to the forefront of global culture.",
    date: "2024-04-25",
    image: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: 9,
    title: "Rediscovering Maestro Moacir",
    keywords: "Music",
    description: "How a Black musician from Pernambuco, Brazil, recorded iconic albums in the US and became a legendary maestro during the dictatorship era.",
    date: "2024-04-20",
    image: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: 10,
    title: "The Golden Era of Couch Co-Op",
    keywords: "Technology",
    description: "Looking back at the best local multiplayer games from the GameCube era and how the Nintendo Switch is reviving the shared screen experience.",
    date: "2024-04-18",
    image: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: 11,
    title: "Nature as a Canvas",
    keywords: "Fashion",
    description: "Exploring the delicate art of embroidering natural elements like leaves using fine cotton threads, and how it influences indie album art.",
    date: "2024-04-15",
    image: "https://images.unsplash.com/photo-1584311899144-8456209c2dbd?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: 12,
    title: "Exploiting Game Mechanics",
    keywords: "Technology",
    description: "From leveling up Enchanting and Smithing to the infamous fortify restoration loop, why breaking a game's limits is sometimes the most fun.",
    date: "2024-04-12",
    image: "https://images.unsplash.com/photo-1605901309584-818e25960b8f?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: 13,
    title: "A Sonic Journey Through Berlin",
    keywords: "Travel",
    description: "Mapping out the underground techno clubs and historic record stores that define Germany's capital.",
    date: "2024-04-10",
    image: "https://images.unsplash.com/photo-1533107862482-0e6974b06ec4?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: 14,
    title: "The Return of the Cassette",
    keywords: "Music",
    description: "Following the vinyl boom, cassette tapes are the next analog format making a surprise resurgence among audiophiles.",
    date: "2024-04-05",
    image: "https://images.unsplash.com/photo-1512411624479-335dbb7ab4de?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: 15,
    title: "Wearable Tech on the Runway",
    keywords: "Fashion",
    description: "High fashion meets hardware: how designers are integrating smart fabrics and LEDs into their latest collections.",
    date: "2024-04-01",
    image: "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: 16,
    title: "Lost Sounds of the 80s",
    keywords: "Music",
    description: "A deep dive into the obscure synthesizers and drum machines that defined the early days of synth-pop.",
    date: "2024-03-28",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: 17,
    title: "Poetry in the Digital Age",
    keywords: "Literature",
    description: "How social media platforms have birthed a new generation of micro-poets reaching global audiences.",
    date: "2024-03-25",
    image: "https://images.unsplash.com/photo-1455390582262-044cdead2708?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: 18,
    title: "Backpacking the Andes",
    keywords: "Travel",
    description: "Essential tips and breathtaking routes for a month-long journey through South America's greatest mountain range.",
    date: "2024-03-20",
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop"
  }
];