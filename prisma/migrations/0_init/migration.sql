-- CreateEnum
CREATE TYPE "ApplicationCategory" AS ENUM ('HealthApplication', 'EducationApplication', 'ReferenceApplication', 'DeveloperApplication', 'UtilitiesApplication');

-- CreateEnum
CREATE TYPE "AdditionalType" AS ENUM ('https://schema.org/ScholarlyArticle', 'https://schema.org/SoftwareSourceCode');

-- CreateEnum
CREATE TYPE "MaintainerType" AS ENUM ('Person', 'Organization');

-- CreateEnum
CREATE TYPE "OperatingSystem" AS ENUM ('Windows', 'macOS', 'Linux', 'Unix', 'Cross-platform');

-- CreateEnum
CREATE TYPE "ProgrammingLanguage" AS ENUM ('Python', 'TypeScript', 'JavaScript', 'R', 'Julia', 'Java', 'Go', 'Rust', 'C#', 'C++', 'Other');

-- CreateEnum
CREATE TYPE "LicenseIdentifier" AS ENUM ('UNKNOWN', '0BSD', 'AAL', 'AFL-1.1', 'AFL-1.2', 'AFL-2.0', 'AFL-2.1', 'AFL-3.0', 'AGPL-3.0-only', 'AGPL-3.0-or-later', 'Apache-1.1', 'Apache-2.0', 'APL-1.0', 'APSL-1.0', 'APSL-1.1', 'APSL-1.2', 'APSL-2.0', 'Artistic-1.0', 'Artistic-1.0-cl8', 'Artistic-1.0-Perl', 'Artistic-2.0', 'BSD-1-Clause', 'BSD-2-Clause', 'BSD-2-Clause-Patent', 'BSD-3-Clause', 'BSD-3-Clause-LBNL', 'BSL-1.0', 'CAL-1.0', 'CAL-1.0-Combined-Work-Exception', 'CATOSL-1.1', 'CDDL-1.0', 'CECILL-2.1', 'CERN-OHL-P-2.0', 'CERN-OHL-S-2.0', 'CERN-OHL-W-2.0', 'CNRI-Python', 'CPAL-1.0', 'CPL-1.0', 'CUA-OPL-1.0', 'ECL-1.0', 'ECL-2.0', 'EFL-1.0', 'EFL-2.0', 'Entessa', 'EPL-1.0', 'EPL-2.0', 'EUDatagrid', 'EUPL-1.1', 'EUPL-1.2', 'Fair', 'Frameworx-1.0', 'GPL-2.0-only', 'GPL-2.0-or-later', 'GPL-3.0-only', 'GPL-3.0-or-later', 'HPND', 'Intel', 'IPA', 'IPL-1.0', 'ISC', 'Jam', 'LGPL-2.0-only', 'LGPL-2.0-or-later', 'LGPL-2.1-only', 'LGPL-2.1-or-later', 'LGPL-3.0-only', 'LGPL-3.0-or-later', 'LiLiQ-P-1.1', 'LiLiQ-R-1.1', 'LiLiQ-Rplus-1.1', 'LPL-1.0', 'LPL-1.02', 'LPPL-1.3c', 'MirOS', 'MIT', 'MIT-0', 'MIT-Modern-Variant', 'Motosoto', 'MPL-1.0', 'MPL-1.1', 'MPL-2.0', 'MPL-2.0-no-copyleft-exception', 'MS-PL', 'MS-RL', 'MulanPSL-2.0', 'Multics', 'NASA-1.3', 'Naumen', 'NCSA', 'NGPL', 'Nokia', 'NPOSL-3.0', 'NTP', 'OCLC-2.0', 'OFL-1.1', 'OFL-1.1-no-RFN', 'OFL-1.1-RFN', 'OGTSL', 'OLDAP-2.8', 'OSET-PL-2.1', 'OSL-1.0', 'OSL-2.0', 'OSL-2.1', 'OSL-3.0', 'PHP-3.0', 'PHP-3.01', 'PostgreSQL', 'Python-2.0', 'QPL-1.0', 'RPL-1.1', 'RPL-1.5', 'RPSL-1.0', 'RSCPL', 'SimPL-2.0', 'SISSL', 'Sleepycat', 'SPL-1.0', 'UCL-1.0', 'Unicode-DFS-2016', 'Unlicense', 'UPL-1.0', 'VSL-1.0', 'W3C', 'Watcom-1.0', 'Xnet', 'Zlib', 'ZPL-2.0', 'ZPL-2.1');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'BLOCKED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatRateLimit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "windowStartTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastRequestTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatRateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimit" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "ipAddress" TEXT,
    "resourceType" TEXT NOT NULL,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "windowStartTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastRequestTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("provider","providerAccountId")
);

