import { Machine,assign,interpret } from 'xstate';
import RJSON from 'relaxed-json'
import {build_interactions_sm} from './interactions.js'
var fs = require("fs")
// const path = require("path")


const CTATGuid = {s4:function s4() {
  return Math.floor((1 + Math.random()) * 65536).toString(16).substring(1);
}, guid:function guid() {
  return this.s4() + this.s4() + "-" + this.s4() + "-" + this.s4() + "-" + this.s4() + "-" + this.s4() + this.s4() + this.s4();
}};

function load_training_file (context,event){
	console.log("TRAINING JSON:", context.training_file)
	return fetch(context.training_file)
			.then((response) => response.text())//response.json())
			.then((response) => RJSON.parse(response))//response.json())
			.then((response) => Object.entries(response))
			.then((response) => {return {updateContext : {training_iterator : response}}})
	// var promise = new Promise((resolve, reject) => {
		// try{
		// 	let file_name = context.training_json
		// 	let rawdata = fs.readFileSync(file_name)
		// 	let training_json_obj = JSON.parse(rawdata);
		// 	var training_iterator = Object.entries(training_json_obj);	
		// }catch(error){
		// 	console.error(error)
		// 	reject(error)
		// }
		// resolve(training_iterator)
	// });
	// return promise
};



function serve_next_training_set (context,event){
	var promise = new Promise((resolve, reject) => {
		var training_iterator = context.training_iterator
	var file_params = context.file_params || {};
	console.log("TRAINING ITERATOR", training_iterator.length);
		if(training_iterator.length > 0){
			var out = training_iterator.shift()
			var name = out[0];

	        while(name == "set_params"){
	            file_params = {...file_params, ...out[1]} //join and prefer new one
	            out = training_iterator.shift();
	            name = out[0];
	        }

	        console.log("START TRAINING SET: ", name, file_params);
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
    var promise = new Promise((resolve, reject) => {
    	var agent_iterator = context.agent_iterator;
    	console.log("AGENT ITERATOR", agent_iterator.length);
	    if(context.agent_iterator.length > 0){
	        var agent_obj = {...(context.file_params['agent'] || {}),...agent_iterator.shift() }
	        if(context.file_params['agent'] && context.file_params['agent']['args']){
	        	agent_obj['args'] = {...context.file_params['agent']['args'], ...agent_obj['args']};
	        }
	        var agent_params = agent_obj["set_params"] || {}
	        var agent_description = "Agent Name:" + agent_obj["agent_name"] + "<br>Agent Type:" + agent_obj["agent_type"] +"<br>"
	        var problem_set = agent_obj["problem_set"];
	        var prior_knowledge = agent_obj["prior_knowledge"] || [];

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
	        	other_agent_data : other_data,

	        	agent_iterator:  agent_iterator,
	        	problem_set : problem_set,
	        	prior_knowledge : prior_knowledge,
	        }})
	    }else{
	        resolve(null)
	    }
	});
	return promise
}

