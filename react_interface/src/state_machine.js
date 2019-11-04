import { Machine,assign } from 'xstate';

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


const send_feedback = (context,event,reward,explicit=true) => {

}

const post_next_example = (context,event) => {

}

const query_apprentice = () => {};
// const post_next_example = () => {};
const apply_sai = () => {};
// const query_apprentice = () => {};
// const query_apprentice = () => {};
// const query_apprentice = () => {};
// const query_apprentice = () => {};

const NonInteractive_SM = Machine({
	states: {
		"Waiting_Agent_Skill_Application" : {
			entry : query_apprentice,
			on : {"SKILL_APPLS_RECIEVED": "Wait_Tutor_Yes_No",
				  "NO_APPLICABLE_SKILLS": 
				  	{target: "Waiting_Training_Recieved", actions: post_next_example}
				  }

		},
		"Waiting_Tutor_Yes_No" : {
			entry : apply_sai,
			on : {"TUTOR_RESP_CORRECT" : 
					{target: "Waiting_Training_Recieved", actions: "send_feedback_C_NE"},
				  "TUTOR_RESP_INCORRECT" : 
					{target: "Waiting_Training_Recieved", actions: "send_feedback_I_NE"},
				   "TUTOR_NO_RESP" : 
					{target: "Waiting_Training_Recieved", actions: "send_feedback_N_NE"}
				 }
		},
		"Waiting_Training_Recieved" : {
			on : {"TRAINING_RECIEVED" : "Waiting_Agent_Skill_Application"}
		},
		
	}
},
{
	actions: {
		send_feedback_C_NE : (context,event) => {send_feedback(context,event,1,false);},
		send_feedback_I_NE : (context,event) => {send_feedback(context,event,-1,false);},
		send_feedback_N_NE : (context,event) => {send_feedback(context,event,0,false);},
		send_feedback_C_E : (context,event) => {send_feedback(context,event,1,true);},
		send_feedback_I_E : (context,event) => {send_feedback(context,event,-1,true);},
		send_feedback_N_E : (context,event) => {send_feedback(context,event,0,true);},
		post_next_example : {post_next_example}
	}
});

const load_training_file = () => {};
const serve_next_training_set = () => {};
const serve_next_agent = () => {};
const serve_next_problem = () => {};
const runWhenReady = () => {};
const query_outerloop = () => {};

const TrainingJSON_SM= Machine({
  "initial": "Loading_Training_File",
  "states": {
  	"Loading_Training_File": {
  		entry: load_training_file,
  		on: { "TRAINING_FILE_LOADED": "Serving_Training_Sets" },
  	},	
  	"All_Done" : {},
    "Serving_Training_Sets": {
    	entry: serve_next_training_set,
      	on: { "TRAINING_SET_LOADED": "Serving_Agents",
      		  "NO_MORE_TRAINING_SETS" : "All_Done"},
    },
    "Serving_Agents": {
    	entry: serve_next_agent,
    	on: {"AGENT_CREATED": "Serving_Problem",
      		 "NO_MORE_AGENTS" : "Serving_Training_Sets"},
    },
    "Serving_Problems": {
    	entry: serve_next_problem,
    	on: {"PROBLEM_START_LOAD": "Waiting_Problem_Load",
    		 "QUERY_OUTERLOOP": "Waiting_For_OuterLoop",
      		 "NO_MORE_PROBLEMS" : "Serving_Agents"},
    },
    "Waiting_Problem_Load":{
    	entry: runWhenReady,
    	on: {"PROBLEM_LOADED": "Training"}
    },
    "Waiting_For_OuterLoop": {
    	entry: query_outerloop,
    	on: {"PROBLEM_START_LOAD": "Waiting_Problem_Load"}
    },

    "Training": {
    	on: {"PROBLEM_DONE": "Serving_Problems"},
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

export default ButtonsMachine;