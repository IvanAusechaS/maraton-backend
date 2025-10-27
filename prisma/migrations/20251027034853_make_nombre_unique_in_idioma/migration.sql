/*
  Warnings:

  - You are about to drop the column `version` on the `Idioma` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[nombre]` on the table `Idioma` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Idioma" DROP COLUMN "version";

-- CreateIndex
CREATE UNIQUE INDEX "Idioma_nombre_key" ON "Idioma"("nombre");
