const bcrypt = require("bcryptjs");

const prisma = require("./prismaClient");

async function main() {
  const hashedPassword =
    await bcrypt.hash("123456", 10);

  await prisma.admin.create({
    data: {
      email: "admin@donperrito.com",
      password: hashedPassword,
    },
  });

  console.log("Admin creado");
}

main();
