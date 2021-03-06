/* jshint latedef: true, unused: true */
var express = require('express');
var bodyParser  = require('body-parser');
var restClient = require('node-rest-client').Client;

var PORT = (process.env.PORT || 5000);
var JIRA_TOKEN = 'I9n7AhJu87Gd0w94DzksBWLGAlgbCDzvUFB8';
var HELPSCOUT_TOKEN = 'O6VciZqkVo3YGulBNjEBF0S9vIffvB6Osr0Y'; // user123:pass789
var TRELLO_API_KEY = "161552c07fb3a105793022c82d833c5b";
var TRELLO_OAUTH_OLI_TOKEN = "d1f0ffa71bcd17757a7d852c61705e7587075315e0883d2acb4be0cc784f72a6";
var TRELLO_BOARD_ID = "5a06ed465a69fb980915f341";
var TRELLO_LIST_ID = "5c73eca72135995a3400f5bf";
var TARGET_URL = "https://api.trello.com/1/cards?key=" + TRELLO_API_KEY + "&token=" + TRELLO_OAUTH_OLI_TOKEN + "&idList=" + TRELLO_LIST_ID;
//var TARGET_URL = 'https://hooks.slack.com/services/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';
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
    var queryParams = "";

    if(token === JIRA_TOKEN) {
        queryParams = queryParams.concat("&name=",req.body.issue.key,"&desc=",req.body.issue.fields.description); 
    }

    else if (token === HELPSCOUT_TOKEN) {
        var contentPreview = req.body.preview;
        var assignee = req.body.threads[0].assignedTo.email || "info@dashthis.com";

        if (contentPreview.includes("@olivier") || assignee.includes("olivier@dashthis.com")) {
            queryParams = queryParams.concat("&name=",req.body.subject,"&desc=",contentPreview);
        }
    }

    //return ({ username: "Oli Webhooks", icon_url: te_img, text: retVal});
    return encodeURI(queryParams);
}

app.get('/', function(request, response) {
  response.send('This the OliB simple Webhook server sample.  Use POST methods instead of GET.');
  console.log('GET request received');
});

router.post('/jira/:token', function(req, res) {
    if (req.params.token !== JIRA_TOKEN) {
        res.status(401).send({ error: 'Unauthorized (from webhook)' });
        return;
    }
    console.log('Received: ' + JSON.stringify(req.body));
    var restCall = new restClient();
    var qs = translateHookContent_toTrello(req, req.params.token);
    if(qs !== 0) {
        var args = {headers:{"Content-Type": "application/json"}};
        restCall.post(TARGET_URL + qs, args, function(data,response) {
            console.log('Sending to destination URL: ' + TARGET_URL + 'with the following parameters: ' + qs);
            if (response.statusCode != 200) {
                console.log('Received response: ' + response.statusCode + ' (' + response.statusMessage + ') from destination server');
                //console.log('To test yourself, run this: \n curl -i -v \'' + TARGET_FOR_TRELLO + '\' -H ' + objToStr(args.headers) + ' -d \'' + JSON.stringify(args.data) + '\'');
            }
            res.status(response.statusCode).send(response.statusMessage);
        });
    } else {
        console.log("Empty query params and irrelevant webhook event.");
    }  
});

router.post('/helpscout/:token', function(req, res) {
    if (req.params.token !== HELPSCOUT_TOKEN) {
        res.status(401).send({ error: 'Unauthorized (from webhook)' });
        return;
    }
    console.log('Received: ' + JSON.stringify(req.body));
    var restCall = new restClient();
    var qs = translateHookContent_toTrello(req, req.params.token);
    console.log(qs);
    if(qs !== 0) {
        var args = {headers:{"Content-Type": "application/json"}};
        restCall.post(TARGET_URL + qs, args, function(data,response) {
            console.log('Sending to destination URL: ' + TARGET_URL + 'with the following parameters: ' + qs);
            if (response.statusCode != 200) {
                console.log('Received response: ' + response.statusCode + ' (' + response.statusMessage + ') from destination server');
            }
            res.status(response.statusCode).send(response.statusMessage);
        });
    } else {
        console.log("Empty query params and irrelevant webhook event.");
    } 
});

app.use('/webhook-server', router);
app.listen(PORT);
console.log('Webhook Server started... port: ' + PORT);
