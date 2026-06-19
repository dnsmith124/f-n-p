"use client";

import { useRef, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useCharacterList } from "@/hooks/useCharacterList";
import { CharacterCard } from "@/components/character-list/CharacterCard";
import { AppHeader } from "@/components/ui/AppHeader";
import { Toast } from "@/components/ui/Toast";
import { exportAllCharacters, importCharacter, importAllCharacters } from "@/lib/storage";

export default function Home() {
  const router = useRouter();
  const { characters, isLoaded, addCharacter, deleteCharacter, refresh } =
    useCharacterList();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState({ message: "", visible: false });

  const showToast = useCallback((message: string) => {
    setToast({ message, visible: true });
  }, []);

  const handleNew = () => {
    const character = addCharacter();
    router.push(`/character/${character.id}`);
  };

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
          refresh();
        } catch {
          showToast("Invalid file format");
        }
      };
      reader.readAsText(file);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [refresh, showToast]
  );

  if (!isLoaded) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-text-muted text-sm">Loading...</div>
      </div>
    );
  }

  const menuItems = [
    { label: "Export All Characters", onClick: handleExportAll },
    { label: "Import Characters", onClick: () => fileInputRef.current?.click() },
  ];

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader
        actions={
          <button
            onClick={handleNew}
            className="h-8 px-3 flex items-center gap-1 rounded-lg bg-primary text-white text-xs font-medium hover:opacity-90 transition-opacity"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New
          </button>
        }
        menuItems={menuItems}
      />

      <div className="max-w-2xl mx-auto w-full p-4 pb-8">
        <div className="text-center py-6">
          <h1 className="text-2xl font-bold tracking-wide text-primary uppercase">
            Fight & Prosper
          </h1>
          <p className="text-[11px] text-text-muted mt-1 tracking-wider">
            A Pen-and-Paper Roleplaying Game by Tyler Kelosky and His Friends
          </p>
        </div>

        <div className="flex items-center mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-text-secondary">
            Characters
            {characters.length > 0 && (
              <span className="ml-2 text-text-muted font-normal">
                ({characters.length})
              </span>
            )}
          </h2>
        </div>

        {characters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <p className="text-text-muted text-sm">No characters yet</p>
            <button
              onClick={handleNew}
              className="px-6 py-2.5 rounded-lg bg-primary text-white font-medium text-sm hover:opacity-90 transition-opacity"
            >
              Create Your First Character
            </button>
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              {characters.map((c) => (
                <CharacterCard
                  key={c.id}
                  character={c}
                  onDelete={deleteCharacter}
                />
              ))}
            </div>
            <button
              onClick={handleNew}
              className="mt-4 w-full py-2.5 rounded-lg border-2 border-dashed border-border text-text-muted hover:border-accent hover:text-accent transition-colors text-sm font-medium"
            >
              + New Character
            </button>
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        className="hidden"
      />
      <Toast
        message={toast.message}
        isVisible={toast.visible}
        onHide={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </div>
  );
}
