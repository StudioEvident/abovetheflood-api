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

    //For Developpement only
    page.on('console', consoleObj => {
        if (consoleObj.text() === "JSHandle@object") console.log(consoleObj._args[0]._remoteObject.preview.properties)
        else console.log(consoleObj.text())
    });

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

 /**
 * @api {get} /player/:uuid/:season? Request player informations by UUID.
 * @apiName GetPlayer
 * @apiGroup Player
 * @apiVersion 0.1.0
 * 
 * @apiParam {String{36}} uuid The uuid of the player that you want statistics (The uuid with dashes is needed).
 * @apiParam {Number{1-4}} [season] This parameter is used to select the season for the player's stats.
 * 
 * @apiSuccess {String} seasonOfData The season that the data come from.
 * @apiSuccess {Object} player The player object.
 * @apiSuccess {Object} request The request object.
 * 
 * @apiError PlayerNotFound The UUID <code>uuid</code> has never played on this server.
 * @apiError PlayerNotPlayedSeason The player with the UUID <code>uuid</code> has never played during the season <code>season</code>.
 * 
 * @apiSuccessExample Example data on success:
 * {
 *  "seasonOfData": "4",
 *  "player": {
 *      "playerUUID": "4a6b9e0b-cbc9-4d31-a331-10abab84f5d9",
 *      "playerName": "TheMisterObvious",
 *      "stats": {
 *          "informations": {
 *              "firstConnection": "09 novembre 2019",
 *              "lastConnection": "15 octobre 2021",
 *              "playTime": "208.35 heures",
 *              "afkTime": "200.18 heures",
 *              "deaths": "65",
 *              "kills": "45",
 *              "mobKills": "2810",
 *              "bowShoots": "246",
 *              "animalsBreeded": "193"
 *          },
 *          "distancesTraveled": {
 *              "walk": "311.76 km",
 *              "sneak": "60.30 km",
 *              "sprint": "595.16 km",
 *              "swim": "55.03 km",
 *              "walkingOnTheWater": "22.50 km",
 *              "walkingUnderTheWater": "116.40 km",
 *              "climbing": "19.00 km",
 *              "falling": "48.03 km",
 *              "flying": "329.48 km",
 *              "boat": "58.14 km",
 *              "minecart": "604.05 m",
 *              "elytra": "4384.60 km",
 *              "horse": "35.34 m",
 *              "pig": "0 cm",
 *              "strider": "0 cm",
 *              "jumps": "174525"
 *          },
 *          "blocsMined": {
 *              "dirt": "2858",
 *              "grass": "1048",
 *              "sand": "8601",
 *              "gravel": "1383",
 *              "stone": "67587",
 *              "coalOre": "1006",
 *              "ironOre": "1662",
 *              "redstoneOre": "1230",
 *              "goldOre": "285",
 *              "lapisOre": "105",
 *              "diamondOre": "163",
 *              "emeraldOre": "0",
 *              "netherrack": "24754",
 *              "quartzOre": "582",
 *              "netherGoldOre": "285",
 *              "ancientDebris": "15"
 *          },
 *          "toolsUsed": {
 *              "wood": {
 *                  "Sword": "132",
 *                  "Pickaxe": "6",
 *                  "Axe": "50",
 *                  "Shovel": "0",
 *                  "Hoe": "0"
 *              },
 *              "stone": {
 *                  "Sword": "105",
 *                  "Pickaxe": "211",
 *                  "Axe": "15",
 *                  "Shovel": "0",
 *                  "Hoe": "0"
 *              },
 *              "iron": {
 *                  "Sword": "1033",
 *                  "Pickaxe": "1736",
 *                  "Axe": "1930",
 *                  "Shovel": "1000",
 *                  "Hoe": "242"
 *              },
 *              "gold": {
 *                  "Sword": "0",
 *                  "Pickaxe": "0",
 *                  "Axe": "0",
 *                  "Shovel": "0",
 *                  "Hoe": "0"
 *              },
 *              "diamond": {
 *                  "Sword": "2893",
 *                  "Pickaxe": "58614",
 *                  "Axe": "5727",
 *                  "Shovel": "11371",
 *                  "Hoe": "1252"
 *              },
 *              "netherite": {
 *                  "Sword": "3680",
 *                  "Pickaxe": "91872",
 *                  "Axe": "2333",
 *                  "Shovel": "3075",
 *                  "Hoe": "969"
 *              },
 *              "enchantedItems": "21",
 *              "tradesWithPnjs": "24818"
 *          },
 *          "monstersKilled": {
 *              "zombie": "285",
 *              "skeleton": "186",
 *              "spider": "82",
 *              "creeper": "117",
 *              "slime": "26",
 *              "piglin": "28",
 *              "zombifiedPiglin": "51",
 *              "hoglin": "8",
 *              "zombifiedHoglin": "0",
 *              "magmaCube": "162",
 *              "ghast": "53",
 *              "blaze": "219",
 *              "enderman": "383",
 *              "enderDragon": "0",
 *              "witherSkeleton": "196",
 *              "witherBoss": "46"
 *          },
 *          "achievements": "Succès débloqués (65/84)"
 *      }
 *  },
 *  "request": {
 *      "type": "GET",
 *      "url": "https://abovetheflood.fr/player/4a6b9e0b-cbc9-4d31-a331-10abab84f5d9/season-4"
 *  }
 * }
 */