import { assembleApplication } from "./src/assembly.ts";

export default {
  assemble: assembleApplication,
  title: "Application",
  design: {
    version: 1,
    documents: [
      new URL("./design/types.md", import.meta.url),
      new URL("./design/compositions/Inventory.md", import.meta.url),
      new URL("./design/compositions/Messaging.md", import.meta.url),
      new URL("./design/compositions/MITUserVerification.md", import.meta.url),
      new URL("./design/compositions/Sessioning.md", import.meta.url),
      new URL("./design/compositions/Tagging.md", import.meta.url),
    ],
  },
};
