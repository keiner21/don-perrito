ALTER TABLE "Pedido" ADD COLUMN "estadoPago" TEXT NOT NULL DEFAULT 'NO_APLICA';
ALTER TABLE "Pedido" ADD COLUMN "wompiReference" TEXT;
ALTER TABLE "Pedido" ADD COLUMN "wompiTransactionId" TEXT;
ALTER TABLE "Pedido" ADD COLUMN "wompiPaymentUrl" TEXT;

CREATE UNIQUE INDEX "Pedido_wompiReference_key" ON "Pedido"("wompiReference");
