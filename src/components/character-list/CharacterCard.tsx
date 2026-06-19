"use client";

import Link from "next/link";
import type { CharacterSummary } from "@/lib/types/character";

interface CharacterCardProps {
  character: CharacterSummary;
  onDelete: (id: string) => void;
}

export function CharacterCard({ character, onDelete }: CharacterCardProps) {
  const updated = new Date(character.updatedAt).toLocaleDateString();

  return (
    <div className="relative group bg-surface border border-border-light rounded-lg overflow-hidden hover:border-accent transition-colors">
      <Link
        href={`/character/${character.id}`}
        className="block p-4"
      >
        <h3 className="font-bold text-text truncate">
          {character.name || "Unnamed"}
        </h3>
        <div className="mt-1 flex items-center gap-2 text-xs text-text-secondary capitalize">
          {character.tribe && <span>{character.tribe}</span>}
          {character.tribe && character.class && (
            <span className="text-text-muted">/</span>
          )}
          {character.class && <span>{character.class}</span>}
        </div>
        <div className="mt-2 flex items-center justify-between text-[10px] text-text-muted">
          <span>Level {character.level}</span>
          <span>{updated}</span>
        </div>
      </Link>
      <button
        onClick={(e) => {
          e.preventDefault();
          if (confirm(`Delete "${character.name || "Unnamed"}"?`)) {
            onDelete(character.id);
          }
        }}
        className="absolute top-2 right-2 opacity-60 sm:opacity-0 sm:group-hover:opacity-100 text-text-muted hover:text-danger transition-all p-1"
        aria-label="Delete character"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}
