import { endpoint, receive, respond } from "@mit-sdg/sync-engine/boundary";
import { concepts } from "../concepts.ts";
import { each, form, former } from "@mit-sdg/sync-engine/language";


const { Tagging } = concepts;

const Tags = endpoint("/tagging/tags", () =>
  receive({}).then(respond({ tags: Tagging._tags({}) })),
);

const SearchResults = former(
  "items matching selected tags",
  ({ selectedTags }, { item }) =>
    form({
      items: each(
        Tagging._search(selectedTags).is({ item }),
    ).form({ item }),
    }),
);

const Search = endpoint(
  "/tagging/search",
  ({ selectedTags }) =>
    receive({ selectedTags }).then(
      respond({ result: SearchResults({ selectedTags }) }),
    ),
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
