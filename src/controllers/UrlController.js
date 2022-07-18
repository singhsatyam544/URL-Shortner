const urlModel = require("../model/urlModel");
const shortid = require("shortid");





//*------------------------------------------------ShortnerUrlCreation---------------------------------------------------------------------------------

const UrlShortner = async function (req, res) {
    try{
  const data = req.body;
  const Urldata = {};
  const baseUrl = "http://localhost:3000/";
  Urldata.longUrl = data.longUrl;
  if (
    !/^(http(s)?:\/\/)?(www.)?([a-zA-Z0-9])+([\-\.]{1}[a-zA-Z0-9]+)*\.[a-zA-Z]{2,5}(:[0-9]{1,5})?(\/[^\s]*)?$/.test(
      data.longUrl
    )
  ) {
    
    return res
      .status(400)
      .send({ statua: false, message: "please enter a valid URL" });
  }

  const checkLongUrl = await urlModel
    .findOne({ longUrl: data.longUrl })
    .select({ longUrl: 1, shortUrl: 1, urlCode: 1, _id: 0 });
  if (checkLongUrl) {
    return res
      .status(400)
      .send({
        status: false,
        message: "Url is already used",
        data: checkLongUrl,
      });
  }
  const urlgenerate = shortid.generate(data.longUrl);
  const shortUrl = baseUrl + urlgenerate;
  Urldata.urlCode = urlgenerate;
  Urldata.shortUrl = shortUrl;
  const urlshort = await urlModel.create(Urldata);
  let resdata = {
    longUrl: urlshort.longUrl,
    shortUrl: urlshort.shortUrl,
    urlCode: urlshort.urlCode,
  };
  res
    .status(201)
    .send({
      status: true,
      message: "url shortnered susscessfully ",
      data: resdata,
    });
}
catch(error){
    res.status(500).send({status:false,error:error.message})
}
}


//*------------------------------------------------GetUrl---------------------------------------------------------------------------------
const GetUrl = async function (req, res) {
    try{
  const paramCode = req.params.urlcode;
  const longCheck = await urlModel.findOne({ urlcode: paramCode });
  const resLogin = longCheck.longUrl;
  res.status(302).redirect(resLogin);
}
catch(error){
    res.status(500).sand({status:false,error:error.message})
}}

module.exports = { UrlShortner, GetUrl };
