const express = require("express");
const puppeteer = require("puppeteer");

const references = require("../references.json");

const router = express.Router();

router.get("/:stat?", async(req, res) => {
    const stat = req.params.stat;
    if (stat && !["playersPerDay","playersMaxPerDay","newPlayersPerDay","!playersPerDay","!playersMaxPerDay","!newPlayersPerDay"].includes(stat)) stat = undefined;

    const browser = await puppeteer.launch()
    const page = await browser.newPage()

    const url = `https://abovetheflood.fr/archives`;

    page.on('console', consoleObj => {
        if (consoleObj.text().startsWith("JSHandle@")) console.log(consoleObj._args[0]._remoteObject.preview.properties)
        else console.log(consoleObj.text())
    });

    await page.goto(url);

    const data = await page.evaluate((rawData, references, stat) => {
        Array.prototype.insert = function ( index, item ) {
            this.splice( index, 0, item );
        };

        rawData["stats"] = {}

        var PPDdataToExtract = document.querySelector("body > article:nth-child(5) > script:nth-child(4)").innerHTML
        var PMPDdataToExtract = document.querySelector("body > article:nth-child(5) > script:nth-child(7)").innerHTML
        var NPPDdataToExtract = document.querySelector("body > article:nth-child(5) > script:nth-child(10)").innerHTML

        if (stat && ["playersPerDay","!playersMaxPerDay","!newPlayersPerDay"].includes(stat)) for (const toReplace of references.statistics.toReplace.playersPerDay) PPDdataToExtract = PPDdataToExtract.replace(toReplace[0], toReplace[1])
        if (stat && ["playersMaxPerDay","!playersPerDay","!newPlayersPerDay"].includes(stat)) for (const toReplace of references.statistics.toReplace.playersMaxPerDay) PMPDdataToExtract = PMPDdataToExtract.replace(toReplace[0], toReplace[1])
        if (stat && ["newPlayersPerDay","!playersPerDay","!playersMaxPerDay"].includes(stat)) for (const toReplace of references.statistics.toReplace.newPlayersPerDay) NPPDdataToExtract = NPPDdataToExtract.replace(toReplace[0], toReplace[1])

        const PPDdataSplited = PPDdataToExtract.replace(/[\[\]"]/g, "").split("|")
        const PMPDdataSplited = PMPDdataToExtract.replace(/[\[\]"]/g, "").split("|")
        const NPPDdataSplited = NPPDdataToExtract.replace(/[\[\]"]/g, "").split("|")

        var dataKeys = [];
        if (stat && ["playersPerDay","!playersMaxPerDay","!newPlayersPerDay"].includes(stat)) dataKeys = dataKeys.concat(PPDdataSplited[0].split(","))
        if (stat && ["playersMaxPerDay","!playersPerDay","!newPlayersPerDay"].includes(stat)) dataKeys = dataKeys.concat(PMPDdataSplited[0].split(","))
        if (stat && ["newPlayersPerDay","!playersPerDay","!playersMaxPerDay"].includes(stat)) for (const value of NPPDdataSplited[0].split(",").reverse()) dataKeys.insert(0, value)

        for (const dataKey of dataKeys) {
            rawData["stats"][dataKey] = {}
            if (stat && ["playersPerDay","!playersMaxPerDay","!newPlayersPerDay"].includes(stat)) rawData["stats"][dataKey]["playersPerDay"] = PPDdataSplited[1].split(",")[PPDdataSplited[0].split(",").indexOf(dataKey)]
            if (stat && ["playersMaxPerDay","!playersPerDay","!newPlayersPerDay"].includes(stat)) rawData["stats"][dataKey]["playersMaxPerDay"] = PMPDdataSplited[1].split(",")[PMPDdataSplited[0].split(",").indexOf(dataKey)]
            if (stat && ["newPlayersPerDay","!playersPerDay","!playersMaxPerDay"].includes(stat)) rawData["stats"][dataKey]["newPlayersPerDay"] = NPPDdataSplited[1].split(",")[NPPDdataSplited[0].split(",").indexOf(dataKey)]
        }

        return rawData
    }, {}, references, stat)

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
 * @api {get} /statistics/:stat? Request the server's stats
 * @apiName GetStats
 * @apiGroup Statistics
 * @apiVersion 0.3.0
 * 
 * @apiParam {String="playersPerDay","playersMaxPerDay","newPlayersPerDay","!playersPerDay","!playersMaxPerDay","!newPlayersPerDay"} [stat] This parameter is a filter for only getting 1 specific stat (or don't get it by inserting a "!" in front of the stat name).
 * 
 * @apiSuccess {Object} stats The stats object wich contain objects corresponding to a date and with stats in it.
 * @apiSuccess {Object} request The request object.
 * 
 * @apiSuccessExample Example data on success:
 * {
 *  "stats": {
 *      "2021-10-07": {
 *          "playersPerDay": "29",
 *          "playersMaxPerDay": "9",
 *          "newPlayersPerDay": "1"
 *      },
 *      "2021-10-08": {
 *          "playersPerDay": "22",
 *          "playersMaxPerDay": "6",
 *          "newPlayersPerDay": "1"
 *      },
 *      "2021-10-09": {
 *          "playersPerDay": "44",
 *          "playersMaxPerDay": "9",
 *          "newPlayersPerDay": "2"
 *      },
 *      "2021-10-10": {
 *          "playersPerDay": "29",
 *          "playersMaxPerDay": "8"
 *      },
 *      "2021-10-11": {
 *          "playersPerDay": "21",
 *          "playersMaxPerDay": "5",
 *          "newPlayersPerDay": "2"
 *      },
 *      "2021-10-12": {
 *          "playersPerDay": "25",
 *          "playersMaxPerDay": "6",
 *          "newPlayersPerDay": "8"
 *      },
 *      "2021-10-13": {
 *          "playersPerDay": "22",
 *          "playersMaxPerDay": "6",
 *          "newPlayersPerDay": "1"
 *      },
 *      "2021-10-14": {
 *          "playersPerDay": "23",
 *          "playersMaxPerDay": "9",
 *          "newPlayersPerDay": "2"
 *      },
 *      "2021-10-15": {
 *          "playersPerDay": "27",
 *          "playersMaxPerDay": "6",
 *          "newPlayersPerDay": "1"
 *      },
 *      "2021-10-16": {
 *          "playersPerDay": "37",
 *          "playersMaxPerDay": "6"
 *      },
 *      "2021-10-17": {
 *          "playersPerDay": "46",
 *          "playersMaxPerDay": "13",
 *          "newPlayersPerDay": "2"
 *      },
 *      "2021-10-18": {
 *          "playersPerDay": "27",
 *          "playersMaxPerDay": "9",
 *          "newPlayersPerDay": "2"
 *      },
 *      "2021-10-19": {
 *          "playersPerDay": "28",
 *          "playersMaxPerDay": "11",
 *          "newPlayersPerDay": "2"
 *      },
 *      "2021-10-20": {
 *          "playersPerDay": "27",
 *          "playersMaxPerDay": "8"
 *     },
 *     "2021-10-21": {
 *          "playersPerDay": "29",
 *          "playersMaxPerDay": "8",
 *          "newPlayersPerDay": "3"
 *      },
 *      "2021-10-22": {
 *          "playersPerDay": "32",
 *          "playersMaxPerDay": "11",
 *          "newPlayersPerDay": "2"
 *      },
 *      "2021-10-23": {
 *          "playersPerDay": "49",
 *          "playersMaxPerDay": "10",
 *          "newPlayersPerDay": "8"
 *      },
 *      "2021-10-24": {
 *          "playersPerDay": "39",
 *          "playersMaxPerDay": "10",
 *          "newPlayersPerDay": "3"
 *      },
 *      "2021-10-25": {
 *          "playersPerDay": "38",
 *          "playersMaxPerDay": "8",
 *          "newPlayersPerDay": "2"
 *      },
 *      "2021-10-26": {
 *          "playersPerDay": "39",
 *          "playersMaxPerDay": "12",
 *          "newPlayersPerDay": "4"
 *      },
 *      "2021-10-27": {
 *          "playersPerDay": "34",
 *          "playersMaxPerDay": "8",
 *          "newPlayersPerDay": "4"
 *      },
 *      "2021-10-28": {
 *          "playersPerDay": "45",
 *          "playersMaxPerDay": "11",
 *          "newPlayersPerDay": "4"
 *      },
 *      "2021-10-29": {
 *          "playersPerDay": "31",
 *          "playersMaxPerDay": "6",
 *          "newPlayersPerDay": "1"
 *      },
 *      "2021-10-30": {
 *          "playersPerDay": "35",
 *          "playersMaxPerDay": "6",
 *          "newPlayersPerDay": "1"
 *      },
 *      "2021-10-31": {
 *          "playersPerDay": "29",
 *          "playersMaxPerDay": "10",
 *          "newPlayersPerDay": "1"
 *      },
 *      "2021-11-01": {
 *          "playersPerDay": "41",
 *          "playersMaxPerDay": "9",
 *          "newPlayersPerDay": "5"
 *      },
 *      "2021-11-02": {
 *          "playersPerDay": "30",
 *          "playersMaxPerDay": "10",
 *          "newPlayersPerDay": "2"
 *      },
 *      "2021-11-03": {
 *          "playersPerDay": "38",
 *          "playersMaxPerDay": "10",
 *          "newPlayersPerDay": "4"
 *      },
 *      "2021-11-04": {
 *          "playersPerDay": "41",
 *          "playersMaxPerDay": "9",
 *          "newPlayersPerDay": "2"
 *      },
 *      "2021-11-05": {
 *          "playersPerDay": "8",
 *          "playersMaxPerDay": "10"
 *      }
 *  },
 *  "request": {
 *      "type": "GET",
 *      "url": "https://abovetheflood.fr/archives"
 *  }
 * }
 */