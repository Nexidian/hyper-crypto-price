/**
 * Created by Nexidian on 18/02/2018.
 */
const electron = require('electron');
const app = (process.type === 'renderer') ? electron.remote.app : electron.app;
const color = require('color');
const Client = require('node-rest-client').Client;
const client = new Client();

let hyperCoin = {
    coinList: {},
};
let lastUpdated;
// Prevents rendering before our first API call
let render = false;
// Default refresh rate
let refreshRate = 5000;
const coinMarketCapEndpoint = 'https://api.coinmarketcap.com/v1/ticker/';

/**
 *
 * @param config
 * @returns {*}
 */
exports.decorateConfig = (config) => {
    const colorForeground = color(config.foregroundColor || '#fff');
    const colorBackground = color(config.backgroundColor || '#000');
    const colors = {
        foreground: colorForeground.string(),
        background: colorBackground.lighten(0.3).string()
    };

    const hyperCryptoPrice = Object.assign({
        footerTransparent: true,
    }, config.hyperCryptoPrice);

    return Object.assign({}, config, {
        css: `
            ${config.css || ''}
            .terms_terms {
                margin-bottom: 30px;
            }
            .footer_footer {
                display: flex;
                justify-content: space-between;
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                z-index: 100;
                font-size: 12px;
                height: 30px;
                background-color: ${colors.background};
                opacity: ${hyperCryptoPrice.footerTransparent ? '0.5' : '1'};
                cursor: default;
                -webkit-user-select: none;
                transition: opacity 250ms ease;
            }
            .footer_footer:hover {
                opacity: 1;
            }
            .footer_footer .footer_group {
                display: flex;
                color: ${colors.foreground};
                white-space: nowrap;
                margin: 0 14px;
            }
            .footer_footer .group_overflow {
                overflow: hidden;
            }
            .footer_footer .component_component {
                display: flex;
            }
            .footer_footer .component_item {
                position: relative;
                line-height: 30px;
            }
            .footer_footer .component_item:first-of-type {
                margin-left: 0;
            }
            .footer_footer .item_icon:before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                width: 14px;
                height: 100%;
                -webkit-mask-repeat: no-repeat;
                -webkit-mask-position: 0 center;
            }
            .footer_footer .item_number {
                font-size: 10.5px;
                font-weight: 500;
            }
            .coin-price {
                padding-left: 8px;
            }
            .up {
                color: green;
            }
            .down {
                color: red;
            }
            .percentage {
                padding-left: 8px;
            } 
            .divider {
                margin: 0 8px;
            }
            .notifications_view {
                bottom: 50px;
            }
        `
    });
};

/**
 *
 */
const checkPrice = () => {
    let config = app.config.getConfig().hyperCryptoPrice;

    for (let index in config.coins) {
        if (config.coins.hasOwnProperty(index)) {
            getCoinDetails(config.coins[index]);
        }
    }
};

/**
 * Perform the request to the coinmarketcap API
 * @param {string} name
 */
const getCoinDetails = (name) => {
    /**
     * @param {object[]} data
     * @param {string} data.price_usd
     * @param {string} data.percent_change_24h
     * @param {string} data.symbol
     */
    client.get(coinMarketCapEndpoint + name, function (data, response) {
        let statusCode = response.statusCode;
        if (statusCode === 200) {
            hyperCoin.coinList[name] = {
                price: data[0].price_usd,
                percentChange24h: data[0].percent_change_24h,
                name: data[0].name,
                symbol: data[0].symbol
            };
            render = true;
        } else {
            if (statusCode === 404) {
                console.log('The API could not find any info for coin "' + name + '" please check spelling and try again');
            }

            // Remove the coin from the config to prevent unnecessary API calls
            delete hyperCoin.coinList[name];
        }
    });
    lastUpdated = Date.now();
};

/**
 * Update the current coin config when the hyper.js config has changed
 */
const updateConfig = () => {
    let config = app.config.getConfig().hyperCryptoPrice.coins;

    for (let coinName in hyperCoin.coinList) {
        if (hyperCoin.coinList.hasOwnProperty(coinName)) {
            if (config.indexOf(coinName) === -1) {
                // Remove entry from the coin list if it is no longer in the hyper.js config array
                delete hyperCoin.coinList[coinName];
            }
        }
    }
};

/**
 * When this plugin loads we set up some defaults
 */
exports.onRendererWindow = () => {
    const config = app.config.getConfig().hyperCryptoPrice;

    if (config.hasOwnProperty('refreshRate')) {
        refreshRate = config['refreshRate'];
    }

    /** @param {object} config.coins   */
    for (let coinName in config.coins) {
        if (config.coins.hasOwnProperty(coinName)) {
            // Set some defaults
            let name = config.coins[coinName];
            hyperCoin.coinList[name] = {
                price: 0,
                percentChange24h: "0",
            };
        }
    }
};

exports.decorateHyper = (Hyper, {React}) => {
    return class extends React.PureComponent {
        constructor(props) {
            super(props);

            this.state = {
                hyperCoinInfo: hyperCoin,
                lastRender: lastUpdated
            };
        }

        render() {
            const {customChildren} = this.props;
            const existingChildren = customChildren ?
                customChildren instanceof Array ?
                    customChildren : [customChildren] : [];
            let elements = [];

            if (render) {
                let coinList = this.state.hyperCoinInfo.coinList;

                for (let coin in coinList) {
                    if (coinList.hasOwnProperty(coin)) {
                        let _this = hyperCoin.coinList[coin];
                        // Is this a positive or negative change?
                        let priceChangeDirection = (_this.percentChange24h.indexOf('-') > -1) ? 'down' : 'up';
                        elements.push(
                            React.createElement('div', {
                                    className: 'component_item item_icon item_clickable',
                                }, _this.symbol,
                                React.createElement('span',
                                    {className: 'coin-price '},
                                    '$' + _this.price),
                                React.createElement('span',
                                    {className: 'percentage ' + priceChangeDirection},
                                    _this.percentChange24h + '%'),
                                React.createElement('span',
                                    {className: 'divider'}, '|'))
                        )
                    }
                }
            }

            return (
                React.createElement(Hyper, Object.assign({}, this.props, {
                    customInnerChildren: existingChildren.concat(
                        React.createElement('footer', {className: 'footer_footer'},
                            React.createElement('div', {className: 'footer_group group_overflow'},
                                React.createElement('div', {className: 'component_component component_cwd'},
                                    elements
                                )
                            ),
                        ))
                }))
            );
        }

        componentDidMount() {
            this.interval = setInterval(() => {
                checkPrice();
                this.setState({
                    hyperCoinInfo: hyperCoin,
                    lastRender: lastUpdated
                });
            }, refreshRate);
        }

        componentWillUnmount() {
            clearInterval(this.interval);
        }
    };
};

exports.middleware = (store) => (next) => (action) => {
    switch (action.type) {
        case 'CONFIG_RELOAD':
            updateConfig();
            break;
    }

    next(action);
};