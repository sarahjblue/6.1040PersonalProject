# Concept Design of Infinite Clothing

## Password Authenticating + MIT Verification

** concept ** PasswordAuthenticating

** purpose ** identify users; prevent one user from pretending to be another; only permit account creation if the user is an MIT student

** principle ** after a user registers with a username and a password, they utilize their MIT email to confirm their account. from then, they can authenticate with that same username and password and be treated each time as the same user.

** state: **
a set of Users with a username String, a password String, a token String, where the token String is either a string or undefined, a confirmed boolean representing whether or not the account has been confirmed, and an email address ending with @mit.edu

** actions **

register(username: String, email: String, password: String): return (user: User)

&nbsp;&nbsp; ** where ** the username is a unique, unused String and the email is an @mit.edu email and is not associated with any other accounts

&nbsp;&nbsp; ** then ** create a new User with the username and password and emails the user a token. Mark the user as unconfirmed.


confirm(token: String): return (user: User)

&nbsp;&nbsp; ** where ** token is a unique, secret String and the token matches that of user

&nbsp;&nbsp; ** then ** give the user access to their account, remove the token from user, and mark the user as confirmed.

&nbsp;&nbsp; ** else ** the token does not match, and the user is notified that their token was not valid


authenticate(username: String, password: String): return (user: User)

&nbsp;&nbsp; ** where ** username matches a User within the set and the password matches the one associated with the username and the confirmed boolean is set to true

&nbsp;&nbsp; ** then ** give the user access to their account



## Messaging

** concept ** Messaging [User, Item]

** purpose ** allow users to message one another independently and keep track of what has been sent; deletes messages after the Item is no longer available

** principle ** after a user starts a conversation with another user about an Item by sending an initial message, the other user can reply and the conversation persists until the Item has been sold for 24 hours, then the Conversation deletes

** state ** a set of Conversations with a topic Item, an initiator User, a recipient User, a messages sequence of Message, and a transactionComplete Time

a set of Messages with a sender User, a content String, and a setat Time

** actions **

startConversation(initiator: User, recipient: User, topicItem: Item, content: String): (conversation: Conversation)

&nbsp;&nbsp; ** where **  initiator and recipient are not the same people and, initiator and recipient do not have a preexisting Conversation about the topicItem

&nbsp;&nbsp; ** then ** create a Message with the initiator, topicItem, content, and the time. add it to messages.

sendMessage(conversation: Conversation, sender: User, content: String): (message: Message)

&nbsp;&nbsp; ** where ** sender is the the initiator or recipient of conversation

&nbsp;&nbsp; ** then ** create a new message with this sender and the content, add it to the thred of conversations

deleteConversation(conversation: Conversation, transactionComplete: Time)

&nbsp;&nbsp; ** where ** transactionComplete time is greater than 24 hours ago

&nbsp;&nbsp; ** then ** delete the Conversation



## Inventory

** concept ** Inventory

** purpose ** store all items that have been added for sale

** principle ** when a user adds an item for sale, add it to the inventory. the inventory items persist until the item has been sold

** state **
A collection of sale Items with a description String, a sold Boolean, and a transactionComplete Time

** actions **

post(item: Item, description: String)

** where ** item is not currently in the set of sale Items

** then ** add item to the set of sale Items with the description

markAsSold(item: Item): (purchaseTime: Time)

** where ** the sold boolean is false

** then **








## Reactions

** reaction ** MarkAsSold
** when **
** then **
