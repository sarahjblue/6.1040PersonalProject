import { endpoint, receive, respond } from "@mit-sdg/sync-engine/boundary";
import { concepts } from "../concepts.ts";

const { Messaging } = concepts;

const StartConversation = endpoint(
  "/messaging/startConversation",
  ({ initiator, recipient, topic, content }) =>
    receive({ initiator, recipient, topic, content })
      .then(
        Messaging.startConversation({ initiator, recipient, topic, content })
            .responds({ conversation: "conversation" }),
      )
          .then(respond({ conversation: "conversation" })),
  { input: { required: ["initiator", "recipient", "topic", "content"] } },
);

const SendMessage = endpoint(
  "/messaging/sendMessage",
  ({ conversation, sender, content }) =>
    receive({ conversation, sender, content })
      .then(Messaging.sendMessage({ conversation, sender, content }).responds({ message }))
      .then(respond({ message })),
  { input: { required: ["conversation", "sender", "content"] } },
);

const MarkRead = endpoint(
  "/messaging/markRead",
  ({ conversation, reader }) =>
    receive({ conversation, reader })
      .then(Messaging.markRead({ conversation, reader }))
      .then(respond({})),
  { input: { required: ["conversation", "reader"] } },
);

const Messages = endpoint(
  "/messaging/messages",
  ({ conversation, reader }) =>
    receive({ conversation, reader })
      .then(respond({ messages: Messaging._messages({ conversation, reader }) })),
  { input: { required: ["conversation", "reader"] } },
);

const Conversations = endpoint(
  "/messaging/conversations",
  ({ user }) =>
    receive({ user })
      .then(respond({ conversations: Messaging._conversationsOf({ user }) })),
  { input: { required: ["user"] } },
);

const CloseConversation = endpoint(
  "/messaging/closeConversation",
  ({ topic }) =>
    receive({ topic })
      .then(Messaging.closeConversation({ topic }))
      .then(respond({})),
  { input: { required: ["topic"] } },
);

const PurgeClosed = endpoint("/messaging/purgeClosed", () =>
  receive({})
    .then(Messaging.purgeClosed({}))
    .then(respond({})),
);

export const composition = {
  StartConversation,
  SendMessage,
  MarkRead,
  Messages,
  Conversations,
  CloseConversation,
  PurgeClosed,
};
