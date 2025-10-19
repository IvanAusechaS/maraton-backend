/*
  Warnings:

  - You are about to drop the column `clasificacionId` on the `Pelicula` table. All the data in the column will be lost.
  - You are about to drop the column `paisId` on the `Pelicula` table. All the data in the column will be lost.
  - You are about to drop the `Clasificacion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Pais` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[descripcion]` on the table `Genero` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."Pelicula" DROP CONSTRAINT "Pelicula_clasificacionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Pelicula" DROP CONSTRAINT "Pelicula_paisId_fkey";

-- AlterTable
ALTER TABLE "Pelicula" DROP COLUMN "clasificacionId",
DROP COLUMN "paisId";

-- DropTable
DROP TABLE "public"."Clasificacion";

-- DropTable
DROP TABLE "public"."Pais";

-- CreateIndex
CREATE UNIQUE INDEX "Genero_descripcion_key" ON "Genero"("descripcion");
