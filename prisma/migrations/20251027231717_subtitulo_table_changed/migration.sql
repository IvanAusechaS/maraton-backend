/*
  Warnings:

  - You are about to drop the column `color` on the `Subtitulo` table. All the data in the column will be lost.
  - You are about to drop the column `descriptiva` on the `Subtitulo` table. All the data in the column will be lost.
  - You are about to drop the column `fuente` on the `Subtitulo` table. All the data in the column will be lost.
  - Added the required column `contenido` to the `Subtitulo` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Comentario" DROP CONSTRAINT "Comentario_comentarioPadreId_fkey";

-- AlterTable
ALTER TABLE "Subtitulo" DROP COLUMN "color",
DROP COLUMN "descriptiva",
DROP COLUMN "fuente",
ADD COLUMN     "contenido" JSONB NOT NULL,
ALTER COLUMN "estado" SET DEFAULT true;

-- AddForeignKey
ALTER TABLE "Comentario" ADD CONSTRAINT "Comentario_comentarioPadreId_fkey" FOREIGN KEY ("comentarioPadreId") REFERENCES "Comentario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
