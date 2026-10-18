# Messaging

A User [starts a conversation](reaction: StartConversation)

```endpoints
StartConversation at /messaging/startConversation
```

A User [sends a message](reaction: SendMessage)

```endpoints
SendMessage at /messaging/sendMessage
```

A User [marks conversation messages as read](reaction: MarkRead)

```endpoints
MarkRead at /messaging/markRead
```

A User can [view messages in a conversation](reaction: Messages)

```endpoints
Messages at /messaging/messages
```

A User can [list their conversations](reaction: Conversation)

```endpoints
Conversation at /messaging/conversations
```

The application [closes conversations about an item](reaction: CloseConversation)

```endpoints
CloseConversation at /messaging/closeConversation
```

A scheduled maintenance task [purges expired conversations](reaction: PurgeClosed)

```endpoints
PurgeClosed at /messaging/purgeClosed
```
