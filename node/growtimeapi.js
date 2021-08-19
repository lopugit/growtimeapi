global.env = require("minimist")(process.argv.slice(2))
console.log("Starting GrowTime API")
console.log("args: ", global.env)

// catches all uncaught errors so process never dies
process.on("uncaughtException", function (err) {
  console.log("Caught exception: ", err)
})

let Express = require("express")
let cors = require("cors")
let compression = require("compression")
let express = Express()
let fs = require("fs")
let path = require("path")
let bodyParser = require("body-parser")
let url = require("url")
let nodemailer = require("nodemailer")
let pug = require("pug")
let http = require("http").Server(express)
let beautify = require("json-beautify")
let beautifyhtml = require("json-pretty-html").default
let session = require("express-session")
let bcrypt = require("bcryptjs")
let moment = require("moment")
let RedisStore = require("connect-redis")(session)
let conf = require("./conf/conf.js")
let secrets = require("secrets")
global.secrets = secrets
let jsmart = require("circular-json")
let smarts = require("smarts")({ node: true })
let uuid = require("uuid/v4")
let faker = require("faker")
let authing = require("authing")
let admin = require("firebase-admin")
let { OAuth2Client } = require("google-auth-library")
let textdb = require(__dirname + "/db/db.json")
let schemas = require("philosophy")({ secrets })
let unconscious = require("unconscious")
let sentience = require("sentience")
let functions = require("functions")

/** Logging */
setInterval(() => {
  console.log("Still alive and listening on http://localhost:" + conf.port)
  console.log("Arguments were: ", global.env)
}, 5000)

/** MongoDB Clients */
let uri = functions["uri.js"](secrets.monk)
/** mongodb */
let { MongoClient } = require("mongodb")
console.log("Connecting via mongodb to " + uri)
let mongodb = new MongoClient(uri)
/** monk */
console.log("Connecting via monk to " + uri)
let monk = require("monk")(uri)
/** mongoose */
let mongoose = require("mongoose")
mongoose.Promise = require("bluebird")
console.log("Connecting via mongoose to " + functions["uri.js"](secrets.node214))
let mdb = {
  mongoose,
  connection: mongoose.createConnection(functions["uri.js"](secrets.node214), {
    useNewUrlParser: true,
  }),
  uri: functions["uri.js"](secrets.node214),
  metaSchemaToMongoose: functions["metaSchemaToMongoose.js"],
  schemas: {
    thingosphere: schemas,
    mongoose: [],
  },
  models: {
    mongoose: [],
  },
}

if (mdb.schemas.thingosphere) {
  let keys = Object.keys(mdb.schemas.thingosphere)

  keys.forEach((key) => {
    mdb.metaSchemaToMongoose({ schema: mdb.schemas.thingosphere[key], mdb })
  })
}

/** CREATE LOGS OBJECT */
const logs = {}
/** FIREBASE CONF */
var serviceAccount = secrets.firebase
var growtimegclient = new OAuth2Client(secrets.google.CLIENT_ID)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: secrets.google.firebaseUrl,
  })
}
var db = admin.firestore()
/** EXPRESS CONFIG */
/** COMPRESSION */
//express.use('*', cors())
//express.options('*', function (req,res) { res.sendStatus(200) })
express.use(compression())
/** BODY PARSER CONFIG */
///// SET BODY PARSER CONFIG
express.use(
  bodyParser.urlencoded({
    extended: false,
  })
)
express.use(bodyParser.json())
/** SET SESSION CONFIG */
express.use(
  session({
    name: "growtimeapi.sid",
    secret: secrets.sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: new RedisStore({
      host: "localhost",
      port: 6379,
      ttl: 260,
    }),
  })
)
/** Enable CORS on HTTP */
express.use((req, res, next) => {
  res.setHeader("X-Frame-Options", "ALLOWALL")
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Origin"
  )
  //    				res.status(200)
  next()
})

/** PUG CONF */
//// SET VIEW ENGINE PUG/JADE
express.set("view engine", "pug")
//// Allows use of /snippets and absolute paths in jade includes
express.locals.basedir = path.join(__dirname, "views")
// let dbNode = mongoose.createConnection("mongodb://localhost:27017/node214")
////////// LOAD MODELS
// let postModel = require('./models/nodes/post.js')
realmModel = require("./models/nodes/realm.js")
thingModel = require("./models/nodes/thing.js")
navModel = require("./models/nodes/nav.js")
entityModel = require("./models/nodes/entity.js")

/** HTTP SERVER INIT */
http.listen(conf.port, () => {
  console.error("%s running on port %s", conf.siteTitle, conf.port)
})

/** EXPRESS API */
/** ALIVE CHECK */
express.get("/", (req, res) => {
  res.send("GrowTime API is alive!")
})
/** POSTS GETTER
 * Takes the following @param's
 * @param count is the number of posts you want
 * @param realm is the realm you want the posts from
 * @param @var [ @var realms ] is a list of realms you want the posts from
 * @param sort is the value by which you want to sort
 * eg. alphabetical, date are currently supported
 * @param sortDirection is the direction/pattern you want to sort in (if undefined it will always be descending)
 * eg. ascending, descending are currently supported
 * @param includeComments is a boolean which defines whether you want to include comment data with the posts
 * @param commentSort is the value by which you want to sort Comments
 * eg. alphabetical, date are currently supported
 * @param commentSortDirection is the direction/pattern you want to sort comments in (if undefined it will always be descending)
 * eg. ascending, descending are currently supported
 */
express.post("/api/posts", (req, res) => {
  if (!req.query.count) {
    res.send("you need to provide a count for how many posts you want")
  }
})
/** JSON TO EMAIL
 * Accepts some arbitrary json data and sends it to the specific email
 * @param @var req.body.json is the json data to be sent
 * @param @var req.body.email is the email the json data is sent to
 */
express.post("/api/email/json", (req, res) => {
  console.log("req.body", req.body)
  var mailOpts, smtpTrans
  if (!req.body.email) req.body.email = "contact@growtime.com.au"
  if (!req.body.from) req.body.from = "contact@growtime.com.au"
  if (req.body.json) {
    //Setup Nodemailer transport, I chose gmail. Create an routerlication-specific password to avoid problems.
    console.log("[growtimeapi][api][email][json][createTransport] Creating transport using service Gmail, username", secrets.email.email, "password", secrets.email.password)
    smtpTrans = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        // xoauth2: xoauth2.createXOAuth2Generator({
        user: secrets.email.email,
        pass: secrets.email.password,
        // })
      },
    })
    //Mail options
    mailOpts = {
      from: req.body.from,
      to: req.body.email,
      subject: "JSON email API",
      text: beautify(req.body.json, null, 2, 80),
    }
    let whitelist = [
      "@lopudesigns.com",
      "@growtime.com",
      "@lopu.com.au",
      "@growlights.com.au",
      "@growtime.com.au",
      "@planetexpress.global",
    ]
    let allowed = false
    whitelist.forEach((domain) => {
      if (!allowed) {
        allowed = mailOpts.to.length - mailOpts.to.indexOf(domain) == domain.length
      }
    })

    if (!allowed) {
      let error = {
        erorr: "Email is not in the email whitelist",
      }
      console.error("Error when trying to send email", error)
      res.status(500).json(error)
    } else {
      smtpTrans.sendMail(mailOpts, (error, response) => {
        if (error) {
          console.error("Error when trying to send email", error)
          res.status(500).json(error)
        } else {
          res.sendStatus(200)
        }
      })
    }
  }
})

