"use client";

import Image from "next/image";
import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_GROUP_IMAGE } from "@/lib/constants/groups";

type GroupImageEditorProps = {
  groupId: string;
  image: string | null;
  name: string;
  isAdmin: boolean;
};

export function GroupImageEditor({
  groupId,
  image,
  name,
  isAdmin,
}: GroupImageEditorProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState(image);

  // Close popup when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  function handleImageClick() {
    if (!isAdmin) return;
    setShowMenu((prev) => !prev);
    setError(null);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setShowMenu(false);
    setLoading(true);
    setError(null);

    // 1. Upload the image
    const uploadForm = new FormData();
    uploadForm.append("image", file);

    const uploadRes = await fetch("/api/groups/upload-image", {
      method: "POST",
      body: uploadForm,
    });
    const uploadData = await uploadRes.json();

    if (!uploadRes.ok) {
      setError(uploadData.error ?? "No se pudo subir la imagen");
      setLoading(false);
      return;
    }

    // 2. Save the new image URL to the group
    const updateRes = await fetch(`/api/groups/${groupId}/image`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: uploadData.imageUrl }),
    });
    const updateData = await updateRes.json();

    setLoading(false);

    if (!updateRes.ok) {
      setError(updateData.error ?? "No se pudo actualizar la foto");
      return;
    }

    setCurrentImage(uploadData.imageUrl);
    router.refresh();

    // Reset file input so the same file can be re-selected later
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleRemoveImage() {
    setShowMenu(false);
    if (!confirm("¿Eliminar la foto del grupo?")) return;

    setLoading(true);
    setError(null);

    const res = await fetch(`/api/groups/${groupId}/image`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: "" }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "No se pudo eliminar la foto");
      return;
    }

    setCurrentImage(null);
    router.refresh();
  }

  const src = currentImage || DEFAULT_GROUP_IMAGE;

  return (
    <div className="relative flex-shrink-0" ref={popupRef}>
      {/* Hidden file input */}
      {isAdmin && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          aria-label="Seleccionar nueva foto del grupo"
        />
      )}

      {/* Group image */}
      <button
        type="button"
        onClick={handleImageClick}
        disabled={!isAdmin || loading}
        className={[
          "relative block size-20 rounded-2xl overflow-hidden focus:outline-none",
          isAdmin
            ? "cursor-pointer ring-offset-background focus-visible:ring-2 focus-visible:ring-ring ring-offset-2"
            : "cursor-default",
          loading ? "opacity-60" : "",
        ].join(" ")}
        aria-label={isAdmin ? "Editar foto del grupo" : name}
        aria-haspopup={isAdmin ? "true" : undefined}
        aria-expanded={isAdmin ? showMenu : undefined}
      >
        <Image
          src={src}
          alt={name}
          fill
          className="object-cover"
          unoptimized
        />

        {/* Admin overlay hint */}
        {isAdmin && !loading && (
          <span
            className="absolute inset-0 flex items-end justify-center pb-1 bg-black/0 hover:bg-black/40 transition-colors"
            aria-hidden
          >
            <span className="text-[10px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity leading-tight text-center px-1">
              ✏️
            </span>
          </span>
        )}

        {/* Loading spinner */}
        {loading && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="size-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
          </span>
        )}
      </button>

      {/* Popup menu */}
      {isAdmin && showMenu && (
        <div
          className="absolute left-0 top-[calc(100%+6px)] z-50 min-w-[152px] rounded-xl border border-border bg-popover shadow-lg overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100"
          role="menu"
        >
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-4 py-3 text-sm hover:bg-muted transition-colors"
            onClick={() => {
              setShowMenu(false);
              fileInputRef.current?.click();
            }}
          >
            <span>🖼️</span>
            <span>Editar foto</span>
          </button>

          <div className="h-px bg-border" />

          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-4 py-3 text-sm text-destructive hover:bg-destructive/10 transition-colors"
            onClick={handleRemoveImage}
          >
            <span>🗑️</span>
            <span>Eliminar foto</span>
          </button>
        </div>
      )}

      {/* Inline error */}
      {error && (
        <p className="absolute top-[calc(100%+8px)] left-0 text-xs text-destructive whitespace-nowrap">
          {error}
        </p>
      )}
    </div>
  );
}
