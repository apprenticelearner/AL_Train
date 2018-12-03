var agent_id = null;
var state = null;
var current_task = null;
var last_action = null;
var lastButtonList = null;
var AL_URL = null;//'http://localhost:8000';
var graph = null;
var commLibrary = null;
var currentElement = null;
var cache = null;
var project_id = 1;//"DEFAULT_PROJECT";

var iframe = null;
var iframe_content = null;

var training_json = null;
var training_iterator = null;
var agent_iterator = null;
var problem_iterator = null;
// var agent_type = "WhereWhenHowNoFoa";

var CTAT_CORRECT = null;
var CTAT_INCORRECT = null;

var verbosity = 0;


function create_agent(callback,agent_name, agent_type){
	$.ajax({
            type: "POST",
            url: AL_URL + '/create/',
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify({
                'name': agent_name,
                'agent_type': agent_type,
                'project_id': project_id
            }),
            success: function(resp) {
                if(callback){
                	callback(resp);
                }
            }
        });
}

function post_next_example(){
	
	// console.log(graph);
	
	//SELECT SAI AMONG OPTIONS
	var sai = graph.getExampleTracer().getBestNextLink().getDefaultSAI();

    console.log("%cEXAMPLE: " + sai.getSelection() + " -> " + sai.getInput(), 'color: #2222bb; background: #DDDDDD;');


	sai_data = {
		selection: sai.getSelection(),
		action: sai.getAction(),
		inputs: {value: sai.getInput()},
		state: get_state(),
		reward: 1
	};

	apply_sai(sai_data);

	// console.log(sai_data);
	send_training_data(sai_data);
	
}


function apply_sai(sai){

	message = "<message><properties>" +
					"<MessageType>InterfaceAction</MessageType>" +
					"<Selection><value>"+ sai.selection + "</value></Selection>" +
					"<Action><value>" + sai.action + "</value></Action>" +
					"<Input><value><![CDATA["+ sai.inputs["value"] +"]]></value></Input>" +
				"</properties></message>";
	// console.log("MESSAGE",message);
	commLibrary.sendXML(message); 	
}

// Cr1Str1.addEventListener(CTAT.Component.Base.Tutorable.EventType.action, function(){ alert("Hello World!");});

function handle_correct(evt){
	console.log("%cCORRECT:" + last_action.selection + " -> " + last_action.inputs.value, "color: #009922; background: #DDDDDD;");
	currentElement.removeEventListener(CTAT_CORRECT, handle_correct);
	currentElement.removeEventListener(CTAT_INCORRECT, handle_incorrect);
	currentElement = null;
	send_feeback(1);
}

function handle_incorrect(evt){
	console.log("%cINCORRECT: " + last_action.selection + " -> " + last_action.inputs.value, "color: #bb2222; background: #DDDDDD;");
	currentElement.removeEventListener(CTAT_CORRECT, handle_correct);
	currentElement.removeEventListener(CTAT_INCORRECT, handle_incorrect);
	currentElement = null;
	send_feeback(-1);
}

function singal_done(){
	console.log("DONE!");
    serve_next_problem();
}



function send_feeback(reward){
	if (last_action === null) {
        console.log('error. cannot give feedback on no action.');
    }
    var data = last_action;
    data.state = state;
    data.reward = reward;

    send_training_data(data);
}

function send_training_data(sai_data) {
	$.ajax({
        type: 'POST',
        url: AL_URL + '/train/' + agent_id + '/',
        data: JSON.stringify(sai_data),
        contentType: "application/json; charset=utf-8",
        success: function(resp) {
            if(verbosity > 0) console.log('training received.');
            // console.log(sai_data);

            //If correctly pushed done then problem finished otherwise query again.
            if(sai_data.selection === "done" && sai_data.reward > 0){
            	singal_done();
            }else{
            	query_apprentice();	
            }
        }
    });
}



// // https://stackoverflow.com/questions/11616630/json-stringify-avoid-typeerror-converting-circular-structure-to-json/11616993
// function customReplacer(key, value) {
//     if (typeof value === 'object' && value !== null) {
//     	console.log(value);
//         if (cache.indexOf(value) !== -1) {
//             // Duplicate reference found
//             try {
//                 // If this value does not reference a parent it can be deduped
//                 return JSON.parse(JSON.stringify(value));
//             } catch (error) {
//                 // discard key if value cannot be deduped
//                 return;
//             }
//         }
//         // Store value in our collection
//         cache.push(value);
//     }
//     return value;
// }

