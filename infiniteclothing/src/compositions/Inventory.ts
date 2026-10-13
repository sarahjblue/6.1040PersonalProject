import { endpoint, receive, respond } from "@mit-sdg/sync-engine/boundary";
import { each, form, former } from "@mit-sdg/sync-engine/language";
import { concepts } from "../concepts.ts";

const { Inventory } = concepts;

const AvailableInventory = former(
  "available inventory",
  (_input, { id, name, description, price, image, seller, status, buyer }) =>
    form({
      items: each(
        Inventory._available({}).is({
          id,
          name,
          description,
          price,
          image,
          seller,
          status,
          buyer,
        }),
      ).form({ id, name, description, price, image, seller, status, buyer }),
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
  { input: { required: ["name", "seller", "image"] } },
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
  { input: { required: ["item", "user"] } },
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
