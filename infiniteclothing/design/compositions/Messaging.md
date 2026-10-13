# Messaging

A User [starts a conversation](reaction: Messaging.startConversation)

```endpoints
Messaging.startConversation at /messaging/startConversation
```

A User [sends a message](reaction: Messaging.sendMessage)

```endpoints
Messaging.sendMessage at /messaging/sendMessage
```

A User [marks conversation messages as read](reaction: Messaging.markRead)

```endpoints
Messaging.markRead at /messaging/markRead
```

A User can [view messages in a conversation](reaction: Messaging._messages)

```endpoints
Messaging._messages at /messaging/messages
```

A User can [list their conversations](reaction: Messaging._conversationsOf)

```endpoints
Messaging._conversationsOf at /messaging/conversations
```

The application [closes conversations about an item](reaction: Messaging.closeConversation)

```endpoints
Messaging.closeConversation at /messaging/closeConversation
```

A scheduled maintenance task [purges expired conversations](reaction: Messaging.purgeClosed)

```endpoints
Messaging.purgeClosed at /messaging/purgeClosed
```
