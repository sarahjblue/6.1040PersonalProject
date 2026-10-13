import { db } from "../db.ts";
import type { User } from "./MITUserVerification.ts";

export type Session = {
  id: string;
  user: User;
};

type SessionDocument = {
  username: string;
  sessionId: string;
};

const sessions = db.collection<SessionDocument>("sessions");
let indexesReady: Promise<void> | undefined;

function ensureIndexes(): Promise<void> {
  indexesReady ??= Promise.all([
    sessions.createIndex({ username: 1 }, { unique: true }),
    sessions.createIndex({ sessionId: 1 }, { unique: true }),
  ]).then(() => undefined).catch((error: unknown) => {
    indexesReady = undefined;
    throw error;
  });
  return indexesReady;
}

export class SessioningConcept {
  async sessionOpen(user: User): Promise<Session> {
    await ensureIndexes();

    let stored = await sessions.findOne({ username: user.username });
    if (!stored) {
      try {
        await sessions.insertOne({
          username: user.username,
          sessionId: crypto.randomUUID(),
        });
      } catch (error) {
        // Another request may have created the session concurrently.
        if (!(typeof error === "object" && error !== null && "code" in error && error.code === 11000)) {
          throw error;
        }
      }
      stored = await sessions.findOne({ username: user.username });
    }

    if (!stored) throw new Error("Could not open a session.");
    return { id: stored.sessionId, user };
  }

  async _getUser(session: Session): Promise<User | undefined> {
    await ensureIndexes();

    const stored = await sessions.findOne({ sessionId: session.id });
    if (!stored) return undefined;
    return { username: stored.username, email: session.user.email };
  }
}
