import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PrismaClient, Prisma } from "@/lib/generated/prisma";
import { checkAccess, Role } from "@/lib/permissions";

const prisma = new PrismaClient();

// GET - Récupérer tous les utilisateurs (Admin seulement)
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer le rôle de l'utilisateur
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { role: true },
    });

    if (
      !currentUser?.role?.nom ||
      !checkAccess(currentUser.role.nom as Role, "/admin")
    ) {
      return NextResponse.json(
        { error: "Accès refusé - Admin requis" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const roleFilter = searchParams.get("role") || "";
    const statusFilter = searchParams.get("status") || "";

    const skip = (page - 1) * limit;

    // Construction des filtres
    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { prenom: { contains: search, mode: "insensitive" } },
      ];
    }

    if (roleFilter) {
      where.role = { nom: roleFilter };
    }

    if (statusFilter === "active") {
      where.active = true;
    } else if (statusFilter === "inactive") {
      where.active = false;
    }

    // Récupérer les utilisateurs avec pagination
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          role: true,
          _count: {
            select: {
              suggestions: true,
              alertes: true,
              abonnementQuartiers: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    // Récupérer tous les rôles disponibles
    const roles = await prisma.role.findMany({
      orderBy: { nom: "asc" },
    });

    // Formater les données (enlever les mots de passe)
    const formattedUsers = users.map((user) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    return NextResponse.json({
      users: formattedUsers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      roles,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - Modifier un utilisateur (Admin seulement)
export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Vérifier les permissions admin
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { role: true },
    });

    if (
      !currentUser?.role?.nom ||
      !checkAccess(currentUser.role.nom as Role, "/admin")
    ) {
      return NextResponse.json(
        { error: "Accès refusé - Admin requis" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, updates } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "ID utilisateur requis" },
        { status: 400 }
      );
    }

    // Empêcher l'admin de se désactiver lui-même
    if (userId === session.user.id && updates.active === false) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas vous désactiver vous-même" },
        { status: 400 }
      );
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
      include: {
        role: true,
        _count: {
          select: {
            suggestions: true,
            alertes: true,
            abonnementQuartiers: true,
          },
        },
      },
    });

    // Retourner sans le mot de passe
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = updatedUser;

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'utilisateur:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Créer un nouvel utilisateur (Admin seulement)
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Vérifier les permissions admin
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { role: true },
    });

    if (
      !currentUser?.role?.nom ||
      !checkAccess(currentUser.role.nom as Role, "/admin")
    ) {
      return NextResponse.json(
        { error: "Accès refusé - Admin requis" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, prenom, email, telephone, idRole, password } = body;

    // Validation des champs requis
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email et mot de passe sont requis" },
        { status: 400 }
      );
    }

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Un utilisateur avec cet email existe déjà" },
        { status: 400 }
      );
    }

    // Créer l'utilisateur avec better-auth signUp
    const signUpResult = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name: name || "",
      },
    });

    if (!signUpResult || !signUpResult.user) {
      return NextResponse.json(
        { error: "Erreur lors de la création du compte" },
        { status: 500 }
      );
    }

    // Mettre à jour les informations supplémentaires de l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: signUpResult.user.id },
      data: {
        prenom: prenom || "",
        telephone: telephone || "",
        idRole: idRole || 3, // Par défaut : Citoyen
        active: true,
      },
      include: {
        role: true,
        _count: {
          select: {
            suggestions: true,
            alertes: true,
            abonnementQuartiers: true,
          },
        },
      },
    });

    // Retourner sans le mot de passe
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = updatedUser;

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
      message: "Utilisateur créé avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - Supprimer un utilisateur (Admin seulement)
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Vérifier les permissions admin
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { role: true },
    });

    if (
      !currentUser?.role?.nom ||
      !checkAccess(currentUser.role.nom as Role, "/admin")
    ) {
      return NextResponse.json(
        { error: "Accès refusé - Admin requis" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "ID utilisateur requis" },
        { status: 400 }
      );
    }

    // Empêcher l'admin de se supprimer lui-même
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas supprimer votre propre compte" },
        { status: 400 }
      );
    }

    // Supprimer l'utilisateur (les suppressions en cascade sont gérées par Prisma)
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({
      success: true,
      message: "Utilisateur supprimé avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'utilisateur:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
