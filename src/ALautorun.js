var working_dir = null;

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

var relative_pos_cache={};
var HTML_PATH = null;

var AL_TIMEOUT = 2000;
var AL_RETRY_LIMIT = 3;

var loggingLibrary = null;

var session_id = null;
var user_guid = null;

var HTML_name = null;
var BRD_name = null

var interactive = null;


CTATGuid = {s4:function s4() {
  return Math.floor((1 + Math.random()) * 65536).toString(16).substring(1);
}, guid:function guid() {
  return this.s4() + this.s4() + "-" + this.s4() + "-" + this.s4() + "-" + this.s4() + "-" + this.s4() + this.s4() + this.s4();
}};

// Special REST call to killable_server.py server
function kill_this(data){
    // ''' Sends a request to kill the server where this is running.'''
    $.ajax({
        type: "QUIT",
        url: window.location.origin,
        data: data,
        dataType: "text",
    });
}

function term_print(data){
    // ''' Prints back to the terminal that this was started in.'''
    $.ajax({
        type: "PRINT",
        url: window.location.origin,
        data: data,
        dataType: "text",
    });
}

// https://stackoverflow.com/questions/10024469/whats-the-best-way-to-retry-an-ajax-request-on-failure-using-jquery
function ajax_retry_on_error(xhr, textStatus, errorThrown) {
    // ''' An error handler that retries a few times to talk to the AL server before giving up.'''
    // if(xhr.status != 200){
        // var error = "AL failed with code " + xhr.status +" (" + textStatus + ").";
        // console.error(error);

        // kill_this(null, error);    
    // }else{
    // if (textStatus == 'timeout') {
        console.log("ISSUE OCCURED" ,this.tryCount, this.retryLimit);
        // alert("ISSUE OCCURED" ,this.tryCount, this.retryLimit);
        this.tryCount++;
        if (this.tryCount <= this.retryLimit) {
            //try again
            $.ajax(this);
            return;
        }
        var error = "AL failed with code " + xhr.status +" (" + textStatus + ").";
        console.error(error);

        kill_this(error);            
        return;
    // }
    
}


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

        // async: true,
        // timeout: AL_TIMEOUT,
        retryLimit : AL_RETRY_LIMIT,
        tryCount : 0,
        error: ajax_retry_on_error,

        success: function(resp) {
            if(callback){
            	callback(resp);
            }
        },
        
    });
}

function post_next_example(){
	
	// console.log(graph);

    apply_hint()
	
	//SELECT SAI AMONG OPTIONS
	var sai = graph.getExampleTracer().getBestNextLink().getDefaultSAI();


    console.log("%cEXAMPLE: " + sai.getSelection() + " -> " + sai.getInput(), 'color: #2222bb; background: #DDDDDD;');
    term_print('\x1b[0;33;44m' + "EXAMPLE: " + sai.getSelection() + " -> " + sai.getInput() + '\x1b[0m')
    


	sai_data = {
		selection: sai.getSelection(),
		action: sai.getAction(),
		inputs: {value: sai.getInput()},
		state: get_state(),
		reward: 1
	};

	apply_sai(sai_data);

    var elm = iframe_content.document.getElementById(sai.getSelection())
    console.log(elm.firstElementChild);
    elm.firstElementChild.setAttribute("class", "CTAT--example");
    console.log(elm.firstElementChild);


	// console.log(sai_data);
	send_training_data(sai_data);
	
}

