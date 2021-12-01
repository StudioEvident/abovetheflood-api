const express = require("express");
const puppeteer = require("puppeteer");
const noelshack = require("noelshack");
const fs = require('fs');

const references = require("../references.json");
var number = 0;

const router = express.Router();

router.get("/:x/:y/:zoom?", async(req, res) => {
    const x = req.params.x
    const y = req.params.y
    const zoom = req.params.zoom

    if (zoom === "0") var zoomLevel = "min"
    else if (0 < Number(zoom) < 10) var zoomLevel = (-10+Number(zoom)).toString()
    else if (zoom === "10") var zoomLevel = "max"
    else var zoomLevel = "min"

    const browser = await puppeteer.launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    })
    const page = await browser.newPage()

    const url = `https://map.abovetheflood.fr/#/${x}/64/${y}/${zoomLevel}/survival/survival`;

    await page.goto(url);

    function delay(time) {
        return new Promise(function(resolve) { 
            setTimeout(resolve, time)
        });
    }

    await delay(10000)

    await page.screenshot({path: `./data/img${number}.png`})

    const imgurl = await noelshack.uploadFromFs(`./data/img${number}.png`)

    try {
        fs.unlinkSync(`./data/img${number}.png`)
    } catch {
        number+1;
    }

    res.status(200).json({
        imageLink: imgurl.direct,
        request: {
            type: "GET",
            url: url
        }
    })

    await browser.close();
})

module.exports = router;

/**
 * @api {get} /map/:x/:y/:zoom? Request an image from the map.
 * @apiName MapScreenshot
 * @apiGroup GetMapImage
 * @apiVersion 0.4.0
 * 
 * @apiParam {Number{-5000-5000}} x The x coordinate for the screenshot.
 * @apiParam {Number{-5000-5000}} y The y coordinate for the screenshot.
 * @apiParam {Number{0-10}} [zoom] The zoom level for the screenshot.
 * 
 * @apiSuccess {String} imageLink The url of the screenshot.
 * @apiSuccess {Object} request The request object.
 * 
 * @apiSuccessExample Example data on success: 
 * {
 *  "imageLink": "https://image.noelshack.com/fichiers/2021/45/2/1636483520-img0.png",
 *  "request": {
 *      "type": "GET",
 *      "url": "https://map.abovetheflood.fr/#/-2000/64/2000/-3/survival/survival"
 * }
 */
