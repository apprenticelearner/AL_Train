import create from "zustand";
import {randomUID, arraysEqual, baseFile} from "../utils.js";
import {makeChangeStore} from "change-store";


import {graph_data} from "./graph_test_data1.js"
import {organizeByDepth} from "./graph.js"
let {states:debug_graph_states, actions:debug_graph_actions} = graph_data
const GRAPH_DEBUG_MODE = false

const test_state = {
  "A" : {
    id: "A",
    type : "textfield",
    x : 100,
    y : 100,
    width: 200,
    height: 100,
  },
  "B" : {
    id: "B",
    type : "textfield",
    x : 200,
    y : 250,
    width: 200,
    height: 200,
  },
  "C" : {
    id: "C",
    type : "textfield",
    x : 350,
    y : 100,
    width: 100,
    height: 100,
  },
  "D" : {
    id: "D",
    type : "textfield",
    x : 50,
    y : 300,
    width: 100,
    height: 100,
  },
  "Button" : {
    id: "Button",
    type : "button",
    x : 150,
    y : 500,
    width: 100,
    height: 50,
  },
  "E" : {
    id: "E",
    type : "textfield",
    x : 500,
    y : 300,
    width: 100,
    height: 100,
  },
  "F" : {
    id: "F",
    type : "textfield",
    x : 650,
    y : 300,
    width: 100,
    height: 100,
  },
  "G" : {
    id: "G",
    type : "textfield",
    x : 500,
    y : 500,
    width: 100,
    height: 100,
  },
}

const test_skill_applications = [
        {"selection" : "A", "action_type" : "UpdateTextField", "input" : "6",
          "how": "Add(?,?,?) ","reward": 0, only: false},

        { "selection" : "B", "action_type" : "UpdateTextField", "input" : "long long long long long long long long sdf sdf sjif sd",
          "how": "Add(?,?,?)", "reward": 0},
        { "selection" : "B", "action_type" : "UpdateTextField", "input" : "8x + 4 + 7 + 9 + 2+6+5",
          "how": "x0 + x1 + x2", "reward": 0,
          arg_foci: ["E","F"]},
        { "selection" : "B", "action_type" : "UpdateTextField", "input" : "9",
          "how": "Add(?,?,?)", "reward": 0},
        { "selection" : "B", "action_type" : "UpdateTextField", "input" : "5",
          "how": "Add(?,?,?)", "reward": 0},
        { "selection" : "B", "action_type" : "UpdateTextField", "input" : "12",
          "how": "Add(?,?,?)", "reward": 0},
        { "selection" : "B", "action_type" : "UpdateTextField", "input" : "16x - 8",
          "how": "Subtract(?,Add(?,?))", "reward": 0},

        { "selection" : "C", "action_type" : "UpdateTextField", "input" : "8x + 4",
          "how": "x0 + x1 + x2", "reward": 0,
          arg_foci: ["E","F"]},
        { "selection" : "C", "action_type" : "UpdateTextField", "input" : "9",
          "how": "Add(?,Subtract(?,?,?),?, Subtract(?,?,?))", "reward": 0},
        { "selection" : "C", "action_type" : "UpdateTextField", "input" : "5",
          "how": "Add(?,?,?)", "reward": 0},
        { "selection" : "C", "action_type" : "UpdateTextField", "input" : "12",
          "how": "Add(?,?,?)", "reward": 0},
        { "selection" : "C", "action_type" : "UpdateTextField", "input" : "16x - 8",
          "how": "Subtract(?,Add(?,?))", "reward": 0},

        // { "selection" : "Button", "action" : "PressButton", "input" : "-1",
        //   "how": "-1", "reward": 0},
]

for(let sa of test_skill_applications){
  sa.uid = randomUID()
}


const removeKey = (key, {[key]: _, ...rest}) => rest;

const applySkillAppAttr = (store, skill_app, attr, val) => {
  return {skill_apps : {
        ...store.skill_apps,
        [skill_app.uid] : {...store.skill_apps[skill_app.uid], [attr]:val}
  }}
}



const findStageCandidate = (store) =>{

}

// GLOBAL CONFIG
const EXPLAIN_DEMO_REFRESH_DELAY = 0