-- CreateTable
CREATE TABLE "Session" (
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("identifier","token")
);

-- CreateTable
CREATE TABLE "Authenticator" (
    "credentialID" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "credentialPublicKey" TEXT NOT NULL,
    "counter" INTEGER NOT NULL,
    "credentialDeviceType" TEXT NOT NULL,
    "credentialBackedUp" BOOLEAN NOT NULL,
    "transports" TEXT,

    CONSTRAINT "Authenticator_pkey" PRIMARY KEY ("userId","credentialID")
);

-- CreateTable
CREATE TABLE "McpServer" (
    "id" TEXT NOT NULL,
    "context" TEXT NOT NULL DEFAULT 'https://schema.org',
    "type" TEXT NOT NULL DEFAULT 'SoftwareApplication',
    "uri" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(1000) NOT NULL,
    "codeRepository" TEXT NOT NULL,
    "softwareHelpUrl" TEXT,
    "softwareHelpName" TEXT,
    "url" TEXT,
    "datePublished" TIMESTAMP(3),
    "applicationCategory" "ApplicationCategory" NOT NULL DEFAULT 'HealthApplication',
    "license" TEXT NOT NULL DEFAULT 'Unknown',
    "installationConfig" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "McpServer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "McpServerReport" (
    "id" TEXT NOT NULL,
    "mcpServerId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "isReviews" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "McpServerReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "McpServerAdditionalType" (
    "id" TEXT NOT NULL,
    "mcpServerId" TEXT NOT NULL,
    "type" "AdditionalType" NOT NULL,

    CONSTRAINT "McpServerAdditionalType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "McpServerMaintainer" (
    "id" TEXT NOT NULL,
    "mcpServerId" TEXT NOT NULL,
    "type" "MaintainerType" NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "identifier" TEXT,
    "url" TEXT,

    CONSTRAINT "McpServerMaintainer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "McpServerKeyword" (
    "id" TEXT NOT NULL,
    "mcpServerId" TEXT NOT NULL,
    "keyword" VARCHAR(30) NOT NULL,

    CONSTRAINT "McpServerKeyword_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "McpServerOperatingSystem" (
    "id" TEXT NOT NULL,
    "mcpServerId" TEXT NOT NULL,
    "operatingSystem" "OperatingSystem" NOT NULL,

    CONSTRAINT "McpServerOperatingSystem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "McpServerProgrammingLanguage" (
    "id" TEXT NOT NULL,
    "mcpServerId" TEXT NOT NULL,
    "programmingLanguage" "ProgrammingLanguage" NOT NULL,

    CONSTRAINT "McpServerProgrammingLanguage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "McpServerFeature" (
    "id" TEXT NOT NULL,
    "mcpServerId" TEXT NOT NULL,
    "feature" TEXT NOT NULL,

    CONSTRAINT "McpServerFeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GitHubStars" (
    "id" TEXT NOT NULL,
    "mcpServerId" TEXT NOT NULL,
    "starCount" INTEGER NOT NULL DEFAULT 0,
    "lastChecked" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GitHubStars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GitHubReadme" (
    "id" TEXT NOT NULL,
    "mcpServerId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "encoding" TEXT NOT NULL DEFAULT 'base64',
    "sha" TEXT,
    "size" INTEGER,
    "lastChecked" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GitHubReadme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "McpServerTool" (
    "id" TEXT NOT NULL,
    "mcpServerId" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "inputSchema" TEXT,
    "outputSchema" TEXT,
    "lastChecked" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "McpServerTool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500),
    "keywords" TEXT[],
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionItem" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "mcpServerId" TEXT NOT NULL,
    "notes" TEXT,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollectionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "modelName" TEXT,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "reasoningTokens" INTEGER NOT NULL DEFAULT 0,
    "cachedInputTokens" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessageToolCalls" (
    "id" TEXT NOT NULL,
    "chatMessageId" TEXT NOT NULL,
    "mcpServerId" TEXT,
    "toolName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatMessageToolCalls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "reviewBody" TEXT NOT NULL,
    "isHelpful" BOOLEAN NOT NULL,
    "datePublished" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isPending" BOOLEAN NOT NULL DEFAULT true,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "authorId" TEXT NOT NULL,
    "mcpServerId" TEXT NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogPost" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" VARCHAR(500),
    "content" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "metaTitle" VARCHAR(200),
    "metaDescription" VARCHAR(500),
    "keywords" TEXT[],
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ChatRateLimit_userId_key" ON "ChatRateLimit"("userId");

-- CreateIndex
CREATE INDEX "ChatRateLimit_userId_idx" ON "ChatRateLimit"("userId");

-- CreateIndex
CREATE INDEX "ChatRateLimit_windowStartTime_idx" ON "ChatRateLimit"("windowStartTime");

-- CreateIndex
CREATE INDEX "RateLimit_userId_resourceType_idx" ON "RateLimit"("userId", "resourceType");

-- CreateIndex
CREATE INDEX "RateLimit_ipAddress_resourceType_idx" ON "RateLimit"("ipAddress", "resourceType");

-- CreateIndex
CREATE INDEX "RateLimit_windowStartTime_idx" ON "RateLimit"("windowStartTime");

-- CreateIndex
CREATE UNIQUE INDEX "RateLimit_userId_resourceType_key" ON "RateLimit"("userId", "resourceType");

-- CreateIndex
CREATE UNIQUE INDEX "RateLimit_ipAddress_resourceType_key" ON "RateLimit"("ipAddress", "resourceType");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "Authenticator_credentialID_key" ON "Authenticator"("credentialID");

-- CreateIndex
CREATE UNIQUE INDEX "McpServer_uri_key" ON "McpServer"("uri");

-- CreateIndex
CREATE UNIQUE INDEX "McpServer_identifier_key" ON "McpServer"("identifier");

-- CreateIndex
CREATE INDEX "McpServer_identifier_idx" ON "McpServer"("identifier");

-- CreateIndex
CREATE INDEX "McpServer_name_idx" ON "McpServer"("name");

-- CreateIndex
CREATE INDEX "McpServer_applicationCategory_idx" ON "McpServer"("applicationCategory");

-- CreateIndex
CREATE INDEX "McpServer_datePublished_idx" ON "McpServer"("datePublished");

-- CreateIndex
CREATE UNIQUE INDEX "McpServerAdditionalType_mcpServerId_type_key" ON "McpServerAdditionalType"("mcpServerId", "type");

-- CreateIndex
CREATE INDEX "McpServerMaintainer_mcpServerId_idx" ON "McpServerMaintainer"("mcpServerId");

-- CreateIndex
CREATE INDEX "McpServerKeyword_keyword_idx" ON "McpServerKeyword"("keyword");

-- CreateIndex
CREATE UNIQUE INDEX "McpServerKeyword_mcpServerId_keyword_key" ON "McpServerKeyword"("mcpServerId", "keyword");

-- CreateIndex
CREATE UNIQUE INDEX "McpServerOperatingSystem_mcpServerId_operatingSystem_key" ON "McpServerOperatingSystem"("mcpServerId", "operatingSystem");

-- CreateIndex
CREATE UNIQUE INDEX "McpServerProgrammingLanguage_mcpServerId_programmingLanguag_key" ON "McpServerProgrammingLanguage"("mcpServerId", "programmingLanguage");

-- CreateIndex
CREATE UNIQUE INDEX "McpServerFeature_mcpServerId_feature_key" ON "McpServerFeature"("mcpServerId", "feature");

-- CreateIndex
CREATE INDEX "GitHubStars_mcpServerId_idx" ON "GitHubStars"("mcpServerId");

-- CreateIndex
CREATE INDEX "GitHubStars_lastChecked_idx" ON "GitHubStars"("lastChecked");

-- CreateIndex
CREATE UNIQUE INDEX "GitHubStars_mcpServerId_key" ON "GitHubStars"("mcpServerId");

-- CreateIndex
CREATE INDEX "GitHubReadme_mcpServerId_idx" ON "GitHubReadme"("mcpServerId");

-- CreateIndex
CREATE INDEX "GitHubReadme_lastChecked_idx" ON "GitHubReadme"("lastChecked");

-- CreateIndex
CREATE UNIQUE INDEX "GitHubReadme_mcpServerId_key" ON "GitHubReadme"("mcpServerId");

-- CreateIndex
CREATE INDEX "McpServerTool_mcpServerId_idx" ON "McpServerTool"("mcpServerId");

-- CreateIndex
CREATE INDEX "McpServerTool_name_idx" ON "McpServerTool"("name");

-- CreateIndex
CREATE INDEX "McpServerTool_lastChecked_idx" ON "McpServerTool"("lastChecked");

-- CreateIndex
CREATE UNIQUE INDEX "Collection_slug_key" ON "Collection"("slug");

-- CreateIndex
CREATE INDEX "Collection_ownerId_idx" ON "Collection"("ownerId");

-- CreateIndex
CREATE INDEX "Collection_slug_idx" ON "Collection"("slug");

-- CreateIndex
CREATE INDEX "Collection_isPublic_idx" ON "Collection"("isPublic");

-- CreateIndex
CREATE INDEX "Collection_name_idx" ON "Collection"("name");

-- CreateIndex
CREATE INDEX "CollectionItem_collectionId_idx" ON "CollectionItem"("collectionId");

-- CreateIndex
CREATE INDEX "CollectionItem_mcpServerId_idx" ON "CollectionItem"("mcpServerId");

-- CreateIndex
CREATE INDEX "CollectionItem_addedAt_idx" ON "CollectionItem"("addedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionItem_collectionId_mcpServerId_key" ON "CollectionItem"("collectionId", "mcpServerId");

-- CreateIndex
CREATE INDEX "ChatMessageToolCalls_chatMessageId_idx" ON "ChatMessageToolCalls"("chatMessageId");

-- CreateIndex
CREATE INDEX "Review_mcpServerId_idx" ON "Review"("mcpServerId");

-- CreateIndex
CREATE INDEX "Review_isHelpful_idx" ON "Review"("isHelpful");

-- CreateIndex
CREATE INDEX "Review_datePublished_idx" ON "Review"("datePublished");

-- CreateIndex
CREATE INDEX "Review_isPending_idx" ON "Review"("isPending");

-- CreateIndex
CREATE INDEX "Review_isApproved_idx" ON "Review"("isApproved");

-- CreateIndex
CREATE UNIQUE INDEX "Review_authorId_mcpServerId_key" ON "Review"("authorId", "mcpServerId");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_slug_key" ON "BlogPost"("slug");

-- CreateIndex
CREATE INDEX "BlogPost_slug_idx" ON "BlogPost"("slug");

-- CreateIndex
CREATE INDEX "BlogPost_published_idx" ON "BlogPost"("published");

-- CreateIndex
CREATE INDEX "BlogPost_publishedAt_idx" ON "BlogPost"("publishedAt");

-- CreateIndex
CREATE INDEX "BlogPost_authorId_idx" ON "BlogPost"("authorId");

-- CreateIndex
CREATE INDEX "BlogPost_createdAt_idx" ON "BlogPost"("createdAt");

-- AddForeignKey
ALTER TABLE "ChatRateLimit" ADD CONSTRAINT "ChatRateLimit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Authenticator" ADD CONSTRAINT "Authenticator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "McpServerReport" ADD CONSTRAINT "McpServerReport_mcpServerId_fkey" FOREIGN KEY ("mcpServerId") REFERENCES "McpServer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "McpServerAdditionalType" ADD CONSTRAINT "McpServerAdditionalType_mcpServerId_fkey" FOREIGN KEY ("mcpServerId") REFERENCES "McpServer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "McpServerMaintainer" ADD CONSTRAINT "McpServerMaintainer_mcpServerId_fkey" FOREIGN KEY ("mcpServerId") REFERENCES "McpServer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "McpServerKeyword" ADD CONSTRAINT "McpServerKeyword_mcpServerId_fkey" FOREIGN KEY ("mcpServerId") REFERENCES "McpServer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "McpServerOperatingSystem" ADD CONSTRAINT "McpServerOperatingSystem_mcpServerId_fkey" FOREIGN KEY ("mcpServerId") REFERENCES "McpServer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "McpServerProgrammingLanguage" ADD CONSTRAINT "McpServerProgrammingLanguage_mcpServerId_fkey" FOREIGN KEY ("mcpServerId") REFERENCES "McpServer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "McpServerFeature" ADD CONSTRAINT "McpServerFeature_mcpServerId_fkey" FOREIGN KEY ("mcpServerId") REFERENCES "McpServer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GitHubStars" ADD CONSTRAINT "GitHubStars_mcpServerId_fkey" FOREIGN KEY ("mcpServerId") REFERENCES "McpServer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GitHubReadme" ADD CONSTRAINT "GitHubReadme_mcpServerId_fkey" FOREIGN KEY ("mcpServerId") REFERENCES "McpServer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "McpServerTool" ADD CONSTRAINT "McpServerTool_mcpServerId_fkey" FOREIGN KEY ("mcpServerId") REFERENCES "McpServer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionItem" ADD CONSTRAINT "CollectionItem_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionItem" ADD CONSTRAINT "CollectionItem_mcpServerId_fkey" FOREIGN KEY ("mcpServerId") REFERENCES "McpServer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessageToolCalls" ADD CONSTRAINT "ChatMessageToolCalls_mcpServerId_fkey" FOREIGN KEY ("mcpServerId") REFERENCES "McpServer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessageToolCalls" ADD CONSTRAINT "ChatMessageToolCalls_chatMessageId_fkey" FOREIGN KEY ("chatMessageId") REFERENCES "ChatMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_mcpServerId_fkey" FOREIGN KEY ("mcpServerId") REFERENCES "McpServer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

