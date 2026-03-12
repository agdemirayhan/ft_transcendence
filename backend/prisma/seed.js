const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  await prisma.user.createMany({
    data: [
      {
        email: "Jonathan@example.com",
        username: "jnthn",
        passwordHash: "$2a$10$Q7Qh8SxgEc3mXkMZuSE5h.vFfGh0P95nko1fGwA7d9JmI7Kf5mXU2",
      },
      {
        email: "Robin@example.com",
        username: "robin",
        passwordHash: "$2a$10$Q7Qh8SxgEc3mXkMZuSE5h.vFfGh0P95nko1fGwA7d9JmI7Kf5mXU2",
      },
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
