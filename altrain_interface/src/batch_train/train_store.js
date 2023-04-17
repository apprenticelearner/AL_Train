import {create} from "zustand";
import {baseName, baseFile, CTATGuid} from "../utils";
import {makeChangeStore} from "change-store";
import {evalJSONFunc} from "../eval";

// Format: [do_act, do_feedback, do_demo, on_incorrect]
const feedback_modes = {
  // Normal ITS training loop.
  full :            [1,1,1,'feedback'],
  default :         [1,1,1,'feedback'],

  // No Demonstrations only suitable for agents with preset action space. 
  no_demos :        [1,1,0,'feedback'],

  // Demonstrations are always given, but act() is called anyway.
  predict_observe : [1,0,1,'demo'],

  // Demonstrations are always given. act() is never called.
  demos_only :      [0,0,1,'demo'],

  // No Feedback or Demonstrations. Moved to next problem on first incorrect.
  //  Agent is evaluated but train() is never called.
  test :            [1,0,0,'next_problem'],

  // No Feedback or Demonstrations. Moved to next problem step on incorrect.
  //  Agent is evaluated on every step on main solution path but train() is never called.
  test_stepwise :   [1,0,0,'next_step'],
}

export const useTrainStore = create((set,get) => ({
    /* "mode" indicates the current unique state-machine state that the batch trainer
       is in. It can be in one of the following states: ??
    */
    mode : null,
    tutor: null,
    error: null,


    // A set of global parameters provided by the training file
    file_config: null, 
    // Agent configuration: {name, type, start_time, ...rest}
    agent_config: null,
    // Problem Configuration: {HTML, question_file, ...rest}
    prob_config: null,

    // A message displayed at top level if not null.
    message : null,

    // Descriptions for agents, training sets, and problems
    train_desc : null,
    agent_desc : null,
    problem_desc : null,

    // Configuration of the outerloop controller
    outerloop_config : null,

    // A full set of problems passed to an outerloop controller for selection.
    problem_set: null,

    // A running history of start states and requests 
    start_state_history: [],
    request_history: [],

    // Ids for the session and user (used in CTAT logging)
    session_id: CTATGuid.guid(),
    user_guid: null, // gets set the agent's name

    network_layer : null,

    setTutor: (tutor) => set((state) => ({tutor: tutor})),
    setError: (error) => set((state) => ({error: error})),

    /* ------------------------------------------------
      : Controls for serving training configuration files
    */ 
    serveTrainingSet: async (training_config, training_file, network_layer) =>  {
      // The directory of the training.json
      let match = training_file.match(/(.*)[\/\\]/)
      let working_dir =  !!match ? match[1] : ''; 

      set({mode: "ServingTrainingSets",
           network_layer: network_layer,
           working_dir:   working_dir,
         })

      // get() should come after set() so network layer is defined.
      let store = get()
      let file_params = training_config.set_params || {}
      let agent_set = training_config.batch_train
      let file_agent_config = training_config.agent
      set({train_desc: baseFile(training_file)})

      agent_set = await evalJSONFunc(agent_set, store)
      if(!Array.isArray(agent_set)){agent_set = [agent_set]}

      for (let agent_config of agent_set) {
        // Ensure that agent config inherits from 'agent' specified at file level
        agent_config = {...agent_config,...file_agent_config}

        // Parse name, type, args, problem_set
        let {agent_name, name,  agent_type, type,
             set_params,  args, agent_args, repetitions=1,
             problem_set, outer_loop_controller,
             ...rest} = agent_config
        agent_name = agent_name || name
        agent_type = agent_type || type
        agent_args = {...(args || agent_args), ...rest}

        if(!agent_name){
          throw new Error(`Agent config missing 'name'|'agent_name':\n${JSON.stringify(agent_config)}`)
        }
        if(!agent_type){
          throw new Error(`Agent config missing 'type'|'agent_type':\n${JSON.stringify(agent_config)}`)
        }

        // Fill in any set_params at agent level 
        let agent_params = {...file_params, ...set_params}

        let r = 1
        while(repetitions === -1 || r <= repetitions){
          let rep_count = (repetitions && r)

          // Instantiate problem_set or outerloop individually by agent
          let evaled_problem_set;
          if(outer_loop_controller){
            // Instantiate Outerloop Controller
            evaled_problem_set = [await parseOuterLoopConfig(
              outer_loop_controller, problem_set, store
            )]
          }else if(problem_set){
            // Ensure any fixed problem set is evaled
            evaled_problem_set = await evalJSONFunc(problem_set, store)
          }else{
            throw new Error(`Agent config missing 'problem_set'|'outer_loop_controller':\n${JSON.stringify(agent_config)}`)
          }

          let agent_config = {name: agent_name, type: agent_type, args: agent_args}
          set({mode: "CreatingAgent", agent_rep_count: rep_count,
               user_guid: agent_name, agent_config: agent_config
          })
          console.log("CREATE:", agent_name, rep_count)
          await store.trainAgent(agent_config, agent_params, evaled_problem_set, rep_count)
          r += 1
        }
        set({mode: "ServingTrainingSets"})
      }

      // Set all done, and kill the host altrain process
      set({mode : "AllDone", message: "All Done!"})
      network_layer.kill_this("All Done!", "INFO")
    },

    trainAgent: async (agent_config, agent_params, problem_set, rep_count=null) =>  {
      let store = get()
      let {name, type, message} = agent_config
      let agent_uid = (await store.network_layer.createAgent(agent_config, rep_count))['agent_uid']
      set({mode: "Training", 
           agent_desc:`${type}(name='${name}, uid=${agent_uid})` + (rep_count!=null ? ` (${rep_count})` : ""),
           agent_uid, problem_set, message}
      )
      while(problem_set.length > 0){
        // Ensure using most up-to-date store
        store = get()
        let prob_config = await next_prob_config(problem_set, agent_params, store)

        // probj_config == null signals problem_set exhausted.
        if(!prob_config) break;        

        let {prob_rep=1, repetitions=1} = prob_config
        if(prob_rep < repetitions || repetitions === -1){
          problem_set.unshift({...prob_config, prob_rep:prob_rep+1})
        }
        set({"prob_config" : prob_config})
        await store.trainProblem(agent_uid, {...prob_config, agent_rep:rep_count}, agent_params)
      }
    },


    trainProblem: async (agent_uid, prob_config, agent_params) =>  {
      // console.log("prob_config", prob_config)
      let store = get()
      let {network_layer: nl, tutor} = store
      let {HTML, question_file, prob_rep, message} = prob_config
      let rep_str = prob_rep ? ` (${prob_rep})` : ""
      set({prob_desc: `HTML: ${baseFile(HTML)}\nProblem: ${baseFile(question_file)}${rep_str}`,
           message})

      let prob_name = baseName(question_file)
      let term_str = `Starting Problem: ${prob_name}${rep_str}`
      nl.term_print(term_str, "INFO")
      // console.log(term_str)

      let {feedback_mode='default'} = agent_params
      let [do_act, do_feedback, do_demo, on_incorrect] = feedback_modes[feedback_mode || 'full']

      console.log("START LOAD")
      await tutor.loadProblem(prob_config, store).catch((res)=>{
        console.log("KILL")
        nl.kill_this(res);
        return
      })
      console.log("END LOAD")

      let tutor_state = tutor.getState()
      let reward = null

      while(!tutor.isDone()){
        let sai = null
        if(do_act){
          sai = await nl.act(agent_uid, tutor_state);
          if(!sai || (sai && Object.keys(sai).length === 0)) sai = null  
        } 

        let need_demo = do_demo && !sai
        if(sai){
          // Calc reward. Note: logging may occur at this step.
          reward = await tutor.applySAI(sai)

          // If incorrect apply from on_incorrect mode.
          if(reward < 0){
            if(on_incorrect==="demo"){
              need_demo = true
            }else if(on_incorrect==="next_problem"){
              break
            }else if(on_incorrect==="next_step"){
              tutor?.lockElement(sai.selection);
              tutor_state = tutor.getState();
              continue
            }
            // Else =='feedback'. Will call train() below.
          }
        }

        if(!sai){
          // Get demo SAI anytime no sai because logging may occur at this step.
          sai = await tutor.getDemo(true)  
          if(need_demo){
            await tutor.applySAI(sai)    
            tutor?.colorElement(sai.selection, "DEMO");
            reward = 1
            nl.term_print(`DEMO: ${sai.selection} -> ${JSON.stringify(sai.inputs)}`, "DEMO");
          }
        }else{
          // Print Feedback
          let print_type = reward > 0 ? "CORRECT" : "INCORRECT"
          nl.term_print(`${print_type}: ${sai.selection} -> ${JSON.stringify(sai.inputs)}`, print_type);
        }
        
        if(need_demo || do_feedback){
          await nl.train(agent_uid, tutor_state, sai, reward, {is_demo:need_demo})  
        }
        
        if(reward > 0) tutor_state = tutor.getState();
      }
    }
}))


