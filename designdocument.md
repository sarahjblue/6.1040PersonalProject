# Infinite Clothing Design Document

Turn your design notes, which record your ideas, changes, and observations, into a coherent document of one to two pages. Summarize how your final design differs from your initial concept design in P1 and your visual design in P3. Be succinct and to the point, and use bullets and subheadings to make the document easy to navigate. Feel free to use diagrams and screenshots to illustrate your points if helpful.


## Design Differences (between P1 and P4)

### MITUserVerification
Between P1 and P4, I made the design to not have the confirmation aspect of MITUserVerification. I found that the email confirmation required a tool and skillset I did not have. I also decided that for the internal, testing use at MIT, the challenges and lack of tools to implement the email verification outweighed the necessity for such a design choice.


### Inventory
One design choice I changed in Inventory is I originally planned for a seller to not have to list a price when posting an item. This was originally intended to reduce friction in the item posting process. Throughout the design and building process, I thought further and realized that requiring a price caused the seller very little additional friction, but might create too much friction for a buyer. Therefore, I changed the design to require a price from a seller. Since I require the seller to enter a price, I also decided to enforce that the seller enter a valid number to represent the price.

Another change is that when an item is deleted, rather than deleting any Conversations about the item, I hide the messages so that they are no longer visible to the user. This change also was implemented into transactionCompleted, where any Conversations about the item become hidden rather than being deleted.


### Messaging
I did not make any major design changes to Messaging.


### Sessioning
I did not make any major design changes to Sessioning.

### Tagging
I did not make any major design changes to Tagging.


### Other changes

Another change I made between iterations was to map errors so that any error reveals the more specific string in the UI rather than just saying "INTERNAL_ERROR". This is important so that the user gains an insight into what went wrong and can more easily correct their actions. This improves usability.



## Visual Design Differences (between P2 and P4)
