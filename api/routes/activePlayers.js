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

    page.on('console', consoleObj => {
        if (consoleObj.text().startsWith("JSHandle@")) console.log(consoleObj._args[0]._remoteObject.preview.properties)
        else console.log(consoleObj.text())
    });

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

/**
 * @api {get} /activePlayers/:season? Request the 10 most actives players.
 * @apiName GetActivePlayers
 * @apiGroup PlayersStats
 * @apiVersion 0.2.0
 * 
 * @apiParam {Number{1-4}} [season] This parameter is used to select the season for the list of the 10 most actives players.
 * 
 * @apiSuccess {Object} data The data of the 10 mosts actives players (including the name and play time for each players).
 * @apiSuccess {Object} request The request object.
 * 
 * @apiSuccessExample Example data on success:
 * {
 *  "data": {
 *      "1": {
 *          "name": "K4k0u",
 *          "timePlayed": "388.52 heures"
 *      },
 *      "2": {
 *          "name": "leoncame54",
 *          "timePlayed": "369.69 heures"
 *      },
 *      "3": {
 *          "name": "Eemot",
 *          "timePlayed": "333.68 heures"
 *      },
 *      "4": {
 *          "name": "_Kartman",
 *          "timePlayed": "307.40 heures"
 *      },
 *      "5": {
 *          "name": "Spyff_",
 *          "timePlayed": "304.85 heures"
 *      },
 *      "6": {
 *          "name": "RagnaFu_Sama",
 *          "timePlayed": "295.83 heures"
 *      },
 *      "7": {
 *          "name": "Darknen",
 *          "timePlayed": "279.77 heures"
 *      },
 *      "8": {
 *          "name": "PierrePanda68",
 *          "timePlayed": "266.61 heures"
 *      },
 *      "9": {
 *          "name": "Oaristys",
 *          "timePlayed": "246.21 heures"
 *      },
 *      "10": {
 *          "name": "LGXpro",
 *          "timePlayed": "237.75 heures"
 *      }
 *  },
 *  "request": {
 *      "type": "GET",
 *      "url": "https://abovetheflood.fr/archives"
 *  }
 * }
 */