const express = require("express");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");

const app = express();

const playerRoute = require("./api/routes/player.js")
const bestPlayersRoute = require("./api/routes/bestPlayers.js");
const activePlayersRoute = require("./api/routes/activePlayers.js");
const statisticsRoute = require("./api/routes/statistics.js");
const mapRoute = require("./api/routes/map.js");

app.use(morgan("dev"));

const limiter = rateLimit({
    windowMs: 3 * 1000,
    max: 1,
    message: "Too many requests come from this ip, try again after a moment."
});
app.use(limiter);

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*")
    res.header("Access-Control-Allow-Headers", "Origin, X-Atmosphere-tracking-id, X-Atmosphere-Framework, X-Cache-Date, Content-Type, X-Atmosphere-Transport, *")
    if (req.method === "OPTIONS") {
        res.header("Access-Control-Allow-Methods", "GET") 
        return res.status(200).json({})
    }
    next()
})

app.use("/player", playerRoute)
app.use("/bestPlayers", bestPlayersRoute);
app.use("/activePlayers", activePlayersRoute);
app.use("/statistics", statisticsRoute);
app.use("/map", mapRoute)

app.use((req, res, next) => {
    const error = new Error("Not Found");
    error.status = 404;
    next(error)
})

app.use((error, req, res, next) => {
    res.status(error.status || 500)
    res.json({
        code: error.status || 500,
        message: error.message
    })
})

module.exports = app;
