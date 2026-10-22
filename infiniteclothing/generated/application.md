<!-- Generated from the Application assembly. Do not edit. -->
<!-- Manifest producer: @mit-sdg/sync-engine@1.1.0; concept specification: sync-engine.concept-specification@1; renderer: @mit-sdg/sync-engine@1.1.0. -->

# Application — assembled read-back

_Assembled by sync-engine from registered concepts and composition. Edit the concept_
_specifications and composition source, then regenerate this file._

## Concepts

### Inventory

Defined in [Inventory](../design/concepts/Inventory.md), line 1.

#### Actions

- `post(name: String, description?: String, price?: String, seller: User, image: Image) : returns (item: Item)`
  - Refuses `ITEM_ALREADY_POSTED`: You already have posted an item with that name and description.
- `claim(item: Item, claimer: User) : returns ()`
  - Refuses `CLAIM_UNKNOWN_ITEM`: There is no such item for sale.
  - Refuses `ITEM_NOT_AVAILABLE_TO_CLAIM`: This item can not be claimed at this time.
  - Refuses `SELLER_CANNOT_CLAIM`: You can not claim your own for sale item.
- `edit(item: Item, description?: String, price?: String, image?: Image, user: User) : returns ()`
  - Refuses `EDIT_UNKNOWN_ITEM`: There is no such item.
  - Refuses `NOT_SELLER_EDIT`: You can not edit an item that you are not the seller of.
  - Refuses `NO_EDIT_CHANGES`: Give at least a description, price, or image to edit with.
- `delete(item: Item, user: User) : returns ()`
  - Refuses `DELETE_UNKNOWN_ITEM`: This item already does not exist.
  - Refuses `NOT_SELLER_DELETE`: You can not delete an item that you are not selling.
  - Refuses `DELETE_NOT_COMPLETED`: You can not delete an item where the transaction is completed.
- `releaseClaim(item: Item, user: User) : returns ()`
  - Refuses `RELEASE_UNKNOWN_ITEM`: There is no such item.
  - Refuses `RELEASE_UNCLAIMED`: You can not release an unclaimed item.
  - Refuses `RELEASE_NOT_BUYER`: You can not release a claim you did not make.
- `transactionCompleted(item: Item, user: User) : returns ()`
  - Refuses `COMPLETE_UNKNOWN_ITEM`: There is no such item.
  - Refuses `NOT_CLAIMED`: Only a claimed item can be completed.
  - Refuses `NOT_SELLER_COMPLETE`: Only the seller can complete this transaction.

#### Queries

- `_getSeller(item: Item) : optional (seller: User)`
- `_available() : many (item: Item, name: String, description?: String, price?: String, seller: User, image: Image)`
- `_claimedForUser(user: User) : many (item: Item, name: String, description?: String, price?: String, seller: User, buyer?: User, image: Image)`

#### Instances

- `Inventory` — instance of `Inventory` — [Marketplace Application Types](../design/types.md), line 15.
  - `Image` is `ImageRef` — [Marketplace Application Types](../design/types.md), line 17.
  - `User` is `MITUserVerification.User` — [Marketplace Application Types](../design/types.md), line 16.

### MITUserVerification

Defined in [MITUserVerification](../design/concepts/MITUserVerification.md), line 1.

#### Actions

- `register(username: String, email: String, password: String) : returns (user: User)`
  - Refuses `USERNAME_ALREADY_USED`: This username is already used. Choose a new one.
  - Refuses `NOT_MIT`: Your email is not an MIT email. Please use that email, otherwise you can not join Infinite Clothing.
  - Refuses `EMAIL_ALREADY_USED`: This email already has an account.
- `authenticate(username: String, password: String) : returns (user: User)`
  - Refuses `NO_USERNAME_FOUND`: This username does not have an account.
  - Refuses `INCORRECT_PASSWORD`: Incorrect password. Please try again.

#### Instances

- `MITUserVerification` — instance of `MITUserVerification` — [Marketplace Application Types](../design/types.md), line 13.

### Messaging

Defined in [Messaging](../design/concepts/Messaging.md), line 1.

#### Actions

