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

**principle** after a user starts a conversation with another user about an Item by sending an initial message, the other user can reply. deletes conversations a set time after their topic closes.

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


purgeClosed()

&nbsp;&nbsp; **where** some Conversation has closedAt defined and closedAt earlier than 24 hours ago

&nbsp;&nbsp; **then** delete every Conversation that meets these requirements and all Messages within



## Inventory

**concept** Inventory [User, Item]

**purpose** allows sellers to advertise their for sale items so that buyers can discover

**principle** a seller posts an item for sale. a buyer finds the item in the inventory. from there, a transaction occurs and the item is marked as sold

**state**
A collection of Items with a description String, a price string, Image, a seller User, a status String (of [available, claimed, completed]), a buyer User, and a completedTime Time

**actions**

post(name: String, description: String, price: String, seller: User, image: Image): (item: Item)

&nbsp;&nbsp; **where** no item in Items matches the name, seller, and description as listed

&nbsp;&nbsp; **then** create a new Item and add item to the set of Items with the description, price, seller, and image. set status to available. set buyer to undefined and completedTime to undefined.


claim(item: Item, claimer: User):

&nbsp;&nbsp; **where** status is available and claimer is not the same as seller

&nbsp;&nbsp; **then** set status as claimed and set the buyer to claimer.


edit(item: Item, description: String, price:String, image: Image, user: User)

&nbsp;&nbsp; **where** the item is an existing item and user is the seller of item

&nbsp;&nbsp; **then** edit the item to have the new description, new price, and/or new Image


delete(item: Item, user: User)

&nbsp;&nbsp; **where** the item is a valid Item, status is available, and user is the seller

&nbsp;&nbsp; **then** remove the entire item from the set

releaseClaim(item: Item, user: User)

&nbsp;&nbsp; **where** the status of item is claimed and the buyer is the same as user

&nbsp;&nbsp; **then** set the status of item to available, and set the buyer to undefined.


transactionCompleted(item:Item)

&nbsp;&nbsp; **where** the status is claimed

&nbsp;&nbsp; **then** set status to completed and set completedTime to the current time.


getSeller(item: Item): (seller: User)

&nbsp;&nbsp; **where** item is a valid item and status is available

&nbsp;&nbsp; **then** return the seller

available(): (arrayOf(item))

&nbsp;&nbsp; **where** there are items in the set

&nbsp;&nbsp; **then** return the items to the user requesting



## Tagging

**concept** Tagging [Item]

**purpose** allow users to describe items with predefined attributes so buyers can narrow their search

**principle** a user selects predefined tags to notify other users what the item is; allows users to ask for items with specific tags and see only items with those tags

**state**
A set of Tags with a category String and a label String (predefined options created at deployment)

A set of Items with a tags set of Tag


**actions**
tag(item: Item, tag: Tag)

&nbsp;&nbsp; **where** tag is included in Tags

&nbsp;&nbsp; **then** add item to Items if not present, add tag to item's tags

untag(item: Item, tag: Tag)

&nbsp;&nbsp; **where** item is included in the collection and tag is included in item's tags

&nbsp;&nbsp; **then** remove tag from Item's tags

search(tags: set of Tags): (arrayOf(Item))

&nbsp;&nbsp; **where** each tag in tags is contained within the valid tags

&nbsp;&nbsp; **then** return a set of Items that include all tags within their set of Tags

clear(item: Item)

&nbsp;&nbsp; **where** item is a valid Item

&nbsp;&nbsp; **then** clear all of its tags and delete the item


## Sessioning

**concept** Sessioning [User]

**purpose** let a signed-in user make requests without resending a password

**state** a set of Sessions with a user User

**actions**

start(user: User): (session: Session)

&nbsp;&nbsp; **where** user is a valid User

&nbsp;&nbsp; **then** return a new session

sessionOpen(user: User, session: Session)

&nbsp;&nbsp; **where** session exists and its associated user is user

&nbsp;&nbsp; **then** permit actions that user wishes


## Reactions

**reaction** Register

&nbsp;&nbsp; **when** Requesting.register(username, email,password)

&nbsp;&nbsp; **then** MITUserVerification.register(username, email, password)

email the user token for confirmation


**reaction** Login

&nbsp;&nbsp; **when** Requesting.authenticate(username, password)

&nbsp;&nbsp; **where** MITUserVerification.authenticate(username, password)

&nbsp;&nbsp; **then** Sessioning.start(user)


**reaction** PostItem

&nbsp;&nbsp; **when** Requesting.post(session, description, price, image, tags)

&nbsp;&nbsp; **where** Sessioning

&nbsp;&nbsp; **then** Inventory.post(item, description, price, seller: user, image)

&nbsp;&nbsp; Tagging.tag(item, tag) for each tag in tags


**reaction** BuyItem

&nbsp;&nbsp; **when** Requesting.claim(item, user)

&nbsp;&nbsp; **where** Sessioning.sessionOpen(user, session)

&nbsp;&nbsp; **then** Inventory.claim(item, user)


**reaction** contactSeller

&nbsp;&nbsp; **when** Requesting.contactSeller(session, item, content)

&nbsp;&nbsp; **where** Sessioning.sessionOpen(user, session)

&nbsp;&nbsp; Inventory.getSeller(item)

&nbsp;&nbsp; **then** Messaging.startConversation(initiator: user, recipient: seller, topicItem: item, content)


**reaction** CompleteSale

&nbsp;&nbsp; **when** Requesting.transactionCompleted(user, item)

&nbsp;&nbsp; **where** Sessioning.sessionOpen(user, session)

&nbsp;&nbsp; Inventory.getSeller(item) is the same as user

&nbsp;&nbsp; **then** Inventory.transactionCompleted(item)

&nbsp;&nbsp; Messaging.closeConversation(item)

&nbsp;&nbsp; Tagging.clear(item)


**reaction** PurgeClosed

&nbsp;&nbsp;  **when** via system, every hour

&nbsp;&nbsp; **where** time since transaction completed for any conversation

&nbsp;&nbsp; **then** Messaging.purgeClosed()


**reaction** DeleteItem

&nbsp;&nbsp; **when** Request.delete(item, user)

&nbsp;&nbsp; **where** Sessioning.sessionOpen(user, session)

&nbsp;&nbsp; **then** Inventory.delete(item, user)

&nbsp;&nbsp; Messaging.closeConversation(item)

&nbsp;&nbsp; Tagging.clear(item)



## A Brief Note

- MITUserVerification controls access to all other concepts by permitting only members of the MIT community to access these concepts. This is verified by checking that the email the user confirms their account with is an MIT domain email at registration via token in their email.

- Tagging works alongside Inventory to provide sorting and easier searching for buyers who are looking through the inventory of items.

- Item as appears in Messaging, Inventory, and Tagging are all the same items. Inventory creates Items in the claim action. Messaging and Inventory then use these Items.

- User as seen in Messaging and Inventory is dependent on the creation of User during MITUserVerification. When Messaging begins, the recipient User is required to be the seller of the item through the ContactSeller reaction.

- Authentication is required for each new session, when the user must login to their account. Any time that the user performs some action, such as posting or claiming, the users authenticated status will be checked via Sessioning. This use case shows how the MITUserVerification and Sessioning concepts work together to ensure a valid user.

- The Messaging concept allows users to message one another about a specific item until the status of a transaction has been marked complete by the seller. Upon that completion, the messages will delete after 24 hours. The transaction being completed is a separate operation than finalizing a sale, because there is an in person element to sales that will require users to have access to their messages until the transaction is fully completed (including item handoff).
