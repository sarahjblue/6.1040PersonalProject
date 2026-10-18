import { endpoint, receive, respond } from "@mit-sdg/sync-engine/boundary";
import { concepts } from "../concepts.ts";
import { each, form, former } from "@mit-sdg/sync-engine/language";

const { Messaging } = concepts;

const ConversationList = former(
  "conversations for a user",
  ({ user }, { conversation, topic, initiator, recipient, closedAt }) =>
    form({
      conversations: each(
        Messaging._conversationsOf({ user }).is({
          conversation,
          topic,
          initiator,
          recipient,
          closedAt,
        }),
      ).form({ conversation, topic, initiator, recipient, closedAt }),
    }),
);

const Conversation = endpoint(
  "/messaging/conversations",
  ({ user }) =>
    receive({ user }).then(
      respond({ result: ConversationList({ user }) }),
    ),
  { input: { required: ["user"] } },
);

const StartConversation = endpoint(
  "/messaging/startConversation",
  ({ initiator, recipient, topic, content }) =>
    receive({ initiator, recipient, topic, content })
      .then(
        Messaging.startConversation({ initiator, recipient, topic, content })
            .responds({}),
      ).then(respond({})),
  { input: { required: ["initiator", "recipient", "topic", "content"] } },
);

const SendMessage = endpoint(
  "/messaging/sendMessage",
  ({ conversation, sender, content, message }) =>
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

const MessageList = former(
  "messages in a conversation",
  ({ conversation, reader }, { message, sender, content, sentAt, readStatus }) =>
    form({
      messages: each(
        Messaging._messages({ conversation, reader }).is({
          message,
          sender,
          content,
          sentAt,
          readStatus,
        }),
      ).form({ message, sender, content, sentAt, readStatus }),
    }),
);

const Messages = endpoint(
  "/messaging/messages",
  ({ conversation, reader }) =>
    receive({ conversation, reader }).then(
      respond({ result: MessageList({ conversation, reader }) }),
    ),
  { input: { required: ["conversation", "reader"] } },
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
  Conversation,
  CloseConversation,
  PurgeClosed,
};