- `startConversation(initiator: User, recipient: User, topic: Item, content: String) : returns (conversation: Conversation)`
  - Refuses `SELF_MESSAGE`: You can not message yourself.
  - Refuses `CONVERSATION_EXISTS`: You already have a conversation about this item.
- `sendMessage(conversation: Conversation, sender: User, content: String) : returns (message: Message)`
  - Refuses `SEND_UNKNOWN_CONVERSATION`: There is no conversation.
  - Refuses `INVALID_CONVERSATION`: You are not a member of this conversation.
  - Refuses `CONVERSATION_CLOSED`: This conversation has been closed.
- `markRead(conversation: Conversation, reader: User) : returns ()`
  - Refuses `UNKNOWN_CONVERSATION`: There is no such conversation.
  - Refuses `NOT_CONVERSATION_MEMBER`: You are not a member of this conversation.
- `closeConversation(topic: Item) : returns ()`
- `purgeClosed() : returns ()`

#### Queries

- `_messages(conversation: Conversation, reader: User) : many (message: Message, sender: User, content: String, sentAt: DateTime, readStatus: ReadStatus)`
- `_conversationsOf(user: User) : many (conversation: Conversation, topic: Item, initiator: User, recipient: User, closedAt?: DateTime)`

#### Instances

- `Messaging` — instance of `Messaging` — [Marketplace Application Types](../design/types.md), line 22.
  - `Item` is `Inventory.Item` — [Marketplace Application Types](../design/types.md), line 24.
  - `User` is `MITUserVerification.User` — [Marketplace Application Types](../design/types.md), line 23.

### Sessioning

Defined in [Sessioning](../design/concepts/Sessioning.md), line 1.

#### Actions

- `sessionOpen(user: User) : returns (session: Session)`

#### Queries

- `_getUser(session: Session) : optional (user: User)`

#### Instances

- `Sessioning` — instance of `Sessioning` — [Marketplace Application Types](../design/types.md), line 26.
  - `User` is `MITUserVerification.User` — [Marketplace Application Types](../design/types.md), line 27.

### Tagging

Defined in [Tagging](../design/concepts/Tagging.md), line 1.

#### Actions

- `tag(item: Item, tag: Tag) : returns ()`
  - Refuses `TAG_NOT_EXIST`: This tag does not exist.
  - Refuses `TAG_CATEGORY_TAKEN`: This item already has a tag in that category.
- `untag(item: Item, tag: Tag) : returns ()`
- `clear(item: Item) : returns ()`
  - Refuses `CLEAR_UNKNOWN_ITEM`: This item has no tags to clear.

#### Queries

- `_search(selectedTags: Tags) : many (item: Item)`
- `_tags() : many (tag: Tag, category: String, label: String)`
- `_tagsForItem(item: Item) : many (tag: Tag, category: String, label: String)`

#### Instances

- `Tagging` — instance of `Tagging` — [Marketplace Application Types](../design/types.md), line 19.
  - `Item` is `Inventory.Item` — [Marketplace Application Types](../design/types.md), line 20.

## Application types

Concrete types:

- `ImageRef` — [Marketplace Application Types](../design/types.md), line 8.

## Formers

_Formers name result shapes evaluated when asked. The source former owns_
_the authored explanation; this section records the generated shape._

### available inventory

```former
Former "available inventory" — inputs (); bindings (item, name, description, price, image, seller); promises exactly one record — forms:
  a record of
    items: each Inventory._available () has (description, image, item, name, price, seller)
      form a record of
        description
        image
        item
        name
        price
        seller
```

### claimed inventory

```former
Former "claimed inventory" — inputs (user); bindings (item, name, description, price, image, seller, buyer); promises exactly one record — forms:
  a record of
    items: each Inventory._claimedForUser (user) has (buyer, description, image, item, name, price, seller)
      form a record of
        buyer
        description
        image
        item
        name
        price
        seller
```

### conversations for a user

```former
Former "conversations for a user" — inputs (user); bindings (conversation, topic, initiator, recipient, closedAt); promises exactly one record — forms:
  a record of
    conversations: each Messaging._conversationsOf (user) has (closedAt, conversation, initiator, recipient, topic)
      form a record of
        closedAt
        conversation
        initiator
        recipient
        topic
```

