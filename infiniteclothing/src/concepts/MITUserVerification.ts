import { db } from "../db.ts";

export type User = {
  username: string;
  email: string;
};

type Confirmation = "CONFIRMED" | "UNCONFIRMED";

export class UsernameAlreadyUsed extends Error {}
export class NotMIT extends Error {}
export class EmailAlreadyUsed extends Error {}
export class NoUsernameFound extends Error {}
export class IncorrectPassword extends Error {}

type UserDocument = {
  username: string;
  email: string;
  passwordHash: string;
  confirmed: Confirmation;
};

const users = db.collection<UserDocument>("users");
let indexesReady: Promise<void> | undefined;

function ensureIndexes(): Promise<void> {
  indexesReady ??= Promise.all([
    users.createIndex({ username: 1 }, { unique: true }),
    users.createIndex({ email: 1 }, { unique: true }),
  ]).then(() => undefined).catch((error: unknown) => {
    indexesReady = undefined;
    throw error;
  });
  return indexesReady;
}

function publicUser(user: UserDocument): User {
  return { username: user.username, email: user.email };
}

export class MITUserVerificationConcept {
  async register({username, email, password}: {username: string, email: string, password: string}): Promise<{user: User}> {
    await ensureIndexes();

    if (await users.findOne({ username })) {
      throw new UsernameAlreadyUsed("USERNAME_ALREADY_USED: This username is already used. Choose a new one.");
    }
    if (!email.toLowerCase().endsWith("@mit.edu")) {
      throw new NotMIT("NOT_MIT: Your email is not an MIT email. Please use that email, otherwise you can not join Infinite Clothing.");
    }
    if (await users.findOne({ email })) {
      throw new EmailAlreadyUsed("EMAIL_ALREADY_USED: This email already has an account.");
    }

    const user: UserDocument = {
      username,
      email,
      passwordHash: await Bun.password.hash(password),
      confirmed: "CONFIRMED",
    };

    try {
      await users.insertOne(user);
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
        throw new Error("Username or email is already used.");
      }
      throw error;
    }

    return { user: publicUser(user) };
  }

  async authenticate({username, password}: {username: string, password: string}): Promise<{user:User}> {
    await ensureIndexes();

    const user = await users.findOne({ username });
    if (!user) throw new NoUsernameFound("NO_USERNAME_FOUND: This username does not have an account.");

    const valid = await Bun.password.verify(password, user.passwordHash);
    if (!valid) throw new IncorrectPassword("Invalid credentials.");

    return {user: publicUser(user)};
  }
}
