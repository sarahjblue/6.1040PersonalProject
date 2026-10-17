# Tagging

## Purpose
allow users to describe items with predefined attributes so buyers can narrow their search

## Principle
a user selects predefined tags grouped by category, such as the sizes XS to XXL and a set of colors, to notify other users what the item is; allows users to ask for items with specific tags and see only items with those tags; users can only assign one tag per category

## Types

```types
external Item
    a thing that can be described with tags, owned by another concept.
```

## State
```state
a set of Tags with
    a category String
    a label String
    unique category and label
    Rule: the Tags are predefined when the concept is created and no action adds or removes them.

a set of Items with
    a tags set of Tag
```

## Actions

```actions
tag(item: Item, tag: Tag): returns ()

    where tag is not in Tags

    then
        refuses TAG_NOT_EXIST "This tag does not exist."

    where tag is in Tags and item already has a tag in the category of tag

    then
        refuses TAG_CATEGORY_TAKEN "This item already has a tag in that category."

    where tag is included in Tags and item has no tag in the category of tag

    then
        add item to Items if not present
        add tag to the tags of items
        returns


untag(item: Item, tag: Tag): returns ()

    where item is included in the Items and tag is included in the tags of item

    then
        remove tag from the tags of item
        returns


clear(item: Item): returns ()

    where item is not in Items

    then
        refuses CLEAR_UNKNOWN_ITEM "This item has no tags to clear."

    where item is in Items

    then
        remove item from Items with all of its tags
        returns
```

## Queries

```queries
_search(selectedTags: Tags): many (item: Item)

    selectedTags is a collection of Tag identifiers
    answers every item in Items whose tags include all of the given tags
    answers no rows when any given tag is not in Tags

_tags() : many (tag: Tag, category: String, label: String)

    answers every predefined tag
```
