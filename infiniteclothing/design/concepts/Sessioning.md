# Sessioning

## Purpose
let a signed-in user make requests without resending a password

## Principle
after a user signs in, a session is opened for them. later requests present the session instead of a password. opening a session again for the same user gives back the same session.

## Types
```types
external User
    a person who has signed in
```

## State
```state
a set of Sessions with
    a user User
```

## Actions

```actions
sessionOpen(user: User): returns (session: Session)

    where user does not have a session

    then
        create a new session
        returns session

    where user does have a session

    then
        returns session
```

## Queries

```queries
_getUser(session: Session) : optional (user: User)

    answers the user the session belongs to
    answers no row for an unknown Session
```
