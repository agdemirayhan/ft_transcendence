const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const passwordHash =
    "$2a$10$Q7Qh8SxgEc3mXkMZuSE5h.vFfGh0P95nko1fGwA7d9JmI7Kf5mXU2";

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
      bio: "BEST DEVELOPER IN DA WORLD",
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
    { username: "u1", email: "u1@example.com", bio: "Demo user 1", language: "en", avatarUrl: "https://via.placeholder.com/150?text=U1" },
    { username: "u2", email: "u2@example.com", bio: "Demo user 2", language: "en", avatarUrl: "https://via.placeholder.com/150?text=U2" },
    { username: "u3", email: "u3@example.com", bio: "Demo user 3", language: "en", avatarUrl: "https://via.placeholder.com/150?text=U3" },
    { username: "u4", email: "u4@example.com", bio: "Demo user 4", language: "en", avatarUrl: "https://via.placeholder.com/150?text=U4" },
    { username: "u5", email: "u5@example.com", bio: "Demo user 5", language: "en", avatarUrl: "https://via.placeholder.com/150?text=U5" },
    { username: "u6", email: "u6@example.com", bio: "Demo user 6", language: "en", avatarUrl: "https://via.placeholder.com/150?text=U6" },
  ];

  for (const user of usersToUpsert) {
    await prisma.user.upsert({
      where: { username: user.username },
      update: {
        bio: user.bio,
        language: user.language,
        avatarUrl: user.avatarUrl,
        onlineStatus: false,
      },
      create: {
        email: user.email,
        username: user.username,
        passwordHash,
        bio: user.bio,
        language: user.language,
        avatarUrl: user.avatarUrl,
        onlineStatus: false,
      },
    });
  }

  const users = await prisma.user.findMany({
    where: {
      username: {
        in: usersToUpsert.map((u) => u.username),
      },
    },
    select: { id: true, username: true },
  });

  const userIdByUsername = Object.fromEntries(users.map((u) => [u.username, u.id]));

  await prisma.follow.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.like.deleteMany({});
  await prisma.post.deleteMany({
    where: {
      authorId: {
        in: [
          userIdByUsername["ayhan"],
          userIdByUsername["tkirmizi"],
          userIdByUsername["mhummel"],
          userIdByUsername["ldick"],
        ],
      },
    },
  });

  const postAyhan1 = await prisma.post.create({
    data: {
      authorId: userIdByUsername["ayhan"],
      content: "First post! 🎉 I'm building a simple social media page.",
    },
  });

  const postTaha1 = await prisma.post.create({
    data: {
      authorId: userIdByUsername["tkirmizi"],
      content: "Building small UIs with React is really funny.",
    },
  });

  const postManuel1 = await prisma.post.create({
    data: {
      authorId: userIdByUsername["mhummel"],
      content: "Authentication flow is stable now guys",
    },
  });

  const postLeon1 = await prisma.post.create({
    data: {
      authorId: userIdByUsername["ldick"],
      content: "2FA building is really enjoyable.",
    },
  });

  const postAyhan2 = await prisma.post.create({
    data: {
      authorId: userIdByUsername["ayhan"],
      content: "Well done guys",
    },
  });

  await prisma.like.createMany({
    data: [
      { userId: userIdByUsername["ayhan"], postId: postAyhan1.id },
      { userId: userIdByUsername["mhummel"], postId: postAyhan1.id },
      { userId: userIdByUsername["ldick"], postId: postAyhan1.id },
      { userId: userIdByUsername["ayhan"], postId: postTaha1.id },
      { userId: userIdByUsername["tkirmizi"], postId: postTaha1.id },
      { userId: userIdByUsername["mhummel"], postId: postTaha1.id },
      { userId: userIdByUsername["ldick"], postId: postTaha1.id },
      { userId: userIdByUsername["u1"], postId: postTaha1.id },
      { userId: userIdByUsername["u2"], postId: postTaha1.id },
      { userId: userIdByUsername["u3"], postId: postTaha1.id },
      { userId: userIdByUsername["u4"], postId: postManuel1.id },
      { userId: userIdByUsername["u5"], postId: postManuel1.id },
      { userId: userIdByUsername["u6"], postId: postLeon1.id },
      { userId: userIdByUsername["tkirmizi"], postId: postAyhan2.id },
      { userId: userIdByUsername["mhummel"], postId: postAyhan2.id },
    ],
    skipDuplicates: true,
  });

  await prisma.comment.createMany({
    data: [
      {
        postId: postAyhan1.id,
        authorId: userIdByUsername["tkirmizi"],
        content: "Nice start Ayhan abi. The layout already feels clean.",
      },
      {
        postId: postAyhan1.id,
        authorId: userIdByUsername["mhummel"],
        content: "Good momentum. Keep shipping.",
      },
      {
        postId: postTaha1.id,
        authorId: userIdByUsername["ayhan"],
        content: "Agreed.",
      },
      {
        postId: postLeon1.id,
        authorId: userIdByUsername["u1"],
        content: "Security is always important",
      },
      {
        postId: postAyhan2.id,
        authorId: userIdByUsername["ldick"],
        content: "Thanksss",
      },
    ],
    skipDuplicates: true,
  });

  await prisma.follow.createMany({
    data: [
      { followerId: userIdByUsername["ayhan"], followingId: userIdByUsername["tkirmizi"] },
      { followerId: userIdByUsername["ayhan"], followingId: userIdByUsername["mhummel"] },
      { followerId: userIdByUsername["tkirmizi"], followingId: userIdByUsername["ayhan"] },
      { followerId: userIdByUsername["tkirmizi"], followingId: userIdByUsername["ldick"] },
      { followerId: userIdByUsername["mhummel"], followingId: userIdByUsername["ayhan"] },
      { followerId: userIdByUsername["ldick"], followingId: userIdByUsername["ayhan"] },
      { followerId: userIdByUsername["u1"], followingId: userIdByUsername["ayhan"] },
      { followerId: userIdByUsername["u2"], followingId: userIdByUsername["ayhan"] },
      { followerId: userIdByUsername["u3"], followingId: userIdByUsername["ayhan"] },
      { followerId: userIdByUsername["u4"], followingId: userIdByUsername["tkirmizi"] },
      { followerId: userIdByUsername["u5"], followingId: userIdByUsername["tkirmizi"] },
      { followerId: userIdByUsername["u6"], followingId: userIdByUsername["mhummel"] },
    ],
    skipDuplicates: true,
  });
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
