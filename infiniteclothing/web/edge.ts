import { httpPolicy } from "@mit-sdg/sync-engine-http/policy";

// Without this map every concept refusal reaches the browser as 500 INTERNAL_ERROR, so the
// frontend cannot tell "wrong password" from "server down". The browser receives only the
// category, e.g. { "error": "CONFLICT" }, never the refusal code or its message.
export const publicErrors = {
  // MITUserVerification
  USERNAME_ALREADY_USED: "CONFLICT",
  EMAIL_ALREADY_USED: "CONFLICT",
  NOT_MIT: "INVALID_REQUEST",
  NO_USERNAME_FOUND: "UNAUTHORIZED", // same category as INCORRECT_PASSWORD, so logins don't reveal which usernames exist
  INCORRECT_PASSWORD: "UNAUTHORIZED",
  // Inventory
  ITEM_ALREADY_POSTED: "CONFLICT",
  CLAIM_UNKNOWN_ITEM: "NOT_FOUND",
  ITEM_NOT_AVAILABLE_TO_CLAIM: "CONFLICT",
  SELLER_CANNOT_CLAIM: "FORBIDDEN",
  EDIT_UNKNOWN_ITEM: "NOT_FOUND",
  NOT_SELLER_EDIT: "FORBIDDEN",
  NO_EDIT_CHANGES: "INVALID_REQUEST",
  DELETE_UNKNOWN_ITEM: "NOT_FOUND",
  NOT_SELLER_DELETE: "FORBIDDEN",
  DELETE_NOT_COMPLETED: "CONFLICT",
  RELEASE_UNKNOWN_ITEM: "NOT_FOUND",
  RELEASE_UNCLAIMED: "CONFLICT",
  RELEASE_NOT_BUYER: "FORBIDDEN",
  COMPLETE_UNKNOWN_ITEM: "NOT_FOUND",
  NOT_CLAIMED: "CONFLICT",
  NOT_SELLER_COMPLETE: "FORBIDDEN",
  INVALID_PRICE: "INVALID_REQUEST",
  // Tagging
  TAG_NOT_EXIST: "NOT_FOUND",
  TAG_CATEGORY_TAKEN: "CONFLICT",
  CLEAR_UNKNOWN_ITEM: "NOT_FOUND",
  // Messaging
  SELF_MESSAGE: "INVALID_REQUEST",
  CONVERSATION_EXISTS: "CONFLICT",
  CONVERSATION_CLOSED: "CONFLICT",
  NOT_CONVERSATION_MEMBER: "FORBIDDEN",
  UNKNOWN_CONVERSATION: "NOT_FOUND",
  INVALID_CONVERSATION: "FORBIDDEN",
  SEND_UNKNOWN_CONVERSATION: "NOT_FOUND",
  SEND_NOT_MEMBER: "FORBIDDEN",
  MARK_UNKNOWN_CONVERSATION: "NOT_FOUND",
  MARK_NOT_MEMBER: "FORBIDDEN",
} as const;

// basePath "/api" matches the frontend's default API_BASE. Pass this to createHttpHandler({ ..., policy }).
export const policy = httpPolicy({ basePath: "/api", publicErrors });