### items matching selected tags

```former
Former "items matching selected tags" — inputs (selectedTags); bindings (item); promises exactly one record — forms:
  each Tagging._search (selectedTags) has (item)
    form a record of
      item
```

### messages in a conversation

```former
Former "messages in a conversation" — inputs (conversation, reader); bindings (message, sender, content, sentAt, readStatus); promises exactly one record — forms:
  a record of
    messages: each Messaging._messages (conversation, reader) has (content, message, readStatus, sender, sentAt)
      form a record of
        content
        message
        readStatus
        sender
        sentAt
```

### predefined tags

```former
Former "predefined tags" — inputs (); bindings (tag, category, label); promises exactly one record — forms:
  a record of
    tags: each Tagging._tags () has (category, label, tag)
      form a record of
        category
        label
        tag
```

### tags assigned to an item

```former
Former "tags assigned to an item" — inputs (item); bindings (tag, category, label); promises exactly one record — forms:
  a record of
    tags: each Tagging._tagsForItem (item) has (category, label, tag)
      form a record of
        category
        label
        tag
```

### user associated with a session

```former
Former "user associated with a session" — inputs (session); bindings (user); promises exactly one record — forms:
  a record of
    users: each Sessioning._getUser (session) has (user)
      form a record of
        user
```

## Reactions

### Authenticate

Authored path: `Authenticate`.
- Covered by [MITUserVerification](../design/compositions/MITUserVerification.md), line 9.
- Covered by [MITUserVerification](../design/compositions/MITUserVerification.md), line 12.

```reaction
when RequestBoundary.request (password, path: "/users/authenticate", requestId, username)
then
  MITUserVerification.authenticate (password, username)
```

### Authenticate#2

Authored path: `Authenticate`.
- Covered by [MITUserVerification](../design/compositions/MITUserVerification.md), line 9.
- Covered by [MITUserVerification](../design/compositions/MITUserVerification.md), line 12.

```reaction
when MITUserVerification.authenticate (password, username, user), asked by Authenticate
where
  earlier, RequestBoundary.request (password, path: "/users/authenticate", requestId, username)
then
  RequestBoundary.respond (requestId, user)
```

### Available

Authored path: `Available`.
- Covered by [Inventory](../design/compositions/Inventory.md), line 3.
- Covered by [Inventory](../design/compositions/Inventory.md), line 6.

```reaction
when RequestBoundary.request (path: "/inventory/available", requestId)
then
  RequestBoundary.respond (inventory: former "available inventory", requestId)
```

### Claim

Authored path: `Claim`.
- Covered by [Inventory](../design/compositions/Inventory.md), line 15.
- Covered by [Inventory](../design/compositions/Inventory.md), line 18.

```reaction
when RequestBoundary.request (claimer, item, path: "/inventory/claim", requestId)
then
  Inventory.claim (claimer, item)
```

### Claim#2

Authored path: `Claim`.
- Covered by [Inventory](../design/compositions/Inventory.md), line 15.
- Covered by [Inventory](../design/compositions/Inventory.md), line 18.

```reaction
when Inventory.claim (claimer, item), asked by Claim
where
  earlier, RequestBoundary.request (claimer, item, path: "/inventory/claim", requestId)
then
  RequestBoundary.respond (requestId)
```

### Claimed

Authored path: `Claimed`.
- Covered by [Inventory](../design/compositions/Inventory.md), line 21.
- Covered by [Inventory](../design/compositions/Inventory.md), line 24.

```reaction
when RequestBoundary.request (path: "/inventory/claimed", requestId, user)
then
  RequestBoundary.respond (inventory: former "claimed inventory" with (user), requestId)
```

### Clear

Authored path: `Clear`.
- Covered by [Tagging](../design/compositions/Tagging.md), line 33.
- Covered by [Tagging](../design/compositions/Tagging.md), line 36.

```reaction
when RequestBoundary.request (item, path: "/tagging/clear", requestId)
then
  Tagging.clear (item)
```

### Clear#2

Authored path: `Clear`.
- Covered by [Tagging](../design/compositions/Tagging.md), line 33.
- Covered by [Tagging](../design/compositions/Tagging.md), line 36.

