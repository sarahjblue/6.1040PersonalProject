# Sessioning [User]

## Purpose
let a signed-in user make requests without resending a password

## State
```state
a set of Sessions with an user User
```

## Actions

```actions

sessionOpen(user: User): returns (session: Session)

    where user does not have a session

    then
        create a new session
        return session

    where user does have a session

    then
        return session
```
