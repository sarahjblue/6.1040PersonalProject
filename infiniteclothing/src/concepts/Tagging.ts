import { db } from "../db.ts";

type TagDefinition = { category: string; label: string };

export const PREDEFINED_TAGS: readonly TagDefinition[] = [
  ...["XS", "S", "M", "L", "XL", "XXL", "OTHER"].map((label) => ({ category: "size", label })),
  ...["RED", "ORANGE", "YELLOW", "GREEN", "BLUE", "PURPLE", "WHITE", "BROWN", "BLACK", "PINK"]
    .map((label) => ({ category: "color", label })),
];

export class TagNotExist extends Error {};
export class TagCategoryTaken extends Error {};
export class ClearUnknownItem extends Error {};

type TagDocument = TagDefinition & { _id: string };
type ItemTagDocument = {
  item: string;
  category: string;
  label: string;
};

const tagId = ({ category, label }: TagDefinition) => `${category}:${label}`;
const tags = db.collection<TagDocument>("tags");
const itemTags = db.collection<ItemTagDocument>("itemTags");

let indexesReady: Promise<void> | undefined;

function ensureIndexes(): Promise<void> {
  indexesReady ??= (async () => {
    await Promise.all([
      tags.createIndex({ category: 1, label: 1 }, { unique: true }),
      itemTags.createIndex({ item: 1, category: 1 }, { unique: true }),
      itemTags.createIndex({ category: 1, label: 1, item: 1 }),
    ]);

    await Promise.all(PREDEFINED_TAGS.map((tag) =>
      tags.updateOne(
        { _id: tagId(tag) },
        { $setOnInsert: { ...tag, _id: tagId(tag) } },
        { upsert: true },
      ),
    ));
  })().catch((error: unknown) => {
    indexesReady = undefined;
    throw error;
  });

  return indexesReady;
}

export class TaggingConcept {
  async tag(item: string, tag: string): Promise<void> {
    await ensureIndexes();

    const definition = await tags.findOne({ _id: tag });
    if (!definition) throw new TagNotExist("TAG_NOT_EXIST: This tag does not exist.");

    const existing = await itemTags.findOne({ item, category: definition.category });
    if (existing) {
      if (existing.label === definition.label) return;
      throw new TagCategoryTaken("TAG_CATEGORY_TAKEN: This item already has a tag in that category.");
    }

    try {
      await itemTags.insertOne({
        item,
        category: definition.category,
        label: definition.label,
      });
    } catch (error) {
      // The compound unique index also prevents concurrent category conflicts.
      if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
        throw new TagCategoryTaken("TAG_CATEGORY_TAKEN: This item already has a tag in that category.");
      }
      throw error;
    }
  }

  async untag(item: string, tag: string): Promise<void> {
    await ensureIndexes();

    const definition = await tags.findOne({ _id: tag });
    if (!definition) return;

    await itemTags.deleteOne({
      item,
      category: definition.category,
      label: definition.label,
    });
  }

  async clear(item: string): Promise<void> {
    await ensureIndexes();
    await itemTags.deleteMany({ item });
  }

  async _search(selectedTags: string[]): Promise<Array<{ item: string }>> {
    await ensureIndexes();
    if (selectedTags.length === 0) return [];

    const definitions = await tags.find(
      { _id: { $in: selectedTags } },
      { projection: { _id: 1 } },
    ).toArray();

    // Per the design, an unknown requested tag returns no results.
    if (definitions.length !== new Set(selectedTags).size) return [];

    const matches = await itemTags.aggregate<{ _id: string }>([
      { $match: { $or: definitions.map(({ _id }) => ({ category: _id.split(":")[0], label: _id.split(":")[1] })) } },
      { $group: { _id: "$item", matched: { $sum: 1 } } },
      { $match: { matched: selectedTags.length } },
      { $project: { _id: 1 } },
    ]).toArray();

    return matches.map(({ _id }) => ({ item: _id }));
  }

  async _tags(): Promise<Array<{ tag: string; category: string; label: string }>> {
    await ensureIndexes();

    const definitions = await tags.find({}, { projection: { _id: 1, category: 1, label: 1 } })
      .sort({ category: 1, label: 1 })
      .toArray();

    return definitions.map(({ _id, category, label }) => ({ tag: _id, category, label }));
  }
}
