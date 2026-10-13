# Messaging [User, Item]

## Purpose
allow users to message one another independently and keep track of what has been sent; deletes messages after the topic has been closed for 24 hours

## Principle
after a user starts a conversation with another user about an Item by sending an initial message, the other user can reply; conversations are deleted 24 hours after their topic closes

## Types

```types
   external User
        a person who sells an item or buys an item

    external Item
        a thing that is being sold

    ReadStatus is UNREAD or READ
        whether the recipient of a message has seen it
```

## State

```state
a set of Conversations with
    a topic Item,
    an initiator User,
    a recipient User,
    a messages sequence of Message, and
    an optional closedAt DateTime

a set of Messages with
    a sender User,
    a content String,
    a sentAt DateTime, and
    a readStatus ReadStatus
```

## Actions

``` actions
startConversation(initiator: User, recipient: User, topic: Item, content: String): returns (conversation: Conversation)

    where initiator and recipient are the same people

    then
        refuses SELF_MESSAGE "You can not message yourself."

    where initiator and recipient are different users and a conversation about topic already exists between them

    then
        refuses CONVERSATION_EXISTS "You already have a conversation about this item."

    where initiator and recipient are different users, and initiator and recipient do not have a preexisting Conversation about the topicItem

    then
        add a new message with initiator as sender, content, sentAt as now, and readStatus as UNREAD
        add a new conversation with topic, initiator, recipient, that message as its only message, and closedAt unset
        returns conversation



sendMessage(conversation: Conversation, sender: User, content: String): returns (message: Message)

    where conversation is not in Conversations

    then
        refuses SEND_UNKNOWN_CONVERSATION "There is no conversation."

    where conversation is in Conversations and sender is not the initiator or recipient of conversation

    then
        refuses INVALID_CONVERSATION "You are not a member of this conversation."


    where conversation is in Conversations and sender is the initiator or recipient of conversation

    then
        add a new message with sender, content, sentAt as now, and readStatus UNREAD
        append the message to the messages of conversation
        returns message


markRead(conversation: Conversation, reader: User): returns ()

    where conversation is not in Conversations

    then
        refuses UNKNOWN_CONVERSATION "There is no such conversation."

    where conversation is in Conversations and reader is not the initiator or recipient of conversation

    then
        refuses INVALID_CONVERSATION "You are not a member of this conversation."

    where conversation is in Conversations and reader is the initiator or recipient of conversation

    then
        set readStatus to READ on every message of conversation whose sender is not reader
        returns


closeConversation(topic: Item): returns ()

    where true

    then
        set closedAt to now on every conversation about topic whose closedAt is unassigned
        returns


purgeClosed(): returns ()

    where true

    then
        remove every conversation whose closedAt is set and is more than 24 hours before now, together with all of its messages
        returns
```

## Queries

```queries

    _messages(conversation: Conversation, reader: User) : many (message: Message, sender: User, content: String, sentAt: DateTime, readStatus: ReadStatus)

    answers the messages of the conversation in the order they were sent
    answers no rows when the conversation is unknown or reader is neither its initiator nor its recipient

    _conversationsOf(user: User): many(conversation: Conversation, topic: Item, initiator: User, recipient: User, closedAt?: DateTime)

    answers every conversation in which user is the initiator or the recipient

```
