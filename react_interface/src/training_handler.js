import { Machine,assign,interpret } from 'xstate';


function load_training_file (context,event){

};
function serve_next_training_set (context,event){

};
function serve_next_agent (context,event){

};
function serve_next_problem (context,event){

};
function set_problem_src (context,event){

};
function query_outerloop (context,event){

};

function make_training_handler(training_state_machine){
	const sm= Machine({
		initial: "Loading_Training_File",
		states: {
			Loading_Training_File: {
				invoke : {
					id: "load_training_file",
					src: "load_training_file",
					onDone: "Serving_Training_Sets",
					onError: 'Fail',
				}
			},	
			Serving_Training_Sets: {
				invoke : {
					id: "serve_next_training_set",
					src: "serve_next_training_set",
					onDone: [{target : "All_Done", cond : "iteratorEmpty"},
							 {target : "Serving_Agents"}],
					onError: 'Fail',
					}
			},
			Serving_Agents: {
				invoke : {
					id: "serve_next_agent",
					src: "serve_next_agent",
					onDone: [{target : "Serving_Training_Sets", cond : "iteratorEmpty"},
							 {target : "Serving_Problems"}],
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
					id: "set_problem_src",
					src: "set_problem_src",
					onDone: "Training",
					onError: 'Fail',
				}
			},
			Training: {
				invoke : {
					id: "training_state_machine",
					src: "training_state_machine",
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
			serve_next_problem : serve_next_problem,
			set_problem_src : set_problem_src,
			training_state_machine : training_state_machine,

		}
	})
}