let parseOuterLoopConfig = async (controller, problem_set = null, context={}) => {
  if (typeof controller === "string") {
    controller = { type: controller };
  }
  controller = {...controller}
  console.log("OOOOOOO", controller, problem_set)
  controller.problem_set = await evalJSONFunc(controller['problem_set'] || problem_set, context)
  if(!controller.problem_set){
    throw new Error(`A 'problem_set' not defined at the agent level or in the outerloop controller`)  
  }
  controller["initialized"] = false;
  return { outer_loop_controller: controller };
}

let next_prob_config = async (problem_iterator, agent_params, store)=> {
  // Pop off the next problem config. It might be an outerloop controller
  let prob_config = problem_iterator.shift();

  // Handle Outer Loop Case
  while (prob_config != null && "outer_loop_controller" in prob_config) {
    let nl = store.network_layer;
    if (!nl.outerloop_url) {
      nl.kill_this(
        "\nCANNOT USE 'outer_loop_controller' : {} pattern unless " +
          "running altrain with --outer-loop flag.\n"
      );
    }

    let controller = prob_config["outer_loop_controller"];
    if (!controller["initialized"]) {
      await nl.newOuterLoopController(controller, store);
      controller["initialized"] = true;
    }

    let next = await nl.nextProblem(controller, store);
    if (next != null) {
      // Push the controller back to the problem iterator.
      problem_iterator.unshift({ ...prob_config });
      prob_config = next;
    } else if (problem_iterator.length > 0) {
      // Get the next problem
      prob_config = problem_iterator.shift();
      continue
    } else {
      return null
    }

    // NOTE: prob_config should be non-null by here 
  }

  if (!prob_config) { return null }

  // If the problem is a set_params call then apply it.
  while ("set_params" in prob_config) {
    Object.assign(agent_params, prob_config["set_params"]);
    // agent_params = { ...agent_params, ...prob_config["set_params"] };
    prob_config = problem_iterator.shift();
    if (!prob_config) { return null }
  }

  console.log("BEFORE", prob_config)
  // If the problem config is a function like "sample" or "glob" run it.
  prob_config = await evalJSONFunc(prob_config, store)

  // If output is list then unshift it into the iterator.
  if(Array.isArray(prob_config)){
    problem_iterator.unshift(...prob_config)
    prob_config = problem_iterator.shift()
  }

  if(!prob_config || !(typeof prob_config === "object")){
    throw new Error(`Expected an object for problem configuration. Got ${prob_config} with type '${typeof prob_config}'.`)
  }

  // Merge prob_config with agent_params
  prob_config = {...agent_params, ...prob_config};  
  return prob_config



}

export let useTrainStoreChange = makeChangeStore(useTrainStore)




