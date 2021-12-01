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
