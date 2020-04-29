import { Machine, assign, interpret } from "xstate";
import RJSON from "relaxed-json";
import { build_interactions_sm } from "./interactions.js";
import { applyPriorKnowledge } from "./prior_knowledge.js";
import { evalJSONFunc } from "./eval.js";
import { Random } from "random-js";

var pick = require('object.pick');
var fs = require("fs");
// const path = require("path")

const random = new Random();

//A set of properties which are passed from the training handler SM context 
//  to the interactions SM as props 
export const problem_props = ['agent_id','free_author', 
        'interactive','tutor_mode','examples_only','test_mode']
const problem_props_dict = problem_props.reduce(function(obj, x) { obj[x] = null;return obj;}, {});        

const CTATGuid = {
  s4: function s4() {
    return Math.floor((1 + Math.random()) * 65536)
      .toString(16)
      .substring(1);
  },
  guid: function guid() {
    return (
      this.s4() +
      this.s4() +
      "-" +
      this.s4() +
      "-" +
      this.s4() +
      "-" +
      this.s4() +
      "-" +
      this.s4() +
      this.s4() +
      this.s4()
    );
  }
};

function load_training_file(context, event) {
  console.log("TRAINING JSON:", context.training_file);
  return fetch(context.training_file)
    .then(response => response.text()) //response.json())
    .then(response => RJSON.parse(response)) //response.json())
    .then(response => Object.entries(response))
    .then(response => {
      return { updateContext: { training_iterator: response } };
    });
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
}

function serve_next_training_set(context, event) {
  var promise = new Promise(async (resolve, reject) => {
    var training_iterator = context.training_iterator;
    var file_params = context.file_params || {};
    console.log("TRAINING ITERATOR", training_iterator.length);
    if (training_iterator.length > 0) {
      var out = training_iterator.shift();
      var name = out[0];

      while (name == "set_params") {
        file_params = { ...file_params, ...out[1] }; //join and prefer new one
        out = training_iterator.shift();
        name = out[0];
      }

      console.log("START TRAINING SET: ", name, file_params);
      var agent_iterator = await evalJSONFunc(out[1],context);

      resolve({
        updateContext: {
          training_iterator: training_iterator,
          agent_iterator: agent_iterator,
          file_params: file_params,
          training_description:
            context.training_file.replace(/^.*[\\\/]/, "") + " : " + name
        }
      });
    } else {
      resolve(null);
    }
  });
  return promise;
}

function parseOuterLoopController(x, problem_set = null) {
  if (typeof x == "string") {
    x = { type: x };
  }
  if (problem_set != null) {
    x["problem_set"] = problem_set;
  }
  x["initialized"] = false;
  return { outer_loop_controller: x };
}

// function resolveProblemSet(spec, context){
// 	var promise = new Promise( async (resolve,reject) => {
// 		var rez;
// 		if(typeof(spec) == 'object'){
//         	spec = {...spec};

// 			var key = Object.keys(spec)[0];
// 			var val = spec[key]
// 			if(key == "concatenate"){
// 				var all = []
// 				for(var g of val){
// 					rez = await resolveProblemSet(g,context)
// 					all = all.concat(rez)
// 				}
// 				resolve(all)
// 			}else if(key == "shuffle"){
// 				rez = await resolveProblemSet(val,context)
// 				resolve(random.shuffle(rez))
// 			}else if(key == "sample"){
// 				var n = val['n']
// 				//TODO: Implement -> var w_repl = val['with_replacement'] || false
// 				var set = val['set']
// 				set = await resolveProblemSet(set,context)
// 				console.log("IT IS THIS BIG:", set.length)
// 				resolve(random.sample(set, n))
// 			}else if(key == "glob"){
// 				var glob_key = val['key']
// 				var pattern = val['pattern']
// 				var matches = await context.network_layer.glob(pattern,context)
// 				matches = matches.map(m => {var o = {}; o[glob_key]="/"+m; return o})
// 				resolve(matches)
// 			}else if(key == "from_file"){

// 			}else{
// 				resolve(spec)
// 			}
//         }else{
//         	resolve([...spec]);
//         }

// 	})
// 	return promise
// }

function serve_next_agent(context, event) {
  var promise = new Promise(async (resolve, reject) => {
    var agent_iterator = context.agent_iterator;
    console.log("AGENT ITERATOR", agent_iterator.length);
    if (context.agent_iterator.length > 0) {
      var agent_obj = agent_iterator.shift();

      if ("repetitions" in agent_obj) {
        if (agent_obj["repetitions"] < 0) {
          agent_iterator.unshift({
            ...agent_obj,
            ...{ _rep_count: (agent_obj["_rep_count"] || 1) + 1 }
          });
        } else if (agent_obj["repetitions"] == 0) {
          agent_obj = agent_iterator.shift();
        } else if (agent_obj["repetitions"] >= 2) {
          agent_obj["repetitions"] -= 1;
          agent_iterator.unshift({
            ...agent_obj,
            ...{ _rep_count: (agent_obj["_rep_count"] || 1) + 1 }
          });
        }
        agent_obj["_rep_count"] = agent_obj["_rep_count"] || 1;
      }

      var problem_set = await evalJSONFunc(agent_obj["problem_set"], context);
      console.log("RESOLVED PROBLEM SET", [...problem_set]);
      // if(typeof(agent_obj["problem_set"]) == 'object'){
      // 	var problem_set = {...agent_obj["problem_set"]};
      // 	problem_set = await resolveProblemSet(problem_set)
      // }else{
      // 	var problem_set = [...agent_obj["problem_set"]];
      // }

      agent_obj = { ...(context.file_params["agent"] || {}), ...agent_obj };

      if (
        context.file_params["agent"] &&
        context.file_params["agent"]["args"]
      ) {
        agent_obj["args"] = {
          ...context.file_params["agent"]["args"],
          ...agent_obj["args"]
        };
      }
      var agent_params = agent_obj["set_params"] || {};
      var rep_count_str =
        agent_obj["_rep_count"] != null
          ? "(" + agent_obj["_rep_count"] + ")"
          : "";
      agent_obj["agent_name"] += rep_count_str;
      var agent_description =
        "Agent Name: " +
        agent_obj["agent_name"] +
        "\nAgent Type: " +
        agent_obj["agent_type"]; //+"<br>"

      var prior_knowledge = [...(agent_obj["prior_knowledge"] || [])];

      var outer_loop_controller = null;
      if ("outer_loop_controller" in agent_obj) {
        outer_loop_controller = parseOuterLoopController(
          agent_obj["outer_loop_controller"],
          problem_set
        );
        problem_set = [outer_loop_controller];
      }

      var other_data = { ...agent_obj };
      delete other_data["problem_set"];
      delete other_data["agent_name"];
      delete other_data["agent_type"];

      resolve({
        updateContext: {
          start_state_history: [],
          request_history: [],
          session_id: CTATGuid.guid(),
          user_guid: agent_obj["agent_name"], //"Stu_" + CTATGuid.guid(),

          agent_params: agent_params,
          agent_name: agent_obj["agent_name"],
          agent_type: agent_obj["agent_type"],
          agent_description: agent_description,
          other_agent_data: other_data,

          agent_iterator: agent_iterator,
          problem_set: problem_set,
          prior_knowledge: prior_knowledge,
          agent_start_time: new Date()
        }
      });
    } else {
      resolve(null);
    }
  });
  return promise;
}

function handle_prior_knowledge(context, event) {
  var promise = new Promise((resolve, reject) => {
    // console.log("WOOP?")
    var prior_knowledge = context.prior_knowledge;
    while (prior_knowledge.length > 0) {
      console.log("CURRENT", prior_knowledge);
      var current = prior_knowledge.shift();
      var out = applyPriorKnowledge(context, current, prior_knowledge);
      if (out["updateContext"]) {
        resolve({ updateContext: out["updateContext"] });
      }
      if (out["train_now"] || false) {
        return promise;
      }
    }

    resolve({
      updateContext: {
        prior_knowledge: prior_knowledge,
        problem_iterator: context.problem_set
      }
    });
  });
  return promise;
}

async function _next_prob_obj(
  problem_iterator,
  agent_params,
  file_params,
  context
) {
  var promise = new Promise(async (resolve, reject) => {
    var prob_obj = problem_iterator.shift();
    while (prob_obj != null && "outer_loop_controller" in prob_obj) {
      var nl = context.network_layer;
      if (!nl.OUTER_LOOP_URL) {
        nl.kill_this(
          "\nCANNOT USE 'outer_loop_controller' : {} pattern unless " +
            "running train.py with --outer-loop flag.\n"
        );
      }
      // console.log("HERE1.5")

      var controller = prob_obj["outer_loop_controller"];
      if (!controller["initialized"]) {
        //TODO: allow for multiple controllers?
        // console.log("HERE1.6")
        await nl.newOuterLoopController(controller, context);
        controller["initialized"] = true;
        // console.log("HERE1.7")
      }
      // console.log("HERE1.9")
      var next = await nl.nextProblem(controller, context);
      // console.log("HERE2")
      if (next != null) {
        problem_iterator.unshift({ ...prob_obj });
        prob_obj = next;
      } else if (problem_iterator.length > 0) {
        prob_obj = problem_iterator.shift();
      } else {
        prob_obj = null;
      }
    }

    // console.log(prob_obj);trz
    if (!prob_obj) {
      resolve([null, agent_params]);
      return;
    }

    while ("set_params" in prob_obj) {
      agent_params = { ...agent_params, ...prob_obj["set_params"] };
      prob_obj = problem_iterator.shift();
      if (!prob_obj) {
        resolve([null, agent_params]);
        return;
      }
    }
    // console.log(prob_obj)
    var fp_clone = { ...file_params };
    delete fp_clone["agent"];
    prob_obj = { ...fp_clone, ...agent_params, ...prob_obj };
    // console.log(prob_obj,agent_params)
    resolve([prob_obj, agent_params]);
    return;
  });
  return promise;
}

function serve_next_problem(context, event) {
  var promise = new Promise(async (resolve, reject) => {
    var prob_obj = null;
    var agent_params = context.agent_params;
    var file_params = context.file_params;
    var problem_iterator = context.problem_iterator;
    var nl = context.network_layer;
    var interactive = context.interactive;
    console.log("PROBLEM ITERATOR", problem_iterator.length);

    if (problem_iterator.length > 0) {
      // console.log("HERE1")
      [prob_obj, agent_params] = await _next_prob_obj(
        problem_iterator,
        agent_params,
        file_params,
        context
      );
      // console.log(prob_obj,agent_params)
      // console.log("SLOOOP")
      // console.log(prob_obj)
      if (prob_obj) {
        if ("repetitions" in prob_obj) {
          if (prob_obj["repetitions"] < 0) {
            problem_iterator.unshift({ ...prob_obj });
          } else if (prob_obj["repetitions"] == 0) {
            [prob_obj, agent_params] = await _next_prob_obj(
              problem_iterator,
              agent_params,
              file_params,
              context
            );
          } else if (prob_obj["repetitions"] >= 2) {
            prob_obj["repetitions"] -= 1;
            problem_iterator.unshift({ ...prob_obj });
          }
        }

        // var EXAMPLES_ONLY = prob_obj["examples_only"] || false;

        var problem_description = Object.keys(prob_obj).reduce((s, key) => {
          return s + key + ": " + prob_obj[key] + "\n";
        }, "");

        resolve({
          updateContext: {
            agent_params: agent_params,
            problem_iterator: problem_iterator,
            prob_obj: prob_obj,
            problem_description: problem_description
          }
        });
      } else {
        resolve(null);
      }
    } else {
      resolve(null);
    }
  });
  return promise;
}
function load_problem(context, event) {
  return context.tutor.loadProblem(context);
}
function query_outerloop(context, event) {}

function iteratorEmpty(context, event) {
  return event.data == null;
}
function AAID(interactions_state_machine) {
  var boop = (context, event) => {
    console.log("MOOOP");
    return {
      ...interactions_state_machine.context,
      ...{ agent_id: context.agent_id }
    };
  };
}

function sendProblemDone(context, event){
  context.network_layer.sendProblemDone(context,event)
}

// function gerp(event){
// 	console.log("GERP")
// 	return event.data['agent_id']
// }

function start_training_interaction(context, event) {
  console.log("START TRAINING INTERACTION");
  var app = context.app;

  var pass_along_context = {...pick(context, problem_props),
                            ...pick(context.prob_obj, problem_props)}
  // {
  //   agent_id: context.agent_id,
  //   interactive: context.interactive,
  //   free_author: context.free_author
  // };

  var interactions_sm = context.interactions_sm.withContext({
    ...context.interactions_sm.context,
    ...pass_along_context
  });
  var interactions_service = interpret(interactions_sm);
  context.app.interactions_service = interactions_service;
  interactions_service.onTransition(app.onInteractionTransition);
  interactions_service.start();
}

function allDone(context, event) {
  var nl = context.network_layer;
  console.log("ITS ALL DONE!");
  nl.kill_this("\n TRAINING FINISHED SUCCESSFULLY! \n", "info");
  // nl.term_print('\x1b[0;30;47m' + "TRAINING FINISHED SUCCESSFULLY!" + '\x1b[0m');
}

const assignInteractionSM = assign({
  interactions_sm: (context, event) => {
    var new_context = {
      ...{app: context.app},
      ...pick(context,problem_props),
      ...pick(context.prob_obj,problem_props),
      ...event.data
    };
    console.log("assignInteractionSM", new_context);
    var sm = build_interactions_sm(
      new_context.app,
      new_context
    );
    return sm;
  }
});

// function create_agent(context,event){
// 	var nl = context.network_layer;

// 	return nl.create_agent(context,event)

// }

export function build_training_sm(app, interactions_sm) {
  // interactions_state_machine,network_layer,training_file,tutor,working_dir
  var nl = app.network_layer;
  var context = {
    //Utils
    app: app,
    tutor: app.tutor.current,
    skill_panel: app.skill_panel.current,
    buttons: app.buttons.current,
    network_layer: app.network_layer,

    //Inherited
    interactive: app.props.interactive,
    training_file: app.props.training_file,
    working_dir: app.props.working_dir,
    interactions_sm: interactions_sm,

    //Dynamic
    file_params: null,
    agent_params: null,
    prob_obj: null,
    // free_author: null
  };
  
  context = {...problem_props_dict,...context}


  const sm = Machine(
    {
      context: context,
      initial: "Loading_Training_File",
      states: {
        Loading_Training_File: {
          invoke: {
            id: "load_training_file",
            src: "load_training_file",
            onDone: {
              target: "Serving_Training_Sets",
              actions: "updateContext"
            },
            onError: { target: "Fail", actions: "logError" }
          }
        },
        Serving_Training_Sets: {
          invoke: {
            id: "serve_next_training_set",
            src: "serve_next_training_set",
            onDone: [
              { target: "All_Done", cond: "iteratorEmpty" },
              { target: "Serving_Agents", actions: "updateContext" }
            ],
            onError: { target: "Fail", actions: "logError" }
          }
        },
        Serving_Agents: {
          invoke: {
            id: "serve_next_agent",
            src: "serve_next_agent",
            onDone: [
              { target: "Serving_Training_Sets", cond: "iteratorEmpty" },
              { target: "Creating_Agent", actions: "updateContext" }
            ],
            onError: { target: "Fail", actions: "logError" }
          }
        },
        Creating_Agent: {
          invoke: {
            id: "create_agent",
            src: "create_agent",
            onDone: {
              target: "Handling_Prior_Knowledge",
              actions: "assignAgentId"
            },
            onError: { target: "Fail", actions: "logError" }
          }
        },
        Handling_Prior_Knowledge: {
          invoke: {
            id: "handle_prior_knowledge",
            src: "handle_prior_knowledge",
            onDone: { target: "Serving_Problems", actions: "updateContext" },
            onError: { target: "Fail", actions: "logError" }
          }
        },
        Serving_Problems: {
          invoke: {
            id: "serve_next_problem",
            src: "serve_next_problem",
            onDone: [
              { target: "Serving_Agents", cond: "iteratorEmpty" },
              { target: "Waiting_Problem_Load", actions: "updateContext" }
            ],
            onError: { target: "Fail", actions: "logError" }
          }
        },
        Waiting_Problem_Load: {
          invoke: {
            id: "load_problem",
            src: "load_problem",
            onDone: { target: "Training", actions: "updateContext" },
            onError: { target: "Fail", actions: "logError" }
          }
        },
        Training: {
          entry: "start_training_interaction",
          on: {
            PROBLEM_DONE: {
              target : "Serving_Problems",
              actions : "sendProblemDone",
            },
            CHANGE_INTERACTION_MODE: {
              target: "Serving_Problems",
              actions: "assignInteractionSM"
            }
          }
          // invoke : {
          // 	id: "interactions_state_machine",
          // 	src: "interactions_state_machine",
          // 	data : (context, event) => ({...interactions_state_machine.context, ...{"agent_id": context.agent_id}}),
          // 	onDone: "Serving_Problems",
          // 	onError: {target :'Fail', actions : "logError"}
          // },
          // entry : send({type: "ASSIGN_AGENT", "agent_id" : agent_id})
        },
        All_Done: {
          entry: "allDone",
          type: "final"
        },
        Fail: {
          entry: ["logError", "kill_this"]
        }
      }
    },
    {
      services: {
        load_training_file: load_training_file,
        serve_next_training_set: serve_next_training_set,
        serve_next_agent: serve_next_agent,
        create_agent: nl.createAgent,
        serve_next_problem: serve_next_problem,
        load_problem: load_problem,
        handle_prior_knowledge: handle_prior_knowledge

        // interactions_state_machine : interactions_state_machine,
      },
      actions: {
        start_training_interaction: start_training_interaction,
        logError: (context, event) => {
          console.error(event.data);
        },
        updateContext: assign((context, event) => {
          return event.data.updateContext;
        }),
        assignAgentId: assign((context, event) => {
          return { agent_id: event.data["agent_id"] };
        }),
        allDone: allDone,
        assignInteractionSM: assignInteractionSM,
        sendProblemDone : sendProblemDone
      },
      guards: {
        iteratorEmpty: iteratorEmpty
      }
    }
  );

  // console.log("JSON MACHINE",sm)
  return sm;
}