// function customStringifiy(value){
// 	cache = [];
// 	var out = JSON.stringify(value);
// 	cache = null;
// 	return out;
// }


function query_apprentice() {
    if (agent_id == null) {
        return;
    }

    if(verbosity > 0) console.log('querying agent');

    state = get_state();

    var data = {
        'state': state
    }
    // console.log("STATE",state);

    // console.log("QUERY!");


    $.ajax({
        type: 'POST',
        url: AL_URL + '/request/' + agent_id + '/',
        crossdomain : true,
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8",
        dataType: 'json',
        success: function(resp) {
            if (jQuery.isEmptyObject(resp)) {
                post_next_example();
            } else {
            	last_action = resp;

                if(verbosity > 0) console.log('action to take!');
                // console.log("RESPONSE: ", resp);
                currentElement = iframe_content.document.getElementById(resp.selection);
                // console.log(resp)
                if(!currentElement){
                	console.log("Element " +resp.selection +" does not exist, providing example instead.");
                    alert("THIS HAPPENED... SO WE NEED TO ACTUALLY IMPLEMENT THIS.");
                }else{
                    currentElement.addEventListener(CTAT_CORRECT, handle_correct);
                    currentElement.addEventListener(CTAT_INCORRECT, handle_incorrect);
                    apply_sai(resp);    
                }
                
                // query_user_feedback(resp);
            }
        },
        // error: function (resp){
        // 	create_agent(query_apprentice);
        // }
    });
}

function checkTypes(element, types){
	var ok = false;
	for (var i = types.length - 1; i >= 0; i--) {
		var type = types[i];
		if(element.classList.contains(type)) ok = true;
	}
	return ok;
}


function get_state(){
    var state_array = iframe_content.$('div').toArray();
    // state_array.push({current_task: current_task});

    var state_json = {}
    var count = 0;
    $.each(state_array, function(idx, element){

    	obj = {}
    	if(element.classList.contains("CTATComponent")) {
    		obj["className"] = element.classList[0];
    		obj["offsetParent"] = element.offsetParent.dataset.silexId;
    		obj["offsetLeft"] = element.offsetLeft;
    		obj["offsetTop"] = element.offsetTop;


    		obj["id"] = element.id;

    		if(checkTypes(element, ["CTATTextInput","CTATComboBox"])){
    			obj["value"] = element.firstElementChild.value;
    			obj["contentEditable"] = element.firstElementChild.contentEditable;
    		}
    		// if(checkTypes(element, ["CTATTextField", "CTATComboBox"])){
    		// 	obj["textContent"] = element.textContent;
    		// }

    		if(checkTypes(element, ["CTATComboBox"])){
    			// if(element.options){
    				//Probably not the best
    			var options = element.firstElementChild.options;
    			var temp = [];
    			for (var i = 0; i < options.length; i++) {
    				temp.push(options[i].text);
    			}
    			obj["options"] = Object.assign({}, temp)

    			// }
    			
    		}
    		state_json["?ele-" + count] = obj;
	        count++;
    	}
        // add question marks for apprentice
        // element = jQuery.extend({}, element);
        // element = jQuery.data(element);
        // if(element && !jQuery.isEmptyObject(element) && element.CTATComponent){
        // 	console.log("ELEEMENT", element);
        // 	// element = jQuery.data(element.CTATComponent);
        // 	element = element.CTATComponent;
        // 	// if(element.CTATComponent){
        // 		// element.CTATComponent = jQuery.data(element.CTATComponent);
        // 	// }
        // 	console.log("KEY ", idx, element.className);
	       //  state_json["?ele-" + idx] = element;
	       //  count++;
        // }
        
        // element.component = jQuery.data(element.component);
        

        // if(element.hasAttribute("removeData") ){
        // 	element.removeData();
        // 	console.log("WOOOPS");
        // }

    });

    return state_json;

}

