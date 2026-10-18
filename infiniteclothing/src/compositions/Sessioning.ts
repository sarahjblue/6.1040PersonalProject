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
  ({ session }, { user }) =>
    form({
      users: each(
        Sessioning._getUser({ session }).is({ user}),
      ).form({ user }),
    }),
);

const GetUser = endpoint(
  "/sessioning/user",
  ({ session }) =>
    receive({ session }).then(
      respond({ result: SessionUser({ session }) }),
    ),
  { input: { required: ["session"] } },
);

export const composition = { SessionOpen, GetUser };
