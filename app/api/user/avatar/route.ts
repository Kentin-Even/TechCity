import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PrismaClient } from "@/lib/generated/prisma";
import { uploadImage, deleteImage } from "@/lib/cloudinary";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    // Convertir le fichier en buffer puis en base64 pour Cloudinary
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    // Récupérer l'ancien avatar de l'utilisateur pour le supprimer
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { image: true },
    });

    // Uploader la nouvelle image sur Cloudinary
    const uploadResult = await uploadImage(base64, "avatars");

    // Mettre à jour l'utilisateur avec la nouvelle URL d'image
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        image: uploadResult.secure_url,
        updatedAt: new Date(),
      },
      include: {
        role: true,
      },
    });

    // Supprimer l'ancienne image si elle existe et qu'elle vient de Cloudinary
    if (currentUser?.image && currentUser.image.includes("cloudinary.com")) {
      const publicIdMatch = currentUser.image.match(/\/([^\/]+)\.[^.]+$/);
      if (publicIdMatch) {
        const publicId = `tech-city-iot/avatars/${publicIdMatch[1]}`;
        deleteImage(publicId).catch(console.error);
      }
    }

    // Retourner les informations de l'utilisateur sans le mot de passe
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = updatedUser;

    return NextResponse.json({
      user: userWithoutPassword,
      uploadResult: {
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
      },
    });
  } catch (error) {
    console.error("Erreur lors de l'upload de l'avatar:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer l'utilisateur actuel
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { image: true },
    });

    if (!currentUser?.image) {
      return NextResponse.json(
        { error: "Aucun avatar à supprimer" },
        { status: 400 }
      );
    }

    // Supprimer l'image de Cloudinary si elle en provient
    if (currentUser.image.includes("cloudinary.com")) {
      const publicIdMatch = currentUser.image.match(/\/([^\/]+)\.[^.]+$/);
      if (publicIdMatch) {
        const publicId = `tech-city-iot/avatars/${publicIdMatch[1]}`;
        await deleteImage(publicId);
      }
    }

    // Mettre à jour l'utilisateur pour supprimer l'image
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        image: null,
        updatedAt: new Date(),
      },
      include: {
        role: true,
      },
    });

    // Retourner les informations de l'utilisateur sans le mot de passe
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = updatedUser;

    return NextResponse.json({ user: userWithoutPassword });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'avatar:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
