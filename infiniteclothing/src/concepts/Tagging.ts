import {Item} from "./Inventory.ts";

type TagDefinition = {category: string, label: string};

export const PREDEFINED_TAGS: readonly TagDefinition[] = [
  ...["XS", "S", "M", "L", "XL", "XXL", "OTHER"].map((label) => ({ category: "size", label })),
  ...[
    "RED",
    "ORANGE",
    "YELLOW",
    "GREEN",
    "BLUE",
    "PURPLE",
    "WHITE",
    "BROWN",
    "BLACK",
    "PINK",
  ].map((label) => ({ category: "color", label })),
];

const tagId = ({category, label}: TagDefinition) => `${category}:${label}`;

export class TaggingConcept {
    private readonly tags = new Map<string, TagDefinition>();
    private readonly items = new Map<string, Set<string>>();

    constructor(predefined: readonly TagDefinition[] = PREDEFINED_TAGS) {
        for (const definition of predefined) this.tags.set(tagId(definition), definition);
    }

    tag(item: string, tag: string) {

        const definition = this.tags.get(tag);
        if(definition === undefined){
            throw new Error("This tag does not exist.");
        }
        const held = this.items.get(item) ?? new Set<string>();

        for (const existing of held) {
            if(this.tags.get(existing)?.category === definition.category){
                throw new Error("This item already has a tag in that category.");
            }
        }

        held.add(tag);
        this.items.set(item, held);
    }

    untag(item: string, tag: string){
        const held = this.items.get(item);
        if(held === undefined || !held.has(tag)){
            throw new Error("This item does not have that tag.");
        }
    }

    clear(item: string){
        if(this.items.delete(item)){
            throw new Error("This item has no tags to clear");
        }
    }

    _search(tags: string[]): Array<{item: string}> {
        if(tags.some((tag) => !this.tags.has(tag))){
            return [];
        }

        return [...this.items.entries()].filter(([, held]) => tags.every((tag) => held.has(tag))).map(([item]) => ({item}));
    }

    _tags(input: Record<string, never>): Array<{tag: string; category: string; label: string}>{
        return [...this.tags.entries()].map(([tag, {category, label}]) => ({tag, category, label,}));
    }
}
