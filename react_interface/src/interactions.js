import { Machine,assign,interpret } from 'xstate';




// const send_feedback = (context,event,explicit=false) => {
// 	if(event.response_type == "CORRECT"){
// 		context.network_layer.send_feedback(context,event,1,explicit)
// 	}else if(event.response_type == "INCORRECT"){
// 		context.network_layer.send_feedback(context,event,-1,explicit)
// 	}else if(event.response_type == "NO_RESPONSE"){
// 		context.network_layer.send_feedback(context,event,0,explicit)
// 	}	
// }

// const post_next_example = (context,event) => {

// }

// const query_apprentice = () => {};
// const post_next_example = () => {};
// const apply_sai = () => {};
// const query_apprentice = () => {};
// const query_apprentice = () => {};
// const query_apprentice = () => {};
// const query_apprentice = () => {};

function apply_skill_application(context,event){
	context.tutor.apply_skill_application()
}

function apply_next_example(context,event){
	const tutor = context.tutor
	var sai = tutor.getDefaultSAI()
	var data = {state: context.state, reward: 1,...sai}
	context.network_layer.send_training_data(data)

}

const stateRecalc = assign({state: (context,event) => {
	console.log("RECALC")
	if(context.last_action == null || context.last_action.reward == 1){
		return context.tutor.get_state()
	}else{
		return context.state
	}
}});


//CONDITIONS 
function saiIsCorrectDone(context,event){
	const sai_data = context.last_action
	return (sai_data.selection === "done" && (sai_data.reward == null || sai_data.reward  > 0))
}

function noApplicableSkills(context,event){
	return !Object.keys(event.data).length;
}

function logError(context,event){
	console.error(event.data)
	// alert("FAIL")
}

var color_map = { 
	"EXAMPLE" : "0;33;44m",
	"CORRECT" : "0;30;42m",
	"INCORRECT" : "0;30;41m",
}

function _kill_this(context,event){
	var nl = context.network_layer
	nl.network_layer(event.data.toString())
}


function print_feedback(context,event){
	var nl = context.network_layer
	var last_action = context.last_action
	var inps = last_action.inputs['value'] || ""
	var type  = context.action_type 
	if(type == "ATTEMPT"){
		type = last_action.reward > 0 ? "CORRECT" : "INCORRECT"
	}

	var color = color_map[type]
	
	nl.term_print('\x1b[' + color + type + ": " + last_action.selection + " -> " + inps + '\x1b[0m')
}

function get_machine_actions(tutor,network_layer){
	return {
		services: {
			send_feedback : (context,event) => network_layer.send_feedback(context,event,false),
			send_feedback_explicit : (context,event) => network_layer.send_feedback(context,event,true),
			apply_next_example : tutor.apply_next_example,
			apply_skill_application : tutor.apply_skill_application,
			query_apprentice : network_layer.query_apprentice,
		},
		actions: {
			logError : logError,
			stateRecalc : stateRecalc,
			assignResponse : assign({response: (context,event) => event.data}),
			assignLastAction : assign({last_action: (context,event) => event.data}) ,
			assignExample : assign({action_type: (context,event) => "EXAMPLE"}) ,
			assignAttempt : assign({action_type: (context,event) => "ATTEMPT"}) ,
			done : window.signal_done,
			print_feedback : print_feedback,
			kill_this : _kill_this,
		},
		guards: {
			saiIsCorrectDone : saiIsCorrectDone,
			noApplicableSkills : noApplicableSkills
		}
	}
}

export function build_interactions_sm(tutor,network_layer, interactive=false, free_author=false){
	const context = {
		interactive : interactive,
		free_author : free_author,
		tutor : tutor,
		network_layer : network_layer,
		// state : tutor.get_state(),
		last_correct : null,
		last_action : null,
		agent_id : null,
		action_type : null
	}
	var sm = interactive ? interactive_sm : non_interactive_sm
	

	const interaction_sm = Machine(
		{...{"context" : context}, ...sm},
		get_machine_actions(tutor,network_layer)
	);	
	return interaction_sm
}

// ------------------------------- NON INTERACTIVE ----------------------------

