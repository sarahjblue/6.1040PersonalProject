# Inventory

## Purpose

allows sellers to advertise their for sale items so that buyers can discover

## Principle
a seller posts an item for sale. a buyer finds the item in the inventory. from there, a transaction occurs and the item is marked as sold

## Types

```types
    external User
        a person who sells an item or buys an item

    external Item
        a thing that is being sold
```

## State
```state
A collection of Items with
    a description String,
    a price string, Image,
    a seller User,
    a status enumeration (of [available, claimed, completed]), and
    a buyer User.
```

## Actions

```actions
post(name: String, description: String, price: String, seller: User, image: Image): (item: Item)

    where no item in Items matches the name, seller, and description as listed

    then
        create a new Item and add item to the set of Items with a name, optional description, optional price, seller, and image.
        set status to available. set buyer to undefined.


claim(item: Item, claimer: User):

    where status is available and claimer is not the same as seller

    then
        set status as claimed and set the buyer to claimer.


edit(item: Item, (optional) description: String, (optional) price:String, (optional) image: Image, user: User)

    where the item is an existing item and user is the seller of item, and at least a description, price, or image is being passed in

    then
        edit the item to have the new description, new price, and/or new Image. the user only has to change one of these.


delete(item: Item, user: User)

    where the item is a valid Item, status is available, and user is the seller

    then
        remove the entire item from the set


releaseClaim(item: Item, user: User)

    where the status of item is claimed and user is the buyer

    then
        set the status of item to available
        set the buyer to undefined


transactionCompleted(item:Item)

    where the status is claimed

    then
        set status to completed.


getSeller(item: Item): (seller: User)

    where item is a valid item

    then
        return the seller

available(): (arrayOf(item))

    where there are items in the set

    then
        return the items to the user requesting

removeFromInventory()   [System Action]

    where item is marked as completed

    then
        delete the item from Inventory
```
