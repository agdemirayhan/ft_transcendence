const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const passwordHash =
    "$2a$10$Q7Qh8SxgEc3mXkMZuSE5h.vFfGh0P95nko1fGwA7d9JmI7Kf5mXU2";

  const usersToUpsert = [
    { username: "ayhan", email: "ayhan@example.com" },
    { username: "tkirmizi", email: "taha@example.com" },
    { username: "mhummel", email: "manuel@example.com" },
    { username: "ldick", email: "leon@example.com" },
    { username: "u1", email: "u1@example.com" },
    { username: "u2", email: "u2@example.com" },
    { username: "u3", email: "u3@example.com" },
    { username: "u4", email: "u4@example.com" },
    { username: "u5", email: "u5@example.com" },
    { username: "u6", email: "u6@example.com" },
  ];

  for (const user of usersToUpsert) {
    await prisma.user.upsert({
      where: { username: user.username },
      update: {},
      create: {
        email: user.email,
        username: user.username,
        passwordHash,
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

  await prisma.comment.deleteMany({});
  await prisma.like.deleteMany({});
  await prisma.post.deleteMany({
    where: {
      authorId: {
        in: [userIdByUsername["ayhan"], userIdByUsername["tkirmizi"]],
      },
    },
  });

  const post1 = await prisma.post.create({
    data: {
      authorId: userIdByUsername["ayhan"],
      content: "First post! 🎉 I'm building a simple social media page.",
    },
  });

  const post2 = await prisma.post.create({
    data: {
      authorId: userIdByUsername["tkirmizi"],
      content: "Building small UIs with React is really enjoyable.",
    },
  });

  await prisma.like.createMany({
    data: [
      { userId: userIdByUsername["ayhan"], postId: post1.id },
      { userId: userIdByUsername["mhummel"], postId: post1.id },
      { userId: userIdByUsername["ldick"], postId: post1.id },
      { userId: userIdByUsername["ayhan"], postId: post2.id },
      { userId: userIdByUsername["tkirmizi"], postId: post2.id },
      { userId: userIdByUsername["mhummel"], postId: post2.id },
      { userId: userIdByUsername["ldick"], postId: post2.id },
      { userId: userIdByUsername["u1"], postId: post2.id },
      { userId: userIdByUsername["u2"], postId: post2.id },
      { userId: userIdByUsername["u3"], postId: post2.id },
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
