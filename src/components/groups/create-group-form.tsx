"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGroup } from "@/components/providers/group-provider";
import Image from "next/image";

type CreateGroupFormProps = {
  defaultNick: string;
};

export function CreateGroupForm({ defaultNick }: CreateGroupFormProps) {
  const router = useRouter();
  const { refreshGroups, changeGroup } = useGroup();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
    } else {
      setPreview(null);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    // Read form values synchronously BEFORE any await — React nullifies
    // event.currentTarget after the first async suspension.
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "");
    const nick = String(formData.get("nick") ?? "");

    let imageUrl: string | undefined;

    // Upload image first if one was selected
    if (imageFile) {
      const uploadForm = new FormData();
      uploadForm.append("image", imageFile);

      const uploadRes = await fetch("/api/groups/upload-image", {
        method: "POST",
        body: uploadForm,
      });

      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) {
        setError(uploadData.error ?? "No se pudo subir la imagen");
        setIsLoading(false);
        return;
      }

      imageUrl = uploadData.imageUrl as string;
    }

    const payload = {
      name,
      image: imageUrl ?? "",
      nick,
    };

    const response = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    setIsLoading(false);

    if (!response.ok) {
      setError(data.error ?? "No se pudo crear el grupo");
      return;
    }

    await refreshGroups();
    changeGroup(data.group.id);

    router.push(`/grupos/${data.group.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Group name */}
      <div className="space-y-2">
        <Label htmlFor="name">Nombre del grupo</Label>
        <Input id="name" name="name" required placeholder="Minabo de Kiev" />
      </div>

      {/* Image picker */}
      <div className="space-y-2">
        <Label>Foto del grupo (opcional)</Label>

        {/* Hidden native file input — accepts images from gallery & camera */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture={undefined}
          className="hidden"
          onChange={handleImageChange}
          aria-label="Seleccionar foto del grupo"
        />

        <div className="flex items-center gap-4">
          {/* Preview */}
          <div
            className="relative w-20 h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted cursor-pointer flex-shrink-0"
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            aria-label="Seleccionar imagen del grupo"
            onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
          >
            {preview ? (
              <Image
                src={preview}
                alt="Vista previa"
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <span className="text-3xl select-none">📷</span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              {preview ? "Cambiar foto" : "Elegir foto"}
            </Button>
            {preview && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => {
                  setPreview(null);
                  setImageFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              >
                Quitar foto
              </Button>
            )}
            <p className="text-xs text-muted-foreground">
              Máx. 5 MB · JPG, PNG, WEBP
            </p>
          </div>
        </div>
      </div>

      {/* Nick */}
      <div className="space-y-2">
        <Label htmlFor="nick">Tu nick en el grupo</Label>
        <Input id="nick" name="nick" defaultValue={defaultNick} required />
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Creando..." : "Crear grupo"}
      </Button>
    </form>
  );
}
