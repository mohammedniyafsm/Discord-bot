-- CreateTable
CREATE TABLE "InteractionLog" (
    "id" TEXT NOT NULL,
    "discordInteractionId" TEXT NOT NULL,
    "commandName" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "inputText" TEXT,
    "responseSent" TEXT NOT NULL,
    "mirrored" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InteractionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommandConfig" (
    "id" TEXT NOT NULL,
    "commandName" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "replyMessage" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommandConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InteractionLog_discordInteractionId_key" ON "InteractionLog"("discordInteractionId");

-- CreateIndex
CREATE UNIQUE INDEX "CommandConfig_commandName_key" ON "CommandConfig"("commandName");
