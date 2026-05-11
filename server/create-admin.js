const bcrypt = require("bcryptjs");

const {
  PrismaClient,
} = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const hash =
    await bcrypt.hash(
      "123456",
      10
    );

  await prisma.admin.create({
    data: {
      email:
        "admin@donperrito.com",

      password: hash,
    },
  });

  console.log(
    "ADMIN CREADO 🔥"
  );
}

main();