/** USERNAME AVAILABILITY */
express.post("/usernamecheck", (req, res) => {
  if (req.body.username !== undefined) {
    var things = db.collection(
      `${smarts.getsmart(global, "env.level", "dev")}/things/users`
    )
    things = things.where("growtime.username", "==", req.body.username)

    things
      .get()
      .then((query) => {
        if (query.size) {
          res.json({
            success: true,
            taken: true,
          })
        } else {
          res.json({
            success: true,
            taken: false,
          })
        }
      })
      .catch((err) => {
        console.error(
          `something went wrong looking up if an entity with username ${req.body.username} exists: `,
          err
        )
        res.json({
          success: false,
          error: err,
        })
      })
  } else {
    res.json({
      success: false,
      error: {
        message: "You didn't supply a username to check",
        err: "You didn't supply a username to check",
      },
    })
  }
})
/** AUTH */
express.post("/auth", (req, res) => {
  if (req.body.provider || req.body.token || req.body.entity) {
    authing
      .auto(req.body)
      .then((args) => {
        if (args.success) {
          authing
            .manifestSessionedEntity(args)
            .then((args) => {
              if (args.success) {
                res.json(args)
              } else {
                console.error(
                  "A session was not able to be created for the entity"
                )
                res.json({
                  success: false,
                  error: "A session was not able to be created for the entity",
                })
              }
            })
            .catch((err) => {
              console.error(
                "A session was not able to be created for the entity: ",
                err
              )
              res.json({
                success: false,
                error: [
                  "A session was not able to be created for the entity",
                  err,
                ],
              })
            })
        } else {
          console.error("The entity could not be authenticated")
          res.json({
            success: false,
            error: "The entity could not be authenticated",
          })
        }
      })
      .catch((err) => {
        console.error("An error occured handling the provider ", err)
        res.send(
          jsmart.stringify({
            success: false,
            error: [
              "You did not supply the right parameters for this api to work properly, please try again.",
              err,
            ],
          })
        )
      })
  } else {
    console.error(
      "something went wrong running the api endpoint, contex: ",
      req
    )
    res.send(
      jsmart.stringify({
        success: false,
        error:
          "You did not supply the right parameters for this api to work properly, please try again.",
      })
    )
  }
})
/** BOT MANAGEMENT */
express.post("/botcheckin", (req, res) => {
  if (
    req.body.key == "woowoo" &&
    req.body.ip &&
    req.body.id &&
    req.body.ip.length &&
    req.body.ip.length < 25
  ) {
    if (!textdb.nodes) {
      textdb.nodes = {}
    }
    if (!textdb.nodes[req.body.id]) {
      console.log(textdb)
      console.log("doing")
      textdb.nodes[req.body.id] = {
        // id: req.body.id,
        ips: {},
      }
    }
    if (!textdb.nodes[req.body.id].ips[req.body.ip]) {
      textdb.nodes[req.body.id].ips[req.body.ip] = {
        note: req.body.note,
        checkinTime: Date.now(),
      }
    } else {
      textdb.nodes[req.body.id].ips[req.body.ip].checkinTime = Date.now()
    }
    // var theseips = textdb.nodes[req.body.id].ips
    // if(theseips.length > 10){
    // 	theseips = theseips.slice(theseips.length - 10, theseips.length)
    // 	textdb.nodes[req.body.id].ips = theseips
    // }
    fs.writeFile(
      __dirname + "/db/db.json",
      beautify(textdb, null, 2, 40),
      (err, done) => {
        if (!err) {
          res.status(200)
          res.send("success")
        } else {
          res.status(500)
          res.send("failure")
        }
      }
    )
  }
})
express.get("/bots", (req, res) => {
  console.log(textdb.dimensions)
  res.send(beautifyhtml(textdb, textdb.dimensions))
})
/** PROXY MANAGER */
express.get("/proxy:num(d{3})", (req, res) => {
  console.log(req.params)
  res.send(req.params.num)
})
/** Mongoose Open Querying */
express.post("/mongodb/query", async (req, res) => {
  if (req.body.query && req.body.model) {
    let model = mdb.models.mongoose[req.body.model]
    if (model) {
      let data = await model.find(req.body.query).exec()
      res.send(data)
    }
  } else {
    if (!req.body.query && !req.body.model) {
      res.status(500).send({ error: `You didn't supply a query or model` })
    } else if (!req.body.query) {
      res.status(500).send({ error: `You didn't supply a query` })
    } else if (!req.body.model) {
      res.status(500).send({ error: `You didn't supply a model` })
    }
  }
})
/** MongoDB Open Querying */
mongodb.connect().then((a, b) => {
  express.post("/mongodb/get", async (req, res) => {
    try {
      let requestId = uuid()
      console.log("Running a mongodb get query, requestId: " + requestId)
      if (req.body.query && req.body.model) {
        let datastop
        let query
        if (req.body.query.hasOwnProperty("searchify")) {
          // search engine
          query = functions["quozza.js"](req.body.query.searchify, req.body.options.index || 'Grow Time Products', req.body.query.paths || ["title"])
          let fullQuery = [
            query,
            {
              $skip: req.body.options.$skip || 0
            },
            {
              $limit: req.body.options.$limit || 12
            }
          ]
          console.log("Running a searchify query, requestId: ", requestId, "query", JSON.stringify(fullQuery, null, 2))
          data = await mongodb.db("growtime").collection(req.body.model).aggregate(fullQuery).toArray()
        } else if (req.body.query.hasOwnProperty("$search")) {
          data = await mongodb.db("growtime").collection(req.body.model).aggregate([req.body.query, req.body.options]).toArray()
        } else {
          data = await mongodb.db("growtime").collection(req.body.model).find(req.body.query).toArray()
        }
        console.log(`returning ${data ? data.length : 0} results, requestId: ${requestId}`)
        res.send(data)
      } else {
        throw "Incorrect params"
      }
    } catch (err) {
      if (err == "Incorrect params") {
        if (!req.body.query && !req.body.model) {
          let errJson = { error: `You didn't supply a query or model` }
          console.error("Error: ", errJson)
          res.status(500).send(errJson)
        } else if (!req.body.query) {
          let errJson = { error: `You didn't supply a query` }
          console.error("Error: ", errJson)
          res.status(500).send(errJson)
        } else if (!req.body.model) {
          let errJson = { error: `You didn't supply a model` }
          console.error("Error: ", errJson)
          res.status(500).send(errJson)
        }
      } else {
        console.error("Error: ", err)
        res.status(500).json(err)
      }
    }
  })
})
/** Monk open querying */
express.post("/monk/get", async (req, res) => {
  let requestId = uuid()
  console.log("received requestId:", requestId, "body:", req.body)
  try {
    let no = ["/orders"]
    if (req.body.query && req.body.model && no.indexOf(req.body.model) < 0) {
      let model = monk.get(req.body.model)
      if (model) {
        let data = await model.find(req.body.query, req.body.options)
        res.send(data)
      }
    } else {
      if (no.indexOf(req.body.model) > -1) {
        throw "invalid permissions"
      } else {
        throw "err"
      }
    }
  } catch (err) {
    if (!req.body.query && !req.body.model) {
      res.send({ error: `You didn't supply a query or model` })
    } else if (!req.body.query) {
      res.send({ error: `You didn't supply a query` })
    } else if (!req.body.model) {
      res.send({ error: `You didn't supply a model` })
    } else {
      res.send({ error: `Something went wrong`, err })
    }
  }
})
express.post("/monk/put", async (req, res) => {
  try {
    let no = ["/orders"]
    if (req.body.thing && req.body.model && no.indexOf(req.body.model) < 0) {
      let thing = req.body.thing
      let model = monk.get(req.body.model)
      if (model) {
        model
          .update(
            {
              uuid: smarts.gosmart(thing, "uuid", uuid()),
            },
            thing,
            {
              upsert: true,
            }
          )
          .then((updated) => {
            res.status(200).send({ success: true })
          })
          .catch((err) => {
            console.error("something went wrong putting an object: ", err)
            throw err
          })
      } else if (no.indexOf(req.body.model) > -1) {
        throw "invalid permissions"
      } else {
        throw "err"
      }
    } else {
      throw "err"
    }
  } catch (err) {
    if (!req.body.thing && !req.body.model) {
      res.status(500).send({ error: `You didn't supply a thing or model` })
    } else if (!req.body.thing) {
      res.status(500).send({ error: `You didn't supply a thing` })
    } else if (!req.body.model) {
      res.status(500).send({ error: `You didn't supply a model` })
    } else {
      res.status(500).send({ error: `Something went wrong` })
    }
  }
})
/** CATCH ALL */
//express.get('*', (req, res)=>{
//	 res.send('woo')
//})
/** SOCKET.IO */
logs.connections = []

