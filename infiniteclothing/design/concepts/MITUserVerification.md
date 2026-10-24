# MITUserVerification

## Purpose

identify users; prevent one user from pretending to be another; only permit account creation if the user is a member of the MIT community

## Principle

after a user registers with a username, password, and MIT email, their account is immediately active. they can authenticate with that same username and password and be treated each time as the same user. automatically sets the account to confirmed.

## Types

```types
Confirmation is UNCONFIRMED or CONFIRMED
    whether the account is active
```

## State

```state
a set of Users with
    a unique username String
    a password String
    a unique email String
    a confirmation Confirmation
```

## Actions

```actions
register(username: String, email: String, password: String): returns (user: User)

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
        mark the account as CONFIRMED
        returns user


authenticate(username: String, password: String): returns (user: User)

    where username is not in Users

    then
        refuses NO_USERNAME_FOUND "This username does not have an account."

    where username is in Users and password does not match the associated password

    then
        refuses INCORRECT_PASSWORD "Incorrect password. Please try again."

    where username is in Users and password matches the one associated with the username

    then
        returns user
```

## Queries

```queries
```
