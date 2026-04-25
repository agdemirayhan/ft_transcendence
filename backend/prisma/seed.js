const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const passwordHash =
  "$2a$10$Q7Qh8SxgEc3mXkMZuSE5h.vFfGh0P95nko1fGwA7d9JmI7Kf5mXU2";

const adminPasswordHash =
  "$2b$10$VsLj6c5RvaZkfrfyG9bcY.UO4y6xxbHNO1gStVFV3cuTezl740YHi";

const usersToUpsert = [
  {
    username: "ayhan",
    email: "ayhan@example.com",
    bio: "I can develop everything, especially frontends",
    language: "en",
    avatarUrl: "https://via.placeholder.com/150?text=A",
  },
  {
    username: "tkirmizi",
    email: "taha@example.com",
    bio: "Backend focused, shipping every day.",
    language: "en",
    avatarUrl: "https://via.placeholder.com/150?text=T",
  },
  {
    username: "mhummel",
    email: "manuel@example.com",
    bio: "Security is my job",
    language: "en",
    avatarUrl: "https://via.placeholder.com/150?text=M",
  },
  {
    username: "ldick",
    email: "leon@example.com",
    bio: "I enjoy coding a lot.",
    language: "en",
    avatarUrl: "https://via.placeholder.com/150?text=L",
  },
  { username: "noraellis", email: "nora.ellis@example.com", bio: "Product designer who codes.", language: "en", avatarUrl: "https://via.placeholder.com/150?text=NE" },
  { username: "mikehansen", email: "mike.hansen@example.com", bio: "Coffee and API contracts.", language: "en", avatarUrl: "https://via.placeholder.com/150?text=MH" },
  { username: "zoepark", email: "zoe.park@example.com", bio: "Frontend and interaction details.", language: "en", avatarUrl: "https://via.placeholder.com/150?text=ZP" },
  { username: "lucasreed", email: "lucas.reed@example.com", bio: "I break things before users do.", language: "en", avatarUrl: "https://via.placeholder.com/150?text=LR" },
  { username: "alinafox", email: "alina.fox@example.com", bio: "Docs, QA, and release notes.", language: "en", avatarUrl: "https://via.placeholder.com/150?text=AF" },
  { username: "omarstone", email: "omar.stone@example.com", bio: "Infra and observability.", language: "en", avatarUrl: "https://via.placeholder.com/150?text=OS" },
  { username: "ivyng", email: "ivy.ng@example.com", bio: "Animation and motion nerd.", language: "en", avatarUrl: "https://via.placeholder.com/150?text=IN" },
  { username: "danielcho", email: "daniel.cho@example.com", bio: "Database and indexing enjoyer.", language: "en", avatarUrl: "https://via.placeholder.com/150?text=DC" },
  { username: "sarahmiles", email: "sarah.miles@example.com", bio: "Type safety advocate.", language: "en", avatarUrl: "https://via.placeholder.com/150?text=SM" },
  { username: "kevinhartz", email: "kevin.hartz@example.com", bio: "Writes tests first on good days.", language: "en", avatarUrl: "https://via.placeholder.com/150?text=KH" },
];

const hashtags = [
  "transcendence",
  "webdev",
  "nestjs",
  "nextjs",
  "postgres",
  "prisma",
  "socketio",
  "chat",
  "frontend",
  "backend",
  "42network",
  "coding",
];

const postVoiceByUser = {
  ayhan: [
    "I reworked spacing in the UI and it finally feels balanced.",
    "I simplified the cards today and readability improved a lot.",
    "Mobile menu transitions were janky, fixed with a small animation tweak.",
    "I toned down the color palette and the page feels cleaner now.",
  ],
  tkirmizi: [
    "Found a weird race condition in login. Painful, but fixed.",
    "One Prisma query was very slow, indexing brought it back to normal.",
    "Re-read last night's code this morning and simplified the whole block.",
    "What looked like duplicate feed data turned out to be cache behavior.",
  ],
  mhummel: [
    "Retested the 2FA fallback flow and this pass is clean.",
    "Closed one more token-validation edge case.",
    "Tightened rate limits and bot traffic dropped noticeably.",
    "Splitting auth logs by stage made debugging much easier.",
  ],
  ldick: [
    "Simplified realtime event names so traces are easier to read.",
    "No more ghost users on disconnect, finally.",
    "Using ack flow reduced duplicate message sends.",
    "Reconnect behavior is more stable during connection drops.",
  ],
  default: [
    "Small cleanup today, bigger impact than expected.",
    "Tests are green and confidence is back.",
    "Pushed a small fix and deploy went smoothly.",
    "Closed another old TODO.",
    "Made the code easier to read.",
  ],
};

