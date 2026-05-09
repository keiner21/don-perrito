const express = require("express");
const cors = require("cors");
const http = require("http");

const { Server } = require("socket.io");

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

io.on("connection", (socket) => {
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
        error: error.message,
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
            estado: "Pendiente",

            fecha: new Date(),

            items: {
              create: items.map(
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
        error: error.message,
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
        error: error.message,
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
