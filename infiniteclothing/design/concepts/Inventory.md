# Inventory

## Purpose

allows sellers to advertise their for sale items so that buyers can discover

## Principle
a seller posts an item for sale. a buyer finds the item in the inventory. from there, a transaction occurs and the item is marked as sold

## Types

```types
external User
    a person who sells an item or buys an item

external Image
    a picture of an item, supplied by the user.

Status is AVAILABLE or CLAIMED or COMPLETED
    represents the item's sale status: open to buyers, held by a buyer, or sold
```

## State
```state
a set of Items with
    a name String
    an optional description String
    an optional price String
    an image Image
    a seller User
    a status Status
    an optional buyer User
    Rule: buyer is present exactly when status is CLAIMED or COMPLETED, and is different from the seller.
```

## Actions

```actions
post(name: String, description?: String, price?: String, seller: User, image: Image) : returns (item: Item)

    where an item with the same name, seller and description is in Items

    then
        refuses ITEM_ALREADY_POSTED "You already have posted an item with that name and description."

    where no item has the same name, seller, and description is in Items

    then
        create a new Item with name, description, price, seller, and image
        set status to AVAILABLE
        set buyer to undefined
        returns item


claim(item: Item, claimer: User) : returns ()

    where item is not in ITEMS

    then
        refuses CLAIM_UNKNOWN_ITEM "There is no such item for sale."

    where item is in Items and its status is not AVAILABLE

    then
        refuses ITEM_NOT_AVAILABLE_TO_CLAIM "This item can not be claimed at this time."

    where item status is AVAILABLE and claimer is the seller of the item

    then
        refuses SELLER_CANNOT_CLAIM "You can not claim your own for sale item."

    where status is available and claimer is not the seller of item

    then
        set status to CLAIMED and set its buyer to claimer.
        returns


edit(item: Item, description?: String, price?: String, image?: Image, user: User) : returns ()

    where item is not in Items

    then
        refuses EDIT_UNKNOWN_ITEM "There is no such item."

    where item is in Items and user is not the seller

    then
        refuses NOT_SELLER_EDIT "You can not edit an item that you are not the seller of."

    where item is in Items, user is the seller and none of description, price, or image have a value

    then
        refuses NO_EDIT_CHANGES "Give at least a description, price, or image to edit with."

    where item is in Items, user is the seller, and at least one of description, price, or image has a value

    then
        replace each given field of item with its new value and leave the others.
        returns


delete(item: Item, user: User) : returns ()

    where item is not in Items

    then
        refuses DELETE_UNKNOWN_ITEM "This item already does not exist."

    where item is in Items and user is not the seller of item

    then
        refuses NOT_SELLER_DELETE "You can not delete an item that you are not selling."

    where item is in Items, status is COMPLETED, and user is the seller

    then
        refuses DELETE_NOT_COMPLETED "You can not delete an item where the transaction is completed."

    where item is in Items and user is the seller

    then
        remove item from Items.
        returns


releaseClaim(item: Item, user: User) : returns ()

    where item is not in Items

    then
        refuses RELEASE_UNKNOWN_ITEM "There is no such item."

    where item is in Items and its status is not CLAIMED

    then
        refuses RELEASE_UNCLAIMED "You can not release an unclaimed item."

    where item is in Items, its status is CLAIMED, and user is not its buyer

    then
        refuses RELEASE_NOT_BUYER "You can not release a claim you did not make."

    where the status of item is claimed and user is the buyer

    then
        set the status of item to AVAILABLE
        set the buyer to undefined
        returns


transactionCompleted(item:Item) : returns ()

    where item is not in ITEMS

    then
        refuses COMPLETE_UNKNOWN_ITEM "There is no such item."

    where item is in Items and its status is not CLAIMED

    then
        refuses NOT_CLAIMED "Only a claimed item can be completed."

    where item is claimed

    then
        set status to COMPLETED
        returns
```

## Queries

```queries
_getSeller(item: Item): optional (seller: User)

    answers the seller of item
    answers no row for an unknown Item

_available():many (item: Item, name: String, description?: String, price?: String, seller: User, image: Image)

    answers every item whose status is AVAILABLE, in the order they were posted
    answers no row when no item is available
```
