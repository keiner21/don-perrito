const express = require("express");
const cors = require("cors");

const http = require("http");

const jwt = require("jsonwebtoken");

const bcrypt = require("bcryptjs");

const { Server } = require("socket.io");

const prisma = require("./prismaClient");

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
  },
});

const JWT_SECRET = "donperrito_secret";

app.use(cors());

app.use(express.json());

io.on("connection", (socket) => {
  console.log(
    "Cliente conectado:",
    socket.id
  );

  socket.on("disconnect", () => {
    console.log("Cliente desconectado");
  });
});

app.get("/", (req, res) => {
  res.json({
    message:
      "API Don Perrito funcionando 🚀",
  });
});

/* =========================
   LOGIN ADMIN
========================= */

app.post("/login", async (req, res) => {
  try {
    const { email, password } =
      req.body;

    const admin =
      await prisma.admin.findUnique({
        where: {
          email,
        },
      });

    if (!admin) {
      return res.status(401).json({
        error: "Usuario no existe",
      });
    }

    const validPassword =
      await bcrypt.compare(
        password,
        admin.password
      );

    if (!validPassword) {
      return res.status(401).json({
        error:
          "Contraseña incorrecta",
      });
    }

    const token = jwt.sign(
      {
        adminId: admin.id,
      },
      JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.json({
      token,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Error login",
    });
  }
});

/* =========================
   OBTENER PEDIDOS
========================= */

app.get("/pedidos", async (req, res) => {
  try {
    const pedidos =
      await prisma.pedido.findMany({
        include: {
          items: true,
        },

        orderBy: {
          id: "desc",
        },
      });

    res.json(pedidos);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error:
        "Error obteniendo pedidos",
    });
  }
});

/* =========================
   CREAR PEDIDO
========================= */

app.post("/pedidos", async (req, res) => {
  try {
    const pedido = req.body;

    const nuevoPedido =
      await prisma.pedido.create({
        data: {
          numero: pedido.numero,

          mesa: pedido.mesa,

          metodo: pedido.metodo,

          total: Number(
            pedido.total
          ),

          estado: pedido.estado,

          fecha: pedido.fecha,

          items: {
            create: pedido.items.map(
              (item) => ({
                nombre:
                  item.nombre,

                precio: Number(
                  item.precio
                ),

                qty: item.qty,
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
      nuevoPedido
    );

    res.status(201).json(
      nuevoPedido
    );
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error:
        "Error creando pedido",
    });
  }
});

/* =========================
   ACTUALIZAR ESTADO
========================= */

app.put(
  "/pedidos/:id/estado",
  async (req, res) => {
    try {
      const { id } = req.params;

      const { estado } = req.body;

      const pedido =
        await prisma.pedido.update({
          where: {
            id: Number(id),
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
      console.error(error);

      res.status(500).json({
        error:
          "Error actualizando estado",
      });
    }
  }
);

const PORT = 3000;

server.listen(PORT, () => {
  console.log(
    `Servidor corriendo en puerto ${PORT}`
  );
});
