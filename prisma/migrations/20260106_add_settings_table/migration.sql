-- CreateTable: Settings
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL,
    "notificationEmail" TEXT,
    "sendOrderConfirmation" BOOLEAN NOT NULL DEFAULT true,
    "sendStatusUpdates" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);
