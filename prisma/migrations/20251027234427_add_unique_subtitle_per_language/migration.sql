/*
  Warnings:

  - A unique constraint covering the columns `[peliculaId,idiomaId]` on the table `Subtitulo` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Subtitulo" ALTER COLUMN "estado" SET DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "Subtitulo_peliculaId_idiomaId_key" ON "Subtitulo"("peliculaId", "idiomaId");
