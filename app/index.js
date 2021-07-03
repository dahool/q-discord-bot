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
    hal.announce(num);
    resp.send("OK");
});

app.get('/load', function(req, resp) {
    console.log("load")
    hal.events();
    resp.send("OK");
});

app.get('/online', function(req, resp) {
    console.log("online")
    hal.online();
    resp.send("OK");
});

app.get('/rotate', function(req, resp) {
    console.log("rotate")
    maia.rotate();
    resp.send("OK");
});

connectionManager.connect().then(() => {
    hal.start(connectionManager);
    maia.start(connectionManager);

    app.listen(port, () => {
        console.log("Ready on port " + port);
    })    
})