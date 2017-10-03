## Clam City Messenger Communication Server

![](https://travis-ci.org/dharness/ccm-com.svg?branch=master)

### API

#### Login

Responds with a JWT if login is successful

``` javascript
/*
POST http://138.197.151.119/account.create
type=application/json
body:
*/
{
  "username": String,
  "password": String,
}
```


#### Signup

Responds with a JWT if login is successful

``` javascript
/*
POST http://138.197.151.119/account.login
type=application/json
body:
*/
{
  "username": String,
  "password": String,
}
```

#### Search

Responds with a list of accounts matching the search criteria

``` javascript
/*
POST http://138.197.151.119/accounts.search
type=application/json
body:
*/
{
  "username": String
}
```

### Messaging

ccm-com runs a websocket server which relays messages. To send a message you
only need the unique username of the recepient, and an authenticated socket connection.

To get establish an authenticated socket connection you will require a JWT. A JET can
be obtained by either logging in or signing up.

``` javascript
const options = {
  headers: {
    token: 'YOUR.JWT'
  }
};
const client = new WebSocket(SOCKET_URL, options);
client.send(JSON.stringify(messageToSend));

client.onmessage = event => {
  console.log(JSON.parse(event.data));
}
```

Messages can be anything you want, since the server simply relays the message.
It need only contain the `to` and `from` fields that represent genuine users. For example:

``` javascript
const messageToSend = {
  from: 'user1',
  to: 'user2',
  data: {
    type: 'text',
    body: 'simple text'
  }  
}

client.send(JSON.stringify(messageToSend));
```