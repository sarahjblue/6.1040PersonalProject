import { endpoint, receive, respond } from "@mit-sdg/sync-engine/boundary";
import { concepts } from "../concepts.ts";

const { Tagging } = concepts;

const Tags = endpoint("/tagging/tags", () =>
  receive({}).then(respond({ tags: Tagging._tags({}) })),
);

const Search = endpoint(
  "/tagging/search",
  ({ selectedTags }) =>
    receive({ selectedTags })
      .then(respond({ items: Tagging._search({ selectedTags }) })),
  { input: { required: ["selectedTags"] } },
);

const Tag = endpoint(
  "/tagging/tag",
  ({ item, tag }) =>
    receive({ item, tag })
      .then(Tagging.tag({ item, tag }))
      .then(respond({})),
  { input: { required: ["item", "tag"] } },
);

const Untag = endpoint(
  "/tagging/untag",
  ({ item, tag }) =>
    receive({ item, tag })
      .then(Tagging.untag({ item, tag }))
      .then(respond({})),
  { input: { required: ["item", "tag"] } },
);

const Clear = endpoint(
  "/tagging/clear",
  ({ item }) =>
    receive({ item })
      .then(Tagging.clear({ item }))
      .then(respond({})),
  { input: { required: ["item"] } },
);

export const composition = { Tags, Search, Tag, Untag, Clear };
