"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, X, Camera } from "lucide-react";

interface AvatarUploadProps {
  currentImage?: string;
  onImageUpload: (file: File) => Promise<void>;
  onImageRemove?: () => Promise<void>;
  loading?: boolean;
  fallback?: string;
}

export function AvatarUpload({
  currentImage,
  onImageUpload,
  onImageRemove,
  loading = false,
  fallback = "U",
}: AvatarUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fonction pour valider le fichier
  const validateFile = (file: File): boolean => {
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      alert("Seuls les fichiers JPEG, PNG et WebP sont acceptés.");
      return false;
    }

    if (file.size > maxSize) {
      alert("Le fichier ne doit pas dépasser 5MB.");
      return false;
    }

    return true;
  };

  // Fonction pour gérer la sélection de fichier
  const handleFileSelect = async (file: File) => {
    if (!validateFile(file)) return;

    // Créer un aperçu
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Uploader le fichier
    try {
      await onImageUpload(file);
    } catch (error) {
      console.error("Erreur lors de l'upload:", error);
      setPreviewUrl(null);
    }
  };

  // Gestionnaire de changement de fichier
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Gestionnaires de drag & drop
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Fonction pour supprimer l'image
  const handleRemoveImage = async () => {
    if (onImageRemove) {
      await onImageRemove();
    }
    setPreviewUrl(null);
  };

  const displayImage = previewUrl || currentImage;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        {/* Avatar actuel */}
        <Avatar className="h-24 w-24">
          {displayImage && <AvatarImage src={displayImage} alt="Avatar" />}
          <AvatarFallback className="text-2xl">{fallback}</AvatarFallback>
        </Avatar>

        {/* Zone d'upload */}
        <div
          className={`flex-1 border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
            isDragging
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={loading}
          />

          <div className="space-y-2">
            <Camera className="mx-auto h-8 w-8 text-gray-400" />
            <div className="text-sm text-gray-600">
              <p>Glissez une image ici ou</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="mt-2"
              >
                <Upload className="mr-2 h-4 w-4" />
                {loading ? "Upload en cours..." : "Choisir un fichier"}
              </Button>
            </div>
            <p className="text-xs text-gray-500">JPEG, PNG, WebP - Max 5MB</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      {displayImage && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
          >
            <Upload className="mr-2 h-4 w-4" />
            Changer
          </Button>
          {onImageRemove && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemoveImage}
              disabled={loading}
            >
              <X className="mr-2 h-4 w-4" />
              Supprimer
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
