export function toKebabId(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[''’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function normalizeWhitespace(str: string): string {
  return str.replace(/\s+/g, " ").trim();
}

export function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/(?:^|\s)\S/g, (c) => c.toUpperCase());
}

export function cleanDescription(str: string): string {
  return str
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/—/g, "—")
    .replace(/–/g, "–")
    .replace(/\s+/g, " ")
    .trim();
}

const ABBR_MAP: Record<string, string> = {
  STR: "str",
  STRENGTH: "str",
  ACC: "acc",
  ACCURACY: "acc",
  FNS: "fns",
  FINESSE: "fns",
  SPD: "spd",
  SPEED: "spd",
  INT: "int",
  INTELLIGENCE: "int",
  MEM: "mem",
  MEMORY: "mem",
  VIT: "vit",
  VITALITY: "vit",
  CHA: "cha",
  CHARISMA: "cha",
  SRV: "srv",
  SURVIVAL: "srv",
};

export function abbrToAttributeKey(abbr: string): string | null {
  return ABBR_MAP[abbr.toUpperCase().trim()] ?? null;
}

export function deduplicateId(
  id: string,
  existingIds: Set<string>
): string {
  if (!existingIds.has(id)) return id;
  let n = 2;
  while (existingIds.has(`${id}-${n}`)) n++;
  return `${id}-${n}`;
}
