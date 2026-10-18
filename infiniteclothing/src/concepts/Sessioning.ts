import { db } from "../db.ts";
import type { User } from "./MITUserVerification.ts";

export type Session = {
  id: string;
  user: User;
};

type SessionDocument = {
  username: string;
  email: string;
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
  async sessionOpen({user}: {user: User}): Promise<{session: Session}> {
    await ensureIndexes();

    const sessionId = crypto.randomUUID();
    const stored = await sessions.findOneAndUpdate(
      { username: user.username },
      {
        $set: { email: user.email },
        $setOnInsert: { sessionId },
      },
      { upsert: true, returnDocument: "after" },
    );

    if (!stored) throw new Error("Could not open a session.");

    return {
      session: {
        id: stored.sessionId,
        user: { username: stored.username, email: stored.email },
      },
    };
  }

  async _getUser({ session }: { session: Session }): Promise<{ user: User }> {
  await ensureIndexes();

  const stored = await sessions.findOne({ sessionId: session.id });
  if (!stored) {
    throw new Error("Unknown session.");
  }

  return {
    user: { username: stored.username, email: stored.email },
  };
}
}
