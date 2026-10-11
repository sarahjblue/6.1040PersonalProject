# MIT User Verification

## Purpose

identify users; prevent one user from pretending to be another; only permit account creation if the user is a member of the MIT community

## Principle

after a user registers with a username and a password, they utilize their MIT email to confirm their account. from then, they can authenticate with that same username and password and be treated each time as the same user.

## State

```state
a set of Users with
    a username String,
    a password String,
    a token String, where the token String is either a string or undefined,
    a confirmed boolean representing whether or not the account has been confirmed, and
    an email address ending with @mit.edu
```

## Actions

```actions
register(username: String, email: String, password: String): returns (user: User, token: String)

    where username is a unique, unused String and the email is an @mit.edu email and is not associated with any other accounts

    then
        create a new User with the username, email, and password
        create a token
        Mark the user as unconfirmed


confirm(token: String): returns (user: User)

    where token is a unique, secret String and there exists a User who has a token matching token

    then
        remove the token from user
        mark the user as confirmed.


authenticate(username: String, password: String): returns (user: User)

    where username matches a User within the set and the password matches the one associated with the username and the confirmed boolean is set to true

    then
        return the users account
```
