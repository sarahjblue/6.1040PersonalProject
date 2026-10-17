import { endpoint, receive, respond } from "@mit-sdg/sync-engine/boundary";
import { concepts } from "../concepts.ts";
import { each, form, former } from "@mit-sdg/sync-engine/language";


const { Sessioning } = concepts;

const SessionOpen = endpoint(
  "/sessioning/sessionOpen",
  ({ user, session }) =>
    receive({ user })
      .then(Sessioning.sessionOpen({ user }).responds({ session }))
      .then(respond({ session })),
  { input: { required: ["user"] } },
);

const SessionUser = former(
  "user associated with a session",
  ({ id, user }, { username, email }) =>
    form({
      users: each(
        Sessioning._getUser({ id, user }).is({ username, email }),
      ).form({ username, email }),
    }),
);

const GetUser = endpoint(
  "/sessioning/user",
  ({ id, user }) =>
    receive({ id, user }).then(
      respond({ result: SessionUser({ id, user }) }),
    ),
  { input: { required: ["id", "user"] } },
);

export const composition = { SessionOpen, GetUser };