// // unique names testing
// 	3000 unique first names
// 	180,000 + unique first + last names
// 	fs.writeFile('names.txt', 'test', function(err){
// 	  if(err){
// 	    console.error(err)
// 	  }
// 	})
// 	let fsStream = fs.createWriteStream('names.txt', {flags: 'a'})
// 	let fakers = []
// 	let dupes = 0
// 	for(var i=0i<200000i++){
// 	  let fakerr = faker.fake("{{name.firstName}} {{name.lastName}}")
// 	  if(fakers.indexOf(fakerr) >= 0){
// 	    dupes++
// 	  } else {
// 	    fakers.push(fakerr)
// 	  }
// 	}

/** Socket.io config */
let io = require("socket.io")(http, {
  origins: ["*:*"],
  cors: {
    origin: "*",
    allowedHeaders: ["Access-Control-Allow-Origin", "Access-Control-Allow-Methods", "Access-Control-Allow-Credentials"],
    methods: ["GET", "POST", "PUT", "DELETE", "POLL", "PATCH"]
  },
  handlePreflightRequest: (req, res) => {
    res.writeHead(200, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,POLL,PATCH",
      "Access-Control-Allow-Credentials": true,
    })
    res.end()
  },
})
// io.set("transports", ["websocket", "polling"])
// io.set('origins', '*:*')
/** INITIATE SOCKET.IO LISTENING */
io.on("connection", function (socket) {
  // socket.use((packet, next)=>{
  //   if(typeof packet == 'string'){
  //     packet = jsmart.parse(packet)
  //     return next()
  //   } else {
  //     return next()
  //   }
  // })
  logs.connections.push(socket)
  console.error("new socket created, sockets: %s", logs.connections.length)
  socket.on("connect_error", (err) => {
    console.log(`connect_error due to ${err.message}`)
  })
  socket.on("disconnect", function (data) {
    logs.connections.splice(logs.connections.indexOf(socket), 1)
    console.error("lost connection, connections: " + logs.connections.length)
  })

  /// SOCKET EVENT HANDLERS

  // data generation
  socket.on("getUniqueName", function (data) {
    checkGoodName(data)
      .then((name) => {
        data.name = name
        data.uuid = uuid()
        socket.emit("giveUniqueName", data)
      })
      .catch((err) => {
        if (err) {
          console.error("caught error at 7493g3892f32fh32")
          console.error(err)
        }
      })
  })
  // functions
  let checkGoodName = function (data) {
    return new Promise((resolve, reject) => {
      let randomName = faker.fake("{{name.firstName}}")
      // let randomName = faker.fake("{{name.firstName}} {{name.lastName}}")
      thingModel
        .find({
          names: {
            $all: ["planet express good", randomName],
          },
        })
        .then((docs) => {
          if (docs.length < 1) {
            resolve(randomName)
          } else {
            resolve(checkGoodName(data))
          }
        })
        .catch((err) => {
          console.error("caught error here ht928p3tg9832")
          console.error(err)
          reject(err)
        })
    })
  }
  // things
  socket.on("getRealms", (opts) => {
    // var res = {}
    if (!opts) {
      let opts = {}
    }
    /*
              Takes the following @params
              @param count is the number of posts you want
              @param realm is the realm you want the posts from
              @param [realms] is a list of realms you want the posts from
              @param sort is the value by which you want to sort
              @param sortDirection is the direction/pattern you want to sort in (if undefined it will always be descending)
              @param includeComments is a boolean which defines whether you want to include comment data with the posts
              @param commentSort is the value by which you want to sort Comments
              @param commentSortDirection is the direction/pattern you want to sort comments in (if undefined it will always be descending)
          */
    // Defaults
    var defaultOpts = {
      count: 50,
      find: {},
      sort: "alphabetical",
      sortDirection: "ascending",
    }
    opts = jsonConcat(defaultOpts, opts, true)
    opts = normaliseSortOpts(opts)
    realmModel
      .find(opts.find)
      .limit(opts.count)
      .sort({
        realm: opts.sortDirectionNormal,
      })
      .then(function (realms) {
        let ret = {
          clientId: opts.clientId,
          realms: realms,
        }
        socket.emit("giveRealms", ret)
      })
  })
  socket.on("getThing", (opts) => {
    /** opts
     * @param opts.thing is the wanted thing, can either be string or object
     * @param opts.populations is a list of wanted population functions
     * @param opts.funCounter is the client side function that this might be coming from
     */

    /** define default opts
     */
    if (!opts) {
      let opts = {}
    }
    var defaultOpts = {
      populations: [],
    }
    /** generate opts object
     */
    opts = jsonConcat(defaultOpts, opts, true)

    /** checks if we have a valid id to find with
     */
    if (opts.thing && (typeof opts.thing == "string" || opts.thing._id)) {
      let query = thingModel.findOne({
        _id: opts.thing._id || opts.thing,
      })
      if (opts.populations.length > 0) {
        query = addPopulationsToQuery(opts.populations, query)
      }
      console.log("looking up thing")
      query.then((thing) => {
        if (thing) {
          let ret = {
            clientId: opts.clientId,
            thing,
            parentId: opts.parentId,
            returnPath: opts.returnPath,
            funCounter: opts.funCounter,
          }
          console.log("giving thing")
          socket.emit("giveThing", ret)
        }
      })
    }
  })
  socket.on("getThings", (opts) => {
    console.log("got request %s", Date.now())
    /** opts
     * @param count is the number of posts you want
     * @param object @type {object/thing} is the object you want the posts from
     * @param things @type {list of things} is a list of things you want the posts from
     * @param find @type {Object} is the find query you want to execute
     * @param findOptions @type {Object} is an object with the sort parameters you want to use
     * @param includeComments is a boolean which defines whether you want to include comment data with the posts
     * @param commentSort is the value by which you want to sort Comments
     * @param commentSortDirection is the direction/pattern you want to sort comments in (if undefined it will always be descending)
     * @param stream @type {Boolean} if we want to get the things back individually
     */
    /** define default opts
     */
    if (!opts) {
      let opts = {}
    }
    var defaultOpts = {
      count: 10,
      find: {
        realms: {
          $all: ["posts"],
        },
      },
      checkEdges: false,
      stream: true,
      findOptions: {},
    }
    /** generate opts object
     */
    opts = jsonConcat(defaultOpts, opts, true)
    opts = normaliseSortOpts(opts)
    /** check if we want only specifically titled inventories populated
     */
    if (opts.checkEdges) {
      var inventoryMatch = []
      for (let source of conf.sources) {
        for (let edge of source.edges) {
          inventoryMatch.push(source.source + " " + edge)
        }
      }
    } else {
      var inventoryMatch = []
    }
    /** build our query
     */
    opts.find = compileFind(opts.find)
    opts.find.backupState = { $ne: true }
    let query = thingModel.find(opts.find, null, opts.findOptions)
    /** check if we want to limit the returned documents
     */
    if (opts.count !== Infinity) {
      query.limit(opts.count)
    }
    /** check if we want to sort the results
     */
    query.sort({
      sortString: opts.sortDirectionNormal,
    })
    /** if the stream option is selected and if so we stream the data to the client
     */
    if (opts.stream) {
      var streamIndex = 0

      query
        .cursor()
        .on("data", function (thing) {
          let ret = {
            parentId: opts.parentId,
            thing: thing,
            index: streamIndex++,
            returnPath: opts.returnPath,
          }
          console.log("giving thing %s", Date.now())
          socket.emit("giveThing", ret)
        })
        .on("error", function (err) {
          console.error("there was an error in the stream")
          console.error(err)
        })
        .on("close", function () {
          // socket.emit('giveThings', {
          //   parentId: opts.parentId,
          //   things: [],
          //   returnPath: opts.returnPath
          // })
        })
      /** otherwise we send all the results back in a single return
       */
    } else {
      query.exec().then(function (things) {
        let ret = {
          parentId: opts.parentId,
          things: things,
          returnPath: opts.returnPath,
        }
        socket.emit("giveThings", ret)
      })
    }
  })
  socket.on("saveThing", (opts) => {
    /** opts
     *  @param opts.thing is the thing needing to be saved
     *  @param opts.feedback is the general error object
     *  @param opts.feedback.err is the error that was encountered
     *  @param opts.feedback.message is the general message associated with the error to give to users/display
     *  @param opts.feedback.success is a boolean to state whether the save was successfull or not
     *  @param opts.clientId is the id of the client component who sent this save request
     *  @param opts.funId is the id of the function that sent this request
     *  @param opts.relations is the list of relations and rules for them that we want to use when saving this thing
     *  @param opts.giveEvent
     */
    console.log(opts.thing.geojson)
    saveThing(opts)
      .then((ret) => {
        opts.thing = ret.thing
        opts.feedback = {}
        opts.feedback.message = "successfully saved thing and all relations"
        opts.feedback.success = true
        opts.giveEvent = "save"
        socket.emit("giveThing", opts)
      })
      .catch((err) => {
        console.error(err)
        // need to initiate delete in the error chain bubble up instead of here because we don't know server id's for some things
        // restore(thing, opts.relations)
        //   .then((thing)=>{
        //     opts.feedback = {
        //       err: err,
        //       message: "something went wrong when saving the thing, we will have more details shortly",
        //       success: false
        //     }
        //     socket.emit('giveThing', opts)
        //   })
        //   .catch(err=>{
        //     console.error(err)
        //     opts.feedback = {
        //       err: err,
        //       message: "something went wrong when saving the thing, we will have more details shortly",
        //       success: false
        //     }
        //     socket.emit('giveThing', opts)
        //   })
        opts.feedback = {
          err: err,
          message:
            "something went wrong when saving the thing, we will have more details shortly",
          success: false,
        }
        socket.emit("giveThing", opts)
      })
  })
  socket.on("deleteThing", (opts) => {
    console.log(opts)
    /** opts
     *  @param opts.thing is the thing needing to be saved
     *  @param opts.feedback is the general error object
     *  @param opts.feedback.err is the error that was encountered
     *  @param opts.feedback.message is the general message associated with the error to give to users/display
     *  @param opts.feedback.success is a boolean to state whether the save was successfull or not
     *  @param opts.clientId is the id of the client component who sent this save request
     *  @param opts.funId is the id of the function that sent this request
     *  @param opts.eventName meta data stuff idk really
     */

    console.log(opts)
    // console.log(smarts.anyOptsIn(
    //   [smarts.getsmart(opts, 'entity._id', ''), null, undefined],
    //   smarts.getsmart(opts.thing, 'owners', [])
    // ))
    if (
      smarts.getsmart(opts.thing, "owners", []).length == 0 ||
      smarts.anyOptsIn(
        [smarts.getsmart(opts, "entity._id", ""), null, undefined],
        smarts.getsmart(opts.thing, "owners", [])
      )
    ) {
      thingModel
        .findOne({
          _id: opts.thing._id,
        })
        .then((thing) => {
          entityModel
            .findOne({
              username: "growtimeapi",
            })
            .then((growtimeapi) => {
              if (
                smarts.getsmart(thing, "owners", []).length == 0 ||
                smarts.anyOptsIn(
                  [smarts.getsmart(opts, "entity._id", ""), null, undefined],
                  smarts.getsmart(opts.thing, "owners", [])
                )
              ) {
                thing.owners = [growtimeapi._id]
                thing.parents = []
                thing.backupState = true
                smarts.pushOpt("deleted", thing.names)
                thing.save((err) => {
                  if (err) {
                    console.error(err)
                  } else {
                    opts.parentId = undefined
                    opts.thing = thing
                    console.log("we do this?")
                    socket.emit("confirmThingDeletion", opts)
                    thingModel
                      .find({
                        things: {
                          $in: [thing._id],
                        },
                      })
                      .then((things) => {
                        things.forEach((inv, index) => {
                          smarts.popOpt(thing._id, inv.things)
                          inv.save((err) => {
                            if (err) {
                              console.error(err)
                            } else {
                              opts.parentId = inv._id
                              opts.feedback = {
                                success: true,
                              }
                              socket.emit("confirmThingDeletion", opts)
                            }
                          })
                        })
                      })
                      .catch((err) => {
                        console.error(err)
                      })
                  }
                })
              } else {
                opts.feedback = {
                  err: `For some reason you aren't allowed to delete this thing, due to a bug or some law`,
                  message: `For some reason you aren't allowed to delete this thing, due to a bug or some law`,
                  success: false,
                }
                console.log("we doing this")
                socket.emit("confirmThingDeletion", opts)
              }
            })
            .catch((err) => {
              console.error(err)
            })
        })
        .catch((err) => {
          console.error(err)
        })
    } else {
      opts.feedback = {
        err: `For some reason you aren't allowed to delete this thing, due to a bug or some law`,
        message: `For some reason you aren't allowed to delete this thing, due to a bug or some law`,
        success: false,
      }
      console.log("we doing this")
      socket.emit("confirmThingDeletion", opts)
    }
  })
  socket.on("populateThings", (opts) => {
    /** parametres
     *  @param opts.things is a list of id's to populate
     *  @param opts.parentId is the parentId of the thing requesting the population
     *  @param opts.returnPath is the property path of the returning list
     *  @param opts.sort is a string identifying the type of sort you want to perform on the population candidates
     *  @param opts.sortDirection is the direction you want the sorted things to come in, a-z, 0-9, ascending, z-a, 9-0, descending
     *  @param opts.rules is an object of population rules to follow for the list
     *  @param opts.limit is the limit of documents to populate, thus return
     *  @param opts.funCounter is the function identifier number for the client side awaiting function
     */
    /** define default opts
     */
    if (!opts) {
      let opts = {}
    }
    var defaultOpts = {
      limit: 5,
      sort: undefined,
      parentId: undefined,
      sort: undefined,
      sortDirection: "ascending",
      rules: {},
      returnPath: "things",
      funCounter: undefined,
      things: [],
    }
    /** generate opts object and find
     */
    opts = jsonConcat(defaultOpts, opts, true)
    let thingIds = opts.things.filter((thing) => {
      if (typeof thing === "string") {
        return thing
      } else if (typeof thing === "object" && thing._id) {
        return thing._id
      }
    })
    let find = { _id: { $in: thingIds } }
    find = jsonConcat(find, opts.rules, true)
    find = compileRegExps(find)
    /** create query
     */
    let query = thingModel.find(find)

    /** apply sorting
     */
    if (opts.sort) {
      let sort = {}
      sort[opts.sort] = opts.sortDirection
      query.sort(sort)
    }
    /** apply limiting
     */
    if (opts.limit) {
      query.limit(opts.limit)
    }
    /**
     */
    query.exec().then((things) => {
      let ret = opts
      ret.oldThings = ret.things
      ret.things = things
      socket.emit("giveThings", ret)
    })
  })

  //site data
  socket.on("getNav", (opts) => {
    // var res = {}
    if (!opts) {
      let opts = {}
    }
    /*
              Takes the following @params
              @param count is the number of posts you want
              @param object is the object you want the posts from
              @param [objects] is a list of objects you want the posts from
              @param sort is the value by which you want to sort
              @param sortDirection is the direction/pattern you want to sort in (if undefined it will always be descending)
              @param includeComments is a boolean which defines whether you want to include comment data with the posts
              @param commentSort is the value by which you want to sort Comments
              @param commentSortDirection is the direction/pattern you want to sort comments in (if undefined it will always be descending)
          */
    // Defaults
    var defaultOpts = {
      auth: "general",
    }
    opts = jsonConcat(defaultOpts, opts, true)
    navModel
      .findOne({
        siteTitle: opts.siteTitle,
      })
      .populate({
        path: "actionGroups",
        model: "actionGroup",
        populate: {
          path: "actions",
          model: "action",
        },
      })
      .then(function (nav) {
        if (nav) {
          let ret = {
            clientId: opts.clientId,
            nav: nav,
          }
          socket.emit("giveNav", ret)
        } else {
          socket.emit("giveNav", {
            clientId: opts.clientId,
            err: "there was no nav found",
          })
        }
      })
  })

  // Authentication
  socket.on("login", (credentials) => {
    if (!credentials) {
      let err = "you didn't provide any credentials....."
      socket.emit("giveAuthenticate", {
        auth: false,
        reason: "error",
        msg: err,
        err: err,
      })
    } else {
      entityModel.findOne(
        {
          $or: [
            {
              username: credentials.username,
            },
          ],
        },
        (err, entity) => {
          if (err) {
            socket.emit("giveAuthenticate", {
              auth: false,
              reason: "error",
              msg: "an error occured on the server side... sorry for the mistake",
              err: err,
            })
            socket.emit("giveLogin", {
              success: false,
              msg: "there was an error",
              err: err,
            })
          } else if (!entity) {
            socket.emit("giveAuthenticate", {
              auth: false,
              reason: "no user",
              err: "we could not find you in our database, please register",
            })
            socket.emit("giveLogin", {
              success: false,
              msg: "the username does not match any on record",
              err: "the username does not match any on record",
            })
          } else if (
            bcrypt.compareSync(credentials.password, entity.password)
          ) {
            delete entity.password
            thingModel
              .populate(entity, {
                path: "inventory",
              })
              .then((entityPopped) => {
                socket.emit("giveAuthenticate", {
                  auth: true,
                  entity: entityPopped.toJSON(),
                })
              })
            socket.emit("giveLogin", {
              success: true,
              msg: "successfully logged in",
              err: null,
            })
          } else {
            let err = "your password was wrong, please try again"
            socket.emit("giveAuthenticate", {
              auth: false,
              reason: "error",
              msg: err,
              err: err,
            })
            socket.emit("giveLogin", {
              success: false,
              msg: "your password did not match",
              err: "your password did not match",
            })
          }
        }
      )
    }
  })
  socket.on("register", (credentials) => {
    if (!credentials) {
      let err = "you didn't provide any credentials....."
      socket.emit("giveRegister", {
        auth: false,
        reason: "error",
        msg: err,
        err: err,
      })
    } else {
      entityModel.findOne(
        {
          $or: [
            {
              username: credentials.username,
            },
            {
              email: credentials.email ? credentials.email : "",
            },
          ],
        },
        (err, entity) => {
          if (err) {
            socket.emit("giveRegister", {
              success: false,
              reason: "error",
              msg: "an error occured on the server side... sorry for the mistake",
              err: err,
            })
          } else if (!entity) {
            var hash = bcrypt.hashSync(
              credentials.password,
              bcrypt.genSaltSync(12)
            )
            let entityNew = new entityModel({
              firstName: credentials.firstName
                ? credentials.firstName.toLowerCase()
                : undefined,
              middleName: credentials.middleName
                ? credentials.middleName.toLowerCase()
                : undefined,
              lastName: credentials.lastName
                ? credentials.firstName.toLowerCase()
                : undefined,
              username: credentials.username,
              entityName: credentials.username,
              password: hash,
              email: credentials.email
                ? credentials.email.toLowerCase()
                : credentials.username + "@growtime.com",
            })
            let entityInventory = new thingModel({
              name: credentials.username + "'s Inventory",
              title: "Your inventory",
              description:
                "This is your own inventory, it's empty at the moment, add items to it to begin",
              names: ["inventory"],
              owners: [entityNew._id],
            })
            entityNew.inventory = entityInventory._id
            entityInventory.save((err) => {
              if (err) {
                entityInventory.save((err) => {
                  if (err) {
                    console.error(err)
                  } else {
                  }
                })
              } else {
              }
            })
            entityNew.save((err) => {
              if (err) {
                if (err.code === 11000) {
                  socket.emit("giveRegister", {
                    success: false,
                    reason: "error",
                    msg: "sorry but that user already exists",
                    err: err,
                  })
                } else {
                  socket.emit("giveRegister", {
                    success: false,
                    reason: "error",
                    msg: "an error occured on the server side... sorry for the mistake",
                    err: err,
                  })
                }
              } else {
                delete entityNew.password
                socket.emit("giveRegister", {
                  success: true,
                })
                socket.emit("giveAuthenticate", {
                  auth: true,
                  entity: entityNew.toJSON(),
                })
              }
            })
          } else if (entity) {
            let err =
              "there is already a user with this username or email, please try a different identity"
            socket.emit("giveRegister", {
              success: false,
              reason: "error",
              msg: err,
              err: err,
            })
          } else {
            let err = "your password was wrong, please try again"
            socket.emit("giveRegister", {
              success: false,
              reason: "error",
              msg: err,
              err: err,
            })
          }
        }
      )
    }
  })
  socket.on("logout", (opts) => {
    socket.emit("giveAuthenticate", {
      auth: false,
      reason: "logout",
      msg: "successfully logged out",
    })
  })

  // functions for api
  function normaliseSortOpts(opts) {
    if (opts.sort == "alphabetical") {
      opts.sortNormal = "realm"
    } else {
      opts.sortNormal = "realm"
    }
    if (opts.sortDirection == "ascending") {
      opts.sortDirectionNormal = 1
    } else if (opts.sortDirection == "descending") {
      opts.sortDirectionNormal = -1
    } else {
      opts.sortDirectionNormal = 1
    }
    return opts
  }
  function addPopulationsToQuery(populations, query) {
    for (population of populations) {
      query.populate(population)
    }
    return query
  }
  function saveThing(opts) {
    /** arguments
     *  @param opts.thing is the thing we want to save
     *  @param opts.thingServer is the server version of the thing we want to save
     *  @param opts.relations is the relationship config list
     *  @param opts.save is the saving options for how to save the current thing
     *  @param opts.commonStateHash
     */
    /** resolves
     *  @param thing is the thing we wanted to save
     *  @param thingServer is the server version of the thing we wanted to save
     *  @param thingServerSaved is the newly saved server version of the thing we wanted to save
     */
    /** define default opts
     */
    if (!opts) {
      let opts = {}
    }
    let defaultOpts = {
      relations: [
        {
          relationship: "properties",
          property: "parents",
          id: true,
          upsert: true,
          save: true,
        },
        {
          relationship: "things",
          property: "parents",
          id: true,
          upsert: true,
          save: true,
        },
        {
          relationship: "parents",
          property: "things",
          id: true,
          upsert: false,
          save: true,
        },
      ],
      save: {
        id: true,
        upsert: false,
        save: true,
      },
      commonStateHash: uuid(),
      backupState: true,
    }
    /** generate opts object
     */
    opts = jsonConcat(defaultOpts, opts, true)
    return new Promise((resolve, reject) => {
      /** check some critical properties to see if we should even save the thing
       */
      smarts.mapsmart(smarts.gosmart(opts.thing, "properties", []), "title")
      if (
        smarts.getsmart(
          opts.thing,
          "properties.mapped.a saveable lopu?." +
          smarts.getsmart(
            opts.thing,
            "properties.mapped.a saveable lopu?.type",
            "Boolean"
          ),
          false
        )
      ) {
        console.log("did we?")
        console.log(opts.thing)
        resolve({
          thing: opts.thing,
        })
      }
      /** run some client/server specific validation
       *  validate realms
       *  validate names
       */
      if (
        opts.thing &&
        typeof opts.thing !== "string" &&
        !(opts.thing instanceof mongoose.Schema.ObjectId)
      ) {
        /** Parse realms into strings
         */
        opts.thing.realms = opts.thing.realms || []
        conf.hardRealms.forEach((hardRealm) => {
          if (!opts.thing.realms.includes(hardRealm)) {
            opts.thing.realms.push(hardRealm)
          }
        })
      }
      // maybe make a backup state of the thing
      makeBackupState(
        opts.thing,
        opts.thingServer,
        opts.relations,
        opts.commonStateHash,
        opts.backupState
      )
        .then((ret) => {
          /** then save relations such as
           *  ._id to all parents' things list
           *  and all parents if unsaved
           *  ._id to all properties parents list
           *  and all properties if unsaved
           *  ._id to all things
           *  and all things if unsaved
           *  then return the thing with all of those
           */
          relate(
            ret.thing,
            ret.thingServer,
            opts.relations,
            opts.commonStateHash,
            opts.save,
            opts.relate
          )
            /** then after relations are successful save the thing
             */
            .then((ret) => {
              if (
                typeof ret.thingServer.save == "function" &&
                ret.thingServer._id
              ) {
                if (
                  opts.save.save &&
                  opts.commonStateHash == ret.thingServer.stateId
                ) {
                  saveThingData(ret, opts, resolve, reject)
                } else if (opts.save.upsert) {
                  saveThingData(ret, opts, resolve, reject)
                } else if (
                  opts.save.id &&
                  opts.commonStateHash == ret.thing.stateId
                ) {
                  saveThingData(ret, opts, resolve, reject)
                }
                // assumes that we are saving a relative
                else if (opts.save.id && opts.save.property) {
                  let set = {}
                  set[opts.save.property] = ret.thingServer[opts.save.property]
                  thingModel
                    .findOneAndUpdate(
                      { _id: ret.thingServer._id },
                      { $set: set },
                      { new: true }
                    )
                    .then((thingServerSaved) => {
                      ret.thing._id = thingServerSaved._id
                      resolve({ thing: ret.thing, thingServerSaved })
                    })
                    .catch((err) => {
                      console.error(err)
                      reject(err)
                    })
                } else if (opts.save.save) {
                  saveThingData(ret, opts, resolve, reject)
                }
              } else {
                let err = "the thing was not able to be saved"
                console.error(err)
                reject(err)
              }
            })
            .catch((err) => {
              console.error(err)
              reject(err)
            })
        })
        .catch((err) => {
          console.error(err)
          reject(err)
        })
    })
    function saveThingData(ret, opts, resolve, reject) {
      if (
        typeof ret.thing == "string" ||
        ret.thing instanceof mongoose.Schema.ObjectId
      ) {
        ret.thingServer
          .save()
          .then((thingServerSaved) => {
            ret.thing._id = thingServerSaved._id
            resolve({ thing: ret.thing, thingServerSaved })
          })
          .catch((err) => {
            console.error(err)
            reject(err)
          })
      } else {
        delete ret.thing._id
        thingModel
          .findOneAndUpdate(
            { _id: ret.thingServer._id },
            { $set: jsmart.parse(jsmart.stringify(ret.thing)) },
            { new: true }
          )
          .then((thingServerSaved) => {
            ret.thing._id = thingServerSaved._id
            if (opts.commonStateHash == ret.thingServer.stateId) {
              socket.emit("giveThing", { thing: ret.thing, giveEvent: "save" })
            }
            resolve({ thing: ret.thing, thingServerSaved })
          })
          .catch((err) => {
            console.error(err)
            reject(err)
          })
      }
    }
  }
  // relating
  function relate(
    thing,
    thingServer,
    relations = [
      {
        relationship: "properties",
        property: "parents",
        id: true,
        update: true,
        save: true,
      },
      {
        relationship: "things",
        property: "parents",
        id: true,
        update: false,
        save: false,
      },
      {
        relationship: "parents",
        property: "things",
        id: true,
        update: false,
        save: true,
      },
    ],
    commonStateHash,
    save,
    relate = true
  ) {
    /** params
     *  @param thing is the thing we are saving relations for
     *  @param thingServer is the server version of the thing we are saving relations for
     *  @param relations is a list of relationships we are saving
     *  @param commonStateHash is the common hash used to identify states backed up from this save function
     */
    /** returns a promise that resolves to:
     *  @func success
     *    @var ret
     *      @var thingRelatedFully
     *      @var thingServerRelatedFully
     *  @func failure
     *    @var err
     */
    return new Promise((resolve, reject) => {
      if (relate) {
        relateRe(thing, thingServer, relations, 0, 0, commonStateHash, save)
          .then((ret) => {
            resolve(ret)
          })
          .catch((err) => {
            console.error(err)
            reject(err)
          })
      } else {
        resolve({ thing, thingServer })
      }
    })
  }
  function relateRe(
    thing,
    thingServer,
    relations,
    relation,
    relative,
    commonStateHash,
    save
  ) {
    /** params
     *  @param thing is the thing we are saving relations for
     *  @param thingServer is the server version of the thing we are saving relations for
     *  @param thingClean is the server version of the thing we are saving relations for
     *  @param relations is a list of relationships we are saving
     *  @param relation will be a @type {Number} representing the index of the relationship string, ie: the property of thing that is a list of related things
     *  @param relative will be a @type {Number} representing the property of the related thing where the _id of the thing should be inserted
     *  @param commonStateHash is the common hash used to identify backup states from this save function
     *  @param save is a @type {Object} identifying the save parametres to be used for the thing being related
     *  @param save.relationship is the current relationship that this thing is being saved for
     *  @param save.property is the current property @type {Array} which the relative of this thing's _id will be pushed into
     *  @param save.id identifies if the thing should have the id list of the current relationship updated or not
     *  @param save.save identifies if the thing should be saved if it does not exist on the server yet
     *  @param save.upsert identifies if the thing should be updated server side if it already existed server side
     */
    /** returns a promise that resolves to:
     *  @func success
     *    @var ret
     *      @var thingRelatedFully
     *      @var thingServerRelatedFully
     *  @func failure
     *    @var err
     */
    return new Promise((resolve, reject) => {
      // if there's no relative we don't do anything but check the next relative
      if (
        thing[relations[relation].relationship]
          ? !thing[relations[relation].relationship][relative]
            ? true
            : false
          : true
      ) {
        /** check if we continue updating relationships
         */
        continueRelatingOrResolve(
          thing,
          thingServer,
          relations,
          relation,
          relative,
          commonStateHash,
          save,
          resolve,
          reject
        )
      }
      // not sure why we check this
      // else if(thing[relations[relation].relationship][relative].stateId !== commonStateHash){
      /** check if we even want to relate this relativeb based on some rules
       *  @func if we are not upserting already saved things and this thing
       *   doesn't have the common hash as it's uuid then we don't do this
       *   relation
       *   !(thingServer.uuid !== commonStateHash && relations[relation].upsert)
       */
      else {
        /** store a backup state of the relative for use if any other saving fails
         *  also handles conversion of non-registered documents into ._id bearing saveable model objects
         *  also handles conversion of non-object, ObjectId type relatives to ._id bearing saveable model objects
         */
        makeBackupState(
          thing[relations[relation].relationship][relative],
          undefined,
          relations,
          commonStateHash,
          true,
          save
        )
          .then((ret) => {
            /**
             *  ret.thing and ret.thingServer are the relative
             */

            // push relationship data to current thing's relatives list
            if (!thing.relatives) {
              thing.relatives = []
            }
            if (relations[relation].relationship !== "parents") {
              smarts.pushOpt(
                {
                  relative: ret.thingServer._id.toString(),
                  path: relations[relation].relationship,
                },
                thing.relatives,
                true,
                ["relative", "path"]
              )
              smarts.pushOpt(
                {
                  relative: ret.thingServer._id.toString(),
                  path: relations[relation].relationship,
                },
                thingServer.relatives,
                true,
                ["relative", "path"]
              )
            }

            if (!ret.alreadyRelated) {
              /** add the _id of the given thing to the relationships list of the current relative
               */
              if (relations[relation].id) {
                if (!ret.thing[relations[relation].property]) {
                  ret.thing[relations[relation].property] = []
                }
                if (
                  !(
                    smarts.optIn(
                      thingServer._id,
                      smarts.getsmart(
                        ret,
                        "thing." + relations[relation].property
                      )
                    ) ||
                    smarts.optIn(
                      thingServer._id.toString(),
                      smarts.getsmart(
                        ret,
                        "thing." + relations[relation].property
                      )
                    )
                  )
                ) {
                  smarts.setThing({
                    option: thing,
                    list: ret.thing[relations[relation].property],
                    obj: true,
                    key: ["_id", "uuid", "clientId"],
                    keymatchtype: "broad",
                    push: true,
                  })
                  smarts.setThing({
                    option: thingServer,
                    list: ret.thingServer[relations[relation].property],
                    obj: true,
                    key: ["_id", "uuid", "clientId"],
                    keymatchtype: "broad",
                    push: true,
                  })
                }
                // smarts.pushOpt(thingServer._id, ret.thing[relations[relation].property])
                // smarts.pushOpt(thingServer._id, ret.thingServer[relations[relation].property])
              }

              let relativeRelations = createRelativeRelations(
                relations,
                relation
              )
              let optsRelative = {
                thing: ret.thing,
                thingServer: ret.thingServer,
                relations: relativeRelations,
                save: relations[relation],
                commonStateHash: commonStateHash,
                backupState: false,
                relate:
                  relations[relation].upsert ||
                  (ret.thingServer.stateId == commonStateHash &&
                    relations[relation].save),
              }
              saveThing(optsRelative)
                .then((ret) => {
                  // apply updates to the source thing's version of the relative thing
                  // let thingClean = jsmart.parse(jsmart.stringify(thing))
                  // smarts.popOpt(ret.thingServer, thingClean[relations[relation].relationship][relative], true, ['uuid', 'clientId', '_id'], 'broad')
                  thing[relations[relation].relationship][relative] =
                    ret.thingServerSaved
                  thingServer[relations[relation].relationship][relative] =
                    ret.thingServerSaved._id
                  // add relation to relations list of thing
                  if (!thing.relatives) {
                    thing.relatives = []
                  }
                  if (thingServer.id == "5a1a2f2dec57f4397d9ae425") {
                  }
                  /** check if we continue updating relationships
                   */
                  continueRelatingOrResolve(
                    thing,
                    thingServer,
                    relations,
                    relation,
                    relative,
                    commonStateHash,
                    save,
                    resolve,
                    reject
                  )
                })
                .catch((err) => {
                  console.error(err)
                  reject(err)
                })
            } else {
              continueRelatingOrResolve(
                thing,
                thingServer,
                relations,
                relation,
                relative,
                commonStateHash,
                save,
                resolve,
                reject
              )
            }
          })
          .catch((err) => {
            console.error(err)
            reject(err)
          })
      }
      // else {
      //   // push relationship data to current thing's relatives list
      //     smarts.pushOpt({relative: thing[relations[relation].relationship][relative]._id.toString(), path: relations[relation].property}, thing.relatives, true, ['relative','path'])
      //     smarts.pushOpt({relative: thing[relations[relation].relationship][relative]._id.toString(), path: relations[relation].property}, thingServer.relatives, true, ['relative','path'])
      //   continueRelatingOrResolve(thing, thingServer, relations, relation, relative, commonStateHash, save, resolve, reject)
      // }
    })

    function continueRelatingOrResolve(
      thing,
      thingServer,
      relations,
      relation,
      relative,
      commonStateHash,
      save,
      resolve,
      reject
    ) {
      /** if the current relation is not the last of this relationship group/list
       *  increment the relationship counter
       *  update the next relationship
       */
      if (
        thing[relations[relation].relationship] &&
        relative < thing[relations[relation].relationship].length - 1
      ) {
        relateRe(
          thing,
          thingServer,
          relations,
          relation,
          (relative += 1),
          commonStateHash,
          save
        )
          .then((ret) => {
            resolve(ret)
          })
          .catch((err) => {
            console.error(err)
            reject(err)
          })
      } else if (relation < relations.length - 1) {
        /** otherwise if the current relationship group/list is not the last group/list
         *  increment the relationship group/list counter
         *  update the next relationship
         */
        relateRe(
          thing,
          thingServer,
          relations,
          (relation += 1),
          0,
          commonStateHash,
          save
        )
          .then((ret) => {
            resolve(ret)
          })
          .catch((err) => {
            console.error(err)
            reject(err)
          })
      } else {
        /** otherwise if that was the last relationship and the last relationship group
         *  resolve the current state of the thing
         */
        resolve({ thing, thingServer })
      }
    }
  }
  // restoring states
  function restore(thing, relations, thingBackupClient, thingBackupServer, id) {
    return new Promise((resolve, reject) => {
      /** restore the state of the relative in the source thing
       */
      thing[relations[relation].relationship][relative] =
        thingRelativeBackupClient
      /** restore the state of the relative in the database
       */
      /** check if the relative wasn't originally in the database at all
       *  if so, delete it completely
       */
      if (!thingRelativeBackupServer) {
        thingModel
          .remove({ _id: id })
          .then((removed) => {
            resolve()
          })
          .catch((err) => {
            console.error("caught error")
            console.error(err)
            reject(err)
          })
      } else {
        /** otherwise we revert the state of the databased thing
         */
        thingModel
          .findOneAndUpdate({ _id: id }, thingRelativeBackupServer, {
            new: true,
          })
          .then((savedFoundRelative) => {
            resolve()
          })
          .catch((err) => {
            console.error("caught error")
            console.error(err)
            reject(err)
          })
      }
    })
  }
  function restoreRe(
    thing,
    relations,
    relation,
    relative,
    thingRelativeBackupClient,
    thingRelativeBackupServer
  ) {
    // stuff
  }

  // backingup states
  function makeBackupState(
    thing,
    thingServer,
    relations,
    commonStateHash,
    backupState = true
  ) {
    return new Promise((resolve, reject) => {
      /** checker whether we want to actually backup state */
      if (backupState) {
        /** check if thing needs to be registered with mongodb
         *  because it didn't come with an _id meaning it has never been saved
         */
        if (
          !thing._id &&
          typeof thing !== "string" &&
          !(thing instanceof mongoose.Types.ObjectId)
        ) {
          let thingModelled = new thingModel(
            jsmart.parse(jsmart.stringify(thing))
          )
          thingModelled.stateId = commonStateHash
          //remove errors
          delete thingModelled.errors
          delete thingModelled.$__.validationError

          thingModelled
            .save()
            .then((thingServer) => {
              thing._id = thingServer._id
              resolve({ thing, thingServer })
            })
            .catch((err) => {
              console.error(err)
              reject(err)
            })

          // thing = jsonConcatRelationships(thingModelled, thing, relations)
        } else {
          /** lookup thing in db to make backup before continuing
           *  also convert pure id to object
           */
          if (
            typeof thing == "string" ||
            thing instanceof mongoose.Types.ObjectId
          ) {
            var _id = thing
          } else {
            var _id = thing._id
          }
          thingModel
            .findOne({ _id })
            .then((thingServer) => {
              // create stringified backup of the server version of the thing
              if (thingServer.stateId !== commonStateHash) {
                let thingServerBackupState = jsmart.parse(
                  jsmart.stringify(thingServer)
                )
                // set the thingId to the server version of the thing's id
                thingServerBackupState.thingId = thingServer._id
                // set the stateId to the commonStateHash being used in this save function so we know what state to restore
                thingServerBackupState.stateId = commonStateHash
                // add backupState boolean
                thingServerBackupState.backupState = true
                // remove origin thingId from backup state
                delete thingServerBackupState._id
                // create a new version of the server thing which acts as a backup state
                let thingServerBackupStateModelled = new thingModel(
                  thingServerBackupState
                )
                // save the backup state
                thingServerBackupStateModelled
                  .save()
                  .then((thingServerBackupStateSaved, err) => {
                    // then push the id of the backup state to the current server state
                    if (!thingServer.states) {
                      thingServer.states = []
                    }
                    smarts.pushOpt(
                      thingServerBackupStateSaved._id,
                      thingServer.states
                    )
                    // then save the server state
                    thingServer
                      .save()
                      .then((thingServerSaved, err) => {
                        if (err) {
                          console.error(err)
                        }
                        resolve({ thing, thingServer })
                      })
                      .catch((err) => {
                        console.error(err)
                        // delete the backup server state to avoid wasting memory
                        // because something went wrong saving the server state with backedup state in states
                        thingModel
                          .remove({ _id: thingServerBackupStateSaved._id })
                          .then((metaErr) => {
                            if (!metaErr) {
                              thingModel
                                .findOneAndUpdate(
                                  { _id: thingServer._id },
                                  {
                                    $pull: {
                                      states: thingServerBackupStateSaved._id,
                                    },
                                  },
                                  { new: true }
                                )
                                .then((thingServerSavedAgain) => {
                                  reject(err)
                                })
                                .catch((err) => {
                                  console.error(err)
                                  reject(err)
                                })
                            } else {
                              console.error(metaErr)
                              reject(err)
                            }
                          })
                          .catch((err) => {
                            console.error(err)
                            reject(err)
                          })
                      })
                  })
                  .catch((err) => {
                    console.error(err)
                    reject(err)
                  })
              } else {
                let alreadyRelated = true
                resolve({ thing, thingServer, alreadyRelated })
              }
            })
            .catch((err) => {
              console.error(err)
              reject(err)
            })
        }
      } else {
        resolve({ thing, thingServer })
      }
    })
  }
  // automators
  function createRelativeRelations(relations, relation) {
    if (relations[relation].relationship == "parents") {
      return [
        {
          relationship: "parents",
          property: "things",
          id: true,
          upsert: false,
          save: true,
        },
        {
          relationship: "properties",
          property: "parents",
          id: true,
          upsert: false,
          save: true,
        },
        {
          relationship: "things",
          property: "parents",
          id: true,
          upsert: false,
          save: true,
        },
      ]
    } else {
      let newRelations = []
      for (var i = 0; i < relations.length; i++) {
        if (relations[i].relationship !== "parents") {
          newRelations.push(relations[i])
        }
      }
      return newRelations
    }
  }

  function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&")
  }
  function compileFind(find) {
    find = compileRegExps(find)
    if (find.orAllTheThings) {
      delete find.orAllTheThings
      var newFind = {
        $or: [],
      }
      Object.keys(find).forEach((key) => {
        var obj = {}
        obj[key] = find[key]
        newFind.$or.push(obj)
      })
      find = newFind
    }
    return find
  }
})

