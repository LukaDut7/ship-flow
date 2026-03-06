-- CreateEnum
CREATE TYPE "UserTier" AS ENUM ('FREE', 'PRO', 'PRO_AGENTS');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "Phase" AS ENUM ('IDEATION', 'PLANNING', 'DESIGN', 'ARCHITECTURE', 'DEVELOPMENT', 'TESTING', 'SHIPPING', 'ITERATION');

-- CreateEnum
CREATE TYPE "DocType" AS ENUM ('PROJECT_BRIEF', 'USER_RESEARCH', 'FEATURE_SPEC', 'DESIGN_SYSTEM', 'WIREFRAME_NOTES', 'TECH_DECISION', 'API_CONTRACT', 'DATA_MODEL', 'IMPLEMENTATION_NOTES', 'ENV_SETUP', 'TEST_STRATEGY', 'DEPLOY_CONFIG', 'LAUNCH_CHECKLIST', 'ITERATION_LOG', 'FEEDBACK_CAPTURE');

-- CreateEnum
CREATE TYPE "TargetTool" AS ENUM ('CURSOR', 'CLAUDE_PROJECTS', 'CLAUDE_CODE', 'CHATGPT', 'GENERIC');

-- CreateEnum
CREATE TYPE "LinkType" AS ENUM ('REFERENCES', 'DEPENDS_ON', 'IMPLEMENTS', 'SUPERSEDES');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "tier" "UserTier" NOT NULL DEFAULT 'FREE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "techStack" JSONB NOT NULL DEFAULT '[]',
    "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "phase" "Phase" NOT NULL,
    "docType" "DocType" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isFromTemplate" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentLink" (
    "id" TEXT NOT NULL,
    "fromDocId" TEXT NOT NULL,
    "toDocId" TEXT NOT NULL,
    "linkType" "LinkType" NOT NULL DEFAULT 'REFERENCES',

    CONSTRAINT "DocumentLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContextBundle" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "isPreset" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ContextBundle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BundleDocument" (
    "id" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BundleDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedPrompt" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "documentId" TEXT,
    "targetTool" "TargetTool" NOT NULL,
    "promptContent" TEXT NOT NULL,
    "options" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeneratedPrompt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "Project_userId_idx" ON "Project"("userId");

-- CreateIndex
CREATE INDEX "Document_projectId_idx" ON "Document"("projectId");

-- CreateIndex
CREATE INDEX "Document_projectId_phase_idx" ON "Document"("projectId", "phase");

-- CreateIndex
CREATE INDEX "DocumentLink_fromDocId_idx" ON "DocumentLink"("fromDocId");

-- CreateIndex
CREATE INDEX "DocumentLink_toDocId_idx" ON "DocumentLink"("toDocId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentLink_fromDocId_toDocId_key" ON "DocumentLink"("fromDocId", "toDocId");

-- CreateIndex
CREATE INDEX "ContextBundle_projectId_idx" ON "ContextBundle"("projectId");

-- CreateIndex
CREATE INDEX "BundleDocument_bundleId_idx" ON "BundleDocument"("bundleId");

-- CreateIndex
CREATE UNIQUE INDEX "BundleDocument_bundleId_documentId_key" ON "BundleDocument"("bundleId", "documentId");

-- CreateIndex
CREATE INDEX "GeneratedPrompt_projectId_idx" ON "GeneratedPrompt"("projectId");

-- CreateIndex
CREATE INDEX "GeneratedPrompt_projectId_createdAt_idx" ON "GeneratedPrompt"("projectId", "createdAt");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentLink" ADD CONSTRAINT "DocumentLink_fromDocId_fkey" FOREIGN KEY ("fromDocId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentLink" ADD CONSTRAINT "DocumentLink_toDocId_fkey" FOREIGN KEY ("toDocId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContextBundle" ADD CONSTRAINT "ContextBundle_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BundleDocument" ADD CONSTRAINT "BundleDocument_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "ContextBundle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BundleDocument" ADD CONSTRAINT "BundleDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedPrompt" ADD CONSTRAINT "GeneratedPrompt_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedPrompt" ADD CONSTRAINT "GeneratedPrompt_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;
