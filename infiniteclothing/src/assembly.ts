import { assemble } from "@mit-sdg/sync-engine/assembly";
import { applicationConceptSet } from "./concepts.ts";

import { composition as inventory } from "./compositions/Inventory.ts";
import { composition as messaging } from "./compositions/Messaging.ts";
import { composition as mitUserVerification } from "./compositions/MITUserVerification.ts";
import { composition as sessioning } from "./compositions/Sessioning.ts";
import { composition as tagging } from "./compositions/Tagging.ts";

export function assembleApplication() {
  return assemble({
    conceptSet: applicationConceptSet,
    composition: {
      ...inventory,
      ...messaging,
      ...mitUserVerification,
      ...sessioning,
      ...tagging,
    },
  });
}
