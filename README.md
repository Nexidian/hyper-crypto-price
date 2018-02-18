# hyper-crypto-price

> Crypto Price Plugin for [Hyper](https://hyper.is). Shows a configurable list of crypto coin prices.

> This idea was based of [hyper-statusline](https://github.com/henrikdahl/hyper-statusline/) plugin created by [henrikdahl](https://github.com/henrikdahl)

![hyper-crypto-coin](https://imgur.com/vdWZ7bb)


## Install

Add the following to your `~/.hyper.js` config.

```javascript
module.exports = {
  // other configs
  
  ...
  plugins: ['hyper-crypto-price'],
  ...
}
```

## Config

To control which coins are displayed you will need to enter the full coin name and not just the ticker.
This can be done by providing a list of coin names to the config file like so:

Add the following to your `~/hyper.js` config.

```javascript
module.exports = {
  config: {
    ...
      hyperCryptoPrice: {
            'coins': ['bitcoin', 'iota', 'neo'],
            'refreshRate': 5000
      }
    ...
  }
}
```