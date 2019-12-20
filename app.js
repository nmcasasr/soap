/*jslint node: true */
"use strict";


var soap = require('soap');
var express = require('express');
var fs = require('fs');
var fetch = require("node-fetch");
var bodyParser = require('body-parser')

// the splitter function, used by the service
function splitter_function(args) {
    console.log('splitter_function');
    var splitter = args.splitter;
    var splitted_msg = args.message.split(splitter);
    var result = [];
    for(var i=0; i<splitted_msg.length; i++){
      result.push(splitted_msg[i]);
    }
    return {
        result: result
        }
}
function getEventsByType(args){
  console.log('get events by type');
  var type = args.type;
  var event = [];
  return fetch("http://162.243.164.26:1337/events/type/"+type).then(res => res.json())
  .then(data =>{
    console.log(data[1]);
    var event = [];
    for(var i=0; i<data.length; i++){
      event.push( {
        id: data[i].id,
        name:data[i].name,
        date:data[i].date,
        description:data[i].description,
        location:data[i].location,
        type:data[i].type
        });
      }
      return event;
      });
}

function getEventByID(args){
  console.log('get event by id');
  var id = args.id;
  var response; 
  return fetch("http://162.243.164.26:1337/events/find/"+id).then(res => res.json())
  .then(data =>{
    console.log(data);
    response=data;
    return {
      id: data.id,
      name:data.name,
      date:data.date,
      description:data.description,
      location:data.location,
      type:data.type
      }
  })
}

// the service
var serviceObject = {
  MessageSplitterService: {
        MessageSplitterServiceSoapPort: {
            MessageSplitter: splitter_function,
            EventsByType: getEventsByType,
            EventByID: getEventByID
        },
        MessageSplitterServiceSoap12Port: {
            MessageSplitter: splitter_function,
            EventsByType: getEventsByType,
            EventByID: getEventByID
        }
  }
};

// load the WSDL file
var xml = fs.readFileSync('service.wsdl', 'utf8');
// create express app
var app = express();
app.use(bodyParser.json());

// Launch the server and listen
var port = 8000;
app.listen(port, function () {
  console.log('Listening on port ' + port);
  var wsdl_path = "/wsdl";
  soap.listen(app, wsdl_path, serviceObject, xml);
  console.log("Check http://localhost:" + port + wsdl_path +"?wsdl to see if the service is working");
  
app.post('/event', function (req, res) {
 // console.log(req.body.employee.name);
  var url = 'http://35.224.55.174:4008/wsevents/action';
  var wsdlURL = 'http://35.224.55.174:4008/wsevents/wsdl';
  soap.createClient(wsdlURL,url, function (err, client) {
    if (err){
      throw err;
    }
    console.log(req.body)
    var args = {
      subject: req.body.name,
      description: req.body.description,
      date: req.body.date ,
      entityId: req.body.location
    };
    // call the service
    console.log(args);
    client.createEvent(args, function (err, res) {
      if (err)
        throw err;
        // print the service returned result
      console.log('respuesta',res); 
    });
  });


  res.send('[POST]Saludos desde express');
});
});