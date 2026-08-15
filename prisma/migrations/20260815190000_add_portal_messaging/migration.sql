-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'MESSAGE';

-- CreateEnum
CREATE TYPE "PortalConversationStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateTable
CREATE TABLE "PortalConversation" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "assignedAgentId" TEXT,
    "subject" TEXT,
    "status" "PortalConversationStatus" NOT NULL DEFAULT 'OPEN',
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortalConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortalMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortalMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PortalConversation_propertyId_ownerId_key" ON "PortalConversation"("propertyId", "ownerId");
CREATE INDEX "PortalConversation_ownerId_status_lastMessageAt_idx" ON "PortalConversation"("ownerId", "status", "lastMessageAt");
CREATE INDEX "PortalConversation_assignedAgentId_status_lastMessageAt_idx" ON "PortalConversation"("assignedAgentId", "status", "lastMessageAt");
CREATE INDEX "PortalMessage_conversationId_createdAt_idx" ON "PortalMessage"("conversationId", "createdAt");
CREATE INDEX "PortalMessage_senderId_readAt_idx" ON "PortalMessage"("senderId", "readAt");

-- AddForeignKey
ALTER TABLE "PortalConversation" ADD CONSTRAINT "PortalConversation_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PortalConversation" ADD CONSTRAINT "PortalConversation_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PortalConversation" ADD CONSTRAINT "PortalConversation_assignedAgentId_fkey" FOREIGN KEY ("assignedAgentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PortalMessage" ADD CONSTRAINT "PortalMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "PortalConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PortalMessage" ADD CONSTRAINT "PortalMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
