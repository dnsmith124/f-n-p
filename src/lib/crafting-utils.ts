import type { ItemData } from "./types/game-data";
import { itemMatchesSearch, normalizeRarity } from "./item-utils";

export const ARMORER_RECIPE_GROUP_ORDER = [
  "Weapon Recipes",
  "Armor & Clothing Recipes",
  "Combat Tools",
  "Tools",
  "Other Recipes",
] as const;

export function isArmorerRecipe(item: ItemData): boolean {
  return item.subcategory === "recipe" && item.recipeType === "armorer";
}

export function isAlchemyCraftable(item: ItemData): boolean {
  return item.ingLevelRequired != null && item.ingLevelRequired > 0;
}

export function isForagedIngredient(item: ItemData): boolean {
  return item.subcategory === "ingredient" && item.ingLevel != null && item.ingLevel > 0;
}

export function getRecipeGroup(item: ItemData): string {
  if (item.recipeGroup) return item.recipeGroup;
  return "Other Recipes";
}

export function craftingMatchesSearch(item: ItemData, query: string): boolean {
  if (!query) return true;
  return itemMatchesSearch(item, query);
}

export function filterCraftingItems(
  items: ItemData[],
  type: "armorer" | "alchemy",
  searchQuery: string,
  selectedRarity: string | null
): ItemData[] {
  return items.filter((item) => {
    if (type === "armorer") {
      if (!isArmorerRecipe(item)) return false;
    } else {
      if (!isAlchemyCraftable(item) && !isForagedIngredient(item)) return false;
    }
    if (selectedRarity && normalizeRarity(item.rarity) !== selectedRarity) return false;
    if (!craftingMatchesSearch(item, searchQuery)) return false;
    return true;
  });
}

export function groupArmorerRecipes(recipes: ItemData[]): Map<string, ItemData[]> {
  const groups = new Map<string, ItemData[]>();
  for (const item of recipes) {
    const key = getRecipeGroup(item);
    const group = groups.get(key);
    if (group) group.push(item);
    else groups.set(key, [item]);
  }
  return groups;
}

const ARMORER_RECIPE_GROUP_ORDER_SET = new Set<string>(ARMORER_RECIPE_GROUP_ORDER);

/** Known groups first (in display order), then any unlisted groups alphabetically. */
export function getArmorerRecipeGroupOrder(groups: Map<string, ItemData[]>): string[] {
  const ordered = ARMORER_RECIPE_GROUP_ORDER.filter((g) => groups.has(g));
  const unknown = [...groups.keys()]
    .filter((g) => !ARMORER_RECIPE_GROUP_ORDER_SET.has(g))
    .sort((a, b) => a.localeCompare(b));
  return [...ordered, ...unknown];
}