const commentVoice = [
  "Nice work, this version looks better.",
  "I tested it too, fixed on my side as well.",
  "The screen feels much cleaner now.",
  "Can we add one more test for this part?",
  "Great cleanup, keep going.",
  "Let's add this to the release notes too.",
  "Big improvement compared to yesterday.",
  "Looks good to merge.",
];

const dmOpeners = [
  "Are you online?",
  "Can you check something quickly?",
  "I just pushed, did you see it?",
  "Want to do one more check before demo?",
  "Are you seeing the same error?",
  "After coffee, let's dive into this bug.",
];

const dmReplies = [
  "Yep, I saw it. Looking now.",
  "Same here, sending logs now.",
  "Tested locally, works on my side.",
  "Send the PR and I will merge it.",
  "Give me two minutes, tests are finishing.",
  "Agreed, this version is safer.",
];

function createRng(seed = 42) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

function pick(rng, list) {
  return list[Math.floor(rng() * list.length)];
}

function pickManyUnique(rng, list, count) {
  const pool = [...list];
  const result = [];
  const finalCount = Math.min(count, pool.length);
  while (result.length < finalCount) {
    const idx = Math.floor(rng() * pool.length);
    result.push(pool.splice(idx, 1)[0]);
  }
  return result;
}

function daysAgo(days, minuteJitter) {
  const now = Date.now();
  const ms = days * 24 * 60 * 60 * 1000 + minuteJitter * 60 * 1000;
  return new Date(now - ms);
}