var non_interactive_sm = {
	initial : "Start",
	states: {
		Start:{
			entry : "stateRecalc",
			on : {
				"" : "Querying_Apprentice",
			}
		},
		Querying_Apprentice: {
			invoke : {
		        id: "query_apprentice",
		        src: "query_apprentice",
		        onDone: [
		        	{target: "Applying_Next_Example", cond: "noApplicableSkills"},
		        	{target: "Applying_Skill_Application"},
		        ],
		        onError: 'Fail',
			},
			exit: "assignResponse",
		},
		Applying_Skill_Application : {
			invoke : {
		        id: "apply_skill_application",
		        src: "apply_skill_application",
		        onDone: "Sending_Feedback",
		        onError: 'Fail',
			},
			exit: ["assignLastAction","assignAttempt"]
		},

		Applying_Next_Example : {
			invoke : {
		        id: "apply_next_example",
		        src: "apply_next_example",
		        onDone: "Sending_Feedback",
		        onError: 'Fail'
			},
			exit: ["assignLastAction","assignExample"]
		},

		Sending_Feedback : {
			entry : 'print_feedback',
			invoke : {
		        id: "send_feedback",
		        src: "send_feedback",
		        onDone: [
			        {target: "Done", cond : "saiIsCorrectDone"},
			        {target: "Querying_Apprentice"},
		        ],
		        onError: 'Fail',
			},
			exit:["stateRecalc","assignResponse"]
		},
		Done : {
			type : 'final',
			entry : "done",
		},
		Fail : {
			entry : ["logError","kill_this"]
		}
	}
};



const feedbackStates = {
	initial: "Waiting_For_Applicable_Skills",
	states: {
		"Waiting_For_Applicable_Skills" :{
			entry : ['query_apprentice'],
			on : {
				"APPLICABLE_SKILLS_RECIEVED" : "Query_Yes_No_Feedback",
				"NO_SKILLS_RECIEVED" : "No_Query_Feedback"
			}
		},
		"Waiting_For_Training_Recieved" :{
			on : {
				"TRAINING_RECIEVED" : "Waiting_For_Applicable_Skills",
			}	
		},
		"No_Query_Feedback" : {
			on : {
				"SKILL_PANEL_FEEDBACK_NONEMPTY" : "Query_Submit_Feedback"
			}
		},
		"Query_Yes_No_Feedback" : {
			on : {
				"SKILL_PANEL_FEEDBACK_NONEMPTY" : "Query_Submit_Feedback",
				"YES_PRESSED" : "Waiting_For_Training_Recieved",
				"NO_PRESSED" : "Waiting_For_Training_Recieved",
			}	
		},
		"Query_Submit_Feedback" : {
			on : {
				"SKILL_PANEL_FEEDBACK_EMPTY" : [
					{target : "Query_Yes_No_Feedback", },
					{target : "No_Query_Feedback"}
				],
				"SUBMIT_SKILL_FEEDBACK": "Waiting_For_Training_Recieved"
			}	
		}
	}
}

const ButtonsMachine = Machine({
  "initial": "Specify_Start_State",
  "states": {
  	"Specify_Start_State": {
  		on: { "START_STATE_SET": "Query_Demonstrate" },
  	},	
    "Query_Demonstrate": {
      on: { "DEMONSTRATE": "Request_Foci",
       		"DONE": "Specify_Start_State" },
      
      ...feedbackStates
    },
    "Request_Foci": {
      on: {
        "FOCI_DONE": "Query_Demonstrate",
      },
    },
    "Explantions_Displayed": {
      on: {
        "NEXT_PRESSED": "Query_Demonstrate",
        "DEMONSTRATE": "Request_Foci",
        "DONE": "Specify_Start_State"
      },
      
    },
  }
},
{
	actions: {
		query_apprentice : (context,event) => {
			window.query_apprentice()
		}
	}
}
)

// ------------------------------- INTERACTIVE ----------------------------

var interactive_sm = {
	initial : "Start",
	states: {
		Start:{
			entry : "stateRecalc",
			on : {
				"" : "Querying_Apprentice",
			}
		},
		Querying_Apprentice: {
			invoke : {
		        id: "query_apprentice",
		        src: "query_apprentice",
		        onDone: [
		        	{target: "Applying_Next_Example", cond: "noApplicableSkills"},
		        	{target: "Applying_Skill_Application"},
		        ],
		        onError: 'Fail',
			},
			exit: "assignResponse",
		},
		Applying_Skill_Application : {
			invoke : {
		        id: "apply_skill_application",
		        src: "apply_skill_application",
		        onDone: "Sending_Feedback",
		        onError: 'Fail',
			},
			exit: ["assignLastAction","assignAttempt"]
		},

		Applying_Next_Example : {
			invoke : {
		        id: "apply_next_example",
		        src: "apply_next_example",
		        onDone: "Sending_Feedback",
		        onError: 'Fail'
			},
			exit: ["assignLastAction","assignExample"]
		},

		Sending_Feedback : {
			entry : 'print_feedback',
			invoke : {
		        id: "send_feedback",
		        src: "send_feedback",
		        onDone: [
			        {target: "Done", cond : "saiIsCorrectDone"},
			        {target: "Querying_Apprentice"},
		        ],
		        onError: 'Fail',
			},
			exit:["stateRecalc","assignResponse"]
		},
		Done : {
			type : 'final',
			entry : "done",
		},
		Fail : {
			entry : ["logError","kill_this"]
		}
	}
};

