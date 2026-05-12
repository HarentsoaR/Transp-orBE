-- CreateTable
CREATE TABLE "revinfo" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "revinfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "a_connexion" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "success" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "a_connexion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "a_historique" (
    "id" TEXT NOT NULL,
    "revId" INTEGER,
    "userId" TEXT,
    "tableName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityId" TEXT,
    "description" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "a_historique_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "a_historique" ADD CONSTRAINT "a_historique_revId_fkey" FOREIGN KEY ("revId") REFERENCES "revinfo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
