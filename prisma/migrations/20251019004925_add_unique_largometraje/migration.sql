/*
  Warnings:

  - A unique constraint covering the columns `[largometraje]` on the table `Pelicula` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Pelicula_largometraje_key" ON "Pelicula"("largometraje");