function handle_prior_knowledge(context,event){
	var promise = new Promise((resolve, reject) => {
		console.log("WOOP?")
		var prior_knowledge =  context.prior_knowledge;
		while(prior_knowledge.length > 0){
			console.log("CURRENT", prior_knowledge)
			var current = prior_knowledge.shift();
			//current.type == "Pik" || 
			var type = current.type.toLowerCase().replace("_", "")
			if(type == "bestintersect"){
								

			}else{

			}
		} 

		resolve({"updateContext" : {
	        	prior_knowledge : prior_knowledge,       	
				problem_iterator : context.problem_set,
	        }})
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
    console.log(prob_obj,agent_params)
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
		console.log("PROBLEM ITERATOR", problem_iterator.length);
		if(problem_iterator.length > 0){
	        [prob_obj, agent_params] = _next_prob_obj(problem_iterator,agent_params,file_params);
	        console.log(prob_obj,agent_params)
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

		        var EXAMPLES_ONLY = prob_obj["examples_only"] || false;

		        resolve({"updateContext" : {
	            	EXAMPLES_ONLY : EXAMPLES_ONLY,
	            	agent_params : agent_params,
	            	problem_iterator : problem_iterator,
	            	prob_obj : prob_obj
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
function AAID(interactions_state_machine){
	var boop = (context,event) => {
		console.log("MOOOP")
		return {...interactions_state_machine.context, ...{"agent_id": context.agent_id}}
	}
}

// function gerp(event){
// 	console.log("GERP")
// 	return event.data['agent_id']
// }

function start_training_interaction(context,event){
	console.log("START TRAINING INTERACTION")
	var app = context.app

	var pass_along_context = {
		"agent_id": context.agent_id,
		"interactive": context.interactive,
		"free_author": context.free_author,
	}

	var interactions_sm = context.interactions_sm
		.withContext({...context.interactions_sm.context, ...pass_along_context});
	var interactions_service = interpret(interactions_sm)
	context.app.interactions_service = interactions_service
	interactions_service.onTransition(app.onInteractionTransition)
	interactions_service.start()
}

function allDone(context,event){
	var nl = context.network_layer
	console.log("ITS ALL DONE!");
    nl.kill_this("\n TRAINING FINISHED SUCCESSFULLY! \n",'info');
    // nl.term_print('\x1b[0;30;47m' + "TRAINING FINISHED SUCCESSFULLY!" + '\x1b[0m');
}

const assignInteractionSM = assign({"interactions_sm" : (context,event) =>  {
	var d = {...{app:context.app,
		    	 interactive:context.interactive,
		    	 free_author:context.free_author,
		    	 tutor_mode:context.tutor_mode},
		     ...event.data}
	console.log("assignInteractionSM", d)
	var sm = build_interactions_sm(d.app, d.interactive, d.free_author, d.tutor_mode)
	return sm
}})






// function create_agent(context,event){
// 	var nl = context.network_layer;
	

// 	return nl.create_agent(context,event)

// }


export function build_training_sm(app,interactions_sm){
	// interactions_state_machine,network_layer,training_file,tutor,working_dir
	var nl = app.network_layer;
	const context = {
		//Utils
		app : app,
		tutor : app.tutor.current,
		skill_panel : app.skill_panel.current,
		buttons : app.buttons.current,
		network_layer : app.network_layer,

		//Inherited
		interactive : app.props.interactive,
		training_file : app.props.training_file,
		working_dir : app.props.working_dir,
		interactions_sm : interactions_sm,

		//Dynamic
		file_params : null,
		agent_params : null,
		prob_obj : null,
		free_author : null,
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
					onError: {target :'Fail', actions : "logError"}
				}
			},	
			Serving_Training_Sets: {
				invoke : {
					id: "serve_next_training_set",
					src: "serve_next_training_set",
					onDone: [{target : "All_Done", cond : "iteratorEmpty"},
							 {target : "Serving_Agents", actions: "updateContext"}],
					onError: {target :'Fail', actions : "logError"}
				}
			},
			Serving_Agents: {
				invoke : {
					id: "serve_next_agent",
					src: "serve_next_agent",
					onDone: [{target : "Serving_Training_Sets", cond : "iteratorEmpty"},
							 {target : "Creating_Agent",actions: "updateContext"}],
					onError: {target :'Fail', actions : "logError"}
				}
			},
			Creating_Agent: {
				invoke : {
					id: "create_agent",
					src: "create_agent",
					onDone: {target : "Handling_Prior_Knowledge",actions: "assignAgentId" },
					onError: {target :'Fail', actions : "logError"}
				}
			},
			Handling_Prior_Knowledge: {
				invoke : {
					id: "handle_prior_knowledge",
					src: "handle_prior_knowledge",
					onDone: {target : "Serving_Problems", actions: "updateContext" },
					onError: {target :'Fail', actions : "logError"}
				}
			},
			Serving_Problems: {
				invoke : {
					id: "serve_next_problem",
					src: "serve_next_problem",
					onDone: [{target : "Serving_Agents", cond : "iteratorEmpty"},
							 {target : "Waiting_Problem_Load",  actions: "updateContext"}],
					onError: {target :'Fail', actions : "logError"}
				}
			},
			Waiting_Problem_Load:{
				invoke : {
					id: "load_problem",
					src: "load_problem",
					onDone: {target : "Training",  actions: "updateContext"},
					onError: {target :'Fail', actions : "logError"}
				}
			},
			Training: {
				entry : "start_training_interaction",
				on : {PROBLEM_DONE : "Serving_Problems",
					  CHANGE_INTERACTION_MODE : {target : "Serving_Problems", "actions" : "assignInteractionSM"}},
				// invoke : {
				// 	id: "interactions_state_machine",
				// 	src: "interactions_state_machine",
				// 	data : (context, event) => ({...interactions_state_machine.context, ...{"agent_id": context.agent_id}}),
				// 	onDone: "Serving_Problems",
				// 	onError: {target :'Fail', actions : "logError"}
				// },
				// entry : send({type: "ASSIGN_AGENT", "agent_id" : agent_id})
			},
			All_Done : {
				entry : "allDone",
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
			create_agent : nl.createAgent,
			serve_next_problem : serve_next_problem,
			load_problem : load_problem,
			handle_prior_knowledge : handle_prior_knowledge,
			
			// interactions_state_machine : interactions_state_machine,
			
		},
		actions : {
			start_training_interaction : start_training_interaction,
			logError : (context,event) => {console.error(event.data)},
			updateContext : assign((context, event) => {
			    return event.data.updateContext
			}),
			assignAgentId : assign((context, event) => {
				return {agent_id : event.data['agent_id']}
			}),
			allDone : allDone,
			assignInteractionSM : assignInteractionSM
		},
		guards : {
			iteratorEmpty : iteratorEmpty,
		}
	});

	
	// console.log("JSON MACHINE",sm)
	return sm
}