```reaction
when Tagging.clear (item), asked by Clear
where
  earlier, RequestBoundary.request (item, path: "/tagging/clear", requestId)
then
  RequestBoundary.respond (requestId)
```

### CloseConversation

Authored path: `CloseConversation`.
- Covered by [Messaging](../design/compositions/Messaging.md), line 33.
- Covered by [Messaging](../design/compositions/Messaging.md), line 36.

```reaction
when RequestBoundary.request (path: "/messaging/closeConversation", requestId, topic)
then
  Messaging.closeConversation (topic)
```

### CloseConversation#2

Authored path: `CloseConversation`.
- Covered by [Messaging](../design/compositions/Messaging.md), line 33.
- Covered by [Messaging](../design/compositions/Messaging.md), line 36.

```reaction
when Messaging.closeConversation (topic), asked by CloseConversation
where
  earlier, RequestBoundary.request (path: "/messaging/closeConversation", requestId, topic)
then
  RequestBoundary.respond (requestId)
```

### Conversation

Authored path: `Conversation`.
- Covered by [Messaging](../design/compositions/Messaging.md), line 27.
- Covered by [Messaging](../design/compositions/Messaging.md), line 30.

```reaction
when RequestBoundary.request (path: "/messaging/conversations", requestId, user)
then
  Messaging.purgeClosed ()
```

### Conversation#2

Authored path: `Conversation`.
- Covered by [Messaging](../design/compositions/Messaging.md), line 27.
- Covered by [Messaging](../design/compositions/Messaging.md), line 30.

```reaction
when Messaging.purgeClosed (), asked by Conversation
where
  earlier, RequestBoundary.request (path: "/messaging/conversations", requestId, user)
then
  RequestBoundary.respond (requestId, result: former "conversations for a user" with (user))
```

### Delete

Authored path: `Delete`.
- Covered by [Inventory](../design/compositions/Inventory.md), line 33.
- Covered by [Inventory](../design/compositions/Inventory.md), line 36.

```reaction
when RequestBoundary.request (item, path: "/inventory/delete", requestId, user)
then
  Inventory.delete (item, user)
```

### Delete#2

Authored path: `Delete`.
- Covered by [Inventory](../design/compositions/Inventory.md), line 33.
- Covered by [Inventory](../design/compositions/Inventory.md), line 36.

```reaction
when Inventory.delete (item, user), asked by Delete
where
  earlier, RequestBoundary.request (item, path: "/inventory/delete", requestId, user)
then
  RequestBoundary.respond (requestId)
```

### DeliverFaultToAsker

```reaction
when any action is faulted, not asked by DeliverFaultToAsker
where
  earlier, RequestBoundary.request (requestId)
then
  RequestBoundary.respondFramework (error: "INTERNAL_ERROR", requestId)
```

### DeliverRefusalToAsker

```reaction
when any action is refused (message), except RequestBoundary
where
  earlier, RequestBoundary.request (requestId)
then
  RequestBoundary.respond (error: message, requestId)
```

### Edit

Authored path: `Edit`.
- Covered by [Inventory](../design/compositions/Inventory.md), line 27.
- Covered by [Inventory](../design/compositions/Inventory.md), line 30.

```reaction
when RequestBoundary.request (description, image, item, path: "/inventory/edit", price, requestId, user)
then
  Inventory.edit (description, image, item, price, user)
```

### Edit#2

Authored path: `Edit`.
- Covered by [Inventory](../design/compositions/Inventory.md), line 27.
- Covered by [Inventory](../design/compositions/Inventory.md), line 30.

```reaction
when Inventory.edit (description, image, item, price, user), asked by Edit
where
  earlier, RequestBoundary.request (description, image, item, path: "/inventory/edit", price, requestId, user)
then
  RequestBoundary.respond (requestId)
```

### GetUser

Authored path: `GetUser`.
- Covered by [Sessioning](../design/compositions/Sessioning.md), line 9.
- Covered by [Sessioning](../design/compositions/Sessioning.md), line 12.

```reaction
when RequestBoundary.request (path: "/sessioning/user", requestId, session)
then
  RequestBoundary.respond (requestId, result: former "user associated with a session" with (session))
```