function tagsFromContent(content) {
  return content.match(/#[a-z0-9_]+/gi) || [];
}

function buildPostContent(username, rng, coreUsers) {
  const voice = postVoiceByUser[username] || postVoiceByUser.default;
  const base = pick(rng, voice);
  const shouldAddTags = rng() > 0.15;
  if (!shouldAddTags) {
    return base;
  }
  const tagCount = coreUsers.includes(username) ? 2 + Math.floor(rng() * 2) : 1 + Math.floor(rng() * 2);
  const tags = pickManyUnique(rng, hashtags, tagCount);
  return `${base} ${tags.map((t) => `#${t}`).join(" ")}`;
}

function buildCommentContent(rng) {
  const base = pick(rng, commentVoice);
  if (rng() > 0.6) {
    return `${base} #${pick(rng, hashtags)}`;
  }
  return base;
}

async function main() {
  const rng = createRng(424242);

  await prisma.user.upsert({
    where: { username: "admin" },
    update: { role: "admin", email: "admin@admin.com" },
    create: {
      username: "admin",
      email: "admin@admin.com",
      passwordHash: adminPasswordHash,
      role: "admin",
      language: "en",
    },
  });

  for (const user of usersToUpsert) {
    await prisma.user.upsert({
      where: { username: user.username },
      update: {
        bio: user.bio,
        language: user.language,
        avatarUrl: user.avatarUrl,
        onlineStatus: false,
        ...(user.role ? { role: user.role } : {}),
      },
      create: {
        email: user.email,
        username: user.username,
        passwordHash,
        bio: user.bio,
        language: user.language,
        avatarUrl: user.avatarUrl,
        onlineStatus: false,
        ...(user.role ? { role: user.role } : {}),
      },
    });
  }

  const users = await prisma.user.findMany({
    where: {
      username: {
        in: usersToUpsert.map((u) => u.username),
      },
    },
    select: { id: true, username: true, createdAt: true },
  });

  const userIdByUsername = Object.fromEntries(users.map((u) => [u.username, u.id]));
  const seededUserIds = users.map((u) => u.id);
  const coreUsers = ["ayhan", "tkirmizi", "mhummel", "ldick"];

  await prisma.like.deleteMany({
    where: {
      OR: [
        { userId: { in: seededUserIds } },
        { post: { authorId: { in: seededUserIds } } },
      ],
    },
  });
  await prisma.comment.deleteMany({
    where: {
      OR: [
        { authorId: { in: seededUserIds } },
        { post: { authorId: { in: seededUserIds } } },
      ],
    },
  });
  await prisma.message.deleteMany({
    where: {
      OR: [
        { senderId: { in: seededUserIds } },
        { receiverId: { in: seededUserIds } },
      ],
    },
  });
  await prisma.follow.deleteMany({
    where: {
      OR: [
        { followerId: { in: seededUserIds } },
        { followingId: { in: seededUserIds } },
      ],
    },
  });
  await prisma.post.deleteMany({
    where: {
      authorId: { in: seededUserIds },
    },
  });

  const usernames = users.map((u) => u.username);
  const followRows = [];
  const followPairs = new Set();

  for (const username of usernames) {
    const others = usernames.filter((name) => name !== username);
    const followCount = coreUsers.includes(username) ? 6 : 4;
    const picks = pickManyUnique(rng, others, followCount);
    for (const target of picks) {
      const followerId = userIdByUsername[username];
      const followingId = userIdByUsername[target];
      const key = `${followerId}:${followingId}`;
      if (!followPairs.has(key)) {
        followPairs.add(key);
        followRows.push({ followerId, followingId });
      }
    }
  }

  await prisma.follow.createMany({
    data: followRows,
    skipDuplicates: true,
  });

  const createdPosts = [];
  const hashtagCounter = new Map();

  for (const username of usernames) {
    const authorId = userIdByUsername[username];
    const postCount = coreUsers.includes(username) ? 8 : 4;
    for (let i = 0; i < postCount; i += 1) {
      const content = buildPostContent(username, rng, coreUsers);
      const createdAt = daysAgo(Math.floor(rng() * 24), Math.floor(rng() * 1440));
      const post = await prisma.post.create({
        data: {
          authorId,
          content,
          createdAt,
        },
      });
      createdPosts.push(post);
      const tags = tagsFromContent(content);
      for (const tag of tags) {
        const normalized = tag.replace("#", "").toLowerCase();
        hashtagCounter.set(normalized, (hashtagCounter.get(normalized) || 0) + 1);
      }
    }
  }

  const likeRows = [];
  const likePairs = new Set();
  const commentRows = [];

  for (const post of createdPosts) {
    const author = users.find((u) => u.id === post.authorId);
    const possibleLikers = users.filter((u) => u.id !== post.authorId).map((u) => u.id);
    const likeCount = coreUsers.includes(author.username) ? 7 : 4;
    const likers = pickManyUnique(rng, possibleLikers, likeCount);

    for (const userId of likers) {
      const key = `${userId}:${post.id}`;
      if (!likePairs.has(key)) {
        likePairs.add(key);
        likeRows.push({ userId, postId: post.id });
      }
    }

    const commentsPerPost = coreUsers.includes(author.username) ? 3 : 2;
    const commentAuthors = pickManyUnique(rng, possibleLikers, commentsPerPost);
    for (const commenterId of commentAuthors) {
      const message = buildCommentContent(rng);
      commentRows.push({
        postId: post.id,
        authorId: commenterId,
        content: message,
        createdAt: daysAgo(Math.floor(rng() * 20), Math.floor(rng() * 1440)),
      });
    }
  }

  await prisma.like.createMany({
    data: likeRows,
    skipDuplicates: true,
  });
  await prisma.comment.createMany({
    data: commentRows,
    skipDuplicates: true,
  });

  const messageRows = [];
  const pairs = [
    ["ayhan", "tkirmizi"],
    ["ayhan", "mhummel"],
    ["tkirmizi", "ldick"],
    ["mhummel", "ldick"],
    ["noraellis", "mikehansen"],
    ["zoepark", "lucasreed"],
    ["alinafox", "omarstone"],
    ["ivyng", "danielcho"],
    ["sarahmiles", "kevinhartz"],
  ];

  for (const [a, b] of pairs) {
    const aId = userIdByUsername[a];
    const bId = userIdByUsername[b];
    const messageCount = 6 + Math.floor(rng() * 7);
    let senderId = rng() > 0.5 ? aId : bId;
    let receiverId = senderId === aId ? bId : aId;
    for (let i = 0; i < messageCount; i += 1) {
      const body = i === 0 ? pick(rng, dmOpeners) : pick(rng, dmReplies);
      const withTag = rng() > 0.7 ? `${body} #${pick(rng, hashtags)}` : body;
      messageRows.push({
        senderId,
        receiverId,
        content: withTag,
        createdAt: daysAgo(Math.floor(rng() * 14), Math.floor(rng() * 1440)),
      });
      if (rng() > 0.35) {
        const tmp = senderId;
        senderId = receiverId;
        receiverId = tmp;
      }
    }
  }

  await prisma.message.createMany({
    data: messageRows,
    skipDuplicates: true,
  });

  const topTrends = [...hashtagCounter.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag, count]) => `#${tag} (${count})`);

  console.log(`Seed complete:
- users: ${users.length}
- posts: ${createdPosts.length}
- likes: ${likeRows.length}
- comments: ${commentRows.length}
- follows: ${followRows.length}
- messages: ${messageRows.length}
- top trends: ${topTrends.join(", ")}`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
