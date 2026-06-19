"use client";

import { useRef, useState, useCallback } from "react";
import { exportAllCharacters, importCharacter, importAllCharacters } from "@/lib/storage";
import { Toast } from "@/components/ui/Toast";

interface ImportExportControlsProps {
  onImport: () => void;
}

export function ImportExportControls({ onImport }: ImportExportControlsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState({ message: "", visible: false });

  const showToast = useCallback((message: string) => {
    setToast({ message, visible: true });
  }, []);

  const handleExportAll = useCallback(() => {
    const json = exportAllCharacters();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fnp-characters-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Characters exported");
  }, [showToast]);

  const handleImport = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        try {
          const data = JSON.parse(text);
          if (Array.isArray(data.characters)) {
            const count = importAllCharacters(text);
            showToast(`Imported ${count} character${count !== 1 ? "s" : ""}`);
          } else {
            const character = importCharacter(text);
            showToast(character ? `Imported "${character.name}"` : "Import failed");
          }
          onImport();
        } catch {
          showToast("Invalid file format");
        }
      };
      reader.readAsText(file);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [onImport, showToast]
  );

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={handleExportAll}
          className="text-xs px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:bg-surface-raised transition-colors"
        >
          Export All
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="text-xs px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:bg-surface-raised transition-colors"
        >
          Import
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
        />
      </div>
      <Toast
        message={toast.message}
        isVisible={toast.visible}
        onHide={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </>
  );
}
