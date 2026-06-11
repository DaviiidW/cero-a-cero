"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { Shield, Bell, Moon, Sun, Trash2, User as UserIcon, LogOut } from "lucide-react";

type ProfileClientProps = {
  user: {
    id: string;
    email: string;
    nickGlobal: string;
    avatar: string | null;
  };
};

const AVAILABLE_AVATARS = [
  "⚽", "🏆", "🦁", "👑", "🦅", "⚡", "🥅", "🥇", "🔥", "🪐"
];

export function ProfileClient({ user }: ProfileClientProps) {
  const [currentAvatar, setCurrentAvatar] = useState<string>(user.avatar || "⚽");
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [notifications, setNotifications] = useState<boolean>(false);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Load theme and notifications preferences from localStorage
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme === "light" || storedTheme === "dark") {
      setTheme(storedTheme);
    }

    const storedNotifs = localStorage.getItem("notificationsEnabled");
    setNotifications(storedNotifs === "true");
  }, []);

  const handleThemeChange = (newTheme: "light" | "dark") => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
  };

  const handleNotificationsChange = (enabled: boolean) => {
    setNotifications(enabled);
    localStorage.setItem("notificationsEnabled", enabled ? "true" : "false");
  };

  const handleAvatarSelect = async (avatar: string) => {
    setIsUpdatingAvatar(true);
    try {
      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar }),
      });
      if (response.ok) {
        setCurrentAvatar(avatar);
      }
    } catch (err) {
      console.error("Error updating avatar:", err);
    } finally {
      setIsUpdatingAvatar(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const response = await fetch("/api/auth/profile", {
        method: "DELETE",
      });
      if (response.ok) {
        await signOut({ callbackUrl: "/" });
      } else {
        const data = await response.json();
        throw new Error(data.error || "No se pudo eliminar la cuenta");
      }
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : "Error al eliminar la cuenta");
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Info */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-5">
          <div className="relative group select-none">
            <div className="size-20 rounded-2xl bg-muted border border-border flex items-center justify-center text-4xl shadow-inner relative overflow-hidden">
              {currentAvatar}
            </div>
            {isUpdatingAvatar && (
              <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center text-xs text-white">
                ...
              </div>
            )}
          </div>
          <div className="text-center sm:text-left space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{user.nickGlobal}</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-xs font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/20 transition active:scale-95 flex items-center gap-1.5 px-3 h-8 rounded-lg border border-border mt-1.5 mx-auto sm:mx-0"
            >
              <LogOut className="size-3.5" />
              <span>Cerrar sesión</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Grid of avatars */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
            <UserIcon className="size-4 text-primary" />
            Selecciona tu Avatar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2.5">
            {AVAILABLE_AVATARS.map((avatar) => (
              <button
                key={avatar}
                disabled={isUpdatingAvatar}
                onClick={() => handleAvatarSelect(avatar)}
                className={`size-11 text-2xl flex items-center justify-center rounded-xl border transition-all active:scale-95 cursor-pointer ${
                  currentAvatar === avatar
                    ? "border-primary bg-primary/10 shadow-sm"
                    : "border-border hover:bg-muted"
                }`}
              >
                {avatar}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Visual & Notification Preferences (HU-10, HU-11) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Theme Preferences */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <Moon className="size-4 text-accent" />
              Preferencias Visuales
            </CardTitle>
            <CardDescription className="text-[11px]">
              Adapta la apariencia de la aplicación a tus gustos
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-2 pt-1">
            <button
              onClick={() => handleThemeChange("light")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2 cursor-pointer ${
                theme === "light"
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "border-border hover:bg-muted text-muted-foreground"
              }`}
            >
              <Sun className="size-3.5" />
              Modo Claro
            </button>
            <button
              onClick={() => handleThemeChange("dark")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2 cursor-pointer ${
                theme === "dark"
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "border-border hover:bg-muted text-muted-foreground"
              }`}
            >
              <Moon className="size-3.5" />
              Modo Oscuro
            </button>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <Bell className="size-4 text-primary" />
              Avisos y Notificaciones
            </CardTitle>
            <CardDescription className="text-[11px]">
              Recibe alertas sobre marcadores y cierres de jornadas
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between pt-1">
            <span className="text-xs text-muted-foreground font-semibold">Notificaciones de resultados</span>
            <button
              onClick={() => handleNotificationsChange(!notifications)}
              className={`w-12 h-6 rounded-full transition-all relative cursor-pointer ${
                notifications ? "bg-primary" : "bg-muted border border-border"
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-all ${
                notifications ? "translate-x-6" : ""
              }`} />
            </button>
          </CardContent>
        </Card>

      </div>

      {/* Change Password Form */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
            <Shield className="size-4 text-accent" />
            Seguridad de la Cuenta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>

      {/* Delete Account */}
      <Card className="border-destructive/20 bg-destructive/5 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-destructive flex items-center gap-2">
            <Trash2 className="size-4" />
            Zona de Peligro
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Elimina tu cuenta y todos tus datos asociados de forma permanente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteModal(true)}
            className="text-xs font-semibold bg-destructive hover:bg-destructive/90 text-white"
          >
            Eliminar Cuenta
          </Button>
        </CardContent>
      </Card>

      {/* Delete Account Confirmation Modal using new Dialog primitive */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="size-5" />
              ¿Eliminar tu cuenta permanentemente?
            </DialogTitle>
            <DialogDescription>
              Esta acción es completamente irreversible. Se eliminará tu perfil, todos tus pronósticos realizados, tus puntos acumulados, y si eres administrador de algún grupo, dicho grupo y todos sus miembros también se eliminarán.
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <p className="text-xs text-destructive bg-destructive/10 p-2.5 rounded-lg border border-destructive/20 font-medium">
              {deleteError}
            </p>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              disabled={isDeleting}
              onClick={() => setShowDeleteModal(false)}
              className="text-xs font-semibold"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={isDeleting}
              onClick={handleDeleteAccount}
              className="text-xs font-semibold bg-destructive hover:bg-destructive/90 text-white flex items-center gap-1.5"
            >
              {isDeleting ? "Eliminando..." : "Sí, eliminar cuenta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

