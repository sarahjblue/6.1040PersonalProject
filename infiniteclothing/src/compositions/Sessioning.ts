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
  ({ id }, { username, email }) =>
    form({
      users: each(
        Sessioning._getUser({ id }).is({ username, email }),
      ).form({ username, email }),
    }),
);

const GetUser = endpoint(
  "/sessioning/user",
  ({ id }) =>
    receive({ id }).then(
      respond({ result: SessionUser({ id }) }),
    ),
  { input: { required: ["id"] } },
);

export const composition = { SessionOpen, GetUser };