function propose_sai(sai){
    var comp = iframe_content.CTATShellTools.findComponent(sai.selection)[0];
    var elm = iframe_content.document.getElementById(sai.selection);
    console.log(comp);
    var sai_obj =  new iframe_content.CTATSAI(sai.selection, sai.action,sai.inputs["value"]);
    comp.executeSAI(sai_obj);
    comp.setEnabled(false);

    elm.firstElementChild.setAttribute("class", "CTAT--AL_highlight");
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

function apply_hint(){

    message = "<message><properties>" +
                    "<MessageType>InterfaceAction</MessageType>" +
                    "<Selection><value>hint</value></Selection>" +
                    "<Action><value>ButtonPressed</value></Action>" +
                    "<Input><value><![CDATA[hint request]]></value></Input>" +
                "</properties></message>";
    // console.log("MESSAGE",message);
    commLibrary.sendXML(message);   
}

// Cr1Str1.addEventListener(CTAT.Component.Base.Tutorable.EventType.action, function(){ alert("Hello World!");});


function handle_user_example(evt){
    var sai = evt.detail.sai

    console.log("%cUSER_EXAMPLE: " + sai.getSelection() + " -> " + sai.getInput(), 'color: #2222bb; background: #DDDDDD;');
    term_print('\x1b[0;33;44m' + "USER_EXAMPLE:" + sai.getSelection() + " -> " + sai.getInput() + '\x1b[0m')
    iframe_content.document.removeEventListener(CTAT_ACTION, handle_user_example);
    iframe_content.document.getElementById("done").removeEventListener("click", _done_clicked); 

    sai_data = {
        selection: sai.getSelection(),
        action: sai.getAction(),
        inputs: {value: sai.getInput()},
        state: state,
        reward: 1
    };

    // apply_sai(sai_data);
    var elm = iframe_content.document.getElementById(sai.getSelection())
    var comp = iframe_content.CTATShellTools.findComponent(sai.getSelection())[0];
    comp.setEnabled(false);
    // elm.contentEditable = "false";
    console.log(elm.firstElementChild);
    elm.firstElementChild.setAttribute("class", "CTAT--example");
    console.log(elm.firstElementChild);


    // console.log(sai_data);
    send_training_data(sai_data);
}

function handle_user_feedback_correct(evt){
    console.log("%cCORRECT:" + last_action.selection + " -> " + last_action.inputs.value, "color: #009922; background: #DDDDDD;");
    term_print('\x1b[0;30;42m' + "CORRECT:" + last_action.selection + " -> " + last_action.inputs.value + '\x1b[0m')
    document.getElementById("yes_button").removeEventListener("click", handle_user_feedback_correct);
    document.getElementById("no_button").removeEventListener("click", handle_user_feedback_incorrect);

    var elm = iframe_content.document.getElementById(last_action.selection)
    elm.firstElementChild.setAttribute("class", "CTAT--correct");
    var comp = iframe_content.CTATShellTools.findComponent(last_action.selection)[0];
    comp.setEnabled(false);

    send_feedback(1);
}

function handle_user_feedback_incorrect(evt){
    console.log("%cINCORRECT: " + last_action.selection + " -> " + last_action.inputs.value, "color: #bb2222; background: #DDDDDD;");
    term_print('\x1b[0;30;41m' + "INCORRECT: " + last_action.selection + " -> " + last_action.inputs.value + '\x1b[0m')
    document.getElementById("yes_button").removeEventListener("click", handle_user_feedback_correct);
    document.getElementById("no_button").removeEventListener("click", handle_user_feedback_incorrect);

    var elm = iframe_content.document.getElementById(last_action.selection)
    elm.firstElementChild.setAttribute("class", "CTAT--incorrect");
    var comp = iframe_content.CTATShellTools.findComponent(last_action.selection)[0];
    comp.setEnabled(true);


    send_feedback(-1);
}

function handle_correct(evt){
	console.log("%cCORRECT:" + last_action.selection + " -> " + last_action.inputs.value, "color: #009922; background: #DDDDDD;");
    term_print('\x1b[0;30;42m' + "CORRECT:" + last_action.selection + " -> " + last_action.inputs.value + '\x1b[0m')
	currentElement.removeEventListener(CTAT_CORRECT, handle_correct);
	currentElement.removeEventListener(CTAT_INCORRECT, handle_incorrect);
	currentElement = null;
	send_feedback(1);
}

function handle_incorrect(evt){
	console.log("%cINCORRECT: " + last_action.selection + " -> " + last_action.inputs.value, "color: #bb2222; background: #DDDDDD;");
    term_print('\x1b[0;30;41m' + "INCORRECT: " + last_action.selection + " -> " + last_action.inputs.value + '\x1b[0m')
	currentElement.removeEventListener(CTAT_CORRECT, handle_correct);
	currentElement.removeEventListener(CTAT_INCORRECT, handle_incorrect);
	currentElement = null;
	send_feedback(-1);
}

function singal_done(){
	console.log("DONE!");
    serve_next_problem();
}



function send_feedback(reward){
	if (last_action === null) {
        console.log('error. cannot give feedback on no action.');
    }
    var data = last_action;
    data.state = state;
    data.reward = reward;

    send_training_data(data);
}

function send_training_data(sai_data) {


    // loggingLibrary.logResponse (transactionID,"textinput1","UpdateTextField","Hello World","RESULT","CORRECT","You got it!");

	$.ajax({
        type: 'POST',
        url: AL_URL + '/train/' + agent_id + '/',
        data: JSON.stringify(sai_data),
        contentType: "application/json; charset=utf-8",

        // async: true,
        // timeout: AL_TIMEOUT,
        retryLimit : AL_RETRY_LIMIT,
        tryCount : 0,
        error: ajax_retry_on_error,

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

function query_user_feedback(){
    document.getElementById("prompt_text").innerHTML = "Is the <span style='color: #9932CC'>highlighted</span> input correct for the next step?"
    document.getElementById("yes_button").setAttribute("class", "yes_button");
    document.getElementById("no_button").setAttribute("class", "no_button");
    document.getElementById("yes_button").addEventListener("click", handle_user_feedback_correct);
    document.getElementById("no_button").addEventListener("click", handle_user_feedback_incorrect);
}

//I REALLY SHOULD"T NEED THIS BECAUSE DONE SHOULD BE PROPAGATED W/ CTAT_ACTION
function _done_clicked(evt){
    handle_user_example({detail:{sai:new iframe_content.CTATSAI("done", "ButtonPressed", "-1")}})
}

function query_user_example(){
    document.getElementById("prompt_text").innerHTML = "Demonstrate the next step."
    document.getElementById("yes_button").setAttribute("class", "hidden");
    document.getElementById("no_button").setAttribute("class", "hidden");

    iframe_content.document.addEventListener(CTAT_ACTION, handle_user_example); 
    iframe_content.document.getElementById("done").addEventListener("click", _done_clicked); 
       
//     iframe_content.CTATCommShell.commShell.addGlobalEventListener({processDone: function (anEvent, aMessage) { if (anEvent=="DonePressed"){}
//     {
//       alert ("Start state finished, tutor ready for input");
//     }
//   }
// };);   
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
    console.log("STATE",state);

    // console.log("QUERY!");


    $.ajax({
        type: 'POST',
        url: AL_URL + '/request/' + agent_id + '/',
        crossdomain : true,
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8",
        dataType: 'json',

        // async: true,
        // timeout: AL_TIMEOUT,
        retryLimit : AL_RETRY_LIMIT,
        tryCount : 0,
        error: ajax_retry_on_error,

        success: function(resp) {
            if (jQuery.isEmptyObject(resp)) {
                if(interactive){
                    query_user_example();
                }else{
                    post_next_example();    
                }
                
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
                    console.log("STATE",state)

                    if(interactive){
                        query_user_feedback()
                        propose_sai(resp) 
                    }else{
                        currentElement.addEventListener(CTAT_CORRECT, handle_correct);
                        currentElement.addEventListener(CTAT_INCORRECT, handle_incorrect);    
                        apply_sai(resp);    
                    }
                    
                    
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


function get_state(encode_relative=true,strip_offsets=true){
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
            obj["offsetWidth"] = element.offsetWidth;
    		obj["offsetHeight"] = element.offsetHeight;


    		obj["id"] = element.id;

    		if(checkTypes(element, ["CTATTextInput","CTATComboBox"])){
    			obj["value"] = element.firstElementChild.value;
    			obj["contentEditable"] = (element.firstElementChild.contentEditable == 'true');
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
    		state_json["?ele-" + element.id] = obj;
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


    
    // Gets lists of elements that are to the left, right and above the current element
    if(encode_relative){
        elm_list = Object.entries(state_json);
        console.log(elm_list.length);

        if(! (HTML_PATH in relative_pos_cache) ){
            var rel_objs = {};
            for (var i = 0; i < elm_list.length; i++) {
                rel_objs[elm_list[i][0]] = {
                    "to_left" : [],
                    "to_right" : [],
                    "above" : [],
                    "below" : []
                }
            }

            for (var i = 0; i < elm_list.length; i++) {
                for (var j = 0; j < elm_list.length; j++) {
                    if(i != j){
                        var [a_n, a_obj] = elm_list[i];
                        var [b_n, b_obj] = elm_list[j];
                        if(a_obj.offsetTop > b_obj.offsetTop 
                            && a_obj.offsetLeft < b_obj.offsetLeft + b_obj.offsetWidth
                            && a_obj.offsetLeft + a_obj.offsetWidth > b_obj.offsetLeft){

                            var dist = a_obj.offsetTop-b_obj.offsetTop;
                            rel_objs[a_n]["above"].push([b_n, dist]);
                            rel_objs[b_n]["below"].push([a_n, dist]);
                        }
                        if(a_obj.offsetLeft < b_obj.offsetLeft 
                            && a_obj.offsetTop + a_obj.offsetHeight > b_obj.offsetTop
                            && a_obj.offsetTop < b_obj.offsetTop + b_obj.offsetHeight){

                            var dist = b_obj.offsetLeft-a_obj.offsetLeft;
                            rel_objs[a_n]["to_right"].push([b_n, dist]);
                            rel_objs[b_n]["to_left"].push([a_n, dist]);

                        }
                    }
                }
            }

            var grab1st = function(x){return x[0];};
            var compare2nd = function(x,y){return x[1] > y[1];};
            for (var i = 0; i < elm_list.length; i++) {
                var rel_obj = rel_objs[elm_list[i][0]];
                rel_obj["below"] = rel_obj["below"].sort(compare2nd).map(grab1st).join(' '); 
                rel_obj["above"] = rel_obj["above"].sort(compare2nd).map(grab1st).join(' '); 
                rel_obj["to_right"] = rel_obj["to_right"].sort(compare2nd).map(grab1st).join(' '); 
                rel_obj["to_left"] = rel_obj["to_left"].sort(compare2nd).map(grab1st).join(' '); 
            }
            

            relative_pos_cache[HTML_PATH] = rel_objs;
        }else{
            for (var i = 0; i < elm_list.length; i++) {
                var obj = state_json[elm_list[i][0]];
                var rel_obj = relative_pos_cache[HTML_PATH][elm_list[i][0]];
                obj["below"] = rel_obj["below"];
                obj["above"] = rel_obj["above"];
                obj["to_right"] = rel_obj["to_right"];
                obj["to_left"] = rel_obj["to_left"];
                if(strip_offsets){
                    delete obj["offsetTop"];
                    delete obj["offsetLeft"];
                    delete obj["offsetWidth"];
                    delete obj["offsetHeight"];
                }

                state_json[elm_list[i][0]] = obj;
            }
        }


    }

    // console.log(state_json);
    return state_json;

}

// function initLogging(){
//     var conf = iframe_content.CTATConfiguration;

//     if(session_id == null){
//         session_id = conf.get("session_id");
//         user_guid = "Stu_" + iframe_content.CTATGuid.guid();
//     }

    
//     conf.set("session_id", session_id);
//     conf.set("log_service_url", window.location.origin);
//     conf.set("SessionLog", "true");
//     conf.set("Logging", "ClientToLogServer");
//     // conf.set("dataset_name", "HTML5LoggingTest");
//     conf.set("dataset_level_name1", HTML_name);
//     conf.set("dataset_level_type1", "Domain");
//     // conf.set("dataset_level_name1", "Unit1.0");
//     // conf.set("dataset_level_type1", "unit");
//     // // conf.set("dataset_level_name2", "Section1.0");
//     // conf.set("dataset_level_type2", "section");
//     conf.set("problem_name", HTML_name + " " + BRD_name);
//     // conf.set("school_name", "CMU");
//     // conf.set("instructor_name", "A Teacher Name");
//     conf.set("user_guid", user_guid);
//     // conf.set("class_name", "22-512");
    
   
//     loggingLibrary = iframe_content.CTATCommShell.commShell.getLoggingLibrary();//new iframe_content.CTATLoggingLibrary (true);
//     var cl = loggingLibrary.getLoggingCommLibrary();
//     cl.setFixedURL(window.location.origin);

//     loggingLibrary.setUseDebugging(true);
//     // loggingLibrary.setProblemName("THE PROBLEM NAME")
        
//     loggingLibrary.start();
//     term_print("\n --- HERE --- \n");
    
//     // loggingLibrary.startProblem();

//     term_print("\n --- DONE --- \n");

//     console.log("LOGGING LIB", loggingLibrary);    



    
// }

function runWhenReady(){
    // console.log("DEEEE", CTAT);
    if(typeof iframe_content.CTAT == "undefined" || iframe_content.CTAT == null){
        window.setTimeout(runWhenReady, 100);
        return;       
    }
	graph = iframe_content.CTAT.ToolTutor.tutor.getGraph();
    commLibrary = iframe_content.CTATCommShell.commShell.getCommLibrary();
	hasConfig = iframe_content.CTATConfiguration != undefined
	if(graph && commLibrary && hasConfig){

        // if(interactive){
        //     graph.hideAllFeedback();
        // }
        //Initialize session
        // if(session_id == null){
        //     var conf = iframe_content.CTATConfiguration;
        //     session_id = conf.get("session_id");
        //     // user_guid = "Stu_" + iframe_content.CTATGuid.guid();
        //     conf.set("user_guid", user_guid);
        // }
        // conf.set("session_id", session_id);

        // ADD CSS FOR EXAMPLES
        var link = iframe_content.document.createElement('link');
        link.setAttribute('rel', 'stylesheet');
        link.setAttribute('type', 'text/css');
        link.setAttribute('href', '../../css/AL_colors.css');
        iframe_content.document.getElementsByTagName('head')[0].appendChild(link);

        //Gets rid of annyoing sai printout on every call to sendXML
        iframe_content.flashVars.setParams({"deliverymode" : "bleehhhh"})

        //Grab these event constants from CTAT
        CTAT_CORRECT = iframe_content.CTAT.Component.Base.Tutorable.EventType.correct;
        CTAT_INCORRECT = iframe_content.CTAT.Component.Base.Tutorable.EventType.incorrect;
        CTAT_ACTION = iframe_content.CTAT.Component.Base.Tutorable.EventType.action;    

		query_apprentice();
	}else{
		window.setTimeout(runWhenReady, 100);		
	}
	
}


function serve_next_training_set(){
    console.log("TRAINING ITERATOR", training_iterator.length);
    if(training_iterator.length > 0){
        var out = training_iterator.shift();
        var name = out[0];
        console.log("START TRAINING SET: ", name);
        agent_iterator = out[1];
        serve_next_agent();
    }else{
        console.log("ITS ALL DONE!");
        kill_this("\n TRAINING FINISHED SUCCESSFULLY! \n");
    }
}

function serve_next_agent(){
    console.log("AGENT ITERATOR", agent_iterator.length);
    if(agent_iterator.length > 0){

        session_id = null;
        user_guid = null;

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

//https://stackoverflow.com/questions/21698906/how-to-check-if-a-path-is-absolute-or-relative
function isAbsPath(path){
    if (navigator.appVersion.indexOf("Win")!=-1){
        var splitDeviceRe =
    /^([a-zA-Z]:|[\\\/]{2}[^\\\/]+[\\\/]+[^\\\/]+)?([\\\/])?([\s\S]*?)$/;
        var result = splitDeviceRe.exec(path),
        device = result[1] || '',
        isUnc = device && device.charAt(1) !== ':';
        // UNC paths are always absolute
        return !!result[2] || isUnc;
    }else{
        return path.charAt(0) === '/';
    }
}

function serve_next_problem(){
    console.log("PROBLEM ITERATOR", problem_iterator.length);

    if(problem_iterator.length > 0){
        var prob_obj = problem_iterator.shift();

        HTML_name = prob_obj["HTML"].substring(prob_obj["HTML"].lastIndexOf('/')+1).replace(".html", "");
        

        // Point the iframe to the HTML and question_file (brd or nools) for the next problem

        iframe_content.CTAT = null;
        iframe_content.CTATCommShell = null;



        HTML_PATH = prob_obj["HTML"];
        if(!isAbsPath(HTML_PATH)){
            HTML_PATH = working_dir + "/" + HTML_PATH  
        }
        console.log("working_dir: ", working_dir)
        console.log("HTML_PATH: ", HTML_PATH)


        if(session_id == null){
            user_guid = "Stu_" + CTATGuid.guid();
            session_id = CTATGuid.guid();
        }

        qf_exists = prob_obj["question_file"] != undefined && prob_obj["question_file"].toUpperCase() != "INTERACTIVE";
        if(qf_exists){
            BRD_name = prob_obj["question_file"].substring(prob_obj["question_file"].lastIndexOf('/')+1).replace(".brd", "").replace(".nools", "");  
        }else{
            BRD_name = "INTERACTIVE"
        }

        qf = qf_exists  ? {"question_file" : prob_obj["question_file"]} : {}//{"question_file" : "src/empty.nools"} ;
        logging_params = {
            "problem_name": BRD_name,
            "dataset_level_name1" : HTML_name,
            "dataset_level_type1" : "Domain",
            "SessionLog" : "true",
            "Logging" : "ClientToLogServer",
            "log_service_url" : window.location.origin,
            "user_guid" : user_guid,
            "session_id" : session_id
        };
        params = Object.assign({},qf,logging_params) //Merge dictionaries
        
        iframe.src = HTML_PATH + "?" + jQuery.param( params );


        runWhenReady();
    }else{
        serve_next_agent();
    }
}

function load_training_file(training_file){
    
    

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
        var error  = training_file + " not valid json.";

        console.log(error);
        console.log(textStatus);
        console.log(errorThrown);
        kill_this(error);
    });





    // window.setTimeout(runWhenReady, 100);   
    

}

function main() {
    iframe = document.getElementById("tutor_iframe")
    iframe_content = iframe.contentWindow

    // Grab the the path to the training .json file and the url for the AL server from the query string
    var urlParams = new URLSearchParams(window.location.search);
    var training_file = urlParams.get('training');
    var tutor_interface = urlParams.get('tutor_interface');
    interactive = urlParams.get('interactive') == "true";
    working_dir = urlParams.get('wd');

    AL_URL = urlParams.get('al_url');
    verbosity = urlParams.get('verbosity') || 0;

    if(!training_file){console.error('training must be set in url query <CTAT URL>?training=<myfile>.json');return;};
    if(!AL_URL){console.error('al_url must be set in url query <CTAT URL>?al_url=<url of AL server>'); return;};

    if(working_dir == null){
        match = training_file.match(/(.*)[\/\\]/)
        working_dir =  !!match ? match[1] : ''; //The directory of the training.json
    }

    if(interactive){
        document.getElementById("prompt_text").setAttribute("class", "prompt_text");
    }

    console.log("INTERACTIVE:",interactive)

    

    console.log("Connecting to AL at: " + AL_URL);

    load_training_file(training_file)
}




// START IT
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




