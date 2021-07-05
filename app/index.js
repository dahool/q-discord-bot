const express = require('express')
const favicon = require('serve-favicon');
const maia = require('./maia')
const hal = require('./hal')

const app = express()
app.use(express.json());
app.use(favicon('public/favicon.ico'));

const connectionManager = require('./db/db').connectionManager;

const port = process.env.PORT || 3000;

app.get('/', function(req, resp) {
    resp.send("OK");
})

app.get('/notify', function(req, resp) {
    console.log("notify")
    const num = req.query.number || 30;
    hal.announce(num).then(() => resp.send("OK"))
    .catch((error) => resp.send(error));
});

app.get('/load', function(req, resp) {
    //console.log("load")
    hal.events().then(() => resp.send("OK"))
    .catch((error) => resp.send(error));
});

app.get('/online', function(req, resp) {
    //console.log("online")
    hal.online().then(() => resp.send("OK"))
    .catch((error) => resp.send(error));
});

app.get('/rotate', function(req, resp) {
    //console.log("rotate")
    maia.rotate().then((r) => resp.send("OK " + r))
    .catch((error) => resp.send(error));
});

app.get('/events', function(req, resp) {
    //console.log("rotate")
    const num = req.query.number || 0;
    maia.events(num).then((r) => resp.send("OK"))
    .catch((error) => resp.send(error));
});

connectionManager.connect().then(() => {
    hal.start(connectionManager);
    maia.start(connectionManager);

    app.listen(port, () => {
        console.log("Ready on port " + port);
    })    
})