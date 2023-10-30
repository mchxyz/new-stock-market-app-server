const User = require("../models/user");
const Stock = require("../models/stock");
const axios = require("axios");

//This function happens after the sign up when load the user information. Basically everytime we refresh the page is going to log this function.

const getUser = async (req, res) => {
  const foundUser = await User.findById(req.params.id);

  if (!foundUser) return res.status(404).json({ message: "User not found" });

  // e.g.: this is a list of strings, we're basically sending that whole list to mongodb and saying, give the list that you have that matches all this tickers.

  const tickers = foundUser.stocks.map((stock) => stock.ticker);

  // Here we have a query that includes a list of tickers and we're basically trying to find all the documents in our database that have a ticker amongst the list.

  const foundStocks = await Stock.find({ ticker: { $in: tickers } });

  // create an object to quickly reference a stock's price
  const priceMap = foundStocks.reduce(
    (acc, stock) => ({ ...acc, [stock.ticker]: stock.price }),
    {}
  );

  const stocks = foundUser.stocks.map((stock) => ({
    ticker: stock.ticker,
    price: priceMap[stock.ticker],
    amount: stock.amount,
  }));

  return res.json({ user: { username: foundUser.username, stocks } });
};

// This function gets called anytime the buyer sells a stock. And this handles creating stocks, operating stocks, and deleting stocks.
// Reading stocks is part of the get user routes. The stocks included are part of the users profile.

// This function is called whenever we buy ourselves a stock so the user and amount is passed down to this function.
//Wth is going to create, update, or delete it depends on the amount.

const updateUserStocks = async (req, res, next) => {
  const ticker = req.body.ticker;
  const amount = parseInt(req.body.amount);

  if (!ticker || !amount)
    res.status(400).json({ message: "missing ticker or amount" });

  const stock = await createOrUpdateStock(ticker);

  // check if user already has the stock in their list
  const foundUser = await User.findById(req.params.id);

  if (!foundUser) return res.status(404).json({ message: "user not found" });

  const foundUserStock = foundUser.stocks.find(
    (stock) => stock.ticker === ticker
  );

  // calculate how many stocks the user would have in total
  const newAmount = (foundUserStock?.amount || 0) + amount;

  if (newAmount < 0)
    return res
      .status(400)
      .json({ message: "invalid amount, user may not have negative stocks" });

  if (!foundUserStock) {
    // the user doesn't already have the stock in their list. Add stock to user list. That's what the "push operator" is used for, basically to add an element to a list.
    await User.findByIdAndUpdate(req.params.id, {
      $push: { stocks: { ticker, amount } },
    });
  } else if (newAmount === 0) {
    // the user already has the stock in their list and the new amount is 0, remove the stock from the user's list

    //The $pull operator. We used pull to remove an element from the list.

    await User.findByIdAndUpdate(req.params.id, {
      $pull: { stocks: { ticker } },
    });
  } else {
    // the user already has the stock in their list, update the stock's amount.
    foundUserStock.amount = newAmount;

    const stocks = foundUser.stocks.map((stock) => ({
      ticker: stock.ticker,
      amount: stock.amount,
    }));

    // $set replaces the entire list with another list. At the end, we're creating a query to place the entire list.

    await User.findByIdAndUpdate(req.params.id, { $set: { stocks } });
  }

  next();
  // return res.json({ ticker, amount: newAmount, price: stock.price });
};

// This is used to update the price of the stock any time we do a sort of operation adding stocks. FYI: It only updates the price the first time.

const createOrUpdateStock = async (ticker) => {
  const foundStock = await Stock.findOne({ ticker });

  const price = foundStock?.price || (await fetchStockPrice(ticker));

  return foundStock
    ? Stock.findOneAndUpdate({ ticker }, { price, lastUpdated: new Date() })
    : Stock.create({ ticker, price, lastUpdated: new Date() });
};

// This function would pull data from the AlphaVantage API.

const fetchStockPrice = async (ticker) => {
  const apiUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${ticker}&interval=5min&month=2023-10&outputsize=full&apikey=${process.env.ALPHA_VANTAGE_KEY}`;
  const response = await axios.get(apiUrl);
  return Object.values(Object.values(response.data)[1])[0]["1. open"];
};

module.exports = {
  getUser,
  updateUserStocks,
};