function runWhenReady(){
    // console.log("DEEEE", CTAT);
    if(typeof iframe_content.CTAT == "undefined" || iframe_content.CTAT == null){
        window.setTimeout(runWhenReady, 100);
        return;       
    }
	graph = iframe_content.CTAT.ToolTutor.tutor.getGraph();
	commLibrary = iframe_content.CTATCommShell.commShell.getCommLibrary();
	if(graph && commLibrary){

        //Gets rid of annyoing sai printout on every call to sendXML
        iframe_content.flashVars.setParams({"deliverymode" : "bleehhhh"})

        //Grab these event constants from CTAT
        CTAT_CORRECT = iframe_content.CTAT.Component.Base.Tutorable.EventType.correct;
        CTAT_INCORRECT = iframe_content.CTAT.Component.Base.Tutorable.EventType.incorrect;    

		query_apprentice();
	}else{
		window.setTimeout(runWhenReady, 100);		
	}
	
}


function serve_next_training_set(){
    console.log(training_iterator);
    if(training_iterator.length > 0){
        var out = training_iterator.shift();
        var name = out[0];
        console.log("START TRAINING SET: ", name);
        agent_iterator = out[1];
        serve_next_agent();
    }else{
        console.log("ITS ALL DONE!");
    }
}

function serve_next_agent(){
    console.log(agent_iterator);
    if(agent_iterator.length > 0){
        var agent_obj = agent_iterator.shift();
        console.log("CREATING AGENT", agent_obj["agent_name"]);
        var callback = function(resp){
            agent_id = resp["agent_id"];
            serve_next_problem();
        }
        problem_iterator = agent_obj["problem_set"];
        create_agent(callback, agent_obj["agent_name"], agent_obj["agent_type"]);

    }else{
        serve_next_training_set();
    }
}

function serve_next_problem(){
    if(problem_iterator.length > 0){
        var prob_obj = problem_iterator.shift();

        // Point the iframe to the HTML and question_file (brd or nools) for the next problem

        iframe_content.CTAT = null;
        iframe_content.CTATCommShell = null;

        iframe.src = prob_obj["HTML"] + "?question_file=" + prob_obj["question_file"] + "&nofrm=1";
        

        runWhenReady();
    }else{
        serve_next_agent();
    }
}

function load_training_file(){
    iframe = document.getElementById("tutor_iframe")
    iframe_content = iframe.contentWindow

    var urlParams = new URLSearchParams(window.location.search);
    var training_file = urlParams.get('training');
    AL_URL = urlParams.get('al_url');

    if(!training_file){console.log('training must be set in url query <CTAT URL>?training=<myfile>.json');return;};
    if(!AL_URL){console.log('al_url must be set in url query <CTAT URL>?al_url=<url of AL server>'); return;};

    verbosity = urlParams.get('verbosity') || 0;

    console.log("Connecting to AL at: " + AL_URL);

    $.getJSON(training_file, function(tj) {
        console.log("Succssfully loaded " + training_file);

        training_json = tj;
        if(verbosity > 0) console.log("Training JSON", training_json);
        training_iterator = Object.entries(training_json);

        if(verbosity > 0) console.log(training_json);

        serve_next_training_set()

        // for (var key in training_json) {
        //     console.log("START TRAINING SET:", key);

            
        // }


    })
    .fail(function(jqXHR,textStatus,errorThrown) {
        // console.log(training_file + " not valid json.");
        console.log(textStatus);
        console.log(errorThrown);
    });





    // window.setTimeout(runWhenReady, 100);   
    

}

function main() {
    load_training_file()
}

$( window ).on("load", main);







// CTATCommShell.commShell.addEventListener("StateGraph", update_agent);
// CTATCommShell.commShell.addEventListener("StartProblem", update_agent);

// $( document ).ready(function() {
// 	console.log("I'm AL-ive", CTATTutor.tutorInitialized);
// 	CTATCommShell.commShell.addEventListener("StartProblem", update_agent);
// 	CTATCommShell.commShell.addEventListener("StateGraph", update_agent);
// 	// if(!CTATTutor.tutorInitialized){
// 	// 	const observer = new MutationObserver(update_agent);
// 	// 	observer.observe(CTATTutor.tutorInitialized);
// 	// }else{
// 	// 	update_agent();
// 	// }
// });

// console.log("HEY");




