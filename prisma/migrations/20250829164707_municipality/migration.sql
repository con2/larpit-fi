-- AlterTable
ALTER TABLE "larp" ADD COLUMN     "municipality_id" TEXT,
ADD COLUMN     "num_player_characters" INTEGER,
ADD COLUMN     "num_total_participants" INTEGER;

-- CreateTable
CREATE TABLE "country" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "name_fi" TEXT,
    "name_sv" TEXT,
    "name_en" TEXT,

    CONSTRAINT "country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "municipality" (
    "id" TEXT NOT NULL,
    "name_fi" TEXT,
    "name_sv" TEXT,
    "name_other" TEXT,
    "name_other_language_code" TEXT,
    "country_code" TEXT NOT NULL DEFAULT 'wd:Q33',
    "lat" DOUBLE PRECISION NOT NULL,
    "long" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "municipality_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "country_code_key" ON "country"("code");

-- AddForeignKey
ALTER TABLE "municipality" ADD CONSTRAINT "municipality_country_code_fkey" FOREIGN KEY ("country_code") REFERENCES "country"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "larp" ADD CONSTRAINT "larp_municipality_id_fkey" FOREIGN KEY ("municipality_id") REFERENCES "municipality"("id") ON DELETE SET NULL ON UPDATE CASCADE;
