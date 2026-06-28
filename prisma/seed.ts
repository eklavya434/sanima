import { PrismaClient, Category, SceneNoteType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/sanima?schema=public";
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding started...");

  // 1. Clean existing database records
  await prisma.comment.deleteMany();
  await prisma.like.deleteMany();
  await prisma.sceneNote.deleteMany();
  await prisma.review.deleteMany();
  await prisma.mediaItem.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Seed Users
  const passwordHash = await bcrypt.hash("password123", 10);
  
  const user1 = await prisma.user.create({
    data: {
      name: "John Doe",
      email: "john@example.com",
      passwordHash,
      avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
      bio: "Cinephile. Ad critic. Podcast addict. I love analyzing screenplays.",
    },
  });

  const user2 = await prisma.user.create({
    data: {
      name: "Jane Smith",
      email: "jane@example.com",
      passwordHash,
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
      bio: "Tech reviewer. YouTuber. TV serial fan. Live, laugh, watch series.",
    },
  });

  const user3 = await prisma.user.create({
    data: {
      name: "Alex Miller",
      email: "alex@example.com",
      passwordHash,
      avatarUrl: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150",
      bio: "Pop culture enthusiast. Ads are art. Sacastic commentary on everything.",
    },
  });

  const users = [user1, user2, user3];
  console.log("Users seeded successfully.");

  // 3. Create Seed MediaItems (15 items)
  const mediaData = [
    {
      title: "Inception",
      category: Category.MOVIE,
      year: 2010,
      creatorOrStudio: "Christopher Nolan",
      posterUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300",
      description: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
      externalUrl: "https://www.youtube.com/watch?v=YoHD9XEInc0",
      createdByUserId: user1.id,
    },
    {
      title: "Interstellar",
      category: Category.MOVIE,
      year: 2014,
      creatorOrStudio: "Christopher Nolan",
      posterUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300",
      description: "When Earth becomes uninhabitable, a team of explorers travels through a wormhole in space in an attempt to ensure humanity's survival.",
      externalUrl: "https://www.youtube.com/watch?v=zSWdZAeeCgs",
      createdByUserId: user1.id,
    },
    {
      title: "Breaking Bad",
      category: Category.TV_SHOW,
      year: 2008,
      creatorOrStudio: "Vince Gilligan",
      posterUrl: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=300",
      description: "A chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine with a former student in order to secure his family's future.",
      externalUrl: "https://www.youtube.com/watch?v=HhesaQXLuRY",
      createdByUserId: user2.id,
    },
    {
      title: "Stranger Things",
      category: Category.TV_SHOW,
      year: 2016,
      creatorOrStudio: "Duffer Brothers",
      posterUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=300",
      description: "When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces and one strange little girl.",
      externalUrl: "https://www.youtube.com/watch?v=b9EkMc79ZSU",
      createdByUserId: user2.id,
    },
    {
      title: "Sacred Games",
      category: Category.WEB_SERIES,
      year: 2018,
      creatorOrStudio: "Anurag Kashyap / Vikramaditya Motwane",
      posterUrl: "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=300",
      description: "A link in their pasts leads an honest cop to a fugitive gang boss, whose cryptic warning spurs the officer on a quest to save Mumbai from cataclysm.",
      externalUrl: "https://www.youtube.com/watch?v=28j8h0RRGi4",
      createdByUserId: user3.id,
    },
    {
      title: "Squid Game",
      category: Category.WEB_SERIES,
      year: 2021,
      creatorOrStudio: "Hwang Dong-hyuk",
      posterUrl: "https://images.unsplash.com/photo-1635805737707-575885ab0820?w=300",
      description: "Hundreds of cash-strapped players accept a strange invitation to compete in children's games. Inside, a tempting prize awaits with deadly high stakes.",
      externalUrl: "https://www.youtube.com/watch?v=oqxAJKy0R4A",
      createdByUserId: user3.id,
    },
    {
      title: "The Simpsons",
      category: Category.TV_SERIAL,
      year: 1989,
      creatorOrStudio: "Matt Groening",
      posterUrl: "https://images.unsplash.com/photo-1593085512500-5d55148d6f0d?w=300",
      description: "The satiric adventures of a working-class family in the misfit city of Springfield.",
      externalUrl: "https://www.youtube.com/watch?v=DX1iplQQJTo",
      createdByUserId: user1.id,
    },
    {
      title: "Apple 1984 Macintosh Ad",
      category: Category.TV_AD,
      year: 1984,
      creatorOrStudio: "Ridley Scott (Apple)",
      posterUrl: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=300",
      description: "Apple Computer's famous television commercial introducing the Macintosh computer in the United States.",
      externalUrl: "https://www.youtube.com/watch?v=VtvjbmoDx-I",
      createdByUserId: user1.id,
    },
    {
      title: "Coca-Cola Hilltop Ad",
      category: Category.TV_AD,
      year: 1971,
      creatorOrStudio: "Bill Backer (Coca-Cola)",
      posterUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300",
      description: "Features young people from around the world singing 'I'd Like to Buy the World a Coke' on a hilltop in Italy.",
      externalUrl: "https://www.youtube.com/watch?v=1VM2eLhvsSM",
      createdByUserId: user2.id,
    },
    {
      title: "Clash of Clans: Ride of the Hog Riders",
      category: Category.YT_AD,
      year: 2015,
      creatorOrStudio: "Supercell",
      posterUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=300",
      description: "An animated, humorous promotional video showcasing hog riders shouting their iconic battle cry.",
      externalUrl: "https://www.youtube.com/watch?v=pdtZ8ZfKwtM",
      createdByUserId: user3.id,
    },
    {
      title: "MKBHD: iPhone 15 Pro Review",
      category: Category.YT_VIDEO,
      year: 2023,
      creatorOrStudio: "Marques Brownlee",
      posterUrl: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=300",
      description: "Comprehensive review of the iPhone 15 Pro, titanium build, and new camera capabilities.",
      externalUrl: "https://www.youtube.com/watch?v=7M79R22w1p8",
      createdByUserId: user2.id,
    },
    {
      title: "MrBeast: 100 Kids vs 100 Adults",
      category: Category.YT_VIDEO,
      year: 2024,
      creatorOrStudio: "Jimmy Donaldson (MrBeast)",
      posterUrl: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=300",
      description: "A grand challenge pitting 100 children against 100 adults in a closed-containment survival challenge.",
      externalUrl: "https://www.youtube.com/watch?v=cl4Fv4c4X5E",
      createdByUserId: user3.id,
    },
    {
      title: "The Joe Rogan Experience: #2000",
      category: Category.PODCAST,
      year: 2023,
      creatorOrStudio: "Joe Rogan",
      posterUrl: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=300",
      description: "Joe Rogan hosts milestone episode 2000 with discussion on comedy, martial arts, and science.",
      externalUrl: "https://open.spotify.com/show/4rOoJ62SVUvFO5uN32R3OI",
      createdByUserId: user1.id,
    },
    {
      title: "Huberman Lab: Neuroplasticity",
      category: Category.PODCAST,
      year: 2021,
      creatorOrStudio: "Dr. Andrew Huberman",
      posterUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=300",
      description: "An in-depth explanation of biological mechanisms of neuroplasticity and how to accelerate learning.",
      externalUrl: "https://www.youtube.com/watch?v=lgqyZptE4yY",
      createdByUserId: user2.id,
    },
    {
      title: "The Last of Us Part I Intro",
      category: Category.OTHER,
      year: 2013,
      creatorOrStudio: "Naughty Dog",
      posterUrl: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=300",
      description: "The cinematic prologue of the critically acclaimed game, detailing Sarah and Joel's escape during outbreak night.",
      externalUrl: "https://www.youtube.com/watch?v=F3S78W94nsc",
      createdByUserId: user3.id,
    },
  ];

  const items = [];
  for (const media of mediaData) {
    const item = await prisma.mediaItem.create({ data: media });
    items.push(item);
  }
  console.log("Media items seeded successfully.");

  // Helper to get random subset
  const getRandomUsers = () => {
    // Return all 3 users in shuffled order
    return [...users].sort(() => 0.5 - Math.random());
  };

  // 4. Seed Reviews & SceneNotes (2-3 reviews per item)
  for (const item of items) {
    const activeUsers = getRandomUsers().slice(0, 2); // 2 reviews per item

    for (let index = 0; index < activeUsers.length; index++) {
      const user = activeUsers[index];
      // Generate rating between 6.0 and 9.5
      const rating = parseFloat((6 + Math.random() * 4).toFixed(1));
      const isLongForm = item.category === Category.MOVIE ||
                         item.category === Category.TV_SHOW ||
                         item.category === Category.WEB_SERIES ||
                         item.category === Category.TV_SERIAL;
      const isAd = item.category === Category.TV_AD ||
                   item.category === Category.YT_AD;
      const isVideoPod = item.category === Category.YT_VIDEO ||
                         item.category === Category.PODCAST;

      let reviewBody = "";
      if (isLongForm) {
        reviewBody = `I found ${item.title} to be incredibly well-constructed. The writing has layers that demand a second viewing. The direction is spot on.`;
      } else if (isAd) {
        reviewBody = `This ad for ${item.title} does exactly what it needs to do. Highly engaging hook and creative execution under a tight window.`;
      } else {
        reviewBody = `Great information and entertainment. Highly recommend watching ${item.title} if you have time.`;
      }

      const review = await prisma.review.create({
        data: {
          userId: user.id,
          mediaId: item.id,
          rating,
          body: reviewBody,
          rewatched: Math.random() > 0.5,
        },
      });

      // Create SceneNotes depending on Category
      if (isLongForm) {
        const episode = ["TV_SHOW", "WEB_SERIES", "TV_SERIAL"].includes(item.category)
          ? `S1E${index + 1}`
          : null;

        // Top Scenes (1-3 scenes)
        for (let r = 1; r <= 2; r++) {
          await prisma.sceneNote.create({
            data: {
              reviewId: review.id,
              type: SceneNoteType.TOP_SCENE,
              rank: r,
              episodeLabel: episode,
              timestampLabel: `00:${15 * r}:${20 * index}`,
              content: `A spectacular moment in ${item.title} representing climax or thematic tension. The cinematography is stunning.`,
            },
          });
        }

        // Scene that stayed with me
        await prisma.sceneNote.create({
          data: {
            reviewId: review.id,
            type: SceneNoteType.SCENE_THAT_STAYED_WITH_ME,
            content: `The emotional sequence where character choices come to a head. The silence in the background scores this beautifully.`,
          },
        });

        // What I Learnt
        await prisma.sceneNote.create({
          data: {
            reviewId: review.id,
            type: SceneNoteType.WHAT_I_LEARNT,
            content: `Good storytellers build tension slowly. Trust the audience's intelligence instead of spoon-feeding details.`,
          },
        });
      } else if (isAd) {
        await prisma.sceneNote.create({
          data: {
            reviewId: review.id,
            type: SceneNoteType.OTHER,
            content: `The visual punchline/slogan reveal at the end of the commercial.`,
          },
        });
      } else if (isVideoPod) {
        await prisma.sceneNote.create({
          data: {
            reviewId: review.id,
            type: SceneNoteType.WHAT_I_LEARNT,
            timestampLabel: `12:${30 + 10 * index}`,
            content: `Actionable insight regarding the primary topic of discussion. Summarizes the thesis perfectly.`,
          },
        });
      }

      // Add a couple of sample comments and likes
      // User who did not write the review can like/comment
      const commenter = users.find((u) => u.id !== user.id);
      if (commenter) {
        await prisma.like.create({
          data: {
            userId: commenter.id,
            reviewId: review.id,
          },
        });

        await prisma.comment.create({
          data: {
            userId: commenter.id,
            reviewId: review.id,
            body: `Totally agree with this review. Spot on!`,
          },
        });
      }
    }
  }

  console.log("Database seeded successfully with users, reviews, and scene notes!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