### ItemTags

Authored path: `ItemTags`.
- Covered by [Tagging](../design/compositions/Tagging.md), line 9.
- Covered by [Tagging](../design/compositions/Tagging.md), line 12.

```reaction
when RequestBoundary.request (item, path: "/tagging/itemTags", requestId)
then
  RequestBoundary.respond (requestId, tags: former "tags assigned to an item" with (item))
```

### MarkRead

Authored path: `MarkRead`.
- Covered by [Messaging](../design/compositions/Messaging.md), line 15.
- Covered by [Messaging](../design/compositions/Messaging.md), line 18.

```reaction
when RequestBoundary.request (conversation, path: "/messaging/markRead", reader, requestId)
then
  Messaging.markRead (conversation, reader)
```

### MarkRead#2

Authored path: `MarkRead`.
- Covered by [Messaging](../design/compositions/Messaging.md), line 15.
- Covered by [Messaging](../design/compositions/Messaging.md), line 18.

```reaction
when Messaging.markRead (conversation, reader), asked by MarkRead
where
  earlier, RequestBoundary.request (conversation, path: "/messaging/markRead", reader, requestId)
then
  RequestBoundary.respond (requestId)
```

### Messages

Authored path: `Messages`.
- Covered by [Messaging](../design/compositions/Messaging.md), line 21.
- Covered by [Messaging](../design/compositions/Messaging.md), line 24.

```reaction
when RequestBoundary.request (conversation, path: "/messaging/messages", reader, requestId)
then
  Messaging.purgeClosed ()
```

### Messages#2

Authored path: `Messages`.
- Covered by [Messaging](../design/compositions/Messaging.md), line 21.
- Covered by [Messaging](../design/compositions/Messaging.md), line 24.

```reaction
when Messaging.purgeClosed (), asked by Messages
where
  earlier, RequestBoundary.request (conversation, path: "/messaging/messages", reader, requestId)
then
  RequestBoundary.respond (requestId, result: former "messages in a conversation" with (conversation, reader))
```

### Post

Authored path: `Post`.
- Covered by [Inventory](../design/compositions/Inventory.md), line 9.
- Covered by [Inventory](../design/compositions/Inventory.md), line 12.

```reaction
when RequestBoundary.request (description, image, name, path: "/inventory/post", price, requestId, seller)
then
  Inventory.post (description, image, name, price, seller)
```

### Post#2

Authored path: `Post`.
- Covered by [Inventory](../design/compositions/Inventory.md), line 9.
- Covered by [Inventory](../design/compositions/Inventory.md), line 12.

```reaction
when Inventory.post (description, image, name, price, seller), asked by Post
where
  earlier, RequestBoundary.request (description, image, name, path: "/inventory/post", price, requestId, seller)
then
  RequestBoundary.respond (item: "item", requestId)
```

### PurgeClosed

Authored path: `PurgeClosed`.
- Covered by [Messaging](../design/compositions/Messaging.md), line 39.
- Covered by [Messaging](../design/compositions/Messaging.md), line 42.

```reaction
when RequestBoundary.request (path: "/messaging/purgeClosed", requestId)
then
  Messaging.purgeClosed ()
```

### PurgeClosed#2

Authored path: `PurgeClosed`.
- Covered by [Messaging](../design/compositions/Messaging.md), line 39.
- Covered by [Messaging](../design/compositions/Messaging.md), line 42.

```reaction
when Messaging.purgeClosed (), asked by PurgeClosed
where
  earlier, RequestBoundary.request (path: "/messaging/purgeClosed", requestId)
then
  RequestBoundary.respond (requestId)
```

### Register

Authored path: `Register`.
- Covered by [MITUserVerification](../design/compositions/MITUserVerification.md), line 3.
- Covered by [MITUserVerification](../design/compositions/MITUserVerification.md), line 6.

```reaction
when RequestBoundary.request (email, password, path: "/users/register", requestId, username)
then
  MITUserVerification.register (email, password, username)
```

### Register#2

Authored path: `Register`.
- Covered by [MITUserVerification](../design/compositions/MITUserVerification.md), line 3.
- Covered by [MITUserVerification](../design/compositions/MITUserVerification.md), line 6.

