# Concept Design of Infinite Clothing

## MIT User Verification

**concept** MITUserVerification

**purpose** identify users; prevent one user from pretending to be another; only permit account creation if the user is a member of the MIT community

**principle** after a user registers with a username and a password, they utilize their MIT email to confirm their account. from then, they can authenticate with that same username and password and be treated each time as the same user.

**state:**
a set of Users with a username String, a password String, a token String, where the token String is either a string or undefined, a confirmed boolean representing whether or not the account has been confirmed, and an email address ending with @mit.edu

**actions**

register(username: String, email: String, password: String): return (user: User, token: String)

&nbsp;&nbsp; **where** the username is a unique, unused String and the email is an @mit.edu email and is not associated with any other accounts

&nbsp;&nbsp; **then** create a new User with the username, email, and password and create a token. Mark the user as unconfirmed.


confirm(token: String): return (user: User)

&nbsp;&nbsp; **where** token is a unique, secret String and there exists a User who has a token matching token

&nbsp;&nbsp; **then** give the user access to their account, remove the token from user, and mark the user as confirmed.


authenticate(username: String, password: String): return (user: User)

&nbsp;&nbsp; **where** username matches a User within the set and the password matches the one associated with the username and the confirmed boolean is set to true

&nbsp;&nbsp; **then** give the user access to their account



## Messaging

**concept** Messaging [User, Item]

**purpose** allow users to message one another independently and keep track of what has been sent; deletes messages after the topic has been closed for 24 hours

**principle** after a user starts a conversation with another user about an Item by sending an initial message, the other user can reply and the conversation persists until the Item transaction has been completed for 24 hours, then the Conversation deletes

**state** a set of Conversations with a topic Item, an initiator User, a recipient User, a messages sequence of Message, and a closedAt Time

a set of Messages with a sender User, a content String, a sentAt Time, and a read Boolean

**actions**

startConversation(initiator: User, recipient: User, topicItem: Item, content: String): (conversation: Conversation)

&nbsp;&nbsp; **where**  initiator and recipient are not the same people and, initiator and recipient do not have a preexisting Conversation about the topicItem

&nbsp;&nbsp; **then** create Conversation with topicItem, initiator, recipient, and an empty array of messages. create a Message with the initiator, content, and sentAt time as the current time. set the Message read boolean to false. add it to messages in the newly created conversation. set closedAt to be undefined.


sendMessage(conversation: Conversation, sender: User, content: String): (message: Message)

&nbsp;&nbsp; **where** sender is the initiator or recipient of conversation

&nbsp;&nbsp; **then** create a new message with this sender, the content, read as false, and sentAt as now, add it to conversations


markRead(conversation: Conversation, reader: User)

&nbsp; &nbsp; **where** reader is the initiator or recipient of conversation

&nbsp; &nbsp; **then** sets read to true on every Message in conversation whose sender is not reader


closeConversation(topic: Item)

&nbsp;&nbsp; **where** a Conversation is about topic

&nbsp;&nbsp; **then** set closedAt of all conversations associated with topic to the current time


deleteConversation(conversation: Conversation)

&nbsp;&nbsp; **where** closedAt time is greater than 24 hours ago

&nbsp;&nbsp; **then** delete the Conversation



## Inventory

**concept** Inventory [User, Item]

**purpose** allows sellers to advertise their for sale items so that buyers can discover

**principle** a seller posts an item for sale. a buyer finds the item in the inventory. from there, a transaction occurs and the item is marked as sold

**state**
A collection of Items with a description String, a price string, Image, a seller User, a status String (of [available, claimed, completed]), a buyer User, and a completedTime Time

**actions**

post(name: String, description: String, price: String, seller: User, image: Image): (item: Item)

**where** no item in Items matches the name, seller, and description as listed

**then** create a new Item and add item to the set of sale Items with the description, price, seller, and image. set status to available. set buyer to undefined and completedTime to undefined.


claim(item: Item, claimer: User):

**where** status is available and claimer is not the same as seller

**then** set status as claimed and set the buyer to claimer.


edit(item: Item, description: String, price:String, image:image, user: User)

**where** the item is an existing item and user is the seller of item

**then** edit the item to have the new description, new price, and/or new Image


