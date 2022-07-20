const urlModel = require("../model/urlModel");
const shortid = require("shortid");
const redis = require("redis");

const { promisify } = require("util");

//Connect to redis
const redisClient = redis.createClient(
  13190,
  "redis-13190.c301.ap-south-1-1.ec2.cloud.redislabs.com",
  { no_ready_check: true }
);
redisClient.auth("gkiOIPkytPI3ADi14jHMSWkZEo2J5TDG", function (err) {
  if (err) throw err;
});

redisClient.on("connect", async function () {
  console.log("Connected to Redis..");
});

//1. connect to the server
//2. use the commands :

//Connection setup for redis

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);

//*------------------------------------------------ShortnerUrlCreation---------------------------------------------------------------------------------


const UrlShortner = async function (req, res) {
  try {
    const data = req.body;
    const Urldata = {};
    const baseUrl = "http://localhost:3000";
    Urldata.longUrl = data.longUrl;
    if (typeof data.longUrl == "string") Urldata.longUrl = data.longUrl.trim();

    if (
      !/^(http(s)?:\/\/)?(www.)?([a-zA-Z0-9])+([\-\.]{1}[a-zA-Z0-9]+)*\.[a-zA-Z]{2,5}(:[0-9]{1,5})?(\/[^\s]*)?$/.test(
        Urldata.longUrl
      )
    ) {
      return res
        .status(400)
        .send({ statua: false, message: "please enter a valid URL" });
    }

    let cahcedProfileData = await GET_ASYNC(`${Urldata.longUrl}`);
    if (cahcedProfileData) {
      return res
        .status(400)
        .send({
          status: false,
          message: "url is already used",
          data: cahcedProfileData,
        });
    } else {
      const checkLongUrl = await urlModel
        .findOne({ longUrl: Urldata.longUrl })
        .select({ longUrl: 1, shortUrl: 1, urlCode: 1, _id: 0 });
      if (checkLongUrl) {
        return res.status(400).send({
          status: false,
          message: "Url is already used",
          data: checkLongUrl,
        });
      }
    }
    const urlgenerate = shortid.generate();
    const shortUrl = baseUrl + "/" + urlgenerate;
    Urldata.urlCode = urlgenerate;
    Urldata.shortUrl = shortUrl;
    const urlshort = await urlModel.create(Urldata);

    let resdata = {
      longUrl: urlshort.longUrl,
      shortUrl: urlshort.shortUrl,
      urlCode: urlshort.urlCode,
    };
    await SET_ASYNC(`${Urldata.longUrl}`, JSON.stringify(resdata));
    return res.status(201).send({
      status: true,
      message: "url shortnered susscessfully ",
      data: resdata,
    });
  } catch (error) {
    res.status(500).send({ status: false, error: error.message });
  }
};

//*------------------------------------------------GetUrl---------------------------------------------------------------------------------
//const fetchAuthorProfile = async function (req, res) {
//     let cahcedProfileData = await GET_ASYNC(`${req.params.authorId}`)
//     if(cahcedProfileData) {
//       res.send(cahcedProfileData)
//     } else {
//       let profile = await authorModel.findById(req.params.authorId);
//       await SET_ASYNC(`${req.params.authorId}`, JSON.stringify(profile))
//       res.send({ data: profile });
//     }

//   };

const GetUrl = async function (req, res) {
  try {
    const paramCode = req.params.urlcode;
    let cahcedProfileData = await GET_ASYNC(`${paramCode}`);
    if (cahcedProfileData) {
      return res.status(302).send(cahcedProfileData);
    } else {
      const longCheck = await urlModel.findOne({ urlCode: paramCode });
      await SET_ASYNC(`${paramCode}`, JSON.stringify(longCheck));

      if (!longCheck) {
        return res.status(404).send({
          status: false,
          message: "Url is invalid",
        });
      }
      const resLogin = longCheck.longUrl;
      return res.status(302).redirect(resLogin); // TA question
    }
  } catch (error) {
    res.status(500).send({ status: false, error: error.message });
  }
};

module.exports = { UrlShortner, GetUrl };