```reaction
when MITUserVerification.register (email, password, username, user), asked by Register
where
  earlier, RequestBoundary.request (email, password, path: "/users/register", requestId, username)
then
  RequestBoundary.respond (requestId, user)
```

### ReleaseClaim

Authored path: `ReleaseClaim`.
- Covered by [Inventory](../design/compositions/Inventory.md), line 39.
- Covered by [Inventory](../design/compositions/Inventory.md), line 42.

```reaction
when RequestBoundary.request (item, path: "/inventory/releaseClaim", requestId, user)
then
  Inventory.releaseClaim (item, user)
```

### ReleaseClaim#2

Authored path: `ReleaseClaim`.
- Covered by [Inventory](../design/compositions/Inventory.md), line 39.
- Covered by [Inventory](../design/compositions/Inventory.md), line 42.

```reaction
when Inventory.releaseClaim (item, user), asked by ReleaseClaim
where
  earlier, RequestBoundary.request (item, path: "/inventory/releaseClaim", requestId, user)
then
  RequestBoundary.respond (requestId)
```

### Search

Authored path: `Search`.
- Covered by [Tagging](../design/compositions/Tagging.md), line 15.
- Covered by [Tagging](../design/compositions/Tagging.md), line 18.

```reaction
when RequestBoundary.request (path: "/tagging/search", requestId, selectedTags)
then
  RequestBoundary.respond (requestId, result: former "items matching selected tags" with (selectedTags))
```

### SendMessage

Authored path: `SendMessage`.
- Covered by [Messaging](../design/compositions/Messaging.md), line 9.
- Covered by [Messaging](../design/compositions/Messaging.md), line 12.

```reaction
when RequestBoundary.request (content, conversation, path: "/messaging/sendMessage", requestId, sender)
then
  Messaging.sendMessage (content, conversation, sender)
```

### SendMessage#2

Authored path: `SendMessage`.
- Covered by [Messaging](../design/compositions/Messaging.md), line 9.
- Covered by [Messaging](../design/compositions/Messaging.md), line 12.

```reaction
when Messaging.sendMessage (content, conversation, sender, message), asked by SendMessage
where
  earlier, RequestBoundary.request (content, conversation, path: "/messaging/sendMessage", requestId, sender)
then
  RequestBoundary.respond (message, requestId)
```

### SessionOpen

Authored path: `SessionOpen`.
- Covered by [Sessioning](../design/compositions/Sessioning.md), line 3.
- Covered by [Sessioning](../design/compositions/Sessioning.md), line 6.

```reaction
when RequestBoundary.request (path: "/sessioning/sessionOpen", requestId, user)
then
  Sessioning.sessionOpen (user)
```

### SessionOpen#2

Authored path: `SessionOpen`.
- Covered by [Sessioning](../design/compositions/Sessioning.md), line 3.
- Covered by [Sessioning](../design/compositions/Sessioning.md), line 6.

```reaction
when Sessioning.sessionOpen (user, session), asked by SessionOpen
where
  earlier, RequestBoundary.request (path: "/sessioning/sessionOpen", requestId, user)
then
  RequestBoundary.respond (requestId, session)
```

### StartConversation

Authored path: `StartConversation`.
- Covered by [Messaging](../design/compositions/Messaging.md), line 3.
- Covered by [Messaging](../design/compositions/Messaging.md), line 6.

```reaction
when RequestBoundary.request (content, initiator, path: "/messaging/startConversation", recipient, requestId, topic)
then
  Messaging.startConversation (content, initiator, recipient, topic)
```

### StartConversation#2

Authored path: `StartConversation`.
- Covered by [Messaging](../design/compositions/Messaging.md), line 3.
- Covered by [Messaging](../design/compositions/Messaging.md), line 6.

```reaction
when Messaging.startConversation (content, initiator, recipient, topic, conversation), asked by StartConversation
where
  earlier, RequestBoundary.request (content, initiator, path: "/messaging/startConversation", recipient, requestId, topic)
then
  RequestBoundary.respond (conversation, requestId)
```

### Tag

Authored path: `Tag`.
- Covered by [Tagging](../design/compositions/Tagging.md), line 21.
- Covered by [Tagging](../design/compositions/Tagging.md), line 24.

```reaction
when RequestBoundary.request (item, path: "/tagging/tag", requestId, tag)
then
  Tagging.tag (item, tag)
```

### Tag#2

Authored path: `Tag`.
- Covered by [Tagging](../design/compositions/Tagging.md), line 21.
- Covered by [Tagging](../design/compositions/Tagging.md), line 24.

```reaction
when Tagging.tag (item, tag), asked by Tag
where
  earlier, RequestBoundary.request (item, path: "/tagging/tag", requestId, tag)
then
  RequestBoundary.respond (requestId)
```

### Tags

Authored path: `Tags`.
- Covered by [Tagging](../design/compositions/Tagging.md), line 3.
- Covered by [Tagging](../design/compositions/Tagging.md), line 6.

```reaction
when RequestBoundary.request (path: "/tagging/tags", requestId)
then
  RequestBoundary.respond (requestId, tags: former "predefined tags")
```

### TransactionCompleted

Authored path: `TransactionCompleted`.
- Covered by [Inventory](../design/compositions/Inventory.md), line 45.
- Covered by [Inventory](../design/compositions/Inventory.md), line 48.

```reaction
when RequestBoundary.request (item, path: "/inventory/transactionCompleted", requestId, user)
then
  Inventory.transactionCompleted (item, user)
```

### TransactionCompleted#2

Authored path: `TransactionCompleted`.
- Covered by [Inventory](../design/compositions/Inventory.md), line 45.
- Covered by [Inventory](../design/compositions/Inventory.md), line 48.

```reaction
when Inventory.transactionCompleted (item, user), asked by TransactionCompleted
where
  earlier, RequestBoundary.request (item, path: "/inventory/transactionCompleted", requestId, user)
then
  RequestBoundary.respond (requestId)
```

### Untag

Authored path: `Untag`.
- Covered by [Tagging](../design/compositions/Tagging.md), line 27.
- Covered by [Tagging](../design/compositions/Tagging.md), line 30.

```reaction
when RequestBoundary.request (item, path: "/tagging/untag", requestId, tag)
then
  Tagging.untag (item, tag)
```

### Untag#2

Authored path: `Untag`.
- Covered by [Tagging](../design/compositions/Tagging.md), line 27.
- Covered by [Tagging](../design/compositions/Tagging.md), line 30.

```reaction
when Tagging.untag (item, tag), asked by Untag
where
  earlier, RequestBoundary.request (item, path: "/tagging/untag", requestId, tag)
then
  RequestBoundary.respond (requestId)
```

## Endpoint input contracts

Before recording an action ask, the boundary rejects a body that is not an
object or lacks a required key. The response uses `INVALID_INPUT` and names
the path or missing key. A declared default fills an absent key. Endpoints
not listed here have no explicit input contract.

- `/inventory/claim` — requires `item`, `claimer`
- `/inventory/claimed` — requires `user`
- `/inventory/delete` — requires `item`, `user`
- `/inventory/edit` — requires `item`, `user`, `description`, `price`, `image`
- `/inventory/post` — requires `name`, `seller`, `image`, `description`, `price`
- `/inventory/releaseClaim` — requires `item`, `user`
- `/inventory/transactionCompleted` — requires `item`, `user`
- `/messaging/closeConversation` — requires `topic`
- `/messaging/conversations` — requires `user`
- `/messaging/markRead` — requires `conversation`, `reader`
- `/messaging/messages` — requires `conversation`, `reader`
- `/messaging/sendMessage` — requires `conversation`, `sender`, `content`
- `/messaging/startConversation` — requires `initiator`, `recipient`, `topic`, `content`
- `/sessioning/sessionOpen` — requires `user`
- `/sessioning/user` — requires `session`
- `/tagging/clear` — requires `item`
- `/tagging/itemTags` — requires `item`
- `/tagging/search` — requires `selectedTags`
- `/tagging/tag` — requires `item`, `tag`
- `/tagging/untag` — requires `item`, `tag`
- `/users/authenticate` — requires `username`, `password`
- `/users/register` — requires `username`, `email`, `password`
