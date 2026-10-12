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
```

## State

```state
a set of Conversations with
    a topic Item,
    an initiator User,
    a recipient User,
    a messages sequence of Message, and
    a closedAt Time

a set of Messages with
    a sender User,
    a content String,
    a sentAt Time, and
    a read Boolean
```

## Actions

``` actions
startConversation(initiator: User, recipient: User, topicItem: Item, content: String): returns (conversation: Conversation)

    where initiator and recipient are not the same people and, initiator and recipient do not have a preexisting Conversation about the topicItem

    then
        create Conversation with topicItem, initiator, recipient, and an empty array of messages
        create a Message with the initiator, content, and sentAt time as the current time
        set the Message read boolean to false, add it to messages in the newly created conversation
        set closedAt to be undefined



sendMessage(conversation: Conversation, sender: User, content: String): (message: Message)

    where sender is the initiator or recipient of conversation

    then
        create a new message with this sender, the content, read as false, and sentAt as now
        add the message to conversation


markRead(conversation: Conversation, reader: User)

    where reader is the initiator or recipient of conversation

    then
        set read to true on every Message in conversation whose sender is not reader


closeConversation(topic: Item)

    where true

    then
        for every Conversation where the conversations topic is topic, and the closedAt variable of the conversation is undefined, set closedAt to the current time


purgeClosed()  [System Action]

    where some Conversation has closedAt defined and closedAt earlier than 24 hours ago

    then
        delete every Conversation that meets these requirements and all Messages within
```
