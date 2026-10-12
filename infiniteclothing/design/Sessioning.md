# Sessioning [User]

## Purpose
let a signed-in user make requests without resending a password

## State
```state
a set of Sessions with an user User
```

## Actions

```actions
start(user: User): returns (session: Session)

    where user is a valid User

    then
        return a new session

sessionOpen(user: User): returns ()

    where session exists and its associated user is user

    then
        permit actions that user wishes
```
