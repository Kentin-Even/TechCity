/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Users,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  Crown,
  Shield,
  Eye,
  MessageSquare,
  UserPlus,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name?: string;
  prenom?: string;
  email: string;
  telephone?: string;
  image?: string;
  active?: boolean;
  createdAt?: string;
  role?: {
    idRole: number;
    nom: string;
  };
  _count: {
    suggestions: number;
    alertes: number;
    abonnementQuartiers: number;
  };
}

interface Role {
  idRole: number;
  nom: string;
}

export default function AdminPage() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user, loading } = useAuth();
  const { isAdmin } = usePermissions();
  const router = useRouter();

  // États pour les données
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // États pour les filtres et pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // États pour l'édition
  const [editForm, setEditForm] = useState({
    name: "",
    prenom: "",
    email: "",
    telephone: "",
    idRole: 0,
    active: true,
  });
  const [saving, setSaving] = useState(false);

  // États pour la création
  const [createForm, setCreateForm] = useState({
    name: "",
    prenom: "",
    email: "",
    telephone: "",
    idRole: 3, // Par défaut : Citoyen
    password: "",
  });
  const [creating, setCreating] = useState(false);

  // Charger les utilisateurs au montage et lors des changements de filtres
  useEffect(() => {
    fetchUsers();
  }, [currentPage, router]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
      });

      const response = await fetch(`/api/admin?${params}`);
      if (response.ok) {
        const data = await response.json();
        console.log("Données reçues de l'API:", data);
        setUsers(data.users || []);
        setRoles(data.roles || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalUsers(data.pagination?.total || 0);
      } else {
        console.error(
          "Erreur lors du chargement des utilisateurs - Status:",
          response.status
        );
        const errorText = await response.text();
        console.error("Détails de l'erreur:", errorText);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des utilisateurs:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name || "",
      prenom: user.prenom || "",
      email: user.email,
      telephone: user.telephone || "",
      idRole: user.role?.idRole || 3,
      active: user.active ?? true,
    });
    setEditDialogOpen(true);
  };

  const openCreateDialog = () => {
    setCreateForm({
      name: "",
      prenom: "",
      email: "",
      telephone: "",
      idRole: 3,
      password: "",
    });
    setCreateDialogOpen(true);
  };

  const handleCreateUser = async () => {
    setCreating(true);
    try {
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createForm),
      });

      if (response.ok) {
        setCreateDialogOpen(false);
        fetchUsers();
      } else {
        const errorData = await response.json();
        console.error("Erreur lors de la création:", errorData.error);
        // Vous pourriez ajouter un toast ou une notification d'erreur ici
      }
    } catch (error) {
      console.error("Erreur lors de la création:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;

    setSaving(true);
    try {
      const response = await fetch("/api/admin", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          updates: editForm,
        }),
      });

      if (response.ok) {
        setEditDialogOpen(false);
        fetchUsers();
      } else {
        console.error("Erreur lors de la sauvegarde");
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin?userId=${userId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchUsers();
      } else {
        console.error("Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
    }
  };

  const toggleUserStatus = async (userId: string, active: boolean) => {
    try {
      const response = await fetch("/api/admin", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          updates: { active },
        }),
      });

      if (response.ok) {
        fetchUsers();
      } else {
        console.error("Erreur lors de la mise à jour du statut");
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error);
    }
  };

  const getRoleIcon = (roleName: string) => {
    switch (roleName) {
      case "Admin":
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case "Gestionnaire":
        return <Shield className="w-4 h-4 text-blue-500" />;
      case "Chercheur":
        return <Eye className="w-4 h-4 text-purple-500" />;
      default:
        return <Users className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleBadgeVariant = (roleName: string) => {
    switch (roleName) {
      case "Admin":
        return "destructive";
      case "Gestionnaire":
        return "default";
      case "Chercheur":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isAdmin()) {
    return null; // La redirection se fait dans useEffect
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="w-8 h-8" />
            Administration des Utilisateurs
          </h1>
          <p className="text-muted-foreground">
            Gérez tous les utilisateurs de la plateforme ({totalUsers}{" "}
            utilisateurs)
          </p>
        </div>
        <Button onClick={openCreateDialog} className="flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          Créer un utilisateur
        </Button>
      </div>

      {/* Tableau des utilisateurs */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Utilisateurs</CardTitle>
          <CardDescription>
            Gérez les rôles, statuts et informations des utilisateurs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingUsers ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Activité</TableHead>
                    <TableHead>Inscription</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={user.image} />
                            <AvatarFallback>
                              {(user.name || user.email)
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {user.name || "Sans nom"} {user.prenom || ""}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {user.telephone || "Pas de téléphone"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={getRoleBadgeVariant(
                            user.role?.nom || "Citoyen"
                          )}
                        >
                          <div className="flex items-center gap-1">
                            {getRoleIcon(user.role?.nom || "Citoyen")}
                            {user.role?.nom || "Citoyen"}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={user.active ?? true}
                            onCheckedChange={(checked) =>
                              toggleUserStatus(user.id, checked)
                            }
                            disabled={user.id === user.id} // Empêcher l'admin de se désactiver
                          />
                          {user.active ? (
                            <UserCheck className="w-4 h-4 text-green-500" />
                          ) : (
                            <UserX className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {user._count.suggestions} suggestions
                          </div>
                          <div className="flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            {user._count.alertes} alertes
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {user._count.abonnementQuartiers} abonnements
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString("fr-FR")
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(user)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {user.id !== user.id && ( // Empêcher l'admin de se supprimer
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Supprimer l&apos;utilisateur
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Êtes-vous sûr de vouloir supprimer
                                    l&apos;utilisateur{" "}
                                    <strong>{user.name || user.email}</strong> ?
                                    Cette action est irréversible.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="bg-red-500 hover:bg-red-600"
                                  >
                                    Supprimer
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Affichage de {(currentPage - 1) * 10 + 1} à{" "}
                  {Math.min(currentPage * 10, totalUsers)} sur {totalUsers}{" "}
                  utilisateurs
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Précédent
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} sur {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                  >
                    Suivant
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog d'édition */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Modifier l&apos;utilisateur</DialogTitle>
            <DialogDescription>
              Modifiez les informations et permissions de l&apos;utilisateur
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nom</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-prenom">Prénom</Label>
                <Input
                  id="edit-prenom"
                  value={editForm.prenom}
                  onChange={(e) =>
                    setEditForm({ ...editForm, prenom: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) =>
                  setEditForm({ ...editForm, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-telephone">Téléphone</Label>
              <Input
                id="edit-telephone"
                value={editForm.telephone}
                onChange={(e) =>
                  setEditForm({ ...editForm, telephone: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Rôle</Label>
              <Select
                value={editForm.idRole.toString()}
                onValueChange={(value) =>
                  setEditForm({ ...editForm, idRole: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem
                      key={role.idRole}
                      value={role.idRole.toString()}
                    >
                      <div className="flex items-center gap-2">
                        {getRoleIcon(role.nom)}
                        {role.nom}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2 space-y-2">
              <Switch
                id="edit-active"
                checked={editForm.active}
                onCheckedChange={(checked) =>
                  setEditForm({ ...editForm, active: checked })
                }
              />
              <Label htmlFor="edit-active">Compte actif</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={saving}
            >
              Annuler
            </Button>
            <Button onClick={handleSaveUser} disabled={saving}>
              {saving ? "Sauvegarde..." : "Sauvegarder"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de création */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
            <DialogDescription>
              Créez un nouveau compte utilisateur avec les informations et
              permissions appropriées
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-name">Nom</Label>
                <Input
                  id="create-name"
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-prenom">Prénom</Label>
                <Input
                  id="create-prenom"
                  value={createForm.prenom}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, prenom: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-email">Email *</Label>
              <Input
                id="create-email"
                type="email"
                value={createForm.email}
                onChange={(e) =>
                  setCreateForm({ ...createForm, email: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-password">Mot de passe *</Label>
              <Input
                id="create-password"
                type="password"
                value={createForm.password}
                onChange={(e) =>
                  setCreateForm({ ...createForm, password: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-telephone">Téléphone</Label>
              <Input
                id="create-telephone"
                value={createForm.telephone}
                onChange={(e) =>
                  setCreateForm({ ...createForm, telephone: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-role">Rôle</Label>
              <Select
                value={createForm.idRole.toString()}
                onValueChange={(value) =>
                  setCreateForm({ ...createForm, idRole: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem
                      key={role.idRole}
                      value={role.idRole.toString()}
                    >
                      <div className="flex items-center gap-2">
                        {getRoleIcon(role.nom)}
                        {role.nom}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              disabled={creating}
            >
              Annuler
            </Button>
            <Button
              onClick={handleCreateUser}
              disabled={creating || !createForm.email || !createForm.password}
            >
              {creating ? "Création..." : "Créer l'utilisateur"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
