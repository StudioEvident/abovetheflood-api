const express = require("express");
const puppeteer = require("puppeteer");

const references = require("../references.json");

const router = express.Router();

router.get("/:uuidOrPlayer/:season?", async(req, res) => {
    const uuid = req.params.uuidOrPlayer;
    const season = req.params.season;
    
    if (season) var seasonForUrl = `/season-${season}`;
    else var seasonForUrl = "";

    const browser = await puppeteer.launch()
    const page = await browser.newPage()

    const url = `https://abovetheflood.fr/player/${uuid}${seasonForUrl}`;

    await page.goto(url);

    if (page.url() === "https://abovetheflood.fr/") { //Case where the player is not found and we got redirected on the main page.
        res.status(404).json({
            code: 404,
            message: "Player not found."
        })
    }

    const seasonOfDataRaw = await page.$x("/html/body/article[1]/p[1]/text()");
    const seasonOfData = await seasonOfDataRaw[1].evaluate(element => element.textContent.slice(8,9))
    
    if (season && seasonOfData !== season) { //Case where the player has never played during the requested season
        res.status(404).json({
            code: 404,
            message: "This player has not played during this season."
        })
    }

    const playerNameRaw = await page.$x("/html/body/article[1]/h2");
    const playerName = await playerNameRaw[0].evaluate(element => element.textContent)

    const data = await page.evaluate((rawData, refs, season) => {
        function extractData(object) {
            for (const [key, value] of Object.entries(object)) {
                if (typeof(value) === "object") extractData(value)
                else {
                    if (document.querySelector(value).innerHTML.startsWith("<span")) object[key] = document.querySelector(value + " > span").getAttribute("title")
                    else object[key] = document.querySelector(value).innerHTML
                }    
            }
            return object
        }
        rawData = extractData(refs.player[season])
        return rawData
    }, {}, references, seasonOfData)
    
    res.json({
        seasonOfData: seasonOfData,
        player: {
            playerUUID: uuid,
            playerName: playerName,
            stats: data
        },
        request: {
            type: "GET",
            url: url
        }
    })

    await browser.close();
})

 module.exports = router;
