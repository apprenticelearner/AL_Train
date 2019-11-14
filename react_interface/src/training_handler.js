import { Machine,assign,interpret } from 'xstate';
var fs = require("fs")
// const path = require("path")


const CTATGuid = {s4:function s4() {
  return Math.floor((1 + Math.random()) * 65536).toString(16).substring(1);
}, guid:function guid() {
  return this.s4() + this.s4() + "-" + this.s4() + "-" + this.s4() + "-" + this.s4() + "-" + this.s4() + this.s4() + this.s4();
}};

function load_training_file (context,event){
	var promise = new Promise((resolve, reject) => {
		try{
			let file_name = context.training_json
			let rawdata = fs.readFileSync(file_name)
			let training_json_obj = JSON.parse(rawdata);
			var training_iterator = Object.entries(training_json_obj);	
		}catch(error){
			console.error(error)
			reject(error)
		}
		resolve(training_iterator)
	});
	return promise
};

function serve_next_training_set (context,event){
	var training_iterator = context.training_iterator
	var file_params = context.file_params || {};
	console.log("TRAINING ITERATOR", training_iterator.length);
	var promise = new Promise((resolve, reject) => {
		if(training_iterator.length > 0){
			var out = training_iterator.shift()
			var name = out[0];

	        while(name == "set_params"){
	            file_params = {...file_params, ...out[1]} //join and prefer new one
	            out = training_iterator.shift();
	            name = out[0];
	        }

	        console.log("START TRAINING SET: ", name);
	        var agent_iterator = out[1];        

	        resolve({"updateContext" : {
	        	training_iterator : training_iterator,
				agent_iterator	: agent_iterator,        	
				file_params : file_params
	        }})
		}else{
			resolve(null)
		}
	});
	return promise
};

function serve_next_agent(context,event){
	var agent_iterator = context.agent_iterator;
    console.log("AGENT ITERATOR", agent_iterator.length);
    var promise = new Promise((resolve, reject) => {
	    if(context.agent_iterator.length > 0){
	        var agent_obj = agent_iterator.shift();
	        var agent_params = agent_obj["set_params"] || {}
	        var agent_description = "Agent Name:" + agent_obj["agent_name"] + "<br>Agent Type:" + agent_obj["agent_type"] +"<br>"
	        var problem_iterator = agent_obj["problem_set"];

	        var other_data = {...agent_obj}
	        delete other_data["problem_set"];
	        delete other_data["agent_name"];
	        delete other_data["agent_type"];

	        resolve({"updateContext" : {
	        	start_state_history : [],
	        	request_history : [],
	        	session_id : CTATGuid.guid(),
	        	user_guid : "Stu_" + CTATGuid.guid(),

	        	agent_params	: agent_params,    
	        	agent_name : agent_obj["agent_name"],
				agent_type	: agent_obj["agent_type"],        	
	        	agent_description : agent_description,

	        	agent_iterator:  agent_iterator,
	        	problem_iterator : problem_iterator,
	        }})
	    }else{
	        resolve(null)
	    }
	});
	return promise
}


function _next_prob_obj(problem_iterator,agent_params,file_params){
    var prob_obj = problem_iterator.shift();
    // console.log(prob_obj);
    if(!prob_obj){return null;}


    while("set_params" in prob_obj){
        agent_params = {...agent_params,...prob_obj['set_params']};
        prob_obj = problem_iterator.shift();
        if(!prob_obj){return null;}
    }
    // console.log(prob_obj)

    prob_obj = {...file_params,...agent_params,...prob_obj}
    return [prob_obj, agent_params]
}

