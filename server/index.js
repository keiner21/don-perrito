const express = require("express");
const cors = require("cors");
const http = require("http");

const { Server } = require("socket.io");

const bcrypt =
  require("bcryptjs");

const jwt =
  require("jsonwebtoken");

const {
  PrismaClient,
} = require("@prisma/client");

const prisma = new PrismaClient();

const app = express();

const server =
  http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(cors());

app.use(express.json());

/* =========================
   SOCKET
========================= */

io.on("connection", () => {
  console.log(
    "Cliente conectado"
  );
});

/* =========================
   TEST
========================= */

app.get("/", (req, res) => {
  res.send(
    "Backend funcionando 🚀"
  );
});

/* =========================
   LOGIN ADMIN
========================= */

app.post(
  "/login",
  async (req, res) => {
    try {
      const {
        email,
        password,
      } = req.body;

      const admin =
        await prisma.admin.findUnique(
          {
            where: {
              email,
            },
          }
        );

      if (!admin) {
        return res
          .status(401)
          .json({
            error:
              "Usuario no encontrado",
          });
      }

      const valid =
        await bcrypt.compare(
          password,
          admin.password
        );

      if (!valid) {
        return res
          .status(401)
          .json({
            error:
              "Contraseña incorrecta",
          });
      }

      const token =
        jwt.sign(
          {
            id: admin.id,
          },

          "donperrito",

          {
            expiresIn:
              "7d",
          }
        );

      res.json({
        token,
      });
    } catch (error) {
      console.log(error);

      res.status(500).json({
        error:
          error.message,
      });
    }
  }
);

/* =========================
   OBTENER PEDIDOS
========================= */

app.get(
  "/pedidos",
  async (req, res) => {
    try {
      const pedidos =
        await prisma.pedido.findMany(
          {
            include: {
              items: true,
            },

            orderBy: {
              fecha: "desc",
            },
          }
        );

      res.json(pedidos);
    } catch (error) {
      console.log(error);

      res.status(500).json({
        error:
          error.message,
      });
    }
  }
);

/* =========================
   CREAR PEDIDO
========================= */

app.post(
  "/pedidos",
  async (req, res) => {
    try {
      const {
        mesa,
        metodo,
        total,
        items,
      } = req.body;

      const numero =
        Math.floor(
          Math.random() * 9000
        );

      const pedido =
        await prisma.pedido.create({
          data: {
            numero,
            mesa,
            metodo,
            total,

            estado:
              "Pendiente",

            fecha:
              new Date().toISOString(),

            items: {
              create:
                items.map(
                  (item) => ({
                    nombre:
                      item.nombre,

                    precio:
                      item.precio,

                    qty:
                      item.qty,
                  })
                ),
            },
          },

          include: {
            items: true,
          },
        });

      io.emit(
        "nuevo-pedido",
        pedido
      );

      res.json(pedido);
    } catch (error) {
      console.log(error);

      res.status(500).json({
        error:
          error.message,
      });
    }
  }
);

/* =========================
   ACTUALIZAR ESTADO
========================= */

app.put(
  "/pedidos/:id/estado",
  async (req, res) => {
    try {
      const { estado } =
        req.body;

      const pedido =
        await prisma.pedido.update({
          where: {
            id: Number(
              req.params.id
            ),
          },

          data: {
            estado,
          },

          include: {
            items: true,
          },
        });

      io.emit(
        "pedido-actualizado",
        pedido
      );

      res.json(pedido);
    } catch (error) {
      console.log(error);

      res.status(500).json({
        error:
          error.message,
      });
    }
  }
);

/* =========================
   START
========================= */

const PORT =
  process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(
    "Servidor corriendo en puerto",
    PORT
  );
});
