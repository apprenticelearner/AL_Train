import { Machine } from 'xstate';

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
        "FOCI_DONE": "Explantions_Displayed",
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

export default ButtonsMachine;