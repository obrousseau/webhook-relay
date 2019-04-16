var express = require('express');
var bodyParser  = require('body-parser');
var restClient = require('node-rest-client').Client;

var PORT = (process.env.PORT || 5000);
var JIRA_TOKEN = 'I9n7AhJu87Gd0w94DzksBWLGAlgbCDzvUFB8';
var HELPSCOUT_TOKEN = 'O6VciZqkVo3YGulBNjEBF0S9vIffvB6Osr0Y'; // user123:pass789
var TRELLO_API_KEY = "161552c07fb3a105793022c82d833c5b"
var TRELLO_OAUTH_OLI_TOKEN = "a11db333a3c9766129ff289562ff30725ff07ef5da83abdf309681a5a3e61e7a"
var TRELLO_BOARD_ID = "5a06ed465a69fb980915f341"
var TRELLO_LIST_ID = "5c73eca72135995a3400f5bf"
var TARGET_URL = "https://api.trello.com/1/cards";
//var TARGET_URL = 'https://hooks.slack.com/services/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';
var te_img = 'https://s3.amazonaws.com/uploads.hipchat.com/6634/194641/uncYbgVEMQ1XNtk/TE-Eye-36x36.jpg';
var app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var router = express.Router();

function objToStr (obj) {
    var str = '';
    for (var p in obj) {
        if (obj.hasOwnProperty(p)) {
            str += '\"' + p + ': ' + obj[p] + '\"';
        }
    }
    return str;
}

function translateHookContent_toTrello(req, token) {
    var retVal = {
        "key": TRELLO_API_KEY,
        "token": TRELLO_OAUTH_OLI_TOKEN,
        "idList":TRELLO_LIST_ID
    };
    
    if(token === JIRA_TOKEN) {
        retVal["name"] = req.body.issue.fields.key + " " + req.body.issue.fields.description; 
        retVal["pos"] = "top";
    }

    else if (token === HELPSCOUT_TOKEN) {
        retVal["name"] = req.body.subject;
        retVal["pos"] = "top";
        retVal["desc"] = req.body.preview;
    };

    //return ({ username: "Oli Webhooks", icon_url: te_img, text: retVal});
    return retVal;
}

app.get('/', function(request, response) {
  response.send('This the OliB simple Webhook server sample.  Use POST methods instead of GET.')
  console.log('GET request received');
})

router.post('/jira/:token', function(req, res) {
    if (req.params.token !== JIRA_TOKEN) {
        res.status(401).send({ error: 'Unauthorized' });
        return;
    }
    console.log('Received: ' + JSON.stringify(req.body));
//  Use the following lines to forward the request to slack, and return the response code from the slack api back to the sender.
//  Note: if you don't send a 200 response code back to the ThousandEyes webhook initiator, it'll keep retrying every 5 minutes for an hour.
    var restCall = new restClient();
    var hookBody = translateHookContent_toTrello(req, req.params.token);
    var args = {qs: hookBody,headers:{"Content-Type": "application/json"}};
    restCall.post(TARGET_URL, args, function(data,response) {
        console.log('Sending to destination hook: ' + JSON.stringify(args));
        if (response.statusCode != 200) {
            console.log('Received response: ' + response.statusCode + ' (' + response.statusMessage + ') from destination server');
            //console.log('To test yourself, run this: \n curl -i -v \'' + TARGET_FOR_TRELLO + '\' -H ' + objToStr(args.headers) + ' -d \'' + JSON.stringify(args.data) + '\'');
        }
        res.status(response.statusCode).send(response.statusMessage);
    });
//  Alternatively, send a response code directly to the webhook server without forwarding to slack
//    res.status(200).send(req.body);

});

router.post('/helpscout/:token', function(req, res) {
    if (req.params.token !== HELPSCOUT_TOKEN) {
        res.status(401).send({ error: 'Unauthorized' });
        return;
    }
    console.log('Received: ' + JSON.stringify(req.body));
//  Use the following lines to forward the request to slack, and return the response code from the slack api back to the sender.
//  Note: if you don't send a 200 response code back to the ThousandEyes webhook initiator, it'll keep retrying every 5 minutes for an hour.
    var restCall = new restClient();
    var hookBody = translateHookContent_toTrello(req, req.params.token);
    var args = {data: hookBody,headers:{"Content-Type": "application/json"}};
    restCall.post(TARGET_URL, args, function(data,response) {
        console.log('Sending to destination hook: ' + JSON.stringify(args));
        if (response.statusCode != 200) {
            console.log('Received response: ' + response.statusCode + ' (' + response.statusMessage + ') from destination server');
            //console.log('To test yourself, run this: \n curl -i -v \'' + TARGET_HOOK + '\' -H ' + objToStr(args.headers) + ' -d \'' + JSON.stringify(args.data) + '\'');
        }
        res.status(response.statusCode).send(response.statusMessage);
    });
//  Alternatively, send a response code directly to the webhook server without forwarding to slack
//    res.status(200).send(req.body);

});

app.use('/webhook-server', router);
app.listen(PORT);
console.log('Webhook Server started... port: ' + PORT);
