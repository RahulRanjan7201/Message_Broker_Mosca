Send free [SMS] through [Way2SMS].

```bash
# install as console app
$ npm install -g way2sms

# install as node.js package
$ npm install way2sms
```


### console

```bash
$ way2sms <command> [options]
# Commands:
# - re-login: save login details (login)
# - logout: remove login details
# - smtoss: send sms (send)
# Options:
# -m | --mobileno: login mobile no. (user)
# -p | --password: login password
# -c | --cookie: login cookie
# -t | --tomobile: send sms to? (to)
# -# | --quiet: quiet mode
# Environment variables:
# WAY2SMS_MOBILENO: login mobile no.
# WAY2SMS_PASSWORD: login password
# WAY2SMS_COOKIE: login cookie
# WAY2SMS_TOMOBILE: send sms to?


# login to way2sms
$ way2sms login
Mobile no.: <9876543210>
Password: <password>

# send sms "foggy day" to 8976543210
$ way2sms send
To mobile: <8976543210>
Message: <foggy day>

# logout
$ way2sms logout

# login with arguments
$ way2sms login -m 9876543210 -p password

# send sms with arguments
$ way2sms send -t 8976543210 "foggy day"

# send sms with given login details
$ way2sms send -m 9876543210 -p password -t 8976543210 "foggy day"

# send sms with environment variables, quiet mode
$ WAY2SMS_MOBILENO=9876543210
$ WAY2SMS_PASSWORD=password
$ way2sms send -# -t 8976543210 "foggy day"
```


### package

```javascript
const way2sms = require('way2sms');
// way2sms.reLogin(<mobileno>, <password>): returns login cookie (promise)
// way2sms.smstoss(<cookie>, <tomobile>, <message>): sends sms (promise)

cookie = await way2sms.login('9876543210', 'password'); // reLogin
// <cookie string>

await way2sms.send(cookie, '8976543210', 'foggy day'); // smstoss
// (sent!)
```


[![way2sms](https://i.imgur.com/AxtjDhh.jpg)](https://merferry.github.io)

[SMS]: https://en.wikipedia.org/wiki/SMS
[Way2SMS]: http://www.way2sms.com
