import { endpoint, receive, respond } from "@mit-sdg/sync-engine/boundary";
import { each, form, former } from "@mit-sdg/sync-engine/language";
import { concepts } from "../concepts.ts";

const { Inventory } = concepts;

const AvailableInventory = former(
  "available inventory",
  (_input, { item, name, description, price, image, seller }) =>
    form({
      items: each(
        Inventory._available({}).is({
          item,
          name,
          description,
          price,
          image,
          seller,
        }),
      ).form({ item, name, description, price, image, seller}),
    }),
);

const Available = endpoint("/inventory/available", () =>
  receive({}).then(respond({ inventory: AvailableInventory({}) })),
);

const Post = endpoint(
  "/inventory/post",
  ({ name, description, price, seller, image }) =>
    receive({ name, description, price, seller, image })
      .then(
        Inventory.post({ name, seller, image, description, price })
      )
      .then(respond({ item: "item" })),
  { input: { required: ["name", "seller", "image", "description", "price"] } },
);

const Claim = endpoint(
  "/inventory/claim",
  ({ item, claimer }) =>
    receive({ item, claimer })
      .then(Inventory.claim({ item, claimer }).responds({}))
      .then(respond({})),
  { input: { required: ["item", "claimer"] } },
);

const Edit = endpoint(
  "/inventory/edit",
  ({ item, description, price, image, user }) =>
    receive({ item, description, price, image, user })
      .then(Inventory.edit({item, user, description, price, image}))
      .then(respond({})),
  { input: { required: ["item", "user", "description", "price", "image"] } },
);

const Delete = endpoint(
  "/inventory/delete",
  ({ item, user }) =>
    receive({ item, user })
      .then(Inventory.delete({item, user}))
      .then(respond({})),
  { input: { required: ["item", "user"] } },
);

const ReleaseClaim = endpoint(
  "/inventory/releaseClaim",
  ({ item, user }) =>
    receive({ item, user })
      .then(Inventory.releaseClaim({item, user}))
      .then(respond({})),
  { input: { required: ["item", "user"] } },
);

const TransactionCompleted = endpoint(
  "/inventory/transactionCompleted",
  ({ item }) =>
    receive({ item })
      .then(Inventory.transactionCompleted({item}))
      .then(respond({})),
  { input: { required: ["item"] } },
);

export const composition = {
  Available,
  Post,
  Claim,
  Edit,
  Delete,
  ReleaseClaim,
  TransactionCompleted,
};