/** AUTHENTICATION */
/** OLD METHODS */
/// SET PERSISTENT LOGIN MIDDLEWARE AND FUNCTIONS
// express.use(function(req, res, next) {
//     if (req.session && req.session.user) {
//         User.findOne({ username: req.session.user.username }, function(err, user) {
//             if (user) {
//                 // req.user = user
//                 req.session.user = user
//                 delete req.session.user.password
//                 res.locals.user = req.session.user
//             }
//             next()
//         })
//     } else {
//         next()
//     }
// })

// function reqLog(req, res, next) {
//     if (!req.session.user) {
//         res.redirect('/login')
//     } else {
//         next()
//     }
// }

/** HELPER FUNCTIONS */
function jsonConcat(o1, o2, sReturn) {
  for (let key in o2) {
    if (o2.hasOwnProperty(key)) {
      o1[key] = {}
      o1[key] = o2[key]
    }
  }
  if (sReturn) {
    return o1
  }
}
function jsonConcatRelationships(o1, o2, relations, sReturn = true) {
  for (var i = 0; i < relations.length; i++) {
    var counter = i
    // o1.set(relations[counter].relationship, o2[relations[counter].relationship])
    // o1[relations[counter].relationship] = o2[relations[counter].relationship]
    for (var j = 0; j < o2[relations[counter].relationship].length; j++) {
      o1[relations[counter].relationship].push({})
    }
  }
  if (sReturn) {
    return o1
  }
}
function compileRegExps(find) {
  Object.keys(find).forEach((key) => {
    if (find[key].regex) {
      find[key].value = escapeRegExp(find[key].value)
      find[key] = new RegExp(find[key].value, find[key].options)
    }
  })
  return find
}
