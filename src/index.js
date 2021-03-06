//our global variables - primarily node libraries
var http       = require('http')
  , request    = require('request')
  , AlexaSkill = require('./AlexaSkill')
  , APP_ID     = 'amzn1.echo-sdk-ams.app.0f82ff69-f29c-499f-be38-74c8a1b58e45'
  , authorizedUsers = [
	  "amzn1.ask.account.AFP3ZWPOS2BGJR7OWJZ3DHPKMOMNWY4AY66FUR7ILBWANIHQN73QHT67AIQLELNW3B5COWYCIEZEYZSBNPZA2KR2FZ2IFUNGV6LAE6ELGWWWNHQINNHZXOKGZJREOSZX63ESOV6M7ED2VYKLIK5C3DPJ2I2FP4FTOISI5WHEEHS5MEOOGQEY5KFM5YFPAZ6QBF5GTZIGMYGBOBI"
	  ];

//constructor
var LabelPrinter = function(){
	AlexaSkill.call(this, APP_ID);
};

//extend the alexaSkill prototype
LabelPrinter.prototype = Object.create(AlexaSkill.prototype);
LabelPrinter.prototype.constructor = LabelPrinter;

//intent handlers
LabelPrinter.prototype.intentHandlers = {
	"printer": function(intent, session, response){	//when user says "print {qty} copies of {partNo}" Alexa prints the labels
		//check authorized user array for userId
		//if(authorizedUsers.indexOf(session.user.userId) > -1){	
			handleNextPrintRequest(intent, session, response);		
		/*}
		else{
			var speechOutput = "I am sorry, you are not authorized";
			response.tell(speechOutput);
		}*/
	},
	"AMAZON.StopIntent":function(intent, session, response){ //When user says, "stop" Alexa ends the session
		var speechOutput = "Ending Session";	
		response.tell(speechOutput);
	},
	"AMAZON.HelpIntent":function(intent, session, response){ //when user says, "help" Alexa offers help
		var speechOutput = "Say the name of a part number and the quantity. For example. please print two copies of six five seven three";
		var repromptOutput = "Say the name of a part and quantity that you wish to print."
		response.ask(speechOutput, repromptOutput);

	},
	"AMAZON.CancelIntent":function(intent, session, response){ //when user says, "cancel", the current intent is cancelled
		var speechOutput = "Listening for a new part number and quantity...";
		var repromptOutput = "Say the name of a part number and the quantity. For example. please print two copies of six five seven three"
		response.ask(speechOutput, repromptOutput);

	}
};

//splits number into digits and synthesizes number into speech
var synthNumber = function(number){
	var digits = number.toString().split("");
	return digits.join(" ");
}

//function in charge of posting to the URL once the part number and qty are established via the voice command
//since node runs asyncronously, the response object must be created inside the request callback function. This
//will force the URL to be hit before alexa responds which means we should always have a part number print when 
//it is supposed to.
var postToUrl = function(intent, session, responsetwo){
	//our dynamic url
	var partNo = intent.slots.partNo.value;
	var qty =  intent.slots.qty.value;
	if(parseInt(intent.slots.qty.value, 10) > 10 || parseInt(intent.slots.qty.value, 10) == 0){
		var speechOutput = "Please tell me a valid number of copies to print, I will only print up to 10 labels at a time";
		var repromptOut = "Say the name of a part number and the quantity. For example. please print two copies of six five seven three";
		responsetwo.ask(speechOutput,repromptOut);
	}
	else{
		var printUrl = function(partNo, qty){
			return "http://92068.aprsworld.com:8160/glabel/bin/?partNumber=APRS"+partNo+"&nCopies="+qty+"&printer=0";
		};
		console.log(session.user.userId);
		request(printUrl(partNo, qty), function ( error, response, body) {
			//check if error
			if(error){

				return console.log('Error:', error);	
			}
			//check for 200 status code
			if(response.statusCode !== 200){

				return console.log('Invalid Status Code Returned:', response.statusCode);
			}
			//nothing failed - print body
			var info = JSON.parse(body);
			console.log(info);

			//gets json response from URL and tells user whether part number is valid or not
			if(info[0].result === "valid"){
				//
				if(parseInt(intent.slots.qty.value, 10) === 1 || typeof parseInt(intent.slots.qty.value, 10) === "undefined" || isNaN(parseInt(intent.slots.qty.value, 10))){
					intent.slots.qty.value = 1;	
					var speechOutput = "Printing... ";
				}
				else{
					var speechOutput = "Printing... ";

				}
				var repromptOut = "Say another part Number or tell me to stop.";
				responsetwo.ask(speechOutput,repromptOut);
			}
			else{
				var speechOutput = "I'm sorry, I either did not understand you, or "+intent.slots.partNo.value+" is not a valid part." ;
				var repromptOut = "Say another part Number or tell me to stop.";
				responsetwo.ask(speechOutput,repromptOut);
			}
		});
	}
};

//print intent handler
var handleNextPrintRequest = function(intent, session, response){	
	
	var result = postToUrl( intent,session, response);	
	
};



//event handler that is called when a user has launched the skill but hasn’t specified which intent they want. 
LabelPrinter.prototype.eventHandlers.onLaunch = function(launchRequest, session, response){
	
	var output = 'Welcome!';
	var reprompt = 'Which label do you wish to print?';

	response.ask(output, reprompt);
};

exports.handler = function(event, context) {
    var skill = new LabelPrinter();
    skill.execute(event, context);
};

