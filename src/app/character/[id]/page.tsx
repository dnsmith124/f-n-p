"use client";

import { use } from "react";
import Link from "next/link";
import { useCharacter } from "@/hooks/useCharacter";
import { CharacterHeader } from "@/components/character-sheet/CharacterHeader";
import { CharacterSheetTabs } from "@/components/character-sheet/CharacterSheetTabs";
import { AppHeader } from "@/components/ui/AppHeader";
import { exportCharacter } from "@/lib/storage";

export default function CharacterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { character, isLoaded, updateCharacter } = useCharacter(id);

  if (!isLoaded) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-text-muted text-sm">Loading...</div>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <p className="text-text-muted">Character not found</p>
        <Link href="/" className="text-accent hover:underline text-sm">
          Back to characters
        </Link>
      </div>
    );
  }

  const handleExport = () => {
    const json = exportCharacter(character.id);
    if (!json) return;
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${character.name || "character"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-1 flex-col max-w-2xl mx-auto w-full">
      <AppHeader
        backHref="/"
        backLabel="Home"
        menuItems={[
          { label: "Export Character", onClick: handleExport },
        ]}
      />

      <div className="p-3">
        <CharacterHeader character={character} onUpdate={updateCharacter} />
      </div>

      <CharacterSheetTabs character={character} onUpdate={updateCharacter} />
    </div>
  );
}
