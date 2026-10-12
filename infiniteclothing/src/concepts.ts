import { conceptSet } from "@mit-sdg/sync-engine/assembly";
import { inventory } from "./concepts/Inventory.ts";

export const applicationConceptSet = conceptSet({
    Inventory: inventory,
});
export const { concepts } = applicationConceptSet;