delete(item: Item, user: User)

**where** the item is a valid Item, status is available, and user is the seller

**then** remove the entire item from the set

releaseClaim(item: Item, user: User)

**where** the status of item is claimed and the buyer is the same as user

**then** set the status of item to available, and set the buyer to undefined.


transactionCompleted(item:Item)

**where** the status is claimed

**then** set status to completed and set completedTime to the current time.


getSeller(item: Item): (seller: User)

**where** item is a valid item and status is available

**then** return the seller

available(): (arrayOf(item))

**where** there are items in the set

**then** return the items to the user requesting



## Tagging

**concept** Tagging [Item]

**purpose** allow users to describe items with predefined attributes so buyers can narrow their search

**principle** a user selects predefined tags to notify other users what the item is; allows users to ask for items with specific tags and see only items with those tags

**state**
A set of Tags with a category String and a label String (predefined options created at deployment)

A set of Items with a tags set of Tag


**actions**
tag(item: Item, tag: Tag)

**where** tag is included in Tags

**then** add item to Items if not present, add tag to item's tags

untag(item: Item, tag: Tag)

**where** item is included in the collection and tag is included in item's tags

**then** remove tag from Item's tags

search(tags: set of Tags): (arrayof(Item))

**where** each tag in tags is contained within the valid tags

**then** return a set of Items that include all tags within their set of Tags

clear(item: Item)

**where** item is a valid Item

**then** clear all of its tags and delete the item


## Sessioning

**concept** Sessioning [User]

**purpose** let a signed-in user make requests without resending a password

**state** a set of Sessions with a user User

**actions**

start(user: User): (session: Session)

**where** user is a valid User

**then** return a new session

sessionOpen(user: User, session: Session)

**where** session exists and its associated user is user

**then** permit actions that user wishes


## Reactions

**reaction** Register
    **when** Requesting.register(username, email,password)
    **then** MITUserVerification.register(username, email, password)

email the user token for confirmation


**reaction** Login

**when** Requesting.authenticate(username, password)

**where** MITUserVerification.authenticate(username, password)

**then** Sessioning.start(user)


**reaction** PostItem

**when** Requesting.post(session, description, price, image, tags)

**where** Sessioning

**then** Inventory.post(item, description, price, seller: user, image)

Tagging.tag(item, tag) for each tag in tags


**reaction** BuyItem

**when** Requesting.claim(item, user)

**where** Sessioning.sessionOpen(user, session)

**then** Inventory.claim(item, user)


**reaction** contactSeller

**when** Requesting.contactSeller(session, item, content)

**where** Sessioning.sessionOpen(user, session)

Inventory.getSeller(item)

**then** Messaging.startConversation(initiator: user, recipient: seller, topicItem: item, content)


**reaction** CompleteSale

**when** Requesting.transactionCompleted(user, item)

**where** Sessioning.sessionOpen(user, session)

Inventory.getSeller(item) is the same as user

**then** Inventory.transactionCompleted(item)

Messaging.closeConversation(item)

Tagging.clear(item)


**reaction** DeleteMessages

**where** time since transaction completed for any conversation

**then** Messaging.deleteConversation(conversation)


**reaction** DeleteItem

**when** Request.delete(item, user)

**where** Sessioning.sessionOpen(user, session)

**then** Inventory.delete(item, user)

Messaging.closeConversation(item)

Tagging.clear(item)



## A Brief Note

- MITUserVerification controls access to all other concepts by permitting only members of the MIT community to access these concepts. This is verified by checking that the email the user confirms their account with is an MIT domain email.

- Tagging works alongside Inventory to provide sorting and easier searching for buyers who are looking through the inventory of items.

- Item as appears in Messaging, Inventory, and Tagging are all the same items. Some item of type Item is used to ground Messaging, Inventory, and Tagging.

- Authentication is required for each new session, when the user must login to their account. Any time that the user performs some action, such as posting or claiming, the users authenticated status will be checked.

- The Messaging concept allows users to message one another about a specific item until the status of a transaction has been marked complete by the seller. Upon that completion, the messages will delete within the after 24 hours. The transaction being completed is a separate operation than finalizing a sale, because there is an in person element to sales that will require users to have access to their messages until the transaction is fully completed (including item handoff).