// window.new_nonInteractiveMachine = () => {
// 	var machine = build_SM_NonInteractive(window.tutor,window.network_layer,window.agent_id)
// 	var machine_service = interpret(machine)
// 	machine_service.start()
// 	return machine_service
// }



// const load_training_file = () => {};
// const serve_next_training_set = () => {};
// const serve_next_agent = () => {};
// const serve_next_problem = () => {};
// const runWhenReady = () => {};
// const query_outerloop = () => {};


// function make_training_handler(){
// 	const sm= Machine({
// 		initial: "Loading_Training_File",
// 		states: {
// 			Loading_Training_File: {
// 				invoke : {
// 					id: "load_training_file",
// 					src: "load_training_file",
// 					onDone: "Serving_Training_Sets",
// 					onError: 'Fail',
// 				}
// 			},	
// 			Serving_Training_Sets: {
// 				invoke : {
// 					id: "serve_next_training_set",
// 					src: "serve_next_training_set",
// 					onDone: [{target : "All_Done", cond : "iteratorEmpty"},
// 							 {target : "Serving_Agents"}],
// 					onError: 'Fail',
// 					}
// 			},
// 			Serving_Agents: {
// 				invoke : {
// 					id: "serve_next_agent",
// 					src: "serve_next_agent",
// 					onDone: [{target : "Serving_Training_Sets", cond : "iteratorEmpty"},
// 							 {target : "Serving_Problems"}],
// 					onError: 'Fail',
// 				}
// 			},
// 			Serving_Problems: {
// 				invoke : {
// 					id: "serve_next_problem",
// 					src: "serve_next_problem",
// 					onDone: [{target : "Serving_Agents", cond : "iteratorEmpty"},
// 							 {target : "Waiting_Problem_Load"}],
// 					onError: 'Fail',
// 				}
// 			},
// 			Waiting_Problem_Load:{
// 				invoke : {
// 					id: "set_problem_src",
// 					src: "set_problem_src",
// 					onDone: "Training",
// 					onError: 'Fail',
// 				}
// 			},

// 		// "Waiting_For_OuterLoop": {
// 		// 	entry: query_outerloop,
// 		// 	on: {"PROBLEM_START_LOAD": "Waiting_Problem_Load"}
// 		// },

// 			Training: {
// 				invoke : {
// 					id: "training_state_machine",
// 					src: "training_state_machine",
// 					onDone: "Serving_Problems",
// 					onError: 'Fail',
// 				}
// 			},
// 		// "Explantions_Displayed": {
// 		//   on: {
// 		//     "NEXT_PRESSED": "Query_Demonstrate",
// 		//     "DEMONSTRATE": "Request_Foci",
// 		//     "DONE": "Specify_Start_State"
// 		//   },
		  
// 		// },
// 			All_Done : {
// 				type : 'final',
// 			},
// 			Fail : {
// 				entry : ["logError","kill_this"]
// 			}
// 		}
// 	})
// }


// const TrainingJSON_SM= Machine({
//   "initial": "Loading_Training_File",
//   "states": {
//   	"Loading_Training_File": {
//   		entry: load_training_file,
//   		on: { "TRAINING_FILE_LOADED": "Serving_Training_Sets" },
//   	},	
//   	"All_Done" : {},
//     "Serving_Training_Sets": {
//     	entry: serve_next_training_set,
//       	on: { "TRAINING_SET_LOADED": "Serving_Agents",
//       		  "NO_MORE_TRAINING_SETS" : "All_Done"},
//     },
//     "Serving_Agents": {
//     	entry: serve_next_agent,
//     	on: {"AGENT_CREATED": "Serving_Problem",
//       		 "NO_MORE_AGENTS" : "Serving_Training_Sets"},
//     },
//     "Serving_Problems": {
//     	entry: serve_next_problem,
//     	on: {"PROBLEM_START_LOAD": "Waiting_Problem_Load",
//     		 "QUERY_OUTERLOOP": "Waiting_For_OuterLoop",
//       		 "NO_MORE_PROBLEMS" : "Serving_Agents"},
//     },
//     "Waiting_Problem_Load":{
//     	entry: runWhenReady,
//     	on: {"PROBLEM_LOADED": "Training"}
//     },
//     "Waiting_For_OuterLoop": {
//     	entry: query_outerloop,
//     	on: {"PROBLEM_START_LOAD": "Waiting_Problem_Load"}
//     },

//     "Training": {
//     	on: {"PROBLEM_DONE": "Serving_Problems"},
//     },
//     "Explantions_Displayed": {
//       on: {
//         "NEXT_PRESSED": "Query_Demonstrate",
//         "DEMONSTRATE": "Request_Foci",
//         "DONE": "Specify_Start_State"
//       },
      
//     },
//   }
// },
// {
// 	actions: {
// 		query_apprentice : (context,event) => {
// 			window.query_apprentice()
// 		}
// 	}
// }
// )

export default ButtonsMachine;