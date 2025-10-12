-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "fecha_nacimiento" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gusto" (
    "id" SERIAL NOT NULL,
    "favoritos" BOOLEAN NOT NULL,
    "reproducida" BOOLEAN NOT NULL,
    "ver_mas_tarde" BOOLEAN NOT NULL,
    "calificacion" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "peliculaId" INTEGER NOT NULL,

    CONSTRAINT "Gusto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comentario" (
    "id" SERIAL NOT NULL,
    "mensaje" TEXT NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "peliculaId" INTEGER NOT NULL,
    "comentarioPadreId" INTEGER,

    CONSTRAINT "Comentario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pelicula" (
    "id" SERIAL NOT NULL,
    "duracion" INTEGER NOT NULL,
    "largometraje" TEXT NOT NULL,
    "actores" TEXT NOT NULL,
    "año" INTEGER NOT NULL,
    "disponible" BOOLEAN NOT NULL,
    "sinopsis" TEXT NOT NULL,
    "trailer" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "director" TEXT NOT NULL,
    "portada" TEXT NOT NULL,
    "paisId" INTEGER NOT NULL,
    "clasificacionId" INTEGER NOT NULL,
    "idiomaId" INTEGER NOT NULL,

    CONSTRAINT "Pelicula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pais" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "bandera" TEXT NOT NULL,

    CONSTRAINT "Pais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Clasificacion" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "edad_minima" INTEGER NOT NULL,

    CONSTRAINT "Clasificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Genero" (
    "id" SERIAL NOT NULL,
    "descripcion" TEXT NOT NULL,
    "estado" BOOLEAN NOT NULL,

    CONSTRAINT "Genero_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Catalogo" (
    "id" SERIAL NOT NULL,
    "peliculaId" INTEGER NOT NULL,
    "generoId" INTEGER NOT NULL,

    CONSTRAINT "Catalogo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Idioma" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "version" TEXT NOT NULL,

    CONSTRAINT "Idioma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subtitulo" (
    "id" SERIAL NOT NULL,
    "estado" BOOLEAN NOT NULL,
    "color" TEXT NOT NULL,
    "fuente" TEXT NOT NULL,
    "descriptiva" BOOLEAN NOT NULL,
    "peliculaId" INTEGER NOT NULL,
    "idiomaId" INTEGER NOT NULL,

    CONSTRAINT "Subtitulo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Gusto_usuarioId_peliculaId_key" ON "Gusto"("usuarioId", "peliculaId");

-- AddForeignKey
ALTER TABLE "Gusto" ADD CONSTRAINT "Gusto_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gusto" ADD CONSTRAINT "Gusto_peliculaId_fkey" FOREIGN KEY ("peliculaId") REFERENCES "Pelicula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comentario" ADD CONSTRAINT "Comentario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comentario" ADD CONSTRAINT "Comentario_peliculaId_fkey" FOREIGN KEY ("peliculaId") REFERENCES "Pelicula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comentario" ADD CONSTRAINT "Comentario_comentarioPadreId_fkey" FOREIGN KEY ("comentarioPadreId") REFERENCES "Comentario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pelicula" ADD CONSTRAINT "Pelicula_paisId_fkey" FOREIGN KEY ("paisId") REFERENCES "Pais"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pelicula" ADD CONSTRAINT "Pelicula_clasificacionId_fkey" FOREIGN KEY ("clasificacionId") REFERENCES "Clasificacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pelicula" ADD CONSTRAINT "Pelicula_idiomaId_fkey" FOREIGN KEY ("idiomaId") REFERENCES "Idioma"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Catalogo" ADD CONSTRAINT "Catalogo_peliculaId_fkey" FOREIGN KEY ("peliculaId") REFERENCES "Pelicula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Catalogo" ADD CONSTRAINT "Catalogo_generoId_fkey" FOREIGN KEY ("generoId") REFERENCES "Genero"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subtitulo" ADD CONSTRAINT "Subtitulo_peliculaId_fkey" FOREIGN KEY ("peliculaId") REFERENCES "Pelicula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subtitulo" ADD CONSTRAINT "Subtitulo_idiomaId_fkey" FOREIGN KEY ("idiomaId") REFERENCES "Idioma"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
