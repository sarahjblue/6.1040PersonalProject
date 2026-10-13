import { db, nextId } from "../db.ts";

const PURGE_AFTER = 24 * 60 * 60 * 1000;
type ReadStatus = "UNREAD" | "READ";

type MessageDocument = {
  id: number;
  conversation: number;
  sender: string;
  content: string;
  sentAt: number;
  readStatus: ReadStatus;
};

type ConversationDocument = {
  id: number;
  topic: string;
  initiator: string;
  recipient: string;
  closedAt?: number;
};

export class SelfMessage extends Error {}
export class ConversationClosed extends Error {}
export class NotConversationMember extends Error {}
export class UnknownConversation extends Error {}
export class ConversationExists extends Error {}
export class SendUnknownConversation extends Error {}
export class InvalidConversation extends Error {}

const conversations = db.collection<ConversationDocument>("conversations");
const messages = db.collection<MessageDocument>("messages");
let indexesReady: Promise<void> | undefined;

function ensureIndexes(): Promise<void> {
  indexesReady ??= Promise.all([
    conversations.createIndex({ id: 1 }, { unique: true }),
    conversations.createIndex({ topic: 1, closedAt: 1 }),
    messages.createIndex({ id: 1 }, { unique: true }),
    messages.createIndex({ conversation: 1, sentAt: 1 }),
  ]).then(() => undefined).catch((error: unknown) => {
    indexesReady = undefined;
    throw error;
  });
  return indexesReady;
}

function isMember(conversation: ConversationDocument, user: string): boolean {
  return conversation.initiator === user || conversation.recipient === user;
}

export class MessagingConcept {
  async startConversation({
    initiator,
    recipient,
    topic,
    content,
  }: {
    initiator: string;
    recipient: string;
    topic: string;
    content: string;
  }): Promise<{ conversation: number }> {
    await ensureIndexes();
    if (initiator === recipient) throw new SelfMessage("You cannot start a conversation with yourself.");

    const id = await nextId("conversations");
    await conversations.insertOne({ id, topic, initiator, recipient });

    await messages.insertOne({
      id: await nextId("messages"),
      conversation: id,
      sender: initiator,
      content,
      sentAt: Date.now(),
      readStatus: "UNREAD",
    });

    return { conversation: id };
  }

  async sendMessage({
    conversation,
    sender,
    content,
  }: {
    conversation: number;
    sender: string;
    content: string;
  }): Promise<{ message: number }> {
    await ensureIndexes();

    const thread = await conversations.findOne({ id: conversation });
    if (!thread || !isMember(thread, sender)) throw new NotConversationMember("You are not a member of this conversation.");
    if (thread.closedAt !== undefined) throw new ConversationClosed("This conversation is closed.");

    const id = await nextId("messages");
    await messages.insertOne({
      id,
      conversation,
      sender,
      content,
      sentAt: Date.now(),
      readStatus: "UNREAD",
    });
    return { message: id };
  }

  async markRead({ conversation, reader }: { conversation: number; reader: string }): Promise<void> {
    await ensureIndexes();

    const thread = await conversations.findOne({ id: conversation });
    if (!thread){
        throw new UnknownConversation("This conversation does not exist.");
    }

    if(!isMember(thread, reader)) {
        throw new NotConversationMember("You are not a member of this conversation.");
    }

    await messages.updateMany(
      { conversation, sender: { $ne: reader }, readStatus: "UNREAD" },
      { $set: { readStatus: "READ" } },
    );
  }

  async _messages({
    conversation,
    reader,
  }: {
    conversation: number;
    reader: string;
  }): Promise<Array<MessageDocument & { sender: string }>> {
    await ensureIndexes();

    const thread = await conversations.findOne({ id: conversation });
    if (!thread){
        throw new UnknownConversation("This conversation does not exist.");
    }

    if(!isMember(thread, reader)) {
        throw new NotConversationMember("You are not a member of this conversation.");
    }

    return messages.find(
      { conversation },
      { projection: { _id: 0 } },
    ).sort({ sentAt: 1 }).toArray();
  }

  async _conversationsOf({ user }: { user: string }): Promise<ConversationDocument[]> {
    await ensureIndexes();

    return conversations.find(
      { $or: [{ initiator: user }, { recipient: user }] },
      { projection: { _id: 0 } },
    ).toArray();
  }

  async closeConversation({ topic }: { topic: string }): Promise<void> {
    await ensureIndexes();
    await conversations.updateMany(
      { topic, closedAt: { $exists: false } },
      { $set: { closedAt: Date.now() } },
    );
  }

  async purgeClosed(): Promise<void> {
    await ensureIndexes();

    const cutoff = Date.now() - PURGE_AFTER;
    const expired = await conversations.find(
      { closedAt: { $lte: cutoff } },
      { projection: { id: 1 } },
    ).toArray();

    if (!expired.length) return;

    const ids = expired.map(({ id }) => id);
    await messages.deleteMany({ conversation: { $in: ids } });
    await conversations.deleteMany({ id: { $in: ids } });
  }
}
