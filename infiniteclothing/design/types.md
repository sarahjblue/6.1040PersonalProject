# Marketplace Application Types

Item images are opaque references (for example a URL) supplied by the application.
Users, sessions and sign-in come from the MITUserVerification and Sessioning concepts.


```types
concrete ImageRef
  A reference to an item's picture, supplied by the application.
```

```instances
instantiate MITUserVerification

instantiate Inventory with
  User is MITUserVerification.User
  Image is ImageRef

instantiate Tagging with
  Item is Inventory.Item

instantiate Messaging with
  User is MITUserVerification.User
  Item is Inventory.Item

instantiate Sessioning with
  User is MITUserVerification.User
```
