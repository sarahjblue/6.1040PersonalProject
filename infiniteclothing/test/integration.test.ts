import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { db, connectDatabase, disconnectDatabase } from "../src/db.ts";
import {
  ClaimUnknownItem,
  CompleteUnknownItem,
  DeleteUnknownItem,
  DeleteNotCompleted,
  EditUnknownItem,
  InventoryConcept,
  ItemAlreadyPosted,
  ItemNotAvailableToClaim,
  NotClaimed,
  NoEditChanges,
  NotSellerComplete,
  NotSellerDelete,
  NotSellerEdit,
  ReleaseNotBuyer,
  ReleaseUnknownItem,
  ReleaseUnclaimed,
  SellerCannotClaim,
} from "../src/concepts/Inventory.ts";
import {
  ClearUnknownItem,
  PREDEFINED_TAGS,
  TagCategoryTaken,
  TagNotExist,
  TaggingConcept,
} from "../src/concepts/Tagging.ts";
import {
  ConversationClosed,
  ConversationExists,
  InvalidConversation,
  MessagingConcept,
  NotConversationMember,
  SendUnknownConversation,
  SelfMessage,
  UnknownConversation,
} from "../src/concepts/Messaging.ts";
import {
  EmailAlreadyUsed,
  IncorrectPassword,
  MITUserVerificationConcept,
  NoUsernameFound,
  NotMIT,
  UsernameAlreadyUsed,
} from "../src/concepts/MITUserVerification.ts";
import { SessioningConcept } from "../src/concepts/Sessioning.ts";
import { assembleApplication } from "../src/assembly.ts";
import { createGateway } from "@mit-sdg/sync-engine/boundary";
import { createHttpHandler } from "@mit-sdg/sync-engine-http/handler";
import { policy } from "../web/edge.ts";
import type { Item } from "../src/concepts/Inventory.ts";

const testPrefix = `test-${crypto.randomUUID()}`;
const itemIds: number[] = [];
const conversationIds: number[] = [];
const usernames: string[] = [];
const sessionUsernames: string[] = [];

const inventory = new InventoryConcept();
const tagging = new TaggingConcept();
const messaging = new MessagingConcept();
const users = new MITUserVerificationConcept();
const sessions = new SessioningConcept();

let httpHandler: (request: Request) => Promise<Response>;

function itemInput(name: string, seller: string) {
  return {
    name,
    seller,
    image: "https://example.test/item.png",
    description: "Integration test item",
    price: "$5",
  };
}

async function postItem(name: string, seller: string): Promise<Item> {
  const result = await inventory.post(itemInput(name, seller));
  itemIds.push(result.item.id);
  return result.item;
}

