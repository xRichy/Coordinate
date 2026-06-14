"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/**
 * Reusable file upload button (Vercel Blob client upload). On success calls
 * onUploaded with the public URL + original filename. The parent persists it.
 */
export function UploadButton({
  accept,
  label = "Carica file",
  onUploaded,
  disabled,
}: {
  accept: string;
  label?: string;
  onUploaded: (url: string, name: string) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    setBusy(true);
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
      });
      onUploaded(blob.url, file.name);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload fallito.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
        {busy ? "Caricamento…" : label}
      </Button>
    </>
  );
}
