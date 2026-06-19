"use client";

import { useCallback } from "react";
import type { Character, SkillEntry } from "@/lib/types/character";
import { EditableField } from "@/components/ui/EditableField";
import { Badge } from "@/components/ui/Badge";
import { generateId } from "@/lib/utils";

interface SkillsPanelProps {
  character: Character;
  onUpdate: (updater: (prev: Character) => Character) => void;
}

export function SkillsPanel({ character, onUpdate }: SkillsPanelProps) {
  const addSkill = useCallback(() => {
    const skill: SkillEntry = {
      id: generateId(),
      name: "New Skill",
      source: "other",
      description: "",
    };
    onUpdate((prev) => ({ ...prev, skills: [...prev.skills, skill] }));
  }, [onUpdate]);

  const updateSkill = useCallback(
    (id: string, field: keyof SkillEntry, value: string) => {
      onUpdate((prev) => ({
        ...prev,
        skills: prev.skills.map((s) =>
          s.id === id ? { ...s, [field]: value } : s
        ),
      }));
    },
    [onUpdate]
  );

  const removeSkill = useCallback(
    (id: string) => {
      onUpdate((prev) => ({
        ...prev,
        skills: prev.skills.filter((s) => s.id !== id),
      }));
    },
    [onUpdate]
  );

  return (
    <div className="space-y-2">
      {character.skills.length === 0 ? (
        <p className="text-xs text-text-muted italic py-2">No skills or abilities</p>
      ) : (
        character.skills.map((skill) => (
          <div
            key={skill.id}
            className="bg-surface border border-border-light rounded-lg p-2 space-y-1"
          >
            <div className="flex items-start justify-between gap-2">
              <EditableField
                value={skill.name}
                onChange={(v) => updateSkill(skill.id, "name", String(v))}
                className="flex-1 font-medium text-sm"
                displayClassName="font-medium text-sm"
              />
              <Badge
                variant="default"
                onRemove={() => removeSkill(skill.id)}
              >
                {skill.source}
              </Badge>
            </div>
            <EditableField
              value={skill.description}
              onChange={(v) => updateSkill(skill.id, "description", String(v))}
              placeholder="Description..."
              className="text-xs"
              displayClassName="text-xs"
            />
          </div>
        ))
      )}
      <button
        onClick={addSkill}
        className="w-full py-1.5 rounded-lg border border-dashed border-border text-text-muted hover:border-accent hover:text-accent transition-colors text-xs"
      >
        + Add Skill
      </button>
    </div>
  );
}
