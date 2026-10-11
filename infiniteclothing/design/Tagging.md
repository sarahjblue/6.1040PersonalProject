# Tagging [Item]

## Purpose
allow users to describe items with predefined attributes so buyers can narrow their search

## Principle
a user selects predefined tags to notify other users what the item is; allows users to ask for items with specific tags and see only items with those tags; users can only assign one tag per category

## State
``` state
A set of Tags with
    a category String and
    a label String (predefined options created at deployment)

A set of Items with
    a tags set of Tag
```


## Actions

tag(item: Item, tag: Tag)

    where tag is included in Tags

    then
        add item to Items if not present, add tag to item's tags


untag(item: Item, tag: Tag)

    where item is included in the collection and tag is included in item's tags

    then
        remove tag from Item's tags


search(tags: set of Tags): (arrayOf(Item))

    where each tag in tags is contained within the valid tags

    then
        return a set of available Items that include all tags within their set of Tags

clear(item: Item)

    where item is a valid Item

    then
        clear all of its tags and delete the item
