const express = require("express");
const cors = require("cors");
const http = require("http");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const { Server } = require("socket.io");

const bcrypt =
  require("bcryptjs");

const jwt =
  require("jsonwebtoken");

const {
  PrismaClient,
} = require("@prisma/client");

const envPath = path.join(
  __dirname,
  ".env"
);

if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .forEach((line) => {
      const match =
        line.match(
          /^([^#=\s]+)=(.*)$/
        );

      if (
        match &&
        !process.env[match[1]]
      ) {
        process.env[match[1]] =
          match[2].replace(
            /^["']|["']$/g,
            ""
          );
      }
    });
}

const prisma = new PrismaClient();

const METODOS_PAGO = [
  "Efectivo",
  "Nequi",
  "Daviplata",
  "Bancolombia",
  "PSE",
  "Tarjeta",
];

const METODOS_ONLINE = [
  "Nequi",
  "Daviplata",
  "Bancolombia",
  "PSE",
  "Tarjeta",
];

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

function getWompiConfig() {
  return {
    publicKey:
      process.env.WOMPI_PUBLIC_KEY,
    integritySecret:
      process.env.WOMPI_INTEGRITY_SECRET,
    apiUrl:
      process.env.WOMPI_API_URL ||
      (process.env.WOMPI_PUBLIC_KEY?.includes(
        "_test_"
      )
        ? "https://sandbox.wompi.co/v1"
        : "https://production.wompi.co/v1"),
  };
}

function generarReferenciaPago() {
  return `DP-${Date.now()}-${Math.floor(
    Math.random() * 100000
  )}`;
}

function generarFirmaIntegridad(
  reference,
  amountInCents
) {
  const { integritySecret } =
    getWompiConfig();

  if (!integritySecret) {
    throw new Error(
      "Falta WOMPI_INTEGRITY_SECRET"
    );
  }

  return crypto
    .createHash("sha256")
    .update(
      `${reference}${amountInCents}COP${integritySecret}`
    )
    .digest("hex");
}

function crearCheckoutUrl({
  req,
  reference,
  total,
}) {
  const { publicKey } =
    getWompiConfig();

  if (!publicKey) {
    throw new Error(
      "Falta WOMPI_PUBLIC_KEY"
    );
  }

  const amountInCents =
    Math.round(total * 100);

  const clientUrl =
    process.env.CLIENT_URL ||
    req.get("origin") ||
    "http://127.0.0.1:5173";

  const redirectUrl =
    `${clientUrl}/payment-result?reference=${encodeURIComponent(
      reference
    )}`;

  const params =
    new URLSearchParams({
      "public-key":
        publicKey,
      currency:
        "COP",
      "amount-in-cents":
        String(amountInCents),
      reference,
      "signature:integrity":
        generarFirmaIntegridad(
          reference,
          amountInCents
        ),
      "redirect-url":
        redirectUrl,
    });

  return `https://checkout.wompi.co/p/?${params.toString()}`;
}

function mapearEstadoPagoWompi(status) {
  switch (status) {
    case "APPROVED":
      return {
        estadoPago:
          "APROBADO",
        estado:
          "Pendiente",
      };

    case "DECLINED":
    case "VOIDED":
    case "ERROR":
      return {
        estadoPago:
          "RECHAZADO",
        estado:
          "PagoRechazado",
      };

    default:
      return {
        estadoPago:
          "PENDIENTE",
        estado:
          "PendientePago",
      };
  }
}

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
            where: {
              OR: [
                {
                  estadoPago:
                    "NO_APLICA",
                },

                {
                  estadoPago:
                    "APROBADO",
                },
              ],
            },

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
   OBTENER PEDIDO
========================= */

app.get(
  "/pedidos/:id",
  async (req, res) => {
    try {
      const pedido =
        await prisma.pedido.findUnique(
          {
            where: {
              id: Number(
                req.params.id
              ),
            },

            include: {
              items: true,
            },
          }
        );

      if (!pedido) {
        return res
          .status(404)
          .json({
            error:
              "Pedido no encontrado",
          });
      }

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

      if (
        !METODOS_PAGO.includes(
          metodo
        )
      ) {
        return res
          .status(400)
          .json({
            error:
              "Selecciona un método de pago válido",
          });
      }

      const esPagoOnline =
        METODOS_ONLINE.includes(
          metodo
        );

      const wompiReference =
        esPagoOnline
          ? generarReferenciaPago()
          : null;

      const wompiPaymentUrl =
        esPagoOnline
          ? crearCheckoutUrl({
              req,
              reference:
                wompiReference,
              total,
            })
          : null;

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
              esPagoOnline
                ? "PendientePago"
                : "Pendiente",

            estadoPago:
              esPagoOnline
                ? "PENDIENTE"
                : "NO_APLICA",

            wompiReference,

            wompiPaymentUrl,

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

      if (!esPagoOnline) {
        io.emit(
          "nuevo-pedido",
          pedido
        );
      }

      res.json({
        pedido,
        checkoutUrl:
          wompiPaymentUrl,
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
   CONFIRMAR PAGO WOMPI
========================= */

app.get(
  "/pagos/confirmar",
  async (req, res) => {
    try {
      const {
        reference,
        transactionId,
      } = req.query;

      if (!reference) {
        return res
          .status(400)
          .json({
            error:
              "Referencia de pago requerida",
          });
      }

      const pedido =
        await prisma.pedido.findUnique({
          where: {
            wompiReference:
              String(reference),
          },

          include: {
            items: true,
          },
        });

      if (!pedido) {
        return res
          .status(404)
          .json({
            error:
              "Pedido no encontrado",
          });
      }

      if (!transactionId) {
        return res.json({
          pedido,
          status:
            pedido.estadoPago,
        });
      }

      const { apiUrl, publicKey } =
        getWompiConfig();

      if (!publicKey) {
        throw new Error(
          "Falta WOMPI_PUBLIC_KEY"
        );
      }

      const wompiResponse =
        await fetch(
          `${apiUrl}/transactions/${transactionId}`,
          {
            headers: {
              Authorization:
                `Bearer ${publicKey}`,
            },
          }
        );

      const wompiData =
        await wompiResponse.json();

      if (!wompiResponse.ok) {
        return res
          .status(400)
          .json({
            error:
              wompiData.error?.reason ||
              "No pudimos verificar el pago",
          });
      }

      const transaction =
        wompiData.data;

      if (
        transaction.reference !==
        pedido.wompiReference
      ) {
        return res
          .status(400)
          .json({
            error:
              "La referencia de pago no coincide",
          });
      }

      const nuevoEstado =
        mapearEstadoPagoWompi(
          transaction.status
        );

      const pedidoActualizado =
        await prisma.pedido.update({
          where: {
            id:
              pedido.id,
          },

          data: {
            estado:
              nuevoEstado.estado,
            estadoPago:
              nuevoEstado.estadoPago,
            wompiTransactionId:
              String(transactionId),
          },

          include: {
            items: true,
          },
        });

      if (
        pedido.estadoPago !== "APROBADO" &&
        pedidoActualizado.estadoPago ===
          "APROBADO"
      ) {
        io.emit(
          "nuevo-pedido",
          pedidoActualizado
        );
      }

      io.emit(
        "pedido-actualizado",
        pedidoActualizado
      );

      res.json({
        pedido:
          pedidoActualizado,
        status:
          pedidoActualizado.estadoPago,
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