function serve_next_problem (context,event){
	var promise = new Promise((resolve, reject) => {
		var prob_obj = null;
		var agent_params = context.agent_params;
		var file_params = context.file_params;
		var problem_iterator = context.problem_iterator
		var nl = context.network_layer
		var interactive = context.interactive
		if(problem_iterator.length > 0){
	        [prob_obj, agent_params] = _next_prob_obj(problem_iterator,agent_params,file_params);
	        // console.log("SLOOOP")
	        // console.log(prob_obj)
	        if(prob_obj){
		        if("repetitions" in prob_obj){
	                if(prob_obj["repetitions"] < 0){
	                    problem_iterator.unshift({...prob_obj})
	                }else if(prob_obj["repetitions"] == 0){
		                [prob_obj, agent_params] = _next_prob_obj(problem_iterator,agent_params,file_params)                
		            }else if(prob_obj["repetitions"] >= 2){
		                prob_obj["repetitions"] -= 1
		                problem_iterator.unshift({...prob_obj})
		            }
		        }

	            // if(!interactive){
	                //! document.getElementById("prompt_text").innerHTML = agent_description + "question_file:" + prob_obj["question_file"];     
	            // }
		        

		        // console.log(prob_obj)
		        var EXAMPLES_ONLY = prob_obj["examples_only"] || false;

		        // tutor.loadProblem(prob_obj)

		        // var HTML_name = prob_obj["HTML"].substring(prob_obj["HTML"].lastIndexOf('/')+1).replace(".html", "");

		        // var domain_name = prob_obj["domain_name"] || HTML_name;
		        

		        // // Point the iframe to the HTML and question_file (brd or nools) for the next problem

		        // // iframe_content.CTAT = null;
		        // // iframe_content.CTATCommShell = null;



		        // var HTML_PATH = prob_obj["HTML"];
		        // if(!path.isAbsolute(HTML_PATH)){
		        //     HTML_PATH = context.working_dir + "/" + HTML_PATH  
		        // }
		        // // console.log("working_dir: ", working_dir)
		        // // console.log("HTML_PATH: ", HTML_PATH)


		        // // if(session_id == null){
		        // //     user_guid = "Stu_" + CTATGuid.guid();
		        // //     session_id = CTATGuid.guid();
		        // // }

		        // var qf_exists = prob_obj["question_file"] != undefined && prob_obj["question_file"].toUpperCase() != "INTERACTIVE";
		        // var BRD_name, free_authoring;
		        // if(qf_exists){
		        //     BRD_name = prob_obj["question_file"].substring(prob_obj["question_file"].lastIndexOf('/')+1).replace(".brd", "").replace(".nools", "");  
	         //        free_authoring = false;
		        // }else{
		        //     BRD_name = "FREE AUTHORING"
	         //        free_authoring = true;
		        // }
	         //    // term_print(prob_obj["question_file"])
	            

		        // nl.term_print('\x1b[0;30;47m' + "Starting Problem: " + BRD_name +  '\x1b[0m');

		        // var qf = qf_exists  ? {"question_file" : prob_obj["question_file"]} : {"question_file" : "/src/empty.nools"} ;

	         //    console.log(qf)
	         //    if(!interactive && qf["question_file"].includes(".nools")){
	         //        nl.kill_this('\x1b[0;30;47m' +'Question file cannot be nools in non-interactive mode. Use example tracing.\x1b[0m')
	         //    }
		        // var logging_params = {
		        //     "problem_name": BRD_name,
		        //     "dataset_level_name1" : domain_name,
		        //     "dataset_level_type1" : "Domain",
		        //     "SessionLog" : "true",
		        //     "Logging" : "ClientToLogServer",
		        //     "log_service_url" : window.location.origin,
		        //     "user_guid" : context.agent_id,
		        //     "session_id" : context.session_id
		        // };
		        // var params = Object.assign({},qf,logging_params) //Merge dictionaries
		        


	         //    //TODO MAKES THESE PROPS~~~
		        // // iframe.onload = runWhenReady;
	         //    tutor.HTML_PATH = HTML_PATH
	         //    tutor.init_callback = onTutorInitialized
	         //    iframe.onload = tutor.componentDidUpdate;
		        // iframe.src = HTML_PATH + "?" + jQuery.param( params );

	            // tutor.componentDidUpdate(null,null)
	            
	            /*
	            if(context.interactive){
	                clear_highlights()
	                window.setSkillWindowState({});
	                feedback_queue = {};
	            }
	            */

	            resolve({"updateContext" : {
	            	EXAMPLES_ONLY : EXAMPLES_ONLY,
	            	agent_params : agent_params,
	            	problem_iterator : problem_iterator,
	            	prob_obj : prob_obj

		        	// HTML_name : HTML_name,
		        	// domain_name : domain_name,
		        	// HTML_PATH : HTML_PATH,
		        	// BRD_name : BRD_name,
		        	// free_authoring : free_authoring,
		        	// logging_params : logging_params,
		        	
		        }})

		    }else{
		    	resolve(null)
		    }
		}else{
			resolve(null)
		}
	});
	return promise
};
function load_problem (context,event){
	return context.tutor.loadProblem(context)
};
function query_outerloop (context,event){

};

