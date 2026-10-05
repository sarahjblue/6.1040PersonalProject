# Concept Design of Infinite Clothing


## Password Authenticating

<strong> concept </strong> PasswordAuthenticating

<strong> purpose </strong> identify users; prevent one user from pretending to be another

<strong> principle </strong> after a user registers with a username and a password, they can authenticate with that same username and password and be treated each time as the same user

<strong> state </strong>: a set of Users with a username String and a password String

### Where/Then specs

register(username: String, password: String): return (user: User)

&nbsp;&nbsp; <strong> where </strong> the username is a unique, unused String

&nbsp;&nbsp; <strong> then </strong> create a new User with the username and password

authenticate(username: String, password: String): return (user: User)

&nbsp;&nbsp; <strong> where </strong> username matches a User within the set and the password matches the one associated with the username

&nbsp;&nbsp; <strong> then </strong> give the user access to their account

### Invariant

Each username must be unique. This is preserved by checking that a new username is unique before registering a new User for the given username.

### Adding Registration

register(username: String, password: String): return (user: User, token: String)

&nbsp;&nbsp; <strong> where </strong> the username is a unique, unused String

&nbsp;&nbsp; <strong> then </strong> create a new User with the username and password and emails the user a token. Mark the user as unconfirmed.


confirm(token: String): return (user: User)

&nbsp;&nbsp; <strong> where </strong> token is a unique, secret String and the token matches that of user

&nbsp;&nbsp; <strong> then </strong> give the user access to their account, remove the token from user, and mark the user as confirmed.

&nbsp;&nbsp; <strong> else </strong> the token does not match, and the user is notified that their token was not valid

<strong> state: </strong>
a set of Users with a username String, a password String, a token String, where the token String is either a string or undefined, and a confirmed boolean representing whether or not the account has been confirmed
