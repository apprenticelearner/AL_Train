var working_dir = null;

var agent_id = null;
var state = null;
var current_task = null;
var last_action = null;
var last_correct = true;
var lastButtonList = null;
var AL_URL = null;//'http://localhost:8000';
var OUTER_LOOP_URL = null;//'http://localhost:8000';
var use_outer_loop_controller = false;
var graph = null;
var commLibrary = null;
var currentElement = null;
var current_sai_data = null;
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

var EXAMPLES_ONLY = false;
var TEST_MODE = false;

var file_params = {};
var training_set_params = {};
var agent_params = {};

var agent_description = "";

var request_history = [];

var free_authoring = false;

var start_state_elements =[];
var start_state_history =[];



CTATGuid = {s4:function s4() {
  return Math.floor((1 + Math.random()) * 65536).toString(16).substring(1);
}, guid:function guid() {
  return this.s4() + this.s4() + "-" + this.s4() + "-" + this.s4() + "-" + this.s4() + "-" + this.s4() + this.s4() + this.s4();
}};

// Special REST call to killable_server.py server
function kill_this(message,type="info"){
    // ''' Sends a request to kill the server where this is running.'''
    $.ajax({
        type: "QUIT",
        url: window.location.origin,
        data: JSON.stringify({"message":message,
               "type":type}),
        dataType: "text",
    });
}

