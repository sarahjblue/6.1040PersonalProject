import { endpoint, receive, respond } from "@mit-sdg/sync-engine/boundary";
import { concepts } from "../concepts.ts";

const { MITUserVerification } = concepts;

const Register = endpoint(
  "/users/register",
  ({ username, email, password, user }) =>
    receive({ username, email, password })
      .then(
        MITUserVerification.register({ username, email, password })
          .responds({ user }),
      )
      .then(respond({ user })),
  { input: { required: ["username", "email", "password"] } },
);

const Authenticate = endpoint(
  "/users/authenticate",
  ({ username, password, user }) =>
    receive({ username, password })
      .then(
        MITUserVerification.authenticate({ username, password })
          .responds({ user }),
      )
      .then(respond({ user })),
  { input: { required: ["username", "password"] } },
);

export const composition = { Register, Authenticate };
