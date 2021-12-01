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
            const path = references.bestPlayers.path + `(${i})`;
            const name = document.querySelector(path + references.bestPlayers.name).innerHTML.slice(90)
            const nbAchievement = document.querySelector(path + references.bestPlayers.nbAchievements).innerHTML
            rawData[i] = {
                name: name,
                achievements: nbAchievement
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
 * @api {get} /bestPlayers/:season? Request the 10 best players.
 * @apiName GetBestPlayers
 * @apiGroup PlayersStats
 * @apiVersion 0.2.0
 * 
 * @apiParam {Number{1-4}} [season] This parameter is used to select the season for the list of the 10 best players.
 * 
 * @apiSuccess {Object} data The data of the 10 best players (including the name and the number of achievements for each players).
 * @apiSuccess {Object} request The request object.
 * 
 * @apiSuccessExample Example data on success:
 * {
 *  "data": {
 *      "1": {
 *          "name": "Atherosclerose",
 *          "achievements": "86"
 *      },
 *      "2": {
 *          "name": "Aquaponey__",
 *          "achievements": "86"
 *      },
 *      "3": {
 *          "name": "B0OOOCLAQUETTE",
 *          "achievements": "86"
 *      },
 *      "4": {
 *          "name": "PierrePanda68",
 *          "achievements": "86"
 *      },
 *      "5": {
 *          "name": "Racing_Man",
 *          "achievements": "85"
 *      },
 *      "6": {
 *          "name": "Oaristys",
 *          "achievements": "85"
 *      },
 *      "7": {
 *          "name": "Spyff_",
 *          "achievements": "85"
 *      },
 *      "8": {
 *          "name": "Tycklique",
 *          "achievements": "84"
 *      },
 *      "9": {
 *          "name": "_Procyon",
 *          "achievements": "82"
 *      },
 *      "10": {
 *          "name": "Kingart50",
 *          "achievements": "81"
 *      }
 *  },
 *  "request": {
 *      "type": "GET",
 *      "url": "https://abovetheflood.fr/archives"
 *  }
 * }
 */