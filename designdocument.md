# Infinite Clothing Design Document

Turn your design notes, which record your ideas, changes, and observations, into a coherent document of one to two pages. Summarize how your final design differs from your initial concept design in P1 and your visual design in P3. Be succinct and to the point, and use bullets and subheadings to make the document easy to navigate. Feel free to use diagrams and screenshots to illustrate your points if helpful.


## Design Differences (between P1 and P4)

### MITUserVerification
Between P1 and P4, I made the design to not have the confirmation aspect of MITUserVerification. I found that the email confirmation required a tool and skillset I did not have. I also decided that for the internal, testing use at MIT, the challenges and lack of tools to implement the email verification outweighed the necessity for such a design choice.

From P2 to P4, I implemented the MITUserVerification concept so that the user experiences a login page that grants them access to their personal account.


### Inventory
One design choice I changed in Inventory is I originally planned for a seller to not have to list a price when posting an item. This was originally intended to reduce friction in the item posting process. Throughout the design and building process, I thought further and realized that requiring a price caused the seller very little additional friction, but might create too much friction for a buyer. Therefore, I changed the design to require a price from a seller. Since I require the seller to enter a price, I also decided to enforce that the seller enter a valid number to represent the price.

Another change is that when an item is deleted, rather than deleting any Conversations about the item, I hide the messages so that they are no longer visible to the user. This change also was implemented into transactionCompleted, where any Conversations about the item become hidden rather than being deleted.


### Messaging
I did not make any major design changes to Messaging.


### Sessioning
I did not make any major design changes to Sessioning. However, from P2 to P4, I implemented Sessioning so that the user experiences a login page that grants them access to their personal session.

### Tagging
I did not make any major design changes to Tagging.


### Other changes

Another change I made between iterations was to map errors so that any error reveals the more specific string in the UI rather than just saying "INTERNAL_ERROR". This is important so that the user gains an insight into what went wrong and can more easily correct their actions. This improves usability.



## Visual Design Differences (between P2 and P4)

From P2 to P4, I made multiple visual design changes. The biggest changes were interface design changes. One such change was making the Inventory show in the interface as the entire screen. To implement this change, I changed the visual design to include a plus button at the bottom left corner of the screen that opens a pop-up for the user to post their item for sale.

Another visual design change I implemented was to add a 'My Items' section. This allows the user to easily see any and all items that they have claimed and the items that they have listed for sale. I hope that this design choice makes it easier for users navigate their posted items and claimed items, removing friction for use.

Based on my visual design study in P3, I changed the colors of my UI to be a green that I find more visiually appealing and was inspired by some greens that appear naturally in the environment. It's a subtle nod to how the environment is an underappreciated stakeholder in the design.

Another visual change is that I reordered the Inventory viewing so that any items the user has claimed appear at the beginning of the Inventory, making claimed items easy to find.
