import { endpoint, receive, respond } from "@mit-sdg/sync-engine/boundary";
import { concepts } from "../concepts.ts";

const { Sessioning } = concepts;

const SessionOpen = endpoint(
  "/sessioning/sessionOpen",
  ({ user }) =>
    receive({ user })
      .then(Sessioning.sessionOpen({ user }).responds({ session }))
      .then(respond({ session })),
  { input: { required: ["user"] } },
);

const GetUser = endpoint(
  "/sessioning/user",
  ({ session }) =>
    receive({ session })
      .then(respond({ user: Sessioning._getUser({ session }) })),
  { input: { required: ["session"] } },
);

export const composition = { SessionOpen, GetUser };
