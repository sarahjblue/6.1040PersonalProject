import { conceptSet, registerConcept } from "@mit-sdg/sync-engine/assembly";

import inventorySpec from "../design/concepts/Inventory.md" with { type: "text" };
import messagingSpec from "../design/concepts/Messaging.md" with { type: "text" };
import mitUserVerificationSpec from "../design/concepts/MITUserVerification.md" with { type: "text" };
import sessioningSpec from "../design/concepts/Sessioning.md" with { type: "text" };
import taggingSpec from "../design/concepts/Tagging.md" with { type: "text" };

import { SessioningConcept } from "./concepts/Sessioning.ts";

import {
    TagNotExist,
    TagCategoryTaken,
    ClearUnknownItem,
    TaggingConcept } from "./concepts/Tagging.ts";

import {
  InventoryConcept,
  ItemAlreadyPosted,
  ClaimUnknownItem,
  ItemNotAvailableToClaim,
  SellerCannotClaim,
  EditUnknownItem,
  NotSellerEdit,
  NoEditChanges,
  DeleteUnknownItem,
  NotSellerDelete,
  DeleteNotCompleted,
  ReleaseUnknownItem,
  ReleaseUnclaimed,
  ReleaseNotBuyer,
  CompleteUnknownItem,
  NotClaimed,
  NotSellerComplete,
} from "./concepts/Inventory.ts";

import{
    MessagingConcept,
    SelfMessage,
    ConversationClosed,
    NotConversationMember,
    UnknownConversation,
    ConversationExists,
    SendUnknownConversation,
    InvalidConversation
} from "./concepts/Messaging.ts";

import{
    MITUserVerificationConcept,
    UsernameAlreadyUsed,
    NotMIT,
    EmailAlreadyUsed,
    InvalidToken,
    NoUsernameFound,
    IncorrectPassword,
    NotConfirmed
} from "./concepts/MITUserVerification.ts";

const inventory = registerConcept({
  class: InventoryConcept,
  spec: inventorySpec,
  refusals: {
    ITEM_ALREADY_POSTED: ItemAlreadyPosted,
    CLAIM_UNKNOWN_ITEM: ClaimUnknownItem,
    ITEM_NOT_AVAILABLE_TO_CLAIM: ItemNotAvailableToClaim,
    SELLER_CANNOT_CLAIM: SellerCannotClaim,
    EDIT_UNKNOWN_ITEM: EditUnknownItem,
    NOT_SELLER_EDIT: NotSellerEdit,
    NO_EDIT_CHANGES: NoEditChanges,
    DELETE_UNKNOWN_ITEM: DeleteUnknownItem,
    NOT_SELLER_DELETE: NotSellerDelete,
    DELETE_NOT_COMPLETED: DeleteNotCompleted,
    RELEASE_UNKNOWN_ITEM: ReleaseUnknownItem,
    RELEASE_UNCLAIMED: ReleaseUnclaimed,
    RELEASE_NOT_BUYER: ReleaseNotBuyer,
    COMPLETE_UNKNOWN_ITEM: CompleteUnknownItem,
    NOT_CLAIMED: NotClaimed,
    NOT_SELLER_COMPLETE: NotSellerComplete,
  },
});

const messaging = registerConcept({
  class: MessagingConcept,
  spec: messagingSpec,
  refusals: {
    SELF_MESSAGE: SelfMessage,
    CONVERSATION_CLOSED: ConversationClosed,
    NOT_CONVERSATION_MEMBER: NotConversationMember,
    UNKNOWN_CONVERSATION: UnknownConversation,
    CONVERSATION_EXISTS: ConversationExists,
    SEND_UNKNOWN_CONVERSATION: SendUnknownConversation,
    INVALID_CONVERSATION: InvalidConversation
  }
});

const mitUserVerification = registerConcept({
  class: MITUserVerificationConcept,
  spec: mitUserVerificationSpec,
  refusals: {
    USERNAME_ALREADY_USED: UsernameAlreadyUsed,
    NOT_MIT: NotMIT,
    EMAIL_ALREADY_USED: EmailAlreadyUsed,
    INVALID_TOKEN: InvalidToken,
    NO_USERNAME_FOUND: NoUsernameFound,
    INCORRECT_PASSWORD: IncorrectPassword,
    NOT_CONFIRMED: NotConfirmed
  }

});

const sessioning = registerConcept({
  class: SessioningConcept,
  spec: sessioningSpec,
});

const tagging = registerConcept({
  class: TaggingConcept,
  spec: taggingSpec,
  refusals:{
    TAG_NOT_EXIST: TagNotExist,
    TAG_CATEGORY_TAKEN: TagCategoryTaken,
    CLEAR_UNKNOWN_ITEM: ClearUnknownItem
  }
});

export const applicationConceptSet = conceptSet({
  Inventory: inventory,
  Messaging: messaging,
  MITUserVerification: mitUserVerification,
  Sessioning: sessioning,
  Tagging: tagging,
});

export const { concepts } = applicationConceptSet;
