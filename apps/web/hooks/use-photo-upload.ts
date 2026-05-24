"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";

type FieldStatus = "incomplete" | "valid" | "invalid";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export function usePhotoUpload() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generationRef = useRef(0);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFile = useCallback((file: File | null) => {
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Only JPEG, PNG, or WebP images are accepted.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("Image must be under 10 MB.");
      return;
    }

    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setBlobUrl(null);
    setError(null);
    setUploading(true);

    const gen = ++generationRef.current;

    upload(file.name, file, {
      access: "public",
      handleUploadUrl: "/api/upload/door-image",
    })
      .then((blob) => {
        if (gen !== generationRef.current) return;
        setBlobUrl(blob.url);
        setUploading(false);
      })
      .catch(() => {
        if (gen !== generationRef.current) return;
        setError("Upload failed. Tap to retry.");
        setUploading(false);
      });
  }, []);

  const reset = useCallback(() => {
    generationRef.current++;
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setBlobUrl(null);
    setUploading(false);
    setError(null);
  }, []);

  const photoStatus: FieldStatus = blobUrl
    ? "valid"
    : error
      ? "invalid"
      : "incomplete";

  return { previewUrl, blobUrl, uploading, error, photoStatus, handleFile, reset };
}