async function requestJson(
  path: string,
  body: unknown,
): Promise<{ response: Response; data: unknown }> {
  const response = await httpHandler(
    new Request(`http://localhost${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
  const data: unknown = await response.json();
  return { response, data };
}

beforeAll(async () => {
  await connectDatabase();
  const application = assembleApplication();
  const gateway = createGateway({ application });
  httpHandler = createHttpHandler({ application, gateway, policy });
});

afterAll(async () => {
  try {
    await Promise.all([
      db.collection("inventory").deleteMany({ id: { $in: itemIds } }),
      db.collection("itemTags").deleteMany({
        item: { $in: itemIds.map(String) },
      }),
      db.collection("messages").deleteMany({
        conversation: { $in: conversationIds },
      }),
      db.collection("conversations").deleteMany({
        id: { $in: conversationIds },
      }),
      db.collection("users").deleteMany({
        username: { $in: usernames },
      }),
      db.collection("sessions").deleteMany({
        username: { $in: sessionUsernames },
      }),
    ]);
  } finally {
    await disconnectDatabase();
  }
});

describe("inventory", () => {
  test("posts, lists, edits, and rejects edits by non-sellers", async () => {
    const seller = `${testPrefix}-seller`;
    const item = await postItem(`${testPrefix}-editable`, seller);

    expect(item.status).toBe("AVAILABLE");
    expect((await inventory._available()).some(({ item: row }) => row.id === item.id))
      .toBe(true);
    expect(await inventory._claimedForUser({ user: seller })).toContainEqual(
      expect.objectContaining({
        item: expect.objectContaining({ id: item.id, status: "AVAILABLE" }),
      }),
    );
    const original = await db.collection("inventory").findOne({ id: item.id });

    await expect(
      inventory.edit({ item, user: `${testPrefix}-stranger`, price: "$6" }),
    ).rejects.toBeInstanceOf(NotSellerEdit);
    await expect(
      inventory.edit({ item, user: seller }),
    ).rejects.toBeInstanceOf(NoEditChanges);
    expect(await db.collection("inventory").findOne({ id: item.id })).toEqual(original);

    await inventory.edit({
      item,
      user: seller,
      description: "Updated description",
      price: "$7",
    });
    const updated = (await inventory._available()).find(
      ({ item: row }) => row.id === item.id,
    );
    expect(updated?.description).toBe("Updated description");
    expect(updated?.price).toBe("$7");
  });

  test("rejects duplicate posts and invalid inventory actions without changing state", async () => {
    const seller = `${testPrefix}-validation-owner`;
    const buyer = `${testPrefix}-validation-buyer`;
    const item = await postItem(`${testPrefix}-validation-item`, seller);
    const original = await db.collection("inventory").findOne({ id: item.id });

    await expect(inventory.post(itemInput(item.name, seller)))
      .rejects.toBeInstanceOf(ItemAlreadyPosted);
    expect(await db.collection("inventory").countDocuments({
      name: item.name,
      seller,
    })).toBe(1);

    await expect(inventory.edit({
      item: { ...item, id: -1 },
      user: seller,
      price: "$8",
    })).rejects.toBeInstanceOf(EditUnknownItem);
    await expect(inventory.delete({
      item: { ...item, id: -1 },
      user: seller,
    })).rejects.toBeInstanceOf(DeleteUnknownItem);
    await expect(inventory.releaseClaim({
      item: { ...item, id: -1 },
      user: buyer,
    })).rejects.toBeInstanceOf(ReleaseUnknownItem);
    await expect(inventory.releaseClaim({ item, user: buyer }))
      .rejects.toBeInstanceOf(ReleaseUnclaimed);
    await expect(inventory.transactionCompleted({
      item: { ...item, id: -1 },
      user: seller,
    })).rejects.toBeInstanceOf(CompleteUnknownItem);
    await expect(inventory.transactionCompleted({ item, user: seller }))
      .rejects.toBeInstanceOf(NotClaimed);

    expect(await db.collection("inventory").findOne({ id: item.id })).toEqual(original);
    expect(await db.collection("inventory").findOne({ id: -1 })).toBeNull();

    await inventory.claim({ item, claimer: buyer });
    const notificationConversation = await db.collection("conversations")
      .findOne({ topic: String(item.id) });
    if (!notificationConversation) {
      throw new Error("Claim notification conversation was not created.");
    }
    conversationIds.push(notificationConversation.id);
    const claimed = await db.collection("inventory").findOne({ id: item.id });
    await expect(inventory.releaseClaim({
      item,
      user: `${testPrefix}-not-the-buyer`,
    })).rejects.toBeInstanceOf(ReleaseNotBuyer);
    await expect(inventory.delete({
      item,
      user: `${testPrefix}-not-the-seller`,
    })).rejects.toBeInstanceOf(NotSellerDelete);
    expect(await db.collection("inventory").findOne({ id: item.id })).toEqual(claimed);
  });

  test("enforces claiming, releasing, seller completion, and completed deletion rules", async () => {
    const seller = `${testPrefix}-owner`;
    const buyer = `${testPrefix}-buyer`;
    const item = await postItem(`${testPrefix}-transaction`, seller);

    const available = await db.collection("inventory").findOne({ id: item.id });
    await expect(
      inventory.claim({ item, claimer: seller }),
    ).rejects.toBeInstanceOf(SellerCannotClaim);
    expect(await db.collection("inventory").findOne({ id: item.id })).toEqual(available);
    const { conversation } = await messaging.startConversation({
      initiator: buyer,
      recipient: seller,
      topic: String(item.id),
      content: "Is the item still available?",
    });
    conversationIds.push(conversation);
    await inventory.claim({ item, claimer: buyer });
    const claimNotification = await messaging._messages({
      conversation,
      reader: seller,
    });
    expect(claimNotification).toHaveLength(2);
    expect(claimNotification[1]).toMatchObject({
      sender: buyer,
      content: "I claimed this item.",
      readStatus: "UNREAD",
    });
    const claimed = await db.collection("inventory").findOne({ id: item.id });
    await expect(
      inventory.claim({ item, claimer: `${testPrefix}-other` }),
    ).rejects.toBeInstanceOf(ItemNotAvailableToClaim);
    expect(await db.collection("inventory").findOne({ id: item.id })).toEqual(claimed);
    expect(await db.collection("messages").countDocuments({
      conversation,
    })).toBe(2);

    const sellerClaims = await inventory._claimedForUser({ user: seller });
    const buyerClaims = await inventory._claimedForUser({ user: buyer });
    expect(sellerClaims).toContainEqual(
      expect.objectContaining({ item: expect.objectContaining({ id: item.id }), buyer }),
    );
    expect(buyerClaims.some(({ item: row }) => row.id === item.id)).toBe(true);

    await expect(
      inventory.transactionCompleted({
        item,
        user: `${testPrefix}-other`,
      }),
    ).rejects.toBeInstanceOf(NotSellerComplete);
    expect(await db.collection("inventory").findOne({ id: item.id })).toEqual(claimed);
    await inventory.transactionCompleted({ item, user: seller });
    expect(await messaging._conversationsOf({ user: seller })).not.toContainEqual(
      expect.objectContaining({ conversation }),
    );
    expect(await messaging._conversationsOf({ user: buyer })).not.toContainEqual(
      expect.objectContaining({ conversation }),
    );
    expect(await messaging._messages({ conversation, reader: seller })).toEqual([]);
    expect(await messaging._messages({ conversation, reader: buyer })).toEqual([]);
    for (const user of [seller, buyer]) {
      const inbox = await requestJson("/api/messaging/conversations", { user });
      expect(inbox.response.status).toBe(200);
      expect(inbox.data).toHaveProperty("result.conversations");
      expect(inbox.data).not.toHaveProperty(
        "result.conversations",
        expect.arrayContaining([expect.objectContaining({ conversation })]),
      );
      const hiddenMessages = await requestJson("/api/messaging/messages", {
        conversation,
        reader: user,
      });
      expect(hiddenMessages.response.status).toBe(200);
      expect(hiddenMessages.data).toHaveProperty("result.messages", []);
    }
    await expect(messaging.sendMessage({
      conversation,
      sender: buyer,
      content: "Follow-up after completion",
    })).rejects.toBeInstanceOf(ConversationClosed);
    expect(await db.collection("conversations").findOne({ id: conversation }))
      .not.toBeNull();
    expect(await db.collection("messages").countDocuments({ conversation })).toBe(2);
    await messaging.purgeClosed();
    expect(await db.collection("conversations").findOne({ id: conversation }))
      .not.toBeNull();
    expect(await db.collection("messages").countDocuments({ conversation })).toBe(2);
    expect(await inventory._claimedForUser({ user: seller })).toContainEqual(
      expect.objectContaining({
        item: expect.objectContaining({ id: item.id, status: "COMPLETED" }),
      }),
    );
    await expect(
      inventory.delete({ item, user: seller }),
    ).rejects.toBeInstanceOf(DeleteNotCompleted);
    expect(await db.collection("inventory").findOne({ id: item.id }))
      .toMatchObject({ status: "COMPLETED", buyer });
  });

  test("deletes an available item and refuses unknown item claims", async () => {
    const seller = `${testPrefix}-delete-owner`;
    const item = await postItem(`${testPrefix}-delete`, seller);

    await expect(
      inventory.claim({ item: { ...item, id: -1 }, claimer: `${testPrefix}-buyer` }),
    ).rejects.toBeInstanceOf(ClaimUnknownItem);
    expect(await db.collection("inventory").findOne({ id: item.id }))
      .toMatchObject({ status: "AVAILABLE" });

    await inventory.delete({ item, user: seller });
    expect(
      (await inventory._available()).some(({ item: row }) => row.id === item.id),
    ).toBe(false);
  });

  test("claiming an item starts a seller notification conversation when no thread exists", async () => {
    const seller = `${testPrefix}-claim-notification-seller`;
    const buyer = `${testPrefix}-claim-notification-buyer`;
    const item = await postItem(`${testPrefix}-claim-notification`, seller);

    expect(await messaging._conversationsOf({ user: seller })).not.toContainEqual(
      expect.objectContaining({ topic: String(item.id) }),
    );

    await inventory.claim({ item, claimer: buyer });

    const sellerConversations = await messaging._conversationsOf({ user: seller });
    const conversation = sellerConversations.find(
      (candidate) => candidate.topic === String(item.id),
    );
    expect(conversation).toMatchObject({
      initiator: buyer,
      recipient: seller,
    });
    if (!conversation) throw new Error("Claim notification conversation was not created.");
    conversationIds.push(conversation.conversation);
    expect(await messaging._messages({
      conversation: conversation.conversation,
      reader: seller,
    })).toEqual([
      expect.objectContaining({
        sender: buyer,
        content: "I claimed this item.",
        readStatus: "UNREAD",
      }),
    ]);
  });

  test("deleting an item closes its conversations and purges them after 24 hours", async () => {
    const seller = `${testPrefix}-cascade-owner`;
    const buyer = `${testPrefix}-cascade-buyer`;
    const item = await postItem(`${testPrefix}-cascade-delete`, seller);
    const unrelatedTopic = `${testPrefix}-unrelated-topic`;

    const related = await messaging.startConversation({
      initiator: buyer,
      recipient: seller,
      topic: String(item.id),
      content: "Is this available?",
    });
    conversationIds.push(related.conversation);
    await messaging.sendMessage({
      conversation: related.conversation,
      sender: seller,
      content: "Yes.",
    });

    const relatedSecond = await messaging.startConversation({
      initiator: `${testPrefix}-second-buyer`,
      recipient: seller,
      topic: String(item.id),
      content: "Can I claim this?",
    });
    conversationIds.push(relatedSecond.conversation);

    const unrelated = await messaging.startConversation({
      initiator: buyer,
      recipient: seller,
      topic: unrelatedTopic,
      content: "Unrelated item question",
    });
    conversationIds.push(unrelated.conversation);

    await expect(
      inventory.delete({ item, user: `${testPrefix}-stranger` }),
    ).rejects.toBeInstanceOf(NotSellerDelete);
    for (const conversation of [related.conversation, relatedSecond.conversation]) {
      expect(await db.collection("conversations").findOne({ id: conversation }))
        .not.toHaveProperty("closedAt");
      expect(await db.collection("messages").countDocuments({ conversation }))
        .toBe(conversation === related.conversation ? 2 : 1);
    }

    const deletion = await requestJson("/api/inventory/delete", {
      item,
      user: seller,
    });
    expect(deletion.response.status).toBe(200);

    for (const conversation of [related.conversation, relatedSecond.conversation]) {
      const closed = await db.collection("conversations").findOne({ id: conversation });
      expect(closed?.closedAt).toBeNumber();
      expect(await db.collection("messages").countDocuments({ conversation }))
        .toBe(conversation === related.conversation ? 2 : 1);
    }
    expect(await db.collection("conversations").findOne({ id: unrelated.conversation }))
      .not.toBeNull();
    expect(await db.collection("messages").countDocuments({
      conversation: unrelated.conversation,
    })).toBe(1);

    const inbox = await requestJson("/api/messaging/conversations", { user: buyer });
    expect(inbox.response.status).toBe(200);
    for (const conversation of [related.conversation, relatedSecond.conversation]) {
      expect(await db.collection("conversations").findOne({ id: conversation }))
        .not.toBeNull();
      expect(inbox.data).not.toHaveProperty(
        "result.conversations",
        expect.arrayContaining([expect.objectContaining({ conversation })]),
      );
    }
    expect(await messaging._messages({
      conversation: related.conversation,
      reader: buyer,
    })).toEqual([]);
    expect(await messaging._messages({
      conversation: related.conversation,
      reader: seller,
    })).toEqual([]);
    const hiddenMessages = await requestJson("/api/messaging/messages", {
      conversation: related.conversation,
      reader: buyer,
    });
    expect(hiddenMessages.response.status).toBe(200);
    expect(hiddenMessages.data).toHaveProperty("result.messages", []);
    expect(await db.collection("messages").countDocuments({
      conversation: related.conversation,
    })).toBe(2);
    const sellerInbox = await requestJson("/api/messaging/conversations", {
      user: seller,
    });
    expect(sellerInbox.response.status).toBe(200);
    for (const conversation of [related.conversation, relatedSecond.conversation]) {
      expect(sellerInbox.data).not.toHaveProperty(
        "result.conversations",
        expect.arrayContaining([expect.objectContaining({ conversation })]),
      );
    }

    await db.collection("conversations").updateMany(
      { id: { $in: [related.conversation, relatedSecond.conversation] } },
      { $set: { closedAt: Date.now() - 25 * 60 * 60 * 1000 } },
    );
    const expiredThread = await requestJson("/api/messaging/messages", {
      conversation: related.conversation,
      reader: buyer,
    });
    expect(expiredThread.response.status).toBe(200);
    expect(expiredThread.data).toHaveProperty("result.messages", []);
    expect(await db.collection("conversations").findOne({ id: related.conversation }))
      .toBeNull();
    expect(await db.collection("messages").countDocuments({
      conversation: related.conversation,
    })).toBe(0);

    const expiredInbox = await requestJson("/api/messaging/conversations", {
      user: buyer,
    });
    expect(expiredInbox.response.status).toBe(200);
    for (const conversation of [related.conversation, relatedSecond.conversation]) {
      expect(await db.collection("conversations").findOne({ id: conversation }))
        .toBeNull();
      expect(await db.collection("messages").countDocuments({ conversation }))
        .toBe(0);
    }
    expect(await db.collection("conversations").findOne({ id: unrelated.conversation }))
      .not.toBeNull();
  });

  test("releases a buyer's claim back into available inventory", async () => {
    const seller = `${testPrefix}-release-owner`;
    const buyer = `${testPrefix}-release-buyer`;
    const item = await postItem(`${testPrefix}-release`, seller);
    await inventory.claim({ item, claimer: buyer });
    const claimConversation = await db.collection("conversations")
      .findOne({ topic: String(item.id) });
    if (!claimConversation) {
      throw new Error("Claim notification conversation was not created.");
    }
    conversationIds.push(claimConversation.id);

    await inventory.releaseClaim({ item, user: buyer });
    const restored = (await inventory._available()).find(
      ({ item: row }) => row.id === item.id,
    );
    expect(restored?.item.status).toBe("AVAILABLE");
    expect(restored?.item.buyer).toBeUndefined();
  });
});

describe("tagging", () => {
  test("lists predefined tags and applies, searches, removes, and clears tags", async () => {
    const item = await postItem(
      `${testPrefix}-tagged`,
      `${testPrefix}-tag-owner`,
    );
    const itemKey = String(item.id);

    const definitions = await tagging._tags();
    expect(definitions.length).toBe(PREDEFINED_TAGS.length);
    expect(definitions.some(({ tag }) => tag === "size:M")).toBe(true);

    await tagging.tag({ item: itemKey, tag: "size:M" });
    await tagging.tag({ item: itemKey, tag: "color:BLUE" });
    await tagging.tag({ item: itemKey, tag: "size:M" });

    await expect(
      tagging.tag({ item: itemKey, tag: "size:L" }),
    ).rejects.toBeInstanceOf(TagCategoryTaken);
    await expect(
      tagging.tag({ item: itemKey, tag: "unknown:tag" }),
    ).rejects.toBeInstanceOf(TagNotExist);

    expect((await tagging._tagsForItem({ item: itemKey })).map(({ tag }) => tag))
      .toEqual(["color:BLUE", "size:M"]);
    expect(
      await tagging._search({ selectedTags: ["size:M", "color:BLUE"] }),
    ).toContainEqual({ item: itemKey });
    expect(await tagging._search({ selectedTags: ["size:M", "color:RED"] }))
      .not.toContainEqual({ item: itemKey });
    expect(await tagging._search({ selectedTags: ["not:a-tag"] })).toEqual([]);
    expect(await tagging._search({ selectedTags: [] })).toEqual([]);

    await tagging.untag({ item: itemKey, tag: "size:M" });
    expect(await tagging._tagsForItem({ item: itemKey })).toEqual([
      { tag: "color:BLUE", category: "color", label: "BLUE" },
    ]);
    await tagging.clear({ item: itemKey });
    expect(await tagging._tagsForItem({ item: itemKey })).toEqual([]);
    await expect(
      tagging.clear({ item: `${testPrefix}-no-tags` }),
    ).rejects.toBeInstanceOf(ClearUnknownItem);
  });

  test("keeps tag state unchanged on rejected and repeated actions", async () => {
    const item = await postItem(
      `${testPrefix}-tag-state`,
      `${testPrefix}-tag-state-owner`,
    );
    const itemKey = String(item.id);
    await tagging.tag({ item: itemKey, tag: "color:GREEN" });
    const originalTags = await tagging._tagsForItem({ item: itemKey });

    await expect(tagging.tag({ item: itemKey, tag: "color:RED" }))
      .rejects.toBeInstanceOf(TagCategoryTaken);
    await expect(tagging.tag({ item: itemKey, tag: "unknown:tag" }))
      .rejects.toBeInstanceOf(TagNotExist);
    expect(await tagging._tagsForItem({ item: itemKey })).toEqual(originalTags);

    await tagging.tag({ item: itemKey, tag: "color:GREEN" });
    await tagging.untag({ item: itemKey, tag: "unknown:tag" });
    expect(await tagging._tagsForItem({ item: itemKey })).toEqual(originalTags);
    await tagging.untag({ item: itemKey, tag: "color:GREEN" });
    await tagging.untag({ item: itemKey, tag: "color:GREEN" });
    expect(await tagging._tagsForItem({ item: itemKey })).toEqual([]);
    await expect(tagging.clear({ item: itemKey }))
      .rejects.toBeInstanceOf(ClearUnknownItem);
  });
});

describe("messaging", () => {
  test("starts conversations, tracks read status, enforces membership, and purges expired threads", async () => {
    const initiator = `${testPrefix}-message-sender`;
    const recipient = `${testPrefix}-message-recipient`;
    const topic = `${testPrefix}-message-topic`;

    await expect(
      messaging.startConversation({
        initiator,
        recipient: initiator,
        topic,
        content: "Self message",
      }),
    ).rejects.toBeInstanceOf(SelfMessage);
    expect(await db.collection("conversations").countDocuments({ topic })).toBe(0);
    expect(await db.collection("messages").countDocuments({
      sender: initiator,
      content: "Self message",
    })).toBe(0);

    const { conversation } = await messaging.startConversation({
      initiator,
      recipient,
      topic,
      content: "Initial message",
    });
    conversationIds.push(conversation);

    const initialMessageCount = await db.collection("messages")
      .countDocuments({ conversation });
    await expect(messaging.startConversation({
      initiator: recipient,
      recipient: initiator,
      topic,
      content: "Duplicate conversation",
    })).rejects.toBeInstanceOf(ConversationExists);
    expect(await db.collection("conversations").countDocuments({ topic }))
      .toBe(1);
    expect(await db.collection("messages").countDocuments({ conversation }))
      .toBe(initialMessageCount);

    expect((await messaging._conversationsOf({ user: initiator }))).toContainEqual({
      conversation,
      topic,
      initiator,
      recipient,
    });
    expect(await messaging._messages({ conversation, reader: recipient })).toEqual([
      expect.objectContaining({
        sender: initiator,
        content: "Initial message",
        readStatus: "UNREAD",
      }),
    ]);

    await expect(
      messaging._messages({
        conversation,
        reader: `${testPrefix}-outsider`,
      }),
    ).rejects.toBeInstanceOf(NotConversationMember);
    await expect(messaging.sendMessage({
      conversation: -1,
      sender: initiator,
      content: "Unknown conversation",
    })).rejects.toBeInstanceOf(SendUnknownConversation);
    await expect(messaging.sendMessage({
      conversation,
      sender: `${testPrefix}-outsider`,
      content: "Not a participant",
    })).rejects.toBeInstanceOf(InvalidConversation);
    await expect(messaging.markRead({
      conversation,
      reader: `${testPrefix}-outsider`,
    })).rejects.toBeInstanceOf(NotConversationMember);
    await expect(messaging.markRead({
      conversation: -1,
      reader: recipient,
    })).rejects.toBeInstanceOf(UnknownConversation);
    expect(await db.collection("messages").countDocuments({ conversation }))
      .toBe(initialMessageCount);
    expect((await messaging._messages({ conversation, reader: recipient }))[0]?.readStatus)
      .toBe("UNREAD");
    await messaging.markRead({ conversation, reader: recipient });
    expect((await messaging._messages({ conversation, reader: recipient }))[0]?.readStatus)
      .toBe("READ");

    await messaging.sendMessage({
      conversation,
      sender: recipient,
      content: "Reply",
    });
    const senderReadStatuses = await messaging._messages({
      conversation,
      reader: initiator,
    });
    expect(senderReadStatuses.map(({ readStatus }) => readStatus))
      .toEqual(["READ", "UNREAD"]);
    await messaging.markRead({ conversation, reader: initiator });
    expect((await messaging._messages({ conversation, reader: initiator }))
      .map(({ readStatus }) => readStatus)).toEqual(["READ", "READ"]);
    await messaging.closeConversation({ topic });
    const closedAt = (await db.collection("conversations").findOne({ id: conversation }))
      ?.closedAt;
    await messaging.closeConversation({ topic });
    expect((await db.collection("conversations").findOne({ id: conversation }))
      ?.closedAt).toBe(closedAt);
    await expect(
      messaging.sendMessage({ conversation, sender: initiator, content: "Closed" }),
    ).rejects.toBeInstanceOf(ConversationClosed);
    expect(await db.collection("messages").countDocuments({ conversation })).toBe(2);

    await db.collection("conversations").updateOne(
      { id: conversation },
      { $set: { closedAt: Date.now() - 25 * 60 * 60 * 1000 } },
    );
    await messaging.purgeClosed();
    expect(await messaging._messages({ conversation, reader: recipient }))
      .toEqual([]);
  });
});

describe("account verification and sessions", () => {
  test("registers MIT users as active accounts and verifies credentials", async () => {
    const username = `${testPrefix}-account`;
    const email = `${testPrefix}@mit.edu`;
    usernames.push(username);

    await expect(
      users.register({
        username: `${username}-outside`,
        email: `${testPrefix}@example.com`,
        password: "correct horse battery staple",
      }),
    ).rejects.toBeInstanceOf(NotMIT);
    expect(await db.collection("users").countDocuments({
      username: `${username}-outside`,
    })).toBe(0);

    const registration = await users.register({
      username,
      email,
      password: "correct horse battery staple",
    });
    expect(registration.user).toEqual({ username, email });
    expect(registration).not.toHaveProperty("token");
    const storedAccount = await db.collection("users").findOne({ username });
    expect(storedAccount?.confirmed).toBe("CONFIRMED");
    expect(
      (await users.authenticate({
        username,
        password: "correct horse battery staple",
      })).user,
    ).toEqual({ username, email });

    await expect(
      users.register({
        username,
        email: `${testPrefix}-duplicate@mit.edu`,
        password: "another password",
      }),
    ).rejects.toBeInstanceOf(UsernameAlreadyUsed);
    expect(await db.collection("users").countDocuments({ username })).toBe(1);
    const duplicateEmailUsername = `${username}-duplicate-email`;
    await expect(users.register({
      username: duplicateEmailUsername,
      email,
      password: "another password",
    })).rejects.toBeInstanceOf(EmailAlreadyUsed);
    expect(await db.collection("users").findOne({ username: duplicateEmailUsername }))
      .toBeNull();
    await expect(users.authenticate({
      username: `${username}-unknown`,
      password: "correct horse battery staple",
    })).rejects.toBeInstanceOf(NoUsernameFound);

    await expect(
      users.authenticate({ username, password: "wrong password" }),
    ).rejects.toBeInstanceOf(IncorrectPassword);
    expect(await db.collection("users").findOne({ username })).toEqual(storedAccount);
    expect(
      (await users.authenticate({
        username,
        password: "correct horse battery staple",
      })).user,
    ).toEqual({ username, email });
  });

  test("opens a stable session and resolves its user", async () => {
    const username = `${testPrefix}-session`;
    sessionUsernames.push(username);
    const user = { username, email: `${username}@mit.edu` };

    const opened = await sessions.sessionOpen({ user });
    const reopened = await sessions.sessionOpen({ user });
    expect(reopened.session.id).toBe(opened.session.id);
    expect(await sessions._getUser({ session: opened.session })).toEqual({ user });
    expect(await db.collection("sessions").countDocuments({ username })).toBe(1);
  });
});

describe("HTTP compositions", () => {
  test("supports the account-to-sale journey through the HTTP boundary", async () => {
    const sellerName = `${testPrefix}-journey-seller`;
    const buyerName = `${testPrefix}-journey-buyer`;
    const sellerEmail = `${sellerName}@mit.edu`;
    const buyerEmail = `${buyerName}@mit.edu`;
    usernames.push(sellerName, buyerName);
    sessionUsernames.push(sellerName, buyerName);

    const sellerRegistration = await requestJson("/api/users/register", {
      username: sellerName,
      email: sellerEmail,
      password: "test seller password",
    });
    expect(sellerRegistration.response.status).toBe(200);
    expect(sellerRegistration.data).not.toHaveProperty("token");
    const sellerLogin = await requestJson("/api/users/authenticate", {
      username: sellerName,
      password: "test seller password",
    });
    expect(sellerLogin.response.status).toBe(200);

    const buyerRegistration = await requestJson("/api/users/register", {
      username: buyerName,
      email: buyerEmail,
      password: "test buyer password",
    });
    expect(buyerRegistration.response.status).toBe(200);
    expect(buyerRegistration.data).not.toHaveProperty("token");
    const buyerLogin = await requestJson("/api/users/authenticate", {
      username: buyerName,
      password: "test buyer password",
    });
    expect(buyerLogin.response.status).toBe(200);

    const sellerSession = await requestJson("/api/sessioning/sessionOpen", {
      user: { username: sellerName, email: sellerEmail },
    });
    expect(sellerSession.response.status).toBe(200);
    const session = (sellerSession.data as {
      session: { id: string; user: { username: string; email: string } };
    }).session;
    expect(await sessions._getUser({ session })).toEqual({ user: session.user });

    const itemName = `${testPrefix}-journey-item`;
    const posted = await requestJson("/api/inventory/post", {
      ...itemInput(itemName, sellerName),
    });
    expect(posted.response.status).toBe(200);
    const availableResponse = await requestJson("/api/inventory/available", {});
    const availableData = availableResponse.data as {
      inventory: { items: Array<{ item: Item }> };
    };
    const item = availableData.inventory.items.find(
      ({ item: row }) => row.name === itemName && row.seller === sellerName,
    )?.item;
    expect(item).toBeDefined();
    if (!item) throw new Error("Posted journey item was not listed.");
    itemIds.push(item.id);

    const itemKey = String(item.id);
    const addSizeTag = await requestJson("/api/tagging/tag", {
      item: itemKey,
      tag: "size:M",
    });
    expect(addSizeTag.response.status).toBe(200);
    const search = await requestJson("/api/tagging/search", {
      selectedTags: ["size:M"],
    });
    expect(search.response.status).toBe(200);
    expect(search.data).toHaveProperty("result");
    const itemTags = await requestJson("/api/tagging/itemTags", {
      item: itemKey,
    });
    expect(itemTags.response.status).toBe(200);

    const started = await requestJson("/api/messaging/startConversation", {
      initiator: buyerName,
      recipient: sellerName,
      topic: itemKey,
      content: "Is this still available?",
    });
    expect(started.response.status).toBe(200);
    const conversation = (started.data as { conversation: number }).conversation;
    conversationIds.push(conversation);

    const inbox = await requestJson("/api/messaging/conversations", {
      user: sellerName,
    });
    expect(inbox.response.status).toBe(200);
    const history = await requestJson("/api/messaging/messages", {
      conversation,
      reader: sellerName,
    });
    expect(history.response.status).toBe(200);
    const markedRead = await requestJson("/api/messaging/markRead", {
      conversation,
      reader: sellerName,
    });
    expect(markedRead.response.status).toBe(200);
    const reply = await requestJson("/api/messaging/sendMessage", {
      conversation,
      sender: sellerName,
      content: "Yes, it is available.",
    });
    expect(reply.response.status).toBe(200);

    const claim = await requestJson("/api/inventory/claim", {
      item,
      claimer: buyerName,
    });
    expect(claim.response.status).toBe(200);
    const claimMessages = await requestJson("/api/messaging/messages", {
      conversation,
      reader: sellerName,
    });
    expect(claimMessages.response.status).toBe(200);
    expect(claimMessages.data).toHaveProperty(
      "result.messages",
      expect.arrayContaining([
        expect.objectContaining({
          sender: buyerName,
          content: "I claimed this item.",
          readStatus: "UNREAD",
        }),
      ]),
    );
    const claimed = await requestJson("/api/inventory/claimed", {
      user: buyerName,
    });
    expect(claimed.response.status).toBe(200);
    const sellerClaimed = await requestJson("/api/inventory/claimed", {
      user: sellerName,
    });
    expect(sellerClaimed.response.status).toBe(200);
    const sellerClaimedData = sellerClaimed.data as {
      inventory: { items: Array<{ item: Item; buyer: string }> };
    };
    expect(sellerClaimedData.inventory.items).toContainEqual(
      expect.objectContaining({
        item: expect.objectContaining({ id: item.id }),
        buyer: buyerName,
      }),
    );

    const release = await requestJson("/api/inventory/releaseClaim", {
      item,
      user: buyerName,
    });
    expect(release.response.status).toBe(200);
    expect(
      (await requestJson("/api/inventory/claim", {
        item,
        claimer: buyerName,
      })).response.status,
    ).toBe(200);
    const completed = await requestJson(
      "/api/inventory/transactionCompleted",
      { item, user: sellerName },
    );
    expect(completed.response.status).toBe(200);
    expect(
      (await requestJson("/api/inventory/delete", {
        item,
        user: sellerName,
      })).response.status,
    ).toBe(409);

    const clearTags = await requestJson("/api/tagging/clear", {
      item: itemKey,
    });
    expect(clearTags.response.status).toBe(200);
    const closeConversation = await requestJson(
      "/api/messaging/closeConversation",
      { topic: itemKey },
    );
    expect(closeConversation.response.status).toBe(200);
    await db.collection("conversations").updateOne(
      { id: conversation },
      { $set: { closedAt: Date.now() - 25 * 60 * 60 * 1000 } },
    );
    const purged = await requestJson("/api/messaging/purgeClosed", {});
    expect(purged.response.status).toBe(200);
  });

  test("serves valid routes, validates methods, and reports unknown routes", async () => {
    const tags = await requestJson("/api/tagging/tags", {});
    expect(tags.response.status).toBe(200);
    expect(tags.data).toHaveProperty("tags.tags");

    const inventoryResult = await requestJson("/api/inventory/available", {});
    expect(inventoryResult.response.status).toBe(200);
    expect(inventoryResult.data).toHaveProperty("inventory.items");

    const unknown = await httpHandler(
      new Request("http://localhost/api/no-such-route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      }),
    );
    expect(unknown.status).toBe(404);

    const invalidMethod = await httpHandler(
      new Request("http://localhost/api/inventory/available", {
        method: "GET",
      }),
    );
    expect(invalidMethod.status).toBe(400);
  });
});
