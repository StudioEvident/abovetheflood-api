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

    if (0 < Number(zoom) < 10) var zoomLevel = (-10+Number(zoom)).toString()
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