function term_print(message,type){
    // ''' Prints back to the terminal that this was started in.'''
    // handles types of CORRECT, INCORRECT, INfO, WARNING, ERROR
    $.ajax({
        type: "PRINT",
        url: window.location.origin,
        data: JSON.stringify({"message":message,
               "type":type}),
        dataType: "json",
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
        var server_target = "unknown target"
        switch (this.url){
            case AL_URL:
                server_target = "AL"
                break;
            case OUTER_LOOP_URL:
                server_target = "OUTER LOOP"
                break;
        }

        console.log(this.type + " " + this.url + "\n" +
                    "DATA:" + this.data + "\n" + 
                    "FAILED. Attempt: " 
                     + this.tryCount + "/" + this.retryLimit);
        // alert("ISSUE OCCURED" ,this.tryCount, this.retryLimit);
        this.tryCount++;
        if (this.tryCount <= this.retryLimit) {
            //try again
            var ajax_contents = this;
            setTimeout(function(){
                $.ajax(ajax_contents);
            }, 1000);
            return;
        }
        var error = server_target + " failed with code " + xhr.status +" (" + textStatus + ").";
        console.error(error);
        // term_print('\x1b[0;30;47m' + error + '\x1b[0m');
        term_print(error, 'ERROR');

        kill_this(error);            
        return;
    // }
    
}


function create_agent(callback,agent_name, agent_type, otherdata={}){
    data_dict = {
            'name': agent_name,
            'agent_type': agent_type,
            'project_id': project_id
        }
    data_dict = {...otherdata, ...data_dict}

    $.ajax({
        type: "POST",
        url: AL_URL + '/create/',
        dataType: "json",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(data_dict),

        // async: true,
        // timeout: AL_TIMEOUT,
        retryLimit : AL_RETRY_LIMIT*20,
        tryCount : 0,
        error: ajax_retry_on_error,

        success: function(resp) {
        	// term_print('\x1b[0;30;47m' + "Successfully Built Agent: " + agent_name + '\x1b[0m');
            term_print("Successfully Built Agent: " + agent_name, 'INFO');
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

	sai_data = {
		selection: sai.getSelection(),
		action: sai.getAction(),
		inputs: {value: sai.getInput()},
        feedback_type : "example",
        state: state, //get_state(),
		reward: 1
	};

    last_correct = true;

    // @1 SHOULD BE READDED LATER
    if(sai_data.action == "ButtonPressed"){
        sai_data.inputs = {}
    }

    inps = sai_data.inputs['value'] || ""
    console.log("%cEXAMPLE: " + sai_data.selection + " -> " + inps, 'color: #2222bb; background: #DDDDDD;');
    // term_print('\x1b[0;33;44m' + "EXAMPLE: " + sai_data.selection + " -> " + inps + '\x1b[0m')
    term_print("EXAMPLE: " + sai_data.selection + " -> " + inps, "EXAMPLE")
    

	apply_sai(sai_data);

    var elm = iframe_content.document.getElementById(sai.getSelection())
    console.log(elm.firstElementChild);
    elm.firstElementChild.setAttribute("class", "CTAT--example");
    console.log(elm.firstElementChild);

    sai_data['next_state'] = get_state()

	// console.log(sai_data);
	if(TEST_MODE){
		if(sai_data.selection === "done"){
        	singal_done();
        }else{
        	query_apprentice();	
        }
	}else{
		send_training_data(sai_data);	
	}
	
	
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
    sel_elm = iframe_content.document.getElementById(sai.selection)
    if((sel_elm["data-ctat-enabled"] || 'true') == 'false'){
    	//Force incorrect if try to edit uneditaable
        var incorrect_event = new CustomEvent(CTAT_INCORRECT, {detail:{'sai':sai, 'component':sel_elm}, bubbles:true, cancelable:true});
        sel_elm.dispatchEvent(incorrect_event);
    }


    if(sai.action == "ButtonPressed"){
        sai.inputs = {"value" : -1}
    }

    sai_obj = new iframe_content.CTATSAI(sai.selection, sai.action,sai.inputs["value"]);
    iframe_content.CTATCommShell.commShell.processComponentAction(sai_obj,true)
	
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

function handle_startstate_done(evt){
    document.getElementById("startstate_button").removeEventListener("click", handle_startstate_done);
    iframe_content.document.removeEventListener(CTAT_ACTION, handle_user_set_state); 
    // iframe_content.document.removeEventListener('input', handle_user_clear_state); 
    console.log("START DONE")
    for (i in start_state_elements){
        elm = iframe_content.document.getElementById(start_state_elements[i]);
        if(elm.firstChild.value){
            elm.setAttribute("data-ctat-enabled","false")
            elm.firstChild.setAttribute("contentEditable","false")
            elm.firstChild.disabled = true;    
        }
        elm.firstChild.classList.remove("CTAT--AL_start");
        console.log("BOOP",elm);
    }
    //Take away focus from whatever is there so it isn't treated as an example
    // document.activeElement.blur();
    console.log("STAT",get_state({append_ele:false}))
    start_state_history.push(get_state({append_ele:false}));
    query_apprentice();
}

// function handle_user_clear_state(evt){
//     console.log(evt.data)
//     if(!evt.data && !evt.target.value){
//         evt.target.classList.remove("CTAT--AL_start");
//         if(start_state_elements.includes(evt.target.parentElement.name)){
//             start_state_elements.remove(evt.target.parentElement.name);
//         }
//         // if(start_state_elements.includes(sai.getSelection())){
//         //     start_state_elements.remove(sai.getSelection());
//         // }
//         console.log("clear")
//         // elm = iframe_content.document.getElementById(evt.target);
//         // a = 1/0;
//     }
// }

function handle_user_set_state(evt){
    var sai = evt.detail.sai;
    // var elm = );
    elm = iframe_content.document.getElementById(sai.getSelection());
    console.log(sai.getInput())
    if(sai.getInput() != ""){
        elm.firstChild.classList.add("CTAT--AL_start");
        start_state_elements.push(sai.getSelection());
    }else{
        elm.firstChild.classList.remove("CTAT--AL_start");
        if(start_state_elements.includes(sai.getSelection())){
            start_state_elements.remove(sai.getSelection());
        }
    }
    
}

function handle_user_example(evt){
    var sai = evt.detail.sai

    var elm = iframe_content.document.getElementById(sai.getSelection())
    if(elm.firstChild.contentEditable == "false"){
        console.log("BAIL")
        return
    }

    console.log("%cUSER_EXAMPLE: " + sai.getSelection() + " -> " + sai.getInput(), 'color: #2222bb; background: #DDDDDD;');
    // term_print('\x1b[0;33;44m' + "USER_EXAMPLE:" + sai.getSelection() + " -> " + sai.getInput() + '\x1b[0m')
    term_print("USER_EXAMPLE:" + sai.getSelection() + " -> " + sai.getInput(),"EXAMPLE")
    iframe_content.document.removeEventListener(CTAT_ACTION, handle_user_example);
    iframe_content.document.getElementById("done").removeEventListener("click", _done_clicked); 

    sai_data = {
        selection: sai.getSelection(),
        action: sai.getAction(),
        inputs: {value: sai.getInput()},
        state: state,
        feedback_type: "example",
        reward: 1
    };

    // apply_sai(sai_data);
    
    var comp = iframe_content.CTATShellTools.findComponent(sai.getSelection())[0];
    comp.setEnabled(false);
    // elm.contentEditable = "false";
    console.log(elm.firstElementChild);
    elm.firstElementChild.setAttribute("class", "CTAT--example");
    console.log(elm.firstElementChild);

    last_correct = true;

    if(use_foci && sai_data.selection != 'done'){

        current_sai_data = sai_data;
        // console.log("current_sai_data",current_sai_data)
        query_user_foci();
    }else{
        send_training_data(sai_data);    
    }
    // console.log(sai_data);
    
}

var current_foci = [];

function handle_foci_select(evt){
    console.log("FOCI SELECT!")
    for(ele of evt.path){
        console.log("EELE", ele)
        if(ele.classList != undefined && ele.classList.contains("CTATComponent")){
            var indx = current_foci.indexOf(ele)
            // console.log(current_foci)
            if(indx == -1){
                current_foci.push(ele)
                ele.classList.add("CTAT--AL_highlight");
            }else{
                current_foci.splice(indx,1)
                ele.classList.remove("CTAT--AL_highlight");
            }
            console.log(current_foci)

            break
        }    
    }
    
}

function handle_foci_done(evt){
    console.log("FOCI DONE!")
    var foci_of_attention = [];
    for(ele of current_foci){
        ele.classList.remove("CTAT--AL_highlight");
        foci_of_attention.push(ele.id);
    }
    // console.log(foci_of_attention)
    current_sai_data.foci_of_attention = foci_of_attention;
    current_foci = []
    iframe_content.document.removeEventListener("click", handle_foci_select)

    send_training_data(current_sai_data);    
    current_sai_data = null;

}

function handle_user_feedback_correct(evt){
    console.log("%cCORRECT:" + last_action.selection + " -> " + last_action.inputs.value, "color: #009922; background: #DDDDDD;");
    // term_print('\x1b[0;30;42m' + "CORRECT:" + last_action.selection + " -> " + last_action.inputs.value + '\x1b[0m')
    term_print("CORRECT:" + last_action.selection + " -> " + last_action.inputs.value,"CORRECT");
    document.getElementById("yes_button").removeEventListener("click", handle_user_feedback_correct);
    document.getElementById("no_button").removeEventListener("click", handle_user_feedback_incorrect);

    var elm = iframe_content.document.getElementById(last_action.selection)
    elm.firstElementChild.setAttribute("class", "CTAT--correct");
    var comp = iframe_content.CTATShellTools.findComponent(last_action.selection)[0];
    comp.setEnabled(false);

    last_correct = true;
    send_feedback(1);
}

function handle_user_feedback_incorrect(evt){
    console.log("%cINCORRECT: " + last_action.selection + " -> " + last_action.inputs.value, "color: #bb2222; background: #DDDDDD;");
    // term_print('\x1b[0;30;41m' + "INCORRECT: " + last_action.selection + " -> " + last_action.inputs.value + '\x1b[0m')
    term_print("INCORRECT: " + last_action.selection + " -> " + last_action.inputs.value,"INCORRECT");
    document.getElementById("yes_button").removeEventListener("click", handle_user_feedback_correct);
    document.getElementById("no_button").removeEventListener("click", handle_user_feedback_incorrect);

    var elm = iframe_content.document.getElementById(last_action.selection)
    elm.firstElementChild.setAttribute("class", "CTAT--incorrect");
    var comp = iframe_content.CTATShellTools.findComponent(last_action.selection)[0];
    comp.setEnabled(true);

    last_correct = false;
    send_feedback(-1);
}

function handle_correct(evt){
	console.log("%cCORRECT:" + last_action.selection + " -> " + last_action.inputs.value, "color: #009922; background: #DDDDDD;");
    // term_print('\x1b[0;30;42m' + "CORRECT:" + last_action.selection + " -> " + last_action.inputs.value + '\x1b[0m')
    term_print("CORRECT:" + last_action.selection + " -> " + last_action.inputs.value,"CORRECT")

	currentElement.removeEventListener(CTAT_CORRECT, handle_correct);
	currentElement.removeEventListener(CTAT_INCORRECT, handle_incorrect);
	currentElement = null;

	if(TEST_MODE){
		last_correct = true;
		if(last_action.selection === "done"){
        	singal_done();
        }else{
        	query_apprentice();	
        }
	}else{
		last_correct = true;
		send_feedback(1);	
	}
    
}

function handle_incorrect(evt){
	console.log("%cINCORRECT: " + last_action.selection + " -> " + last_action.inputs.value, "color: #bb2222; background: #DDDDDD;");
    // term_print('\x1b[0;30;41m' + "INCORRECT: " + last_action.selection + " -> " + last_action.inputs.value + '\x1b[0m')
    term_print("INCORRECT: " + last_action.selection + " -> " + last_action.inputs.value,"INCORRECT")
	currentElement.removeEventListener(CTAT_CORRECT, handle_correct);
	currentElement.removeEventListener(CTAT_INCORRECT, handle_incorrect);
	currentElement = null;

	if(TEST_MODE){
		var elm = iframe_content.document.getElementById(last_action.selection)
		elm.firstElementChild.contentEditable = false
		last_correct = true;
		if(last_action.selection === "done"){
        	singal_done();
        }else{
        	query_apprentice();	
        }
	}else{
		last_correct = false;
		send_feedback(-1);
	}
    
}

function singal_done(){
	console.log("DONE!");
	// term_print('\x1b[0;30;47m' + "PROBLEM DONE!" + '\x1b[0m');
    term_print("PROBLEM DONE!","INFO");
    if(use_outer_loop_controller){
        request_next_problem();
    }else{
        serve_next_problem();
    }
}



function send_feedback(reward){
	if (last_action === null) {
        console.log('error. cannot give feedback on no action.');
    }
    var data = last_action;
    data.reward = reward;
    data.feedback_type = "correctness"


    data.state = state;
    data.next_state = get_state()
    send_training_data(data);
}

function outer_loop_update(sai_data){
    data = {...sai_data}
    data.problem_name = BRD_name
    $.ajax({
        type: 'POST',
        url: OUTER_LOOP_URL,
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8",
        retryLimit : AL_RETRY_LIMIT,
        tryCount : 0,
        error: ajax_retry_on_error,
    })
}


function send_training_data(sai_data) {

    if(use_outer_loop_controller){
        data_copy = {...sai_data}
        delete data_copy['state']
        outer_loop_update(data_copy);
    }
    // console.log("SAI: ", sai_data)

    // loggingLibrary.logResponse (transactionID,"textinput1","UpdateTextField","Hello World","RESULT","CORRECT","You got it!");
    console.log(sai_data)
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

function _hide_all(except=[]){
    l = ["yes_button","no_button","foci_done_button","startstate_button"]
    for (x in l){
        if(!except.includes(x)){
            console.log(l[x])
            document.getElementById(l[x]).setAttribute("class", "hidden");        
        }
    }
}

function query_user_startstate(){

    document.getElementById("prompt_text").innerHTML = "Set the start state."
    _hide_all(except=["startstate_done_button"]);
    document.getElementById("startstate_button").setAttribute("class", "startstate_button");

    start_state_elements = [];
    document.getElementById("startstate_button").addEventListener("click", handle_startstate_done);
    iframe_content.document.addEventListener(CTAT_ACTION, handle_user_set_state); 
    // iframe_content.document.addEventListener('input', handle_user_clear_state);  
}


function query_user_feedback(){
    document.getElementById("prompt_text").innerHTML = "Is the <span style='color: #9932CC'>highlighted</span> input correct for the next step?"
    _hide_all(except=["yes_button","no_button"]);
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
    _hide_all();
    
    iframe_content.document.addEventListener(CTAT_ACTION, handle_user_example); 
    iframe_content.document.getElementById("done").addEventListener("click", _done_clicked); 
       
//     iframe_content.CTATCommShell.commShell.addGlobalEventListener({processDone: function (anEvent, aMessage) { if (anEvent=="DonePressed"){}
//     {
//       alert ("Start state finished, tutor ready for input");
//     }
//   }
// };);   
}

function query_user_foci(){
    document.getElementById("prompt_text").innerHTML = "Select any interface elements that were used to compute this result."
    document.getElementById("yes_button").setAttribute("class", "hidden");
    document.getElementById("no_button").setAttribute("class", "hidden");
    document.getElementById("foci_done_button").setAttribute("class", "foci_done_button");

    //Add other handler for interface
    iframe_content.document.addEventListener("click", handle_foci_select)
    document.getElementById("foci_done_button").addEventListener("click", handle_foci_done);

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
    console.log("query_apprentice");
    if (agent_id == null) {
        console.error("Agent_id is NULL!?");
        return;
    }

    if(verbosity > 0) console.log('querying agent');

    if (last_correct){
        // console.log("SETTING STATE!");
        // console.log(last_correct);
        state = get_state();
    }

    var data = {
        'state': state
    }


    // console.log("STATE",state);

    // console.log("QUERY!");

    if(EXAMPLES_ONLY){
        if(interactive){
            query_user_example();
        }else{
            post_next_example();    
        }
    }else{
        request_history.push(data);
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
                console.log("query_apprentice SUCESS");
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
                        // term_print('\x1b[0;30;47m' + "ERROR: Selection Not found : " + resp.selection + '\x1b[0m');
                        term_print("ERROR: Selection Not found : " + resp.selection,"ERROR");
                    }else{
                        // console.log("STATE",state)

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
            error: function (resp){
             	// create_agent(query_apprentice);
            }
        });
    }
}

function checkTypes(element, types){
	var ok = false;
    for (var i = types.length - 1; i >= 0; i--) {
		var type = types[i];
		if(element.classList.contains(type)) ok = true;
	}
	return ok;
}


function get_state({encode_relative=false,strip_offsets=true, use_offsets=false, use_class=false, use_id=true,append_ele=true}={}){
    var state_array = iframe_content.$('div').toArray();
    // state_array.push({current_task: current_task});

    var state_json = {}
    var count = 0;
    $.each(state_array, function(idx, element){

    	obj = {}
    	if(element.classList.contains("CTATComponent")
             && !element.classList.contains("CTATTable")) {
            // if(obj["className"] == "CTATTable") {continue;} //Skip table objects and just use cells
    		if(use_class){obj["className"] = element.classList[0];}
            if(use_offsets){
        		obj["offsetParent"] = element.offsetParent.dataset.silexId;
        		obj["offsetLeft"] = element.offsetLeft;
                obj["offsetTop"] = element.offsetTop;
                obj["offsetWidth"] = element.offsetWidth;
        		obj["offsetHeight"] = element.offsetHeight;
            }


    		if(use_id){obj["id"] = element.id;}

    		if(checkTypes(element, ["CTATTextInput","CTATComboBox","CTATTable--cell"])){
    			obj["value"] = element.firstElementChild.value;
    			obj["contentEditable"] = (element.firstElementChild.contentEditable == 'true');
    			// obj["name"] = element.id
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
            name = (append_ele ? "?ele-":"") + element.id
            console.log(name,append_ele)
    		state_json[name] = obj;
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

var ctatWaitSpins = 0;
var dependencySpins = 0;

function runWhenReady(){
    // console.log("DEEEE", CTAT);
    if(typeof iframe_content.CTAT == "undefined" || iframe_content.CTAT == null ||
     	typeof iframe_content.CTATCommShell == "undefined" || iframe_content.CTATCommShell == null || 
     	typeof iframe_content.CTATCommShell.commShell == "undefined" || iframe_content.CTATCommShell.commShell == null ||
     	typeof iframe_content.CTAT.ToolTutor == "undefined" || iframe_content.CTAT.ToolTutor == null ||
     	typeof iframe_content.CTAT.ToolTutor.tutor == "undefined" || iframe_content.CTAT.ToolTutor.tutor == null){
    	// term_print('\x1b[0;30;47m' + "BLEHH1" +  '\x1b[0m');
        if(ctatWaitSpins > 0){
           term_print("Waiting for CTAT to load. Attempt: "+ ctatWaitSpins,"WARNING");
        }
        ctatWaitSpins += 1;
        window.setTimeout(runWhenReady, 500);
        
        return;       
    }
    ctatWaitSpins = 0;
	graph = iframe_content.CTAT.ToolTutor.tutor.getGraph() || interactive;
    commLibrary = iframe_content.CTATCommShell.commShell.getCommLibrary();
	hasConfig = iframe_content.CTATConfiguration != undefined
	
    // console.log("graph")
    // console.log(graph)
    // console.log("comm")
    // console.log(commLibrary)
    // console.log(hasConfig)
    
	if(graph && commLibrary && hasConfig){
		if(EXAMPLES_ONLY){
			// term_print('\x1b[0;30;47m' + "EXAMPLES_ONLY" +  '\x1b[0m');	
            term_print("EXAMPLES_ONLY","INFO"); 
		}else if(TEST_MODE){
			// term_print('\x1b[0;30;47m' + "TEST_MODE" +  '\x1b[0m');	
            term_print("TEST_MODE","INFO"); 
		}else{
			// term_print('\x1b[0;30;47m' + "OK" +  '\x1b[0m');	
            term_print("OK","INFO");    
		}
		

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
        link.setAttribute('href', "../".repeat(working_dir.split('/').length+1) + 'css/AL_colors.css');
        iframe_content.document.getElementsByTagName('head')[0].appendChild(link);

        //Gets rid of annyoing sai printout on every call to sendXML
        iframe_content.flashVars.setParams({"deliverymode" : "bleehhhh"})

        //Grab these event constants from CTAT
        CTAT_CORRECT = iframe_content.CTAT.Component.Base.Tutorable.EventType.correct;
        CTAT_INCORRECT = iframe_content.CTAT.Component.Base.Tutorable.EventType.incorrect;
        CTAT_ACTION = iframe_content.CTAT.Component.Base.Tutorable.EventType.action;    

        if(free_authoring){
            query_user_startstate();
        }else{
            start_state_history.push(get_state({append_ele:false}));
            query_apprentice();    
        }
        dependencySpins = 0;
		
	}else{
        // term_print('\x1b[0;30;47m' + "BLEHH2" + '\x1b[0m');
        if(dependencySpins > 0) {
		  term_print("Waiting for dependencies to load. Attempt:" + dependencySpins,"WARNING");
        }
		// CTATCommShell.commShell.addGlobalEventListener(function(evt,msg){
		// 	term_print('\x1b[0;30;47m' + msg + '\x1b[0m');
		// 	if("StartStateEnd" != evt || !msg)
	 //        {
	 //            return;
	 //        }
		// 	runWhenReady();	        
		// });
        dependencySpins += 1;
		window.setTimeout(runWhenReady, 500);		
	}
	
}


function serve_next_training_set(){
    console.log("TRAINING ITERATOR", training_iterator.length);
    if(training_iterator.length > 0){
        var out = training_iterator.shift();
        var name = out[0];


        while(name == "set_params"){
            file_params = {...file_params, ...out[1]} //join and prefer new one
            out = training_iterator.shift();
            name = out[0];
        }

        var set_obj = out[1]

        console.log("START TRAINING SET: ", name);
        if(Array.isArray(set_obj)) {
            training_set_params = {};
            agent_iterator = set_obj;
        }else{
            training_set_params = set_obj["set_params"] || {}
            agent_iterator = set_obj['agents'];
        }


        
        serve_next_agent();
    }else{
        console.log("ITS ALL DONE!");
        kill_this("\n TRAINING FINISHED SUCCESSFULLY! \n");
        // term_print('\x1b[0;30;47m' + "TRAINING FINISHED SUCCESSFULLY!" + '\x1b[0m');
        term_print("TRAINING FINISHED SUCCESSFULLY!","INFO");

    }
}

function declare_new_student(agent_id,outer_loop_type,problem_set, outer_loop_args){
    $.ajax({
        type: 'NEW_STUDENT',
        url: OUTER_LOOP_URL,
        crossdomain : true,
        data: JSON.stringify({"id": agent_id, "outer_loop_type": outer_loop_type, "problem_set":problem_set, "outer_loop_args":outer_loop_args}),
        // contentType: "application/json; charset=utf-8",
        // dataType: 'json',
        // "headers": {
        //       "Access-Control-Allow-Origin":"*"
        //   },


        error: ajax_retry_on_error,

        success: function(resp) {
            problem_iterator = []
            request_next_problem();            
        },
    });
}

function request_next_problem(resp){

    $.ajax({
        type: 'NEXT_PROBLEM',
        url: OUTER_LOOP_URL,
        crossdomain : true,
        data: JSON.stringify({"id": agent_id}),
        // contentType: "application/json; charset=utf-8",
        // dataType: 'json',


        error: ajax_retry_on_error,

        success: function(resp) {
            console.log("NEXT:",resp)
            if(Object.entries(resp).length !== 0)
                problem_iterator.unshift(resp)
            serve_next_problem();
        },
    });
    

}
var agent_repeat_count = null;

function serve_next_agent(){
    console.log("AGENT ITERATOR", agent_iterator.length);
    if(agent_iterator.length > 0){

        session_id = null;
        user_guid = null;
        start_state_history = [];

        var agent_obj = agent_iterator.shift();

        

        if("repetitions" in agent_obj){
            if(agent_obj["repetitions"] < 0){
                agent_iterator.unshift({...agent_obj})
            }else if(agent_obj["repetitions"] == 0){
                agent_obj = agent_iterator.shift()
            }else if(agent_obj["repetitions"] >= 2){
                agent_obj["repetitions"] -= 1
                
                agent_iterator.unshift({...agent_obj})
            }
            if(agent_obj["repetitions"] >= 1){
                agent_repeat_count = agent_repeat_count === null ? 0 : agent_repeat_count
                agent_repeat_count += 1
            }
        }else{
            agent_repeat_count = null;
        }

        console.log(agent_repeat_count)
        var agent_name = agent_obj["agent_name"] + ((agent_repeat_count !== null) ? "(" + agent_repeat_count + ")" : "")

        agent_params = agent_obj["set_params"] || {}

        agent_description = "Agent Name:" + agent_name + "<br>Agent Type:" + agent_obj["agent_type"] +"<br>"


        console.log("CREATING AGENT", agent_name);
        
        problem_iterator = [...agent_obj["problem_set"]];

        var callback;
        if("outer_loop_controller" in agent_obj){
            if(OUTER_LOOP_URL === null){ 
                // term_print('\x1b[1;40;31m' + "ERROR: An agent was configured with an outer loop agent. Please use --outer-loop flag in train.py" + '\x1b[0m');
                term_print("ERROR: An agent was configured with an outer loop agent. Please use --outer-loop flag in train.py","ERROR");
                setTimeout(() => {kill_this("Terminating..."), 200}) 

                // kill_this("use --outer-loop flag in train.py")

                throw "use --outer-loop flag in train.py"
            }
            use_outer_loop_controller = true;
            callback = function(resp){
                agent_id = resp["agent_id"];
                request_history = [];

                declare_new_student(agent_id, agent_obj["outer_loop_controller"], agent_obj["problem_set"], agent_obj["outer_loop_args"]);
            }
        }else{
            use_outer_loop_controller = false
            callback = function(resp){
                agent_id = resp["agent_id"];
                request_history = [];
                serve_next_problem();
            }
        }

        other_data = {...agent_obj}
        delete other_data["problem_set"];
        delete other_data["agent_name"];
        delete other_data["agent_type"];
        delete other_data["repetitions"];

        // console.log("OTHERDATA: ", other_data)

        create_agent(callback, agent_name, agent_obj["agent_type"], other_data);

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

function _next_prob_obj(){
    var prob_obj = problem_iterator.shift();
    // console.log(prob_obj);
    if(!prob_obj){return null;}


    while("set_params" in prob_obj){
        agent_params = {...agent_params,...prob_obj['set_params']};
        prob_obj = problem_iterator.shift();
        if(!prob_obj){return null;}
    }
    // console.log(prob_obj)

    prob_obj = {...file_params,...training_set_params,...agent_params,...prob_obj}
    return prob_obj
}

function serve_next_problem(){
    console.log("PROBLEM ITERATOR", problem_iterator.length);

    
    if(problem_iterator.length > 0){
        prob_obj = _next_prob_obj()
        // console.log("SLOOOP")
        // console.log(prob_obj)
        if(prob_obj){



	        if("repetitions" in prob_obj){
                if(prob_obj["repetitions"] < 0){
                    problem_iterator.unshift({...prob_obj})
                }else if(prob_obj["repetitions"] == 0){
	                prob_obj = _next_prob_obj()                
	            }else if(prob_obj["repetitions"] >= 2){
	                prob_obj["repetitions"] -= 1
	                problem_iterator.unshift({...prob_obj})
	            }
	        }

	        document.getElementById("prompt_text").innerHTML = agent_description + "question_file:" + prob_obj["question_file"]; 

	        // console.log(prob_obj)

	        HTML_name = prob_obj["HTML"].substring(prob_obj["HTML"].lastIndexOf('/')+1).replace(".html", "");

	        EXAMPLES_ONLY = prob_obj["examples_only"] || false;
	        TEST_MODE = prob_obj["test_mode"] || false;

	        domain_name = prob_obj["domain_name"] || HTML_name;
	        

	        // Point the iframe to the HTML and question_file (brd or nools) for the next problem

	        iframe_content.CTAT = null;
	        iframe_content.CTATCommShell = null;



	        HTML_PATH = prob_obj["HTML"];
	        if(!isAbsPath(HTML_PATH)){
	            HTML_PATH = working_dir + "/" + HTML_PATH  
	        }
	        // console.log("working_dir: ", working_dir)
	        // console.log("HTML_PATH: ", HTML_PATH)


	        if(session_id == null){
	            user_guid = "Stu_" + CTATGuid.guid();
	            session_id = CTATGuid.guid();
	        }

	        qf_exists = prob_obj["question_file"] != undefined && prob_obj["question_file"].toUpperCase() != "INTERACTIVE";
	        if(qf_exists){
	            BRD_name = prob_obj["question_file"].substring(prob_obj["question_file"].lastIndexOf('/')+1).replace(".brd", "").replace(".nools", "");  
                free_authoring = false;
	        }else{
	            BRD_name = "FREE AUTHORING"
                free_authoring = true;
	        }
            // term_print(prob_obj["question_file"])
            

	        // term_print('\x1b[0;30;47m' + "Starting Problem: " + BRD_name +  '\x1b[0m');
            term_print("Starting Problem: " + BRD_name,"INFO");

	        qf = qf_exists  ? {"question_file" : prob_obj["question_file"]} : {"question_file" : "/src/empty.nools"} ;

            console.log(qf)
            if(!interactive && qf["question_file"].includes(".nools")){
                kill_this('Question file cannot be nools in non-interactive mode. Use example tracing.', "error")
            }

            if(EXAMPLES_ONLY){
				problem_context = "examples_only"
			}else if(TEST_MODE){
				problem_context = "test_mode"
			}else{
				problem_context = "instant_feedback"
			}

	        logging_params = {
	            "problem_name": BRD_name,
	            "dataset_level_name1" : domain_name,
	            "dataset_level_type1" : "Domain",
	            "SessionLog" : "true",
	            "Logging" : "ClientToLogServer",
	            "log_service_url" : window.location.origin,
	            "user_guid" : agent_id,
	            "session_id" : session_id,
	            "problem_context" : problem_context,
	            // "test_mode" : TEST_MODE,
	        };
	        params = Object.assign({},qf,logging_params) //Merge dictionaries
	        
	        iframe.onload = runWhenReady;
	        iframe.src = HTML_PATH + "?" + jQuery.param( params );


	    }else{
	    	serve_next_agent();	
	    }
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

    })
    .fail(function(jqXHR,textStatus,errorThrown) {
        var error  = training_file + " not valid json.";

        console.log(error);
        console.log(textStatus);
        console.log(errorThrown);
        kill_this(error);
    });
}

function generate_nools(evt) {
    data = {'states':request_history.map(x => x['state'])}
    console.log(JSON.stringify(data))

    

    $.ajax({
        type: 'POST',
        url: AL_URL + '/get_skills/' + agent_id + '/',
        crossdomain : true,
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8",
        dataType: 'json',


        error: ajax_retry_on_error,

        success: function(resp) {
            out_data = {"nools_dir":nools_dir,
                "problems": start_state_history,
                "skills" : resp
                }

            $.ajax({
                type: "GEN_NOOLS",
                url: window.location.origin,
                data: JSON.stringify(out_data),
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
            });
        },
    });

    // console.log('{"nools_dir" :' + nools_dir + '}')
    
}

function main() {
    iframe = document.getElementById("tutor_iframe")
    iframe_content = iframe.contentWindow

    // Grab the the path to the training .json file and the url for the AL server from the query string
    var urlParams = new URLSearchParams(window.location.search);
    var training_file = urlParams.get('training');
    var tutor_interface = urlParams.get('tutor_interface');
    interactive = urlParams.get('interactive') == "true";
    use_foci = urlParams.get('use_foci') == "true";
    working_dir = urlParams.get('wd');
    nools_dir = urlParams.get('nools_dir');

    AL_URL = urlParams.get('al_url');
    OUTER_LOOP_URL = urlParams.get('outer_loop_url');
    verbosity = urlParams.get('verbosity') || 0;

    if(!training_file){console.error('training must be set in url query <CTAT URL>?training=<myfile>.json');return;};
    if(!AL_URL){console.error('al_url must be set in url query <CTAT URL>?al_url=<url of AL server>'); return;};

    if(working_dir == null){
        match = training_file.match(/(.*)[\/\\]/)
        working_dir =  !!match ? match[1] : ''; //The directory of the training.json
    }

    if(nools_dir){
        document.getElementById("nools_gen_button").addEventListener('click',generate_nools);
        document.getElementById("nools_gen_button").setAttribute("class","nools_button");
    }

    // if(interactive){
    document.getElementById("prompt_text").setAttribute("class", "prompt_text");
    // }

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




