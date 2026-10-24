"use client";

import Image from "next/image";
import { useState } from "react";

async function shrink(file: File) {
  const bitmap = await createImageBitmap(file);
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not read the photo");
  const scale = Math.max(size / bitmap.width, size / bitmap.height);
  const width = bitmap.width * scale;
  const height = bitmap.height * scale;
  context.drawImage(bitmap, (size - width) / 2, (size - height) / 2, width, height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

export function AvatarField({ current }: { current?: string | null }) {
  const [preview, setPreview] = useState(current ?? "");
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-4">
      {preview ? (
        <Image src={preview} alt="" width={64} height={64} unoptimized className="size-16 rounded-full object-cover" />
      ) : (
        <span className="grid size-16 place-items-center rounded-full bg-canvas text-sm text-body">Photo</span>
      )}
      <label className="text-sm font-medium">
        Upload a photo
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="mt-1 block text-sm"
          onChange={async (event) => {
            const file = event.currentTarget.files?.[0];
            if (!file) return;
            setError(null);
            try {
              const data = await shrink(file);
              if (data.length > 180000) {
                setError("That photo is still too large. Try a smaller one.");
                return;
              }
              setPreview(data);
            } catch {
              setError("Could not use that photo.");
            }
          }}
        />
      </label>
      <input type="hidden" name="image" value={preview} />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