function iteratorEmpty(context,event){
	return event.data == null;
}


export function make_training_handler(interactions_state_machine,network_layer){
	var nl = network_layer;
	const context = {
		file_params : null,
		agent_params : null,
		prob_obj : null,
	}
	const sm = Machine({
		context : context,
		initial: "Loading_Training_File",
		states: {
			Loading_Training_File: {
				invoke : {
					id: "load_training_file",
					src: "load_training_file",
					onDone: {target : "Serving_Training_Sets", actions: "updateContext"},
					onError: 'Fail',
				}
			},	
			Serving_Training_Sets: {
				invoke : {
					id: "serve_next_training_set",
					src: "serve_next_training_set",
					onDone: [{target : "All_Done", cond : "iteratorEmpty"},
							 {target : "Serving_Agents", actions: "updateContext"}],
					onError: 'Fail',
				}
			},
			Serving_Agents: {
				invoke : {
					id: "serve_next_agent",
					src: "serve_next_agent",
					onDone: [{target : "Serving_Training_Sets", cond : "iteratorEmpty"},
							 {target : "Creating_Agent",actions: "updateContext"}],
					onError: 'Fail',
				}
			},
			Creating_Agent: {
				invoke : {
					id: "create_agent",
					src: "create_agent",
					onDone: {target : "Serving_Problems",actions: "assignAgentId"},
					onError: 'Fail',
				}
			},
			Serving_Problems: {
				invoke : {
					id: "serve_next_problem",
					src: "serve_next_problem",
					onDone: [{target : "Serving_Agents", cond : "iteratorEmpty"},
							 {target : "Waiting_Problem_Load"}],
					onError: 'Fail',
				}
			},
			Waiting_Problem_Load:{
				invoke : {
					id: "load_problem",
					src: "load_problem",
					onDone: "Training",
					onError: 'Fail',
				}
			},
			Training: {
				invoke : {
					id: "interactions_state_machine",
					src: "interactions_state_machine",
					data : (context, event) => ({agent_id: context.agent_id}),
					onDone: "Serving_Problems",
					onError: 'Fail',
				}
			},
			All_Done : {
				type : 'final',
			},
			Fail : {
				entry : ["logError","kill_this"]
			}
		}
	},
	{
		services : {
			load_training_file : load_training_file,
			serve_next_training_set : serve_next_training_set,
			serve_next_agent : serve_next_agent,
			create_agent : nl.create_agent,
			serve_next_problem : serve_next_problem,
			load_problem : load_problem,
			interactions_state_machine : interactions_state_machine,
			assignAgentId : assign({agent_id : (context, event) => event.data['agent_id']})
		},
		actions : {
			updateContext : assign((context, event) => {
			    return event.data.contextUpdate
			})
		},
		guards : {
			iteratorEmpty : iteratorEmpty,
		}
	});
	return sm
}