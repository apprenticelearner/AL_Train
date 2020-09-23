import { Machine, assign, interpret, send } from "xstate";

// const sendFeedback = (context,event,explicit=false) => {
// 	if(event.response_type == "CORRECT"){
// 		context.network_layer.sendFeedback(context,event,1,explicit)
// 	}else if(event.response_type == "INCORRECT"){
// 		context.network_layer.sendFeedback(context,event,-1,explicit)
// 	}else if(event.response_type == "NO_RESPONSE"){
// 		context.network_layer.sendFeedback(context,event,0,explicit)
// 	}
// }

// const post_next_example = (context,event) => {

// }

// const queryApprentice = () => {};
// const post_next_example = () => {};
// const apply_sai = () => {};
// const queryApprentice = () => {};
// const queryApprentice = () => {};
// const queryApprentice = () => {};
// const queryApprentice = () => {};

// function apply_skill_application(context,event){
// 	context.tutor.apply_skill_application()
// }

// function apply_next_example(context,event){
// 	const tutor = context.tutor
// 	var sai = tutor.getDefaultSAI()
// 	var data = {state: context.state, reward: 1,...sai}
// 	context.network_layer.sendTrainingData(data)

// }
const appendStartHistory = assign({
  start_state_history: (context, event) => {
    var state = context.tutor.getState();
    var history = context.start_state_history || [];
    history.push(state);
    return history;
  }
});

const stateRecalc = assign({
  state: (context, event) => {
    let skill_applications = context.skill_applications;
    let si = context.staged_index;
    let staged_skill_app =  si && skill_applications[si] || null;
    if (staged_skill_app == null || staged_skill_app.reward > 0 || context.test_mode) {
      console.log("REDO")
      return context.tutor.getState();
    } else {
      console.log("KEEP")
      return context.state;
    }
  }
});

const assignFoci = assign({
  skill_applications: (context, event) => {
    let skill_applications = context.skill_applications
    Object.assign(skill_applications[context.staged_index], {
      foci_of_attention: context.tutor.getCurrentFoci()
    });
    return skill_applications;
  }
});

//CONDITIONS
function saiIsCorrectDone(context, event) {
  if (context.feedback_map && Object.keys(context.feedback_map).length > 0) {
    return false;
  }
  console.log('CORRECT DONE')
  let skill_applications = context.skill_applications//|| [context.staged_SAI]
  if(skill_applications.length == 1){
    var skill_app = skill_applications[0]  
    if(skill_app.selection === "done" &&
      (skill_app.reward == null || skill_app.reward > 0 || context.test_mode)){
      return true
    }
  }
  return false
}

function forceUseExample(context, event) {
  let skill_applications = context.skill_applications// || [context.staged_SAI]
  if(skill_applications.length == 1){
    var skill_app = skill_applications[0]  
    return (skill_app.skipTraining && skill_app.reward < 0) || context.examples_only;
  }
  return false
}

function isFreeAuthor(context, event) {
  
  return context.free_author || false;
}

function useWholeConflictSet(context,event){
  console.log("JEEEEEEZ", context)
  return context.whole_conflict_set || false; 
}

function checkIsCorrect(context, event) {
  return event.data > 0;
}

function noApplicableSkills(context, event) {
  console.log("CCCC", context)
  return !Object.keys(event.data).length || context.examples_only;
}

function logError(context, event) {
  console.error(event.data);
  // alert("FAIL")
}


function _kill_this(context, event) {
  var nl = context.network_layer;
  nl.kill_this(event.data.toString());
}



function clearSkillPanel(context, event) {
  context.al_trainer.setState({
    skill_panel_props: {
      skill_set: { "Applicable Skills": {} }
    }
  });
}

function fillSkillPanel(context, event) {
  console.log("FILLSKILL",event)
  context.al_trainer.setState({
    skill_panel_props: {
      skill_set: { "Applicable Skills": event.data["responses"] || {} }
    }
  });
}

