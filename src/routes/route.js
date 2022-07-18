const express = require("express");
const router = express.Router();

const {UrlShortner,GetUrl} = require("../controllers/UrlController");



router.post("/url/shorten",UrlShortner)
router.get("/:urlcode",GetUrl)


module.exports=router
