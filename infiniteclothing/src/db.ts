import { MongoClient } from "mongodb";

const url = process.env.MONGODB_URL;
if (!url) {
  throw new Error("MONGODB_URL is not set. Add it to your .env file.");
}

export const client = new MongoClient(url);
export const db = client.db();

let connectPromise: Promise<MongoClient> | undefined;

export function connectDatabase(): Promise<MongoClient>{
  connectPromise ??= client.connect().catch((error: unknown) => {
    connectPromise = undefined;
    throw error;
  });
  return connectPromise;
}

export async function disconnectDatabase(): Promise<void> {
  await client.close();
  connectPromise = undefined;
}

type CounterDocument = { _id: string; value: number };

export async function nextId(name: string): Promise<number> {
  const counter = await db.collection<CounterDocument>("counters").findOneAndUpdate(
    { _id: name },
    { $inc: { value: 1 } },
    { upsert: true, returnDocument: "after" },
  );

  if (!counter) throw new Error(`Could not allocate an ID for ${name}.`);
  return counter.value;
}