function applyFeedbackMap(context,event){
  var skill_applications = context.skill_applications
  var feedback_map = context.feedback_map
  // if (!skill_applications){
  //   skill_applications = [context.staged_SAI]
  // }
  for (var i=0; i < skill_applications.length; i++) {
    var skill_app = skill_applications[i];
    if(feedback_map && Object.keys(feedback_map).length > 0){
      skill_app['reward'] = feedback_map[i].toLowerCase() == "correct" ? 1 : -1
    }
  }
  return {skill_applications : skill_applications}
}

// function printSkillApps(context,event){
//   for (var i=0; i < skill_applications.length; i++) {

//   }
// }

const recalcFeedbackMap = send((context, event) => {
  // const promise = new Promise((resolve,reject) => {
  var skill = event.skill;
  var match = event.match;
  var label = event.label;

  let match_id = match["_id"];
  // console.log(match["_id"])
  // console.log(this.state.feedback_map)
  let feedback_map = context.feedback_map || {};
  let new_label =
    feedback_map[match_id] && label === feedback_map[match_id] ? null : label;

  let new_feedback_map = { ...feedback_map };
  if (new_label === null) {
    delete new_feedback_map[match_id];
  } else {
    new_feedback_map[match_id] = new_label;
  }

  let was_empty = Object.keys(feedback_map).length === 0;
  let now_empty = Object.keys(new_feedback_map).length === 0;

  return {
    type: "FEEBACK_MAP_UPDATE",
    feedback_map: new_feedback_map,
    was_empty: was_empty,
    now_empty: now_empty
  };
  // if(!was_empty && now_empty){
  //   	console.log("EMPTY")
  //   	return {type: "SKILL_PANEL_FEEDBACK_EMPTY"}
  // }else if(was_empty && !now_empty){
  //   	console.log("NOT EMPTY")
  //   	return {type :"SKILL_PANEL_FEEDBACK_NONEMPTY"}
  // }
  // return undefined
  // });
  // return promise;
});

const assignFeedbackMap = assign({
  feedback_map: (context, event) => {
    if (context.skill_panel.updateFeedbackMap) {
      context.skill_panel.updateFeedbackMap(event.feedback_map);
    }
    if (context.tutor.updateFeedbackMap) {
      context.tutor.updateFeedbackMap(event.feedback_map);
    }
    return event.feedback_map;
  }
});

const toggleFeedbackStyle = send((context, event) => {
  if (!event.was_empty && event.now_empty) {
    console.log("EMPTY");
    return { type: "SKILL_PANEL_FEEDBACK_EMPTY" };
  } else if (event.was_empty && !event.now_empty) {
    console.log("NOT EMPTY");
    return { type: "SKILL_PANEL_FEEDBACK_NONEMPTY" };
  }
  return { type: "" };
});

async function printFeedback(context, event) {
  var nl = context.network_layer;
  // var staged_SAI = context.staged_SAI;
  var skill_applications = context.skill_applications// || [staged_SAI]
  await nl.term_print("----",'INFO')
  var typ = context.stu_resp_type;
  for (var skill_app of skill_applications) {
    let resp_type = skill_app['stu_resp_type'] || typ
    
    let print_type = resp_type
    if(resp_type == "ATTEMPT" && skill_app['reward']){
       print_type = skill_app['reward'] > 0 ? "CORRECT" : "INCORRECT"  
    }
    if(print_type == "HINT_REQUEST") print_type = "EXAMPLE"
    
    console.log("printFeedback",print_type)

    if(context.tutor.reprSkillApplication){
      var skill_app_str = context.tutor.reprSkillApplication(skill_app)
    }else{
      var skill_app_str = skill_app.selection + " -> " + String(skill_app.inputs)
    }
    await nl.term_print(print_type + ": " + skill_app_str, print_type);
  }
}

// skill_set={skill_set}
//						select_callback={select_callback}
//						correctness_callback={correctness_callback}
//							initial_select={initial_select}
//							where_colors={where_colors || undefined}
//								current = {window.state_machine}
//								service = {window.state_machine_service}

function get_machine_actions(al_trainer) {
  var tutor = al_trainer.tutor.current;
  var skill_panel = al_trainer.skill_panel.current;
  var buttons = al_trainer.network_layer.current;
  var network_layer = al_trainer.network_layer;

  return {
    services: {
      sendFeedback: (context, event) => {
        if ((context.skill_applications &&
             context.skill_applications[context.staged_index] &&
             context.skill_applications[context.staged_index].skipTraining)
             || context.test_mode) {
          return Promise.resolve(true);
        }
        return network_layer.sendFeedback(context, event);
      },
      //TODO: is this depricated?
      sendFeedbackExplicit: (context, event) =>
        network_layer.sendFeedbackExplicit(context, event),
      applyNextExample: tutor.applyNextExample,
      attemptStagedSkillApp: tutor.attemptStagedSkillApp,
      compareConflictSets: tutor.compareConflictSets,
      applyFromConflictSet: tutor.applyFromConflictSet,
      queryApprentice: network_layer.queryApprentice,
      checkApprentice: network_layer.checkApprentice,
      finalizeStartState:  (context, event) => {
        console.log("Start finalizeStartState")
        tutor.exitSetStartStateMode(context, event)
        return Promise.resolve(true);
      }
    },
    actions: {
      logError: logError,

      stateRecalc: stateRecalc,
      assignResponse: assign({ response: (context, event) => event.data }),
      assignStagedIndex: assign({ staged_index: (context, event) => {
        let index = Number.isInteger(event.data) ? event.data : 0 
        console.log("assignStagedIndex", index)
        return index
        }
      }),
      updateStaged: assign({ 
        skill_applications: (context, event) => {
          let skill_applications = context.skill_applications || []
          skill_applications[context.staged_index || 0] = event.data
          return skill_applications
        }
      }),
      // assignStaged: assign({ staged_SAI: (context, event) => event.data }),
      assignHintRequest: assign({ stu_resp_type: (context, event) => "HINT_REQUEST" }),
      assignAttempt: assign({ stu_resp_type: (context, event) => "ATTEMPT" }),
      assignCorrect: assign({
        skill_applications: (context, event) => {
          let skill_applications = context.skill_applications
          let si = context.staged_index
          skill_applications[si] = { ...skill_applications[si], ...{ reward: 1 } }
          return skill_applications;
        }
      }),
      assignIncorrect: assign({
        skill_applications: (context, event) => {
          let skill_applications = context.skill_applications
          let si = context.staged_index
          skill_applications[si] = { ...skill_applications[si], ...{ reward: -1 } }
          return skill_applications;
        }
      }),
      assignFoci: assignFoci,
      clearFeedbackData: assign((context, event) => {
        return {
          reward: null,
          // "rewards" : null,
          staged_index: null,
          skill_applications: null,
          feedback_map: null
        };
      }),
      applyFeedbackMap: assign(applyFeedbackMap),
      assignSkillApplications: assign({
        skill_applications: (context, event) => {
          let skill_applications
          if(event.data instanceof Array){
            //The response looks like this [{selection:?,action: ?, ...},...]
            skill_applications = event.data
          }else{
            //The response looks like this {...,responses: [{selection:?,action: ?, ...},...]}
            skill_applications = event.data.responses || event.data.skill_applications
          }
          if(skill_applications == undefined){
            if(Object.keys(event.data).length){
              //The response looks like this {selection:?,action: ?, ...}
              skill_applications = [event.data]
            }else{
              //The response was empty
              skill_applications = []
            }
          }
          for(var i=0; i < skill_applications.length; i++){
            skill_applications[i]['index'] = i
          }
          console.log("Final skill_applications",skill_applications)

          context.al_trainer.setState({
            skill_panel_props: {
              skill_set: { "Applicable Skills": skill_applications || [] },
              skill_applications : skill_applications,
            }
          });
          
          return skill_applications
        }
      }),
      appendAndStageSkillApplication: assign({
        staged_index : (context, event) => {
          let skill_applications = context.skill_applications || []
          return skill_applications.length
        },
        skill_applications: (context, event) => {
          let skill_applications = context.skill_applications || []
          let l = skill_applications.length
          skill_applications.push(event.data)
          skill_applications[l]['index'] = l

          context.al_trainer.setState({
            skill_panel_props: {
              skill_set: { "Applicable Skills": skill_applications || [] }
            }
          });

          return skill_applications
        }
      }),
      // done : window.signal_done,

      
      kill_this: _kill_this,
      printEvent: (context, event) => {
        console.log("P_EVT:", event);
      },

      fillSkillPanel: fillSkillPanel,
      clearSkillPanel: clearSkillPanel,
      done: (context, event) => {
        context.al_trainer.training_service.send("PROBLEM_DONE");
      },


      enterSetStartStateMode: tutor.enterSetStartStateMode,
      exitSetStartStateMode: tutor.exitSetStartStateMode,
      enterFeedbackMode: tutor.enterFeedbackMode,
      exitFeedbackMode: tutor.exitFeedbackMode,
      enterFociMode: tutor.enterFociMode,
      exitFociMode: tutor.exitFociMode,
      enterTutoringMode: tutor.enterTutoringMode,
      exitTutoringMode: tutor.exitTutoringMode,
      displayCorrectness: tutor.displayCorrectness,
      
      
      applyStagedSkillApp: (context, event) => {
        let staged_skill_app = context.skill_applications[context.staged_index]
        tutor.applySAI(staged_skill_app);
      },
      proposeStaged: (context, event) => {
        let staged_skill_app = context.skill_applications[context.staged_index]
        tutor.proposeSkillApp(staged_skill_app)
      },
      confirmProposedSAI: (context, event) => {
        tutor.confirmProposedSAI();
      },
      clearProposedSAI: (context, event) => {
        tutor.clearProposedSAI();
      },

      recalcFeedbackMap: recalcFeedbackMap,
      assignFeedbackMap: assignFeedbackMap,
      toggleFeedbackStyle: toggleFeedbackStyle,
      printFeedback: printFeedback,

      generate_nools: network_layer.generate_nools,
      appendStartHistory: appendStartHistory,

      apply_overlay_start: (context,event) => {
        let training_overlay = context.training_overlay
        let start_state_sais = training_overlay && training_overlay.state.start_state_sais
        if(start_state_sais){
          for(var sel in start_state_sais){
            let sai = start_state_sais[sel]
            context.tutor.applySAI(sai)
          }
        }
      }
    },
    guards: {
      saiIsCorrectDone: saiIsCorrectDone,
      forceUseExample: forceUseExample,
      noApplicableSkills: noApplicableSkills,
      isFreeAuthor: isFreeAuthor,
      checkIsCorrect: checkIsCorrect,
      useWholeConflictSet: useWholeConflictSet,
      tutorHandlesStartState : (context)=>{return context.al_trainer.tutor_handles_start_state},
      tutorHandlesDemonstrations : (context)=>{return context.al_trainer.tutor_handles_demonstration},
      tutorHandlesFoci : (context)=>{return context.al_trainer.tutor_handles_foci},
    }
  };
}

export function build_interactions_sm(
  al_trainer,
  inh_context,
) {
  var context = {
    al_trainer: al_trainer,
    training_overlay: al_trainer.training_overlay.current,
    tutor: al_trainer.tutor.current,
    skill_panel: al_trainer.skill_panel.current,
    buttons: al_trainer.buttons.current,
    network_layer: al_trainer.network_layer,

    //Dynamic
    // last_correct : null,
    // staged_SAI: null,
    stu_resp_type: null
  };
  context = {...context, ...inh_context}

  var sm;
  if (context.tutor_mode) {
    sm = tutor_sm;
  } else {
    sm = context.interactive ? interactive_sm : non_interactive_sm;
  }

  const interaction_sm = Machine(
    { ...{ context: context }, ...sm },
    get_machine_actions(al_trainer)
  );
  return interaction_sm;
}

// ------------------------------- NON INTERACTIVE ----------------------------

var non_interactive_sm = {
  initial: "Start",
  states: {
    Start: {
      entry: "stateRecalc",
      on: {
        "": "Querying_Apprentice"
      }
    },
    Querying_Apprentice: {
      invoke: {
        id: "queryApprentice",
        src: "queryApprentice",
        onDone: [
          { target: "Comparing_Conflict_Sets", cond : "useWholeConflictSet",
            actions: ["assignSkillApplications"]},
          { target: "Applying_Next_Example", cond: "noApplicableSkills"},
          { target: "Applying_Staged_Skill_App",
             actions: ["assignSkillApplications"] }
        ],
        onError: "Fail"
      },
      exit: "assignResponse"
    },
    Comparing_Conflict_Sets : {
      invoke: {
        id: "compareConflictSets",
        src: "compareConflictSets",
        onDone: {
          target: "Applying_from_Conflict_Set",
          actions: ["assignSkillApplications"]
        },
        onError: "Fail"
      }
    },
    Applying_from_Conflict_Set : {
      invoke: {
        id: "applyFromConflictSet",
        src: "applyFromConflictSet",
        onDone: {
          target: "Sending_Feedback",
        },
        onError: "Fail"
      }
    },
    Applying_Staged_Skill_App: {
      invoke: {
        id: "attemptStagedSkillApp",
        src: "attemptStagedSkillApp",
        onDone: {
          target: "Sending_Feedback",
          actions: ["updateStaged", "assignAttempt"]
        },
        onError: "Fail"
      }
    },

    Applying_Next_Example: {
      invoke: {
        id: "applyNextExample",
        src: "applyNextExample",
        onDone: {
          target: "Sending_Feedback",
          actions: ["updateStaged", "assignHintRequest"]
        },
        onError: "Fail"
      }
    },

    Sending_Feedback: {
      entry: "printFeedback",
      invoke: {
        id: "sendFeedback",
        src: "sendFeedback",
        onDone: [
          { target: "Done", cond: "saiIsCorrectDone" },
          { target: "Applying_Next_Example", cond: "forceUseExample" },
          { target: "Querying_Apprentice" }
        ],
        onError: "Fail"
      },
      exit: ["stateRecalc", "assignResponse", "clearFeedbackData"]
    },
    Done: {
      type: "final",
      entry: "done"
    },
    Fail: {
      entry: ["logError", "kill_this"]
    }
  }
};

// ------------------------------- INTERACTIVE ----------------------------

var interactive_sm = {
  id: "interactive",
  initial: "Start",
  states: {
    Start: {
      entry: "stateRecalc",
      on: {
        "": [
          { target: "Setting_Start_State", cond: "isFreeAuthor" },
          { target: "Querying_Apprentice" }
        ]
      }
    },
    Setting_Start_State: {
      entry: "enterSetStartStateMode",
      on: {
        START_STATE_SET: {
          target: "Finalizing_Start_State",
          actions: ["appendStartHistory", 'apply_overlay_start']
        }
      },
      // exit: ["exitSetStartStateMode"]
    },
    Finalizing_Start_State: {
      invoke :{
        id: "finalizeStartState",
        src: "finalizeStartState",
        onDone: {
          target : "Querying_Apprentice"
        }      
      },
      exit : "stateRecalc"
    },
    Querying_Apprentice: {
      invoke: {
        id: "queryApprentice",
        src: "queryApprentice",
        onDone: [
          {
            target: "Waiting_User_Feedback.Waiting_Demonstrate_Only",
            cond: "noApplicableSkills",
            // actions: ["fillSkillPanel"]
          },
          {
            target: "Waiting_User_Feedback.Waiting_Yes_No_Feedback",
            actions: ["assignStagedIndex"]
          }
        ],
        onError: "Fail"
      },
      exit : ["assignSkillApplications","fillSkillPanel"]
    },
    Waiting_User_Feedback: {
      entry: "enterFeedbackMode",
      //
      initial: "Waiting_Demonstrate_Only",
      states: {
        Waiting_Demonstrate_Only: {},
        Waiting_Yes_No_Feedback: {
          entry : ["proposeStaged"],
          on: {
            SKILL_PANEL_FEEDBACK_NONEMPTY: "Waiting_Submit_Feedback",
            // "YES_PRESSED" : {target : "#interactive.Sending_Feedback",
            YES_PRESSED: {
              target: "#interactive.Sending_Feedback",
              actions: ["assignCorrect", "assignAttempt", "confirmProposedSAI"]
            },
            NO_PRESSED: {
              target: "#interactive.Sending_Feedback",
              actions: ["assignIncorrect", "assignAttempt", "clearProposedSAI"]
            }
          }
        },
        Waiting_Submit_Feedback: {
          on: {
            SKILL_PANEL_FEEDBACK_EMPTY: "Waiting_Yes_No_Feedback",
            SUBMIT_SKILL_FEEDBACK: {
              target: "#interactive.Sending_Feedback",
              actions: ["clearProposedSAI","applyFeedbackMap"]
            }
          }
        }
      },
      //
      on: {
        STAGE_SAI: { actions: ["assignStagedIndex", "proposeSkillApp"] },
        //
        TOGGLE_FEEDBACK: { actions: "recalcFeedbackMap" }, //, onDone:{actions :"callSend"}, onError: 'Fail'}},
        FEEBACK_MAP_UPDATE: {
          actions: ["assignFeedbackMap", "toggleFeedbackStyle"]
        }, //, onDone:{actions :"callSend"}, onError: 'Fail'}},
        //
        DEMONSTRATE: {
          target: "Waiting_Select_Foci",
          actions: [
            "appendAndStageSkillApplication",
            // "assignHintRequest", //NOTE should probably not be global 
            // "printEvent",
            "clearProposedSAI"
          ]
        },
        GEN_NOOLS: { actions: ["generate_nools"] }
      },

      exit: ["exitFeedbackMode"]
    },
    // "Applying_Staged_Skill_App" : {
    // 	invoke : {
    //         id: "attemptStagedSkillApp",
    //         src: "attemptStagedSkillApp",
    //         onDone: "Sending_Feedback",
    //         onError: 'Fail',
    // 	},
    // },
    Waiting_Select_Foci: {
      entry: "enterFociMode",
      on: {
        "": {
          target: "Sending_Feedback",
          actions: "assignFoci",
          cond: "saiIsCorrectDone"
        },
        FOCI_DONE: { target: "Sending_Feedback", actions: "assignFoci" }
      },
      exit: "exitFociMode"
    },
    Sending_Feedback: {
      entry: ["printFeedback"],
      invoke: {
        id: "sendFeedback",
        src: "sendFeedback",
        onDone: [
          // {target: "Setting_Start_State", cond : },
          { target: "Done", cond: "saiIsCorrectDone" },
          // { target: "Applying_Next_Example", cond: "forceUseExample" },
          { target: "Querying_Apprentice" }
        ],
        onError: "Fail"
      },
      exit: ["stateRecalc", "assignResponse", "clearFeedbackData"]
    },
    // Sending_Feedback_Explicit : {
    // 	entry : 'printFeedback',
    // 	invoke : {
    //         id: "sendFeedbackExplicit",
    //         src: "sendFeedbackExplicit",
    //         onDone: [
    // 	        // {target: "Setting_Start_State", cond : },
    // 	        // {target: "Done", cond : "saiIsCorrectDone"},
    // 	        {target: "Querying_Apprentice"},
    //         ],
    //         onError: 'Fail',
    // 	},
    // 	exit:["stateRecalc","assignResponse","clearFeedbackData"]
    // },
    Done: {
      type: "final",
      entry: ["clearSkillPanel", "done"]
      // on : {
      // 	"" : {target  : "Setting_Start_State", cond : "isFreeAuthor"},
      // },
    },
    Fail: {
      entry: ["logError", "kill_this"]
    }
  }
};

const tutor_sm = {
  id: "interactive",
  initial: "Start",
  states: {
    Start: {
      entry: "stateRecalc",
      on: {
        "": [
          { target: "Setting_Start_State", cond: "isFreeAuthor" },
          { target: "Waiting_User_Attempt" }
        ]
      }
    },
    Setting_Start_State: {
      entry: "enterSetStartStateMode",
      on: {
        START_STATE_SET: {
          target: "Waiting_User_Attempt",
          actions: ["appendStartHistory"]
        }
      },
      exit: ["exitSetStartStateMode", "stateRecalc"]
    },
    Waiting_User_Attempt: {
      entry: ["enterTutoringMode", "stateRecalc"],
      on: {
        ATTEMPT: {
          target: "Checking_Against_Apprentice",
          actions: ["assignSkillApplications","assignStagedIndex"]
        }
      },
      exit: "exitTutoringMode"
    },
    Checking_Against_Apprentice: {
      invoke: {
        id: "checkApprentice",
        src: "checkApprentice",
        onDone: [
          {
            cond: "saiIsCorrectDone",
            target: "Done",
            actions: ["displayCorrectness", "assignCorrect"]
          },
          {
            cond: "checkIsCorrect",
            target: "Waiting_User_Attempt",
            actions: ["displayCorrectness", "assignCorrect"]
          },
          {
            target: "Waiting_User_Attempt",
            actions: ["displayCorrectness", "assignIncorrect"]
          }
        ]
      }
      // exit : "stateRecalc"
    },
    Done: {
      type: "final",
      entry: ["clearSkillPanel", "done"]
    }
  }
};

