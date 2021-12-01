const express = require("express");
const puppeteer = require("puppeteer");

const references = require("../references.json");

const router = express.Router();

router.get("/:season?", async(req, res) => {
    const season = req.params.season;
    
    if (season) var seasonForUrl = `/season-${season}`;
    else var seasonForUrl = "";

    const browser = await puppeteer.launch()
    const page = await browser.newPage()

    const url = `https://abovetheflood.fr/archives${seasonForUrl}`;

    await page.goto(url);

    const data = await page.evaluate((rawData) => {
        for (let i=1;i<=10;i++) {
            const path = references.activePlayers.path + `(${i})`;
            const name = document.querySelector(path + references.activePlayers.name).innerHTML.slice(90)
            const timeplayed = document.querySelector(path + references.activePlayers.timePlayed).innerHTML
            rawData[i] = {
                name: name,
                timePlayed: timeplayed
            }
        }
        return rawData;
    }, {})

    res.status(200).json({
        data: data,
        request: {
            type: "GET",
            url: url
        }
    })

    await browser.close();
})

module.exports = router;
