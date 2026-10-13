# MITUserVerification

## Purpose

identify users; prevent one user from pretending to be another; only permit account creation if the user is a member of the MIT community

## Principle

after a user registers with a username and a password, they utilize their MIT email to confirm their account. from then, they can authenticate with that same username and password and be treated each time as the same user.

## Types
```types
Confirmation is UNCONFIRMED or CONFIRMED
    whether the owner of an account has proven control of its MIT email
```

## State

```state
a set of Users with
    a unique username String
    a password String
    an optional token String
    a confirmation Confirmation
    a unique email String
```

## Actions

```actions
register(username: String, email: String, password: String): returns (user: User, token: String)

    where username is already used

    then
        refuses USERNAME_ALREADY_USED "This username is already used. Choose a new one."

    where email is not @mit.edu

    then
        refuses NOT_MIT "Your email is not an MIT email. Please use that email, otherwise you can not join Infinite Clothing."

    where email is already associated with an account

    then
        refuses EMAIL_ALREADY_USED "This email already has an account."

    where username is a unique, unused String and the email is an @mit.edu email and is not associated with any other accounts

    then
        create a new User with the username, email, and password
        create a token
        Mark the user as unconfirmed
        returns user, token


confirm(token: String): returns (user: User)

    where token does not match that of any users

    then
        refuses INVALID_TOKEN "This token is not associated with any account."

    where there exists a User who has a token matching token

    then
        remove the token from user
        mark the user as confirmed.
        returns user


authenticate(username: String, password: String): returns (user: User)

    where username is not in Users

    then
        refuses NO_USERNAME_FOUND "This username does not have an account."

    where username is in Users and password does not match the associated password

    then
        refuses INCORRECT_PASSWORD "Incorrect password. Please try again."

    where username is in Users, password matches, and the confirmed boolean is false

    then
        refuses NOT_CONFIRMED "Your account is not confirmed. Please confirm."


    where username is in Users, password matches the one associated with the username, and the confirmed boolean is set to true

    then
        returns user
```

## Queries

```queries
```