// const feedbackStates = {
// 	initial: "Waiting_For_Applicable_Skills",
// 	states: {
// 		"Waiting_For_Applicable_Skills" :{
// 			entry : ['queryApprentice'],
// 			on : {
// 				"APPLICABLE_SKILLS_RECIEVED" : "Query_Yes_No_Feedback",
// 				"NO_SKILLS_RECIEVED" : "No_Query_Feedback"
// 			}
// 		},
// 		"Waiting_For_Training_Recieved" :{
// 			on : {
// 				"TRAINING_RECIEVED" : "Waiting_For_Applicable_Skills",
// 			}
// 		},
// 		"No_Query_Feedback" : {
// 			on : {
// 				"SKILL_PANEL_FEEDBACK_NONEMPTY" : "Query_Submit_Feedback"
// 			}
// 		},
// 		"Query_Yes_No_Feedback" : {
// 			on : {
// 				"SKILL_PANEL_FEEDBACK_NONEMPTY" : "Query_Submit_Feedback",
// 				"YES_PRESSED" : "Waiting_For_Training_Recieved",
// 				"NO_PRESSED" : "Waiting_For_Training_Recieved",
// 			}
// 		},
// 		"Query_Submit_Feedback" : {
// 			on : {
// 				"SKILL_PANEL_FEEDBACK_EMPTY" : [
// 					{target : "Query_Yes_No_Feedback", },
// 					{target : "No_Query_Feedback"}
// 				],
// 				"SUBMIT_SKILL_FEEDBACK": "Waiting_For_Training_Recieved"
// 			}
// 		}
// 	}
// }

// const ButtonsMachine = Machine({
//   "initial": "Specify_Start_State",
//   "states": {
//   	"Specify_Start_State": {
//   		on: { "START_STATE_SET": "Query_Demonstrate" },
//   	},
//     "Query_Demonstrate": {
//       on: { "DEMONSTRATE": "Request_Foci",
//        		"DONE": "Specify_Start_State" },

//       ...feedbackStates
//     },
//     "Request_Foci": {
//       on: {
//         "FOCI_DONE": "Query_Demonstrate",
//       },
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
// 		queryApprentice : (context,event) => {
// 			window.queryApprentice()
// 		}
// 	}
// }
// )

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
// 		queryApprentice : (context,event) => {
// 			window.queryApprentice()
// 		}
// 	}
// }
// )

export default build_interactions_sm;