var authorStore;
var setAuthorStore;
const useAuthorStore = create((set,get) => ({
  get : authorStore=get,
  set : setAuthorStore=set,

  // Objects for each of the user's current agents
  agents : {},
  // The unique id of the currently selected agent.
  agent_uid : null,
  // A promise that resolves when a selected / newly created agent is loaded
  agentPromise : null,
  // Promises for calls to explain_demo
  explainPromises : [],

  // The current Interface and Question
  curr_interface : "",
  curr_question : "",

  // Counters for forcing rerenders in absence of meaningful state change
  transaction_count : 0, 
  n_tutor_loads : 0,

  // Skills
  skills : {},

  // Skill Applications (queried from the agent)
  skill_apps : {},
  sel_skill_app_uids : {},

  // Skill Applications for tutor performed actions that set start state.
  // start_skill_apps : {},

  /* Graph  */
  graph : null,
  graph_states : (GRAPH_DEBUG_MODE && debug_graph_states) || {},
  graph_actions : (GRAPH_DEBUG_MODE && debug_graph_actions) || {},
  graph_prev_update_time : null,
  graph_demo_count : 0, // Simply used as rerender trigger  

  /* Tutor  */
  // A reference to the tutor wrapper instance.
  tutor : null,
  tutorPromise : null,
  resolveTutorPromise : null,
  problemLoadedPromise : null,

  // The JSON state of the tutor experienced by the agent
  tutor_state : null,

  // The problem configuration, typically {HTML: ???, question_file: ???}
  prob_config: null,

  /* Authoring Interactivity States  */
  input_focus : "",
  focus_uid : "",
  focus_sel : "",
  hover_uid : "",
  hover_sel : "",
  staged_uid : "",
  staged_sel : "",

  // Hovering and selecting states from graph.
  curr_state_uid : "",
  hover_state_uid : "",

  stage_undo_stack : [],
  only_count : 0,
  current_tab : "problem",

  // The current mode: "start_state", "train", "arg_foci" 
  mode : null,

  // misc
  stage_ref : null,
  stage_view_ref : null,

  stage_cursor_stack : [],
  stage_cursor : null,
  stage_cursor_ref : null,

  // Short-lived bools associated with keydowns / clicks
  next_down : false,
  prev_down : false,
  apply_down : false,
  pos_rew_down : false,
  neg_rew_down : false,

  // Awaiting Network
  awaiting_agent : false,
  awaiting_rollout : false,
  awaiting_train : false,

  /*** Project ***/
  loadProject(prob_configs){
    let project = JSON.parse(window.localStorage.getItem("project"))
    if(!project){
      let interfaces = {}
      let questions = {}
      for (let prob_config of prob_configs){
        let intr_name = prob_config?.['name'] ?? baseFile(prob_config['HTML'])
        if(interfaces[intr_name]){
          console.warn(`Duplicate Interface Specification ${intr}`)
        }
        interfaces[intr_name] = prob_config
        questions[intr_name] = {}
      }
      project = {
        interfaces : interfaces,
        questions : questions,
        agents : {},
        curr_interface : "",
        curr_question : "",
        agent_uid : "",
      }
      window.localStorage.setItem("project", JSON.stringify(project))
    }
    console.log("PROJECT", project)

    // If project has no question_files then 
    let agentPromise = new Promise((resolve)=>{resolve(project.agent_uid)})
    set({...project, agentPromise})
  },

  saveProject(){

    let store = get()
    let {interfaces, questions, agents, curr_interface, curr_question, agent_uid} = store
    let project = {interfaces, questions, agents, curr_interface, curr_question, agent_uid}
    console.log("SAVE PROJECT", project)
    window.localStorage.setItem("project", JSON.stringify(project))
  },

  /*** Initialize ***/
  // The entry point for authoring 
  initializeAuthoring: (training_config, network_layer) => { 
    let {loadProject} = get()
    let {set_params, author} = training_config
    let prob_configs = author?.interfaces || [set_params]
    console.log("INIT AUTHORING", prob_configs)

    loadProject(prob_configs)
    let {agent_uid, setInterface, setAgent, createAgent, interfaces,
          saveProject , initializeSpeechRecognition} = get()
    
    set({mode: 'train', prob_configs, network_layer: network_layer})

    initializeSpeechRecognition()

    console.log("BEEFOR")
    if(!agent_uid){
      createAgent(training_config.agent).then((agent_uid) =>{
        setAgent(agent_uid)
      })
      saveProject()
    }else{
      setAgent(agent_uid)
    }

    let tutorPromise = new Promise((resolveTutorPromise) =>{
      set({resolveTutorPromise})
    }).then(()=>{
      // After the tutor mounts go to the first interface
      let first_intr = Object.keys(interfaces)[0]
      setInterface(first_intr)  
    })
    set({tutorPromise})

    
      // store.updateAgentRollout()
    // })
    // console.log("AFTERR")
    // let store = get()
    // Wait for the tutor to mount before setting an interface
    



        

    
    
    // store.loadProblem(prob_config)
  },

  startSpeechRecognition : () =>{
    let {speech_recognition} = get()
    if(speech_recognition){
      speech_recognition.start()
      set({speech_recognition_listening : true})  
    }
  },

  onSpeechRecognitionResult : (e)=>{
    let text = e.results[0][0].transcript
    console.log("Results:", e.results)
    console.log("YOU SAID:", text)
    let {focus_uid, skill_apps, setHowHelp} = get()
    let focus_app = skill_apps[focus_uid]
    setHowHelp(focus_app, text)
  },

  onSpeechRecognitionEnd : () =>{
    let {speech_recognition} = get()
    speech_recognition.stop()
    set({speech_recognition_listening : false})
    console.log("END SPEECH")
  },

  initializeSpeechRecognition : () =>{
    let {onSpeechRecognitionResult, onSpeechRecognitionEnd} = get()
    let rec;
    try{
      rec = new webkitSpeechRecognition()  
    }catch(e){
      set({speech_recognition : null});
      return
    }
    
    rec.onresult = onSpeechRecognitionResult
    rec.onend = onSpeechRecognitionEnd
    rec.continuous = false;
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 2;
    console.log("INIT SPEECH", rec)
    set({speech_recognition : rec})
  },

  setHowHelp : (skill_app, text) =>{
    let {modifySkillApp} = get()
    modifySkillApp(skill_app, {how_help : text})
  },

  submitHowHelp : () =>{
    let {skill_apps, focus_uid, explainDemo} = get();
    let focus_app = skill_apps?.[focus_uid];
    explainDemo(focus_app)
  },

  createAgent: (agent_config) =>  {
    let {agents, network_layer} = get()

    console.log("BEGIN CREATE AGENT")

    let agent_obj = {uid: null, awaiting: true, config: agent_config}
    set({agents : {...agents, temp : agent_obj}, awaiting_agent : true})

    let agentPromise = new Promise( async (resolve, reject) =>{
      network_layer.create_agent(agent_config)
      .then((resp) =>{
        let {agent_uid} = resp
        let {agents, agent_uid: curr_agent_uid} = get()

        delete agents['temp']
        agent_obj['awaiting'] = false
        agent_obj['uid'] = agent_uid
        
        if(agent_uid == curr_agent_uid){
          set({awaiting_agent : false})
        }

        set({agents : {...agents, [agent_uid] : agent_obj}})  
        resolve(agent_uid)
      })
      .catch((e) =>{
        console.warn("AGENT ERROR", e)
        agent_obj['error'] = e
      })
    })
    agent_obj['promise'] = agentPromise

    // set({agentPromise})
    return agentPromise
  },

  setAgent: (agent_uid) => {
    let {updateSkills, agents} = get()
    console.log("SET AGENT", agent_uid)
    let agent_object = agents[agent_uid]
    set({agent_uid, 
         agentPromise: agent_object['promise'],
         awaiting_agent : agent_object?.awaiting
    })
    updateSkills()
  },

  loadProblem: async (prob_config) => { 
    let problemLoadedPromise = new Promise(async (resolve) =>{
      let {tutor, network_layer, n_tutor_loads} = get()  
      let bounds = await tutor.loadProblem({...prob_config, prob_rep: n_tutor_loads}, {network_layer})
      let [midX, midY] = [(bounds.x*2+bounds.width)/2, (bounds.y*2+bounds.height)/2]

      let {stage_ref, stage_view_ref} = get()
      let [stage,stage_view] = [stage_ref.current, stage_view_ref.current]
      // The difference between the midpoint of the tutor on the stage
      //  and the middle of the stage viewport 
      let diffX = (midX-stage_view.offsetWidth*.5)
      let diffY = (midY-stage_view.offsetHeight*.5)

      // Set top,left corner to so that it aligns with top of stage
      // then add diffX, diffY to center the tutor content
      stage_view.scroll(
        //350 is width of left graph+menu
        stage.offsetLeft-350+diffX,
        stage.offsetTop+diffY,
      ) 
      // console.log(stage_view.offsetWidth, stage_view.offsetHeight)
      // console.log(stage_view, stage_view.scrollLeft, stage_view.scrollTop)
      let tutor_state = tutor.getState()
      for(let [id, s_obj] of Object.entries(tutor_state)){
        console.log(id, s_obj)
        if(id.includes(".")){
          console.warn(`Element id '${id}' contains a dot '.' this will cause undefined behavior.`)
        }
      }
      // console.log("tutor_state", tutor_state)
      set({tutor_state, n_tutor_loads: n_tutor_loads+1})
      // }

      resolve()
    })
    set({problemLoadedPromise})
    await problemLoadedPromise
    
  },

  setTutor: (tutor) => {
    // Triggered by tutor render. Initializes the tutor. 
    let {resolveTutorPromise} = get()
    set({tutor: tutor})
    resolveTutorPromise()

    // Note: If run with altrain prob_config should be set by now.
    // let {prob_config, network_layer, loadProblem} = get()
    // console.log("setTutor", tutor, prob_config)
    
    // if(prob_config){
    //   loadProblem(prob_config)
    // }
    // window.addEventListenter("keydown", ()=>{if(e.target == document){onKeyDown(e)}}, true)
    
  },

  setGraph: (graph) => {
    set({graph: graph})
  },  

  setGraphBounds: (graph_bounds) => {
    set({graph_bounds: graph_bounds})
  },  

  setCenterContentRef : (center_content_ref) => set({center_content_ref}),
  setStageViewRef : (stage_view_ref) => set({stage_view_ref}),
  setStageRef : (stage_ref) => set({stage_ref}),
  setStageCursorElem : (stage_cursor_elem) => {
    console.log("SET CURSOR", stage_cursor_elem)
    set({stage_cursor_elem})
  },

  /*** Problem Controls */

  setInterface: async (intr_name) => {
    let {interfaces, questions, loadProblem, setQuestion, beginSetStartState, clearInterface} = get()
    let prob_config = interfaces[intr_name]
    let q_items = Object.keys(questions[intr_name])
    
    let no_qs = (q_items?.length ?? 0) == 0
    set({curr_interface: intr_name})

    console.log("SET INTER", q_items, no_qs)

    clearInterface(false);
    await loadProblem(prob_config)
    if(no_qs){      
      console.log("beginSetStartState")
      beginSetStartState()
    }else{
      set({mode: 'train'})  
      setQuestion(q_items[0])
    }
  },

  setQuestion: (q_id, interal=false) => {
    let {mode, curr_question, confirmStartState,  clearInterface} = get()
    console.log("SET QUESTION", curr_question, q_id, interal)
    if(q_id != curr_question && !interal && mode == "start_state"){
      confirmStartState(false,true)
    }    

    let store = get()
    let {questions, curr_interface, tutor, editing_question_menu, setFocus,
        updateAgentRollout, setSkillApps} = store;
    ({mode} = store);
    
    let question_items = questions[curr_interface] || {}
    let question = question_items?.[q_id];
    if(!question){
      throw new Error(`No question item ${q_id} for ${curr_interface}.`)
      return;
    }

    clearInterface()

    set({curr_question: q_id})    
    let skill_apps = question.skill_apps || {}
    
    let tutor_state = {}
    if(tutor){
      // If in start state mode stage the question's skill_apps
      if(mode == "start_state"){
        setSkillApps(skill_apps)  

      // Otherwise apply skill apps to build the initial state
      }else{
        for (let [uid,sai] of Object.entries(skill_apps)){
          tutor.stageSAI(sai)
        }
      }
      tutor_state = tutor.getState()  
      console.log(tutor_state)
      set({tutor_state, start_state: tutor_state})  
    }

    // If in train mode query the agent on this problem
    if(mode == "train"){      
      updateAgentRollout(false)
    }
  },

  beginEditingQuestionMenu: (will_be_editing) => {
    let {editing_question_menu:was_editing, confirmStartState,
          setQuestion, curr_question} = get()

    if(will_be_editing){
      // if(store.mode == "start_state"){
      //   store.confirmStartState()
      // }
      set({mode: "start_state"})
      setQuestion(curr_question)
    }else{
      confirmStartState()
    }
    if(!was_editing && will_be_editing){
      set({editing_question_menu: true, mode : "start_state"})
    }
    if(was_editing && !will_be_editing){
      set({editing_question_menu: false, mode : "train"})
    }
  },

  modifyQuestion : (intr, q_id, changes)=>{
    let {curr_interface, questions} = get();
    intr = intr || curr_interface;
    let question_items = questions[intr] || {}
    let curr_q = question_items[q_id] || {}
    questions = {...questions,
      [intr]: {...question_items,
        [q_id] : {...curr_q, ...changes}
      }
    }
    set({questions})
  },

  confirmStartState: (force=false, return_to_train=true) =>{
    let store = get()
    let {questions, curr_interface, skill_apps, editing_question_menu,
        setSkillApps, clearInterface, modifyQuestion} = store
    let question_items = questions[curr_interface] || {}

    console.log(skill_apps)

    // If the new problem is empty don't save it.
    if(!force && Object.entries(skill_apps).length==0){
      console.log("EMPTY PROBLEM" ,question_items)
      set({mode: 'train', editing_question_menu:false})
      store.setQuestion(Object.keys(question_items)?.[0], true)
      return
    }
    
    let q_id;
    //Edit Case
    if(editing_question_menu){
      let {curr_question} = store
      // questions = {...questions,
      //   [curr_interface]: {...question_items,
      //     [curr_question] : {...question_items[curr_question], skill_apps, start_state_uid: null}
      //   }
      // }
      q_id = curr_question
      modifyQuestion(curr_interface, q_id, {skill_apps, start_state_uid: null})

      
      
    // New Question Case
    }else{
      let N = 0
      for (let [id,{name,n}] of Object.entries(question_items)){
        if(n > N) N = n;
      }
      N++;
      let new_name = q_id = `Question ${N}`

      modifyQuestion(curr_interface, q_id, {name: q_id, n:N, skill_apps, start_state_uid: null})

      // questions = {...questions,
      //   [curr_interface]: {...question_items,
      //     [new_name] : {name: q_id, n:N, skill_apps}
      //   }
      // }
    }
    console.log("BLOOP")
    // Insert the new/edited question
    // set({questions})
    store.saveProject()

    if(return_to_train){
      set({mode : 'train', editing_question_menu:false})
      store.setQuestion(q_id, true)
    }
  },

  removeQuestion: (id, intr=null) =>{
    console.log("removeQuestion!")
    let {questions, curr_interface, beginSetStartState, setQuestion} = get()
    intr = intr || curr_interface;
    let question_items = questions[intr] || {}

    delete question_items?.[id];
    questions = {...questions, [intr] : question_items}
    set({questions})

    question_items = questions[intr] || {}

    // Choose prev question
    let keys = Object.keys(question_items)

    let new_index = keys.indexOf(id)-1
    new_index = new_index >= 0 ? new_index : 0  
    if(keys.length==0){
      beginSetStartState()
    }else{
      setQuestion(keys[new_index], true)  
    }
  },

  /*** Train Controls ***/

  updateGraphConnections : async (skill_app) =>{
    // Add demo skill_app to the graph  
    let {graph_states, graph_actions, network_layer, agentPromise, tutor_state} = get()
    
    let skill_app_uid = skill_app.uid
    let prev_next_state_uid = graph_actions?.[skill_app_uid]?.next_state_uid
    
    // Make SAI
    let {selection, action_type, inputs, ...rest} = skill_app
    let sai = {selection, action_type, inputs}


    // console.log("DO PRED", sai)
    let agent_uid = await agentPromise
    let {next_state: next_state, state_uid: curr_state_uid, next_state_uid : next_state_uid} = 
      await network_layer.predict_next_state(agent_uid, tutor_state, sai);

    console.log("UP G:", skill_app_uid, next_state_uid, prev_next_state_uid)
    if(next_state_uid != prev_next_state_uid){
    
      // console.log("RESP", next_state_uid)
      graph_states = {...graph_states}
      graph_actions = {...graph_actions}
      
      // TODO NOTE: Is it save to assume the depth here?
      let curr_s_obj = graph_states?.[curr_state_uid] ?? {uid : curr_state_uid, depth : 0, depth_index : 0};
      if(!graph_states?.[next_state_uid]){
        graph_states[next_state_uid] = {
          depth: (curr_s_obj?.depth ?? 0) + 1,
          state: next_state,
          uid : next_state_uid,
          depth_index : curr_s_obj?.out_skill_app_uids?.length ?? 0,
        }
      }
      let next_s_obj = graph_states[next_state_uid]

      graph_actions[skill_app_uid] = {
        uid: skill_app_uid,
        state_uid:  curr_state_uid,
        next_state_uid:  next_state_uid,
        skill_app : skill_app,
      }
      // If current state out doesn't have this action then add it
      if(!curr_s_obj?.out_skill_app_uids?.includes(skill_app_uid)){
        curr_s_obj.out_skill_app_uids = [skill_app_uid, ...curr_s_obj?.out_skill_app_uids ?? []]  
      }

      // If next state in doesn't have this action then add it
      if(!next_s_obj?.in_skill_app_uids?.includes(skill_app_uid)){
        next_s_obj.in_skill_app_uids = [skill_app_uid, ...next_s_obj?.in_skill_app_uids ?? []]  
      }
      
      // If the previous next state has this action as an input then remove it. 
      let prev_next_s_obj = graph_states[prev_next_state_uid]
      if(prev_next_s_obj){
        prev_next_s_obj.in_skill_app_uids = prev_next_s_obj?.in_skill_app_uids?.filter((x) => x != skill_app_uid)
        // If it no longer has any inputs then remove it
        console.log("WHOOP", prev_next_s_obj.in_skill_app_uids)
        if(!prev_next_s_obj.in_skill_app_uids || prev_next_s_obj.in_skill_app_uids.length == 0){
          delete graph_states[prev_next_state_uid]
        }
      }
      set({graph_states, graph_actions, curr_state_uid})
    }
    // }
  },

  explainDemo : async (skill_app) => {
    let {network_layer, modifySkillApp} = get()


    modifySkillApp(skill_app, {awaiting_explanation : true})

    console.log("agentPromise", agentPromise)
    let {skill_apps, agentPromise, tutor_state} = get()
    let skill_app_uid = skill_app.uid



    let agent_uid = await agentPromise

    // Re-get since could have updated while waiting for agent to load
    skill_app = skill_apps[skill_app_uid]
    // console.log(skill_app)
    let {selection, action_type, inputs, ...rest} = skill_app
    let sai = {selection, action_type, inputs}

    // Reject any pending promises for this skill_app
    let {explainPromises} = get()
    let pending_promise_obj = explainPromises?.[skill_app_uid]?.reject?.();

    // Begin calling explain_demo in in a promise and make it the pending promise 
    let new_promise_obj = {};
    let explain_promise = new Promise( async (resolve, reject) => {
      new_promise_obj['reject'] = reject
      let {skill_explanations, func_explanations} = 
        await network_layer.explain_demo(agent_uid, tutor_state, sai, rest);
      resolve({skill_explanations, func_explanations})
    })
    new_promise_obj['promise'] = explain_promise
    explainPromises = {...explainPromises, [skill_app_uid] : new_promise_obj}
    set({explainPromises})

    // When/if it resolves make the UI changes 
    explain_promise.then(({skill_explanations, func_explanations}) => {
      // Format the explanations so that 'react-select' can use them
      let skill_options = [];
      let defaultOption = null
      for(let sa of (skill_explanations ?? [])){
        let option = {
          label: sa?.how_part?.minimal_str,
          value : `Skill Explanations, ${sa.uid}`,
          kind : "skill_app",
          data : sa,
        }
        defaultOption = defaultOption || option
        skill_options.push(option);
      }
      let func_options = [];
      let i = 0;
      for(let expl of (func_explanations ?? [])){
        let option = {
          label: expl?.func?.minimal_str,
          value : `Function Explanations, ${i}`,
          kind : "func",
          data : expl,
        }
        defaultOption = defaultOption || option
        func_options.push(option);
        i++;
      }
      let n_s = skill_explanations?.length ?? 0
      let n_f = func_explanations?.length ?? 0
      let explanation_options = [
        {'label' : `${n_s} Skill Explanations`, value: "Skill Explanations", options: skill_options},
        {'label' : `${n_f} Function Explanations`, value: "Function Explanations", options: func_options},
      ]

      let explanation_time = Date.now()
      console.log("Explanations", explanation_options, explanation_time)

      let explanation_selected = {...defaultOption, explicit : false}

      modifySkillApp(skill_app, {
        explanation_options, explanation_time,
        explanation_selected, awaiting_explanation : false
      })
    })

  },
  clearExplanation: (skill_app) =>{
    let {skill_apps, modifySkillApp} = get()
    let explanation = (skill_app.explanation_options?.[0]?.options?.[0] ?? 
                       skill_app.explanation_options?.[1]?.options?.[0]) ?? null
    if(explanation){
      explanation = {...explanation, explicit : false}
    }

    modifySkillApp(skill_app, {explanation_selected: explanation})
  },

  selectExplanation: (skill_app, explanation) =>{
    let {skill_apps, modifySkillApp} = get()
    modifySkillApp(skill_app, {explanation_selected: {...explanation, explicit : true}})
  },

  setFocus: (skill_app_uid, do_confirm=false) => { 
    let {graph_actions, setTutorState, curr_state_uid} = get()
    let action = graph_actions?.[skill_app_uid] ?? {}
    console.log(action)
    let {skill_app={}, state_uid=""} = action;

    set({focus_sel : skill_app?.selection ?? "", focus_uid : skill_app_uid ?? ""})
    if(state_uid && curr_state_uid != state_uid){
      setTutorState(state_uid, do_confirm)  
    }
  },


  focusPrev: () =>{
    console.log("PREV")
    let {skill_apps, focus_uid, setFocus} = get()
    if(focus_uid){
      let uid_lst = Object.keys(skill_apps)
      let index = uid_lst.indexOf(focus_uid)-1
      if(index < 0) index = uid_lst.length+index
      setFocus(uid_lst[index])
    }
  },

  focusNext: () =>{
    console.log("NEXT")
    let {skill_apps, focus_uid, setFocus} = get()
    if(focus_uid){
      let uid_lst = Object.keys(skill_apps)
      let index = uid_lst.indexOf(focus_uid)+1
      index = index%uid_lst.length
      setFocus(uid_lst[index])
    }
  },

  /* Cursor Setting Stuff */
  // onCursorMove: (e) =>{
  //   let {stage_cursor_ref, stage_view_ref} = get()
  //   let crs = stage_cursor_ref.current
  //   let sv = stage_view_ref.current
  //   if(crs){
  //     // let sv_rect = sv.getBoundingClientRect()
  //     //  + 
  //     // stage_view_ref.style.top +
  //     // crs.style.left = `${e.pageX - sv_rect.x}px`
  //     // crs.style.top =  `${e.pageY - sv_rect.y}px`
  //     crs.style.left = `${e.pageX}px`
  //     crs.style.top =  `${e.pageY}px`
  //     console.log(sv, crs, crs.style.left, crs.style.top)
  //   }
  // },

  _assignCursor: (cursor) =>{
    console.log("ASSIGN", cursor)
    let {center_content_ref:ccref, onCursorMove} = get()
    cursor = cursor || 'auto'
    if(cursor == "arg_foci"){
      ccref.current.style.cursor = "none"
    }else{
      ccref.current.style.cursor = cursor
    }
    set({stage_cursor : cursor})
  },

  _clearCursor: (cursor) =>{
    let {center_content_ref:ccref, onCursorMove} = get()
    ccref.current.style.cursor = "auto"
    set({stage_cursor : 'auto'})
  },

  pushCursor : (cursor) =>{
    console.log("PUSH", cursor)
    let {stage_cursor, stage_cursor_stack, _assignCursor, _clearCursor} = get()
    _clearCursor(stage_cursor)
    if(stage_cursor_stack?.[stage_cursor_stack.length-1] != cursor){
      stage_cursor_stack.push(cursor)  
    }
    _assignCursor(cursor)
  },

  popCursor : (cursor) =>{

    let {stage_cursor, stage_cursor_stack, _assignCursor, _clearCursor} = get()
    let ind = stage_cursor_stack.indexOf(cursor)
    if(ind != -1){
      if(ind == stage_cursor_stack.length-1){
        _clearCursor(stage_cursor)
      }
      stage_cursor_stack.splice(ind,1)
      set({stage_cursor_stack})
    }
    
    console.log("POP", cursor)
    _assignCursor(stage_cursor_stack?.[stage_cursor_stack.length-1])
  },

  setHover: (skill_app_uid) => { 
    let {graph_actions} = get()
    let skill_app = graph_actions?.[skill_app_uid]?.skill_app;

    set({hover_sel : skill_app?.selection ?? "", hover_uid : skill_app_uid ?? ""})
  },

  setHoverSel: (sel) => { 
    console.log("setHoverSel", sel)
    set({hover_sel : sel})
  },

  // Assigned to the focus of 
  setInputFocus: (sel) => set({input_focus:sel}),


  setHoverTutorState: ({uid}) => set((store) => {
    return {hover_state_uid : uid ?? store.hover_state_uid}     
  }),

  // setCurrState: ({uid}) => set((store) => {
  //   return {hover_state_uid : uid ?? store.hover_state_uid}     
  // }),

  setStaged: (skill_app, store_prev=true) => set((store) => { 
    if(typeof(skill_app) == 'string'){
      let {skill_apps} = get()
      skill_app = skill_apps[skill_app]
    }
    let changes = {staged_sel : skill_app.selection, staged_uid : skill_app.uid}
    if(store_prev && store.staged_uid != ""){
      changes['stage_undo_stack'] = [...store.stage_undo_stack, {staged_uid: store.staged_uid, staged_sel : store.staged_sel}]
    }
    return changes
  }),

  undoStaged : () => {

    let {skill_apps, stage_undo_stack: stack} = get()
    // let stack = store.stage_undo_stack
    let changes = {staged_uid: "", staged_sel:"", stage_undo_stack:[]}
    let okay = false

    console.log("undoStaged", stack)
    while(stack.length > 0){

      changes = {...stack.pop(), stage_undo_stack:stack}
      if(skill_apps[changes.staged_uid]?.reward > 0){
        okay = true
        break
      }
    }
    if(!okay){
      console.log("STACK EXHAUSTED")
      for(let skill_app of Object.values(skill_apps)){
        if((skill_app?.reward ?? 0) > 0){
          console.log("+++", skill_app.inputs)
          changes = {staged_uid: skill_app.uid, staged_sel:skill_app.selection, stage_undo_stack:[]}
          break
        }
      }
    }
    console.log("STAGE CHANGES", changes)
    set(changes)
  },

  // undoStaged: () => set((store) => (
  //   makeUndoStagedChanges(store)
  // )),

  incTransactionCount: (skill_app) => { 
    set({transaction_count : store.transaction_count + 1})
  },

  setCurrentTab : (name) => { 
    // console.log("current_tab!!", name)
    set({current_tab : name})
  },

  setMode : (mode) =>  {
    set({'mode' : mode})
  },

  focusFirst : () => {
    let {graph_states, setFocus, curr_state_uid} = get()
    let first_uid = graph_states[curr_state_uid].out_skill_app_uids?.[0];
    setFocus(first_uid)
  },

  setTutorState : async (state, do_confirm=false) => {
    let {graph, graph_states, tutor, showStateSkillApps, focusFirst, confirmFeedback} = get()

    // If state is actually state_uid then grab the states
    let state_uid;
    if(typeof(state) == 'string'){
      state_uid = state
      state = graph_states?.[state_uid]?.state ?? {}
    }

    if(do_confirm){
      await confirmFeedback(false, false)  
    }
    
    tutor.setTutorState(state)
    let tutor_state = tutor.getState()

    set({curr_state_uid :state_uid, tutor_state: tutor_state})
    showStateSkillApps(state_uid)

    if(graph && state_uid){
      setTimeout(()=>{
        console.log("zoom_to", state_uid)
        graph.zoom_to(state_uid)
      },0)  
    }

    focusFirst()
  },

  beginSetStartState : async () => {
    let {tutor, curr_interface, n_tutor_loads, setSkillApps, clearInterface, problemLoadedPromise} = get()

    clearInterface()

    await problemLoadedPromise
    let tutor_state = tutor.getState()
    set({mode : 'start_state', tutor_state, curr_question: "[setting start]", editing_question_menu : false})
  },



  beginSetArgFoci : () => {
    let {pushCursor} = get()

    pushCursor('arg_foci')
    // console.log("CURSOR", stage_view_ref.current)
    // stage_view_ref.current.cursor = 'none'
    // document.
    set({mode : "arg_foci"})
  },

  confirmArgFoci : () => {
    let {skill_apps, focus_uid, popCursor} = get()
    let skill_app = skill_apps?.[focus_uid];
    
    popCursor('arg_foci')
    console.log("confirm arg foci");
    set({mode : "train"})
    if(skill_app){
      skill_app.arg_foci_set = true;
      set({skill_apps : {...skill_apps, [focus_uid] : skill_app}})
    }  
    
  },

  setFociSelect : (sel, hasFociSelect) => { 
    let {skill_apps, focus_uid, explainDemo} = get()
    if(focus_uid == "") return

    let focus_app = {...skill_apps?.[focus_uid]}
    let arg_foci = focus_app?.arg_foci || []
    // console.log(arg_foci, arg_foci.filter((x)=>x!==sel))
    if(!hasFociSelect){
      // console.log(arg_foci, arg_foci.filter((x)=>x!==sel))
      arg_foci = focus_app.arg_foci = arg_foci.filter((x)=>x!==sel)
      if(arg_foci.length == 0){
        arg_foci = null
      }
    }else if(!arg_foci.includes(sel)){
      arg_foci = focus_app.arg_foci = [...arg_foci, sel]
    }else{
      // No Change
      return
    }
    set({'skill_apps' : {...skill_apps, [focus_uid] :  focus_app}})

    explainDemo(focus_app)

    // let prev_focus_uid = focus_uid
    // setTimeout(async ()=>{
      
    //   // If the arg foci haven't changed in 200ms then poll for new set of explanations
      

    //   console.log("TIMEOUT TRIGGER", prev_focus_uid, focus_uid, arg_foci,  focus_app?.arg_foci ?? [])

    //   if(prev_focus_uid == focus_uid && arraysEqual(arg_foci,  focus_app?.arg_foci ?? [])){
    //     console.log("EQUAL")
        
    //   }
    // }, EXPLAIN_DEMO_REFRESH_DELAY)

  },

  mergeGraphChanges : (new_states, new_actions, update_time) =>{
    let {graph_actions, graph_states, graph} = get()

    let new_graph_actions = {}
    let new_graph_states = {}

    // Copy new states to graph
    for (let [uid, s_obj] of Object.entries(new_states)){
      new_graph_states[s_obj.uid] = {...s_obj, prev_update_time: update_time}
    }

    // Copy the new actions and their in an out states
    for (let [uid, a] of Object.entries(new_actions)){
      new_graph_actions[uid] = a
    }

    // Copy old actions and their in/out states if they weren't already added
    for (let [uid, a] of Object.entries(graph_actions)){
      if(new_graph_states?.[a?.state_uid]?.prev_update_time != update_time){
        new_graph_actions[uid] = {...a}
        if(!new_graph_states?.[a?.state_uid]){
          new_graph_states[a.state_uid] = {...graph_states[a.state_uid]}
        }
        if(!new_graph_states?.[a?.next_state_uid]){
          new_graph_states[a.next_state_uid] = {...graph_states[a.next_state_uid]}
        }
      }
    }

    console.log("MERGE", new_graph_states, new_graph_actions)
    return [new_graph_states, new_graph_actions]
  },

  recalcGraphConnections : (states, actions) =>{
    console.log("HERE0")
    // Reset the in/out skills_app_uids
    for (let [uid, s_obj] of Object.entries(states)){
      s_obj.in_skill_app_uids = []
      s_obj.out_skill_app_uids = []  
    }
    
     // Re populate the in_skill_app_uids and out_skill_app_uids for each state
    for (let [uid, a] of Object.entries(actions)){
      let s_obj = states[a?.state_uid];
      s_obj.out_skill_app_uids.push(uid)
      let ns_obj = states[a?.next_state_uid];
      ns_obj.in_skill_app_uids.push(uid)
    }
    console.log("HERE2")
    // Prune any states that have no upstream actions (plus those states' out actions)
    let states_by_depth = organizeByDepth(states)
    for(let [depth, s_lst] of states_by_depth){
      // console.log(s_lst)
      if(depth != 0){
        for (let s_obj of s_lst){
          if(s_obj.in_skill_app_uids.length == 0){
            delete states[s_obj.uid]
            for (let a_uid of s_obj.out_skill_app_uids){
              let a = actions[a_uid] 
              delete actions[a_uid]
              let in_s = states[a.next_state_uid]
              in_s.in_skill_app_uids = (in_s?.in_skill_app_uids ?? []).filter((x)=>x.uid==a_uid)
            }
          }
        }
      }
    }
    console.log("HERE3", states, actions)
    return [states, actions]
  },

  updateAgentRollout : async (merge=false) => {
    console.log("Fetch Next Actions")
    //Make sure the agent exists before we query it for actions 
    let {agentPromise, mergeGraphChanges, recalcGraphConnections, showStateSkillApps,
        questions, curr_interface, curr_question, start_state, network_layer, agent_uid} = get()


    set({awaiting_rollout: true})
    await agentPromise

    // Ensure that we know the state_uid of the start state
    let start_state_uid = questions?.[curr_interface]?.[curr_question]?.start_state_uid
    if(!start_state_uid){
        let {modifyQuestion} = get()
        let start_state_uid = await network_layer.get_state_uid(agent_uid, start_state);  
        modifyQuestion(curr_interface, curr_question, {start_state_uid})
    }
    set({start_state_uid})

    let {tutor_state, setSkillApps, graph_states} = get()

    //NOTE: Should really be stashed until return to mode==train
    setSkillApps({})

    // let base_depth = graph_states[_curr_state_uid]?.depth ?? 0;
    // let rollout = await network_layer.act_rollout(agent_uid, tutor_state, {base_depth})

    let curr_state_uid = await network_layer.get_state_uid(agent_uid, tutor_state);  

    set({curr_state_uid})

    let rollout = await network_layer.act_rollout(agent_uid, start_state)

    console.log("ROLLOUT RETURN", rollout);
    let {states, actions} = rollout
    let update_time = `${Date.now()}-${window.performance.now()}`

    // if(merge){
    //   console.log("MERGE");
    //   ([states, actions] = mergeGraphChanges(states, actions, update_time))
    // }
    ;([states, actions] = recalcGraphConnections(states, actions));

    console.log("START SET", states, actions);
    set({graph_states: states, graph_actions: actions,
        graph_prev_update_time : update_time, awaiting_rollout: false})
    
    console.log("Connected", states, actions);

    let graph
    ({graph, graph_states: states, graph_actions:actions} = get())
    if(graph && curr_state_uid){
      setTimeout(()=>{
      console.log("zoom_to", curr_state_uid)
      graph.zoom_to(curr_state_uid)
    },0)  
    }
    

    console.log("curr_state", states[curr_state_uid])
    let skill_apps = showStateSkillApps(curr_state_uid)

    let {setFocus} = get()
    console.log("FOCUS", skill_apps?.[0]?.uid ?? "")
    setFocus(skill_apps?.[0]?.uid ?? "")
    //set({focus_uid: })
    
  },

  showStateSkillApps: (state_uid) =>{
    let {graph_actions : actions, graph_states : states, setSkillApps} = get()
    let curr_out_uids = states[state_uid]?.out_skill_app_uids??[]
    let new_skill_apps = curr_out_uids.map((a_uid) => actions[a_uid].skill_app)
    console.log("new_skill_apps", new_skill_apps)
    setSkillApps(new_skill_apps)    
    return new_skill_apps
  },

  confirmFeedback : async (apply_focus=true, apply_staged=true, yes_focus=false) => {
    let {network_layer, mode, skill_apps, curr_state_uid, tutor_state, agent_uid,  tutor,
        confirmArgFoci, updateAgentRollout, updateSkills, saveProject, focus_uid, staged_uid,
        graph_states, graph_actions, beginSetStartState, modifySkillApp, setReward} = get()
    if(mode == 'arg_foci'){
      confirmArgFoci()
    }

    if(yes_focus){
      let skill_app = skill_apps[focus_uid]
      if(skill_app && (skill_app?.reward ?? 0) == 0){
        setReward(skill_app, 1);
        ({skill_apps} = get());
      }
    }

    let training_set = [] 
    let states = {[curr_state_uid]: tutor_state} 
    for (let [key, skill_app] of Object.entries(skill_apps)){
      if((skill_app?.reward ?? 0) != 0){
        training_set.push({state: curr_state_uid, ...skill_app})
      }
    }
    let train_promise = network_layer.train_all(agent_uid, training_set, states)
    train_promise.then(() =>{
      for (let ti of training_set){
        modifySkillApp(ti.uid, {"confirmed" : true})
      }
    })

    saveProject()

    // Apply the staged action
    if(apply_focus || apply_staged){
      let apply_uid = (apply_focus && focus_uid) || staged_uid
      let skill_app = skill_apps[apply_uid]
      
      if(apply_uid == focus_uid && (skill_app?.reward ?? 0) <= 0){
        skill_app = skill_apps[staged_uid]
      }

      if(!skill_app){
        return
      } 

      console.log("IS DONE", tutor.isDone(), skill_app)
      if(!(tutor.isDone()) ){
        // NOTE: This is probably worth keeping instead of replacing with
        //  setTutorState since only skill_app is applied instead of whole state.
        await tutor.stageSAI(skill_app)
        let next_state_uid = graph_actions?.[staged_uid]?.next_state_uid
        if(next_state_uid){
          set({curr_state_uid : next_state_uid})
        }
      }else{
        beginSetStartState()
        return
      }        
    }

    set({focus_uid : "", hover_uid : "", staged_uid : "", 
         focus_sel: "", hover_sel: "", staged_sel: ""})    

    await train_promise
    await updateSkills()

    if(apply_focus || apply_staged){
      tutor_state = tutor.getState()
      set({tutor_state})  
      await updateAgentRollout(true)
    }
  },

  updateSkills : async () => {
    let {network_layer, agent_uid} = get()
    let skill_arr = await network_layer.get_skills(agent_uid)
    let skills = {}
    for(let skill of skill_arr){
      skills[skill.uid] = skill
    }
    console.log("SKILLS::", skills)
    set({skills})
  },


  /*** Events ***/


  clickAway : () => { 
    let {mode, confirmStartState, beginSetArgFoci,
     confirmArgFoci, setFocus, setMode} = get()
    // let focus_is_demo = store.skill_apps?.[store.focus_uid]?.is_demo ?? false


    console.log("CLICK AWAY")
    if(mode == "start_state"){
      // // PASS 
      // let {questions, curr_interface} = get()
      // let question_items = questions[curr_interface] || {}

      // // Force user to confirm without click-away if no questions
      // if(Object.keys(question_items).length != 0){
      //   confirmStartState()  
      // }      
    }else{
      // console.log("Set Focus Null")
      if(mode == "arg_foci"){
        confirmArgFoci()
        return
      }
      set({hover_uid : "", hover_sel : ""})
      setFocus(null)
    }//else if(mode == "train" && focus_is_demo){
    //  beginSetArgFoci()
    //}
  },

  toggleFoci : (sel) => { 
    let store = get();
    let selected = store.skill_apps?.[store.focus_uid]?.arg_foci?.includes(sel) ?? false
    store.setFociSelect(sel, !selected)
  },



  onKeyDown : (e) => {
    console.log("OUTER KEY DOWN", e.key, e)
    let {focus_uid, focusNext, focusPrev, graph_actions, setReward, setOnly} = get()

    if(e.code == "Space"){
      let {setStaged, confirmFeedback} = get()
      confirmFeedback(true, true, true)
      set({"apply_down" : true})
      e.preventDefault() // Never jump-scroll on 'space'
    }

    if(e.target == document.body){
      if(e.key == "Enter"){
        let {input_focus, mode, confirmStartState, confirmArgFoci} = get()
        if(mode==="start_state" && !input_focus){
          confirmStartState(true)
        }else if(mode==="arg_foci"){
          confirmArgFoci()
        }
      }
    }
    let cls = e.target.className
    if(e.target == document.body || cls == "SkillAppGroup"){
      if(focus_uid){
        if(e.code == "KeyW" || e.key == "ArrowUp"){
          let skill_app = graph_actions?.[focus_uid]?.skill_app
          if(e.shiftKey){
            skill_app = setOnly(skill_app, !(skill_app?.only ?? false))
          }
          setReward(skill_app, 1)
          e.preventDefault()
          set({"pos_rew_down" : true})
        }else if(e.code == "KeyS" || e.key == "ArrowDown"){
          setReward(graph_actions?.[focus_uid]?.skill_app, -1)
          e.preventDefault()
          set({"neg_rew_down" : true})
        }else if(e.code == "KeyA" || e.key == "ArrowLeft"){
          focusPrev()
          e.preventDefault()
          set({"prev_down" : true})
        }else if(e.code == "KeyD" || e.key == "ArrowRight"){
          focusNext()
          e.preventDefault()
          set({"next_down" : true})
        }
      }
    }
  },

  onKeyUp : (e) => {
    console.log("OUTER KEY UP", e.key, e)
    if(e.code == "Space"){
      set({"apply_down" : false})
      e.preventDefault()
    }else if(e.code == "KeyW" || e.key == "ArrowUp"){
      set({"pos_rew_down" : false})
      e.preventDefault()
    }else if(e.code == "KeyS" || e.key == "ArrowDown"){
      set({"neg_rew_down" : false})
      e.preventDefault()
    }else if(e.code == "KeyA" || e.key == "ArrowLeft"){
      set({"prev_down" : false})
      e.preventDefault()
    }else if(e.code == "KeyD" || e.key == "ArrowRight"){
      set({"next_down" : false})
      e.preventDefault()
    }
  },

  /*** useStore Hook Getters ***/

  getFeedbackCounts : (sel) => (store) => {
    // If sel is null then use all otherwise only those associated with sel
    let {skill_apps, sel_skill_app_uids} = store
    let skill_app_uids_subset = sel ? sel_skill_app_uids?.[sel] ?? [] : Object.keys(skill_apps)

    let counts = {'undef' : 0, 'demo_correct_only' : 0, 'demo_correct' :0, 'demo_incorrect':0,
                  'correct_only' : 0, 'correct' :0, 'incorrect':0,
                 }
    for(let uid of skill_app_uids_subset){
      let {reward=0, is_demo, only} = skill_apps[uid]
      if(reward == null || reward == 0){
        counts.undef++
      }else if(reward > 0){
        if(only){
          if(is_demo){
            counts.demo_correct_only++  
          }else{
            counts.correct_only++
          }
        }else{
          if(is_demo){
            counts.demo_correct++  
          }else{
            counts.correct++
          }
        }
      }else{
        if(is_demo){
            counts.demo_incorrect++  
          }else{
            counts.incorrect++
          }
      }
    }
    return counts
  },

  /*** Getters ***/

  getFocusApp : () => {
    let {skill_apps, focus_uid} = get()
    return skill_apps?.[focus_uid]
  },

  extractArgFoci : (skill_app) =>{
    let arg_foci = skill_app?.arg_foci
    let foci_explicit = true
    if(!arg_foci){
      if(skill_app?.is_demo){
        arg_foci = skill_app?.explanation_selected?.data?.args
        foci_explicit = false
      }else{
        arg_foci = skill_app?.args
        foci_explicit = true
      }
    }

    let {skills} = get()
    // console.log(":::", skills, skill_app?.skill_uid, skill_app)

    let func = skill_app?.explanation_selected?.data?.func ||
               skills?.[skill_app?.skill_uid]?.how?.func || 
               {}

    let {minimal_str="??", vars=[]} = func
    let var_names = vars.map(({alias})=>alias)

    // console.log("::: EXPL", var_names)
    return {arg_foci, foci_explicit, var_names}
  },

  // getHoverSkillApp : (name) => get((store) => { 
  //   return store?.skill_apps?.[store.hover_uid]
  // }),

  /*** Skill Application (Adding & Removing)  ***/

  addSkillApp: (skill_app) => { 
    let {sel_skill_app_uids, skill_apps, only_count, staged_uid,
        graph_actions, curr_state_uid, updateGraphConnections, explainDemo} = get()
    let sel = skill_app.selection
    let store_changes = {
      sel_skill_app_uids : {
      ...sel_skill_app_uids,
      [sel] : [skill_app.uid, ...(sel_skill_app_uids[sel]||[])]
      },
      skill_apps: {
        ...skill_apps,
        [skill_app.uid] : skill_app,
      },
    }
    console.log("ADD", skill_app, !skill_app?.tutor_performed)
    if(!skill_app?.tutor_performed){
      let new_action = {...graph_actions?.[skill_app.uid] || {},
         uid : skill_app.uid,
         state_uid : curr_state_uid,
         skill_app : skill_app
      }
      console.log("NEW ACTION", new_action)

      store_changes = {
        ...store_changes,
        graph_actions: {...graph_actions, [skill_app.uid] : new_action},  
        only_count : only_count + (skill_app?.only || 0),
        staged_uid : staged_uid || (skill_app.reward > 0 && skill_app.uid),
      }
    }

    set(store_changes)
    if(!skill_app?.tutor_performed){
      updateGraphConnections(skill_app)
    }

    if(skill_app.is_demo){
      explainDemo(skill_app)
    }

  },

  modifySkillApp : (skill_app, changes) => {
    console.log(skill_app, changes)
    let {skill_apps, graph_actions} = get()
    if(typeof(skill_app) == "string"){
      let skill_app_uid = skill_app
      skill_app = graph_actions?.[skill_app_uid]?.skill_app
    }
    let changed_skill_app = {...skill_app, ...changes} 

    let store_changes = {
      skill_apps: {...skill_apps,
       [skill_app.uid] : changed_skill_app
      },
    }
    if(!skill_app?.tutor_performed){
      store_changes = {
        ...store_changes,
        graph_actions: {...graph_actions,
          [skill_app.uid] : {...graph_actions?.[skill_app.uid] || {},
           uid : skill_app.uid,
           skill_app : changed_skill_app}
        }
      }
    }
    set(store_changes)
    console.log(store_changes)
    return changed_skill_app
  },


  removeSkillApp: (skill_app) => {
    if(!skill_app) return;
    let {skill_apps, sel_skill_app_uids, only_count, focus_uid, hover_uid, staged_uid,
        graph_states, graph_actions} = get()
    let sel = skill_app.selection
    
    // Remove From SkillApps
    set({
      skill_apps: removeKey(skill_app.uid, skill_apps),
      sel_skill_app_uids : {
        ...sel_skill_app_uids,
        [sel] : sel_skill_app_uids[sel].filter((x)=>x!=skill_app.uid)
      },
      only_count : only_count - (skill_app?.only || 0),
      focus_uid: skill_app.uid == focus_uid ? "" : focus_uid,
      hover_uid: skill_app.uid == hover_uid ? "" : hover_uid,
      staged_uid: skill_app.uid == staged_uid ? "" : staged_uid,
    })

    // If in graph remove from graph
    let a_obj = graph_actions[skill_app.uid]
    if(a_obj){
      let s_obj = graph_states[a_obj.state_uid]
      let next_s_obj = graph_states[a_obj.next_state_uid]
      s_obj = {...s_obj,
        out_skill_app_uids :  (s_obj?.out_skill_app_uids ?? []).filter((x)=>x!=skill_app.uid)
      }
      if(s_obj.out_skill_app_uids.length == 0){
        delete s_obj.out_skill_app_uids
      }
      next_s_obj = {...next_s_obj,
        in_skill_app_uids : (next_s_obj?.in_skill_app_uids ?? []).filter((x)=>x!=skill_app.uid)
      }

      graph_states = {...graph_states,
        [a_obj.state_uid] : s_obj,
        [a_obj.next_state_uid] : next_s_obj
      }
      graph_actions = {...graph_actions}
      delete graph_actions[skill_app.uid]
      if(next_s_obj.in_skill_app_uids.length == 0){
        delete graph_states[a_obj.next_state_uid]
      }

      set({graph_states, graph_actions})
    }
  },

  clearInterface : (clear_tutor=true) => {
    let {setSkillApps, tutor} = get()
    if(tutor && clear_tutor){tutor.clear()}
    set({focus_uid : "", hover_uid : "", staged_uid : "", 
         focus_sel: "", hover_sel: "", staged_sel: "",
         skill_apps : {},
         graph_states: {}, graph_actions: {},
         sel_skill_app_uids : {},
         only_count : 0,
         stage_undo_stack: [],
         tutor_state : {},
       })
    //setSkillApps({})
  },

  setSkillApps: (skill_apps) => {
    let skill_apps_by_sel = {}
    let _skill_apps = {}
    let staged = {staged_uid: "", staged_sel : "", stage_undo_stack: []}

    let only_count = 0 
    // Make skill_apps and sel_skill_app_uids
    for (let sa of Object.values(skill_apps || {})){
      let lst = skill_apps_by_sel?.[sa.selection] ?? []
      lst.push(sa.uid)
      skill_apps_by_sel[sa.selection] = lst
      _skill_apps[sa.uid] = sa

      //Ensure that we stage a skill app if it came with reward > 0
      if(staged.staged_uid == "" && sa.reward > 0){
        staged.staged_uid = sa.uid
        staged.staged_sel = sa.sel
      }
      if(sa.only){
        only_count += 1
      }
    }

    set({
        skill_apps: _skill_apps,
        sel_skill_app_uids: skill_apps_by_sel,
        only_count : only_count,
        ...staged,
    })
  },

  

  /*** Skill Applications (Modifying) ***/

  setReward : (skill_app, reward) => {
    let {staged_uid, setOnly, modifySkillApp, undoStaged, graph_actions} = get()
    let old_reward = skill_app.reward
    skill_app = modifySkillApp(skill_app, {reward})

    // console.log("SET REW", store.skill_apps[skill_app.uid])
    if(old_reward >= 0 && reward < 0){
      skill_app = setOnly(skill_app, false)
      // changes = makeOnlyChanges({...store,...changes}, store.skill_apps[skill_app.uid], false)
      if(skill_app.uid == staged_uid){
        undoStaged()
        // changes = {...changes, ...makeUndoStagedChanges({...store,...changes})}
      }
    }else if(old_reward <= 0 && reward > 0 && staged_uid?.length == 0){
      undoStaged()
      // changes = {...changes, ...makeUndoStagedChanges({...store,...changes})}
    }
    ({staged_uid} = get());

    if(!staged_uid && reward > 0){
      set({staged_uid : skill_app.uid})
    }
    return skill_app    
  },

  toggleReward : (skill_app, force_reward=null) => {
    let {setReward} = get()
    if(force_reward > 0){
      setReward(skill_app, 1)
      return
    }
    if(force_reward < 0){
      setReward(skill_app, -1)
      return
    }
    console.log("TOGGLE reward")
    if(skill_app.reward == 0){
      setReward(skill_app, 1)
    }else if(skill_app.reward > 0){
      setReward(skill_app, -1)
    }else{
      setReward(skill_app, 1)
    }
  },

  setInputs : async (skill_app, inputs) => {
    let {modifySkillApp, updateGraphConnections} = get()
    modifySkillApp(skill_app, {'inputs' : inputs})
    let {skill_apps} = get();
    await updateGraphConnections(skill_apps[skill_app.uid])
    // applySkillAppAttr(store, skill_app,'inputs', inputs)
  },

  // setSkillLabel : (skill_app, skill_label) => set((store) => (
  //   applySkillAppAttr(store, skill_app,'skill_label', skill_label)
  // )),

  // setHowPart : (skill_app, how_part) => set((store) => (
  //   applySkillAppAttr(store, skill_app,'how_part', how_part)
  // )),

  // setOnly: (skill_app, only) => set((store) => (
  //   makeOnlyChanges(store, skill_app, only)
  // )),
  setOnly : (skill_app, only) => {
    let {skill_apps, modifySkillApp, only_count:old_only_count} = get()
    let old = skill_apps[skill_app.uid].only ?? false
    skill_app = modifySkillApp(skill_app, {only: only})
    console.log("SET ONLY")
    if(old != only){
      let only_count = old_only_count+(only-old)
      console.log("-------", (only-old), only, old)
      set({only_count : only_count})
    }
    return skill_app 
  },

  genCompletenessProfile : async () => {
    let {questions, curr_interface, curr_question, setQuestion, network_layer, agent_uid} = get();
    
    let states = []
    let question_items = questions[curr_interface] || {}
    for(let q_id of Object.keys(question_items)){
        setQuestion(q_id)
        let {start_state} = get()
        states.push(start_state)
        console.log(":::", start_state)
    }
    setQuestion(curr_question)
    let d = new Date()
    let time_str = d.toISOString().slice(0,10) + `_${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`
    let file = "cp_" + agent_uid.slice(3,8) + time_str + ".txt"
    network_layer.gen_completeness_profile(agent_uid, states, file)
  },

  evalCompleteness : async (profile) => {
    let {network_layer, agent_uid} = get();
    network_layer.eval_completeness(agent_uid, profile)
  }

}));

const useAuthorStoreChange = makeChangeStore(useAuthorStore)

export {authorStore, setAuthorStore, useAuthorStore, useAuthorStoreChange, test_state, test_skill_applications};
