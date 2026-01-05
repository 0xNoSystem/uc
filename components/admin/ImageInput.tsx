"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";

type ImageInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

const inputClasses =
  "mt-2 w-full rounded-2xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder-white/40 focus:border-white focus:outline-none";

export default function ImageInput({
  label,
  value,
  onChange,
}: ImageInputProps) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);

    try {
      const safeName = file.name.replace(/\s+/g, "-");
      const blob = await upload(`${Date.now()}-${safeName}`, file, {
        access: "public",
        handleUploadUrl: "/api/admin/upload",
      });
      onChange(blob.url);
    } catch (error) {
      console.error("Upload failed", error);
      setError("Upload failed. Try again.");
    } finally {
      setIsUploading(false);
      if (fileRef.current) {
        fileRef.current.value = "";
      }
    }
  };

  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide text-white/70">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="https://..."
        className={inputClasses}
      />
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/70 transition hover:border-white/50 hover:text-white disabled:opacity-60"
          disabled={isUploading}
        >
          {isUploading ? "Uploading..." : "Upload image"}
        </button>
        {value ? (
          <span className="text-xs text-emerald-200">Image set</span>
        ) : null}
      </div>
      {value ? (
        <div className="mt-3 overflow-hidden rounded-2xl border border-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Preview" className="h-28 w-full object-cover" />
        </div>
      ) : null}
      {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}
