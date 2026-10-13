import { endpoint, receive, respond } from "@mit-sdg/sync-engine/boundary";
import { concepts } from "../concepts.ts";

const { MITUserVerification } = concepts;

const Register = endpoint(
  "/users/register",
  ({ username, email, password }) =>
    receive({ username, email, password })
      .then(MITUserVerification.register({ username, email, password }).responds({ user, token }))
      .then(respond({ user, token })),
  { input: { required: ["username", "email", "password"] } },
);

const Confirm = endpoint(
  "/users/confirm",
  ({ token }) =>
    receive({ token })
      .then(MITUserVerification.confirm({ token }).responds({ user }))
      .then(respond({ user })),
  { input: { required: ["token"] } },
);

const Authenticate = endpoint(
  "/users/authenticate",
  ({ username, password }) =>
    receive({ username, password })
      .then(MITUserVerification.authenticate({ username, password }).responds({ user }))
      .then(respond({ user })),
  { input: { required: ["username", "password"] } },
);

export const composition = { Register, Confirm, Authenticate };
