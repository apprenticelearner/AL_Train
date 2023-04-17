import create from "zustand";
import {randomUID, arraysEqual} from "../utils.js";
import {makeChangeStore} from "change-store";

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

const makeOnlyChanges = (store, skill_app, only) => {
  let old = store.skill_apps[skill_app.uid].only ?? false
  let changes = applySkillAppAttr(store, skill_app, 'only', only)
  if(old != only){
    let only_count = changes['only_count'] = store.only_count+(only-old)
    console.log("-------", changes['only_count'], (only-old), only, old)
  }
  return changes
}

const findStageCandidate = (store) =>{

}

// GLOBAL CONFIG
const EXPLAIN_DEMO_REFRESH_DELAY = 0


const makeUndoStagedChanges = (store) => {
  let stack = store.stage_undo_stack
  let changes = {staged_uid: "", staged_sel:"", stage_undo_stack:[]}
  let okay = false
  while(stack.length > 0){

    changes = {...stack.pop(), stage_undo_stack:stack}
    if(store.skill_apps[changes.staged_uid]?.reward > 0){
      okay = true
      break
    }
  }
  if(!okay){
    console.log("STACK EXHAUSTED")
    for(let skill_app of Object.values(store.skill_apps)){
      if(skill_app?.reward > 0){
        console.log("+++", skill_app.input)
        changes = {staged_uid: skill_app.uid, staged_sel:skill_app.selection, stage_undo_stack:[]}
        break
      }
    }
  }
  console.log("STAGE CHANGES", changes)
  return changes
}

var authorStore;
const useAuthorStore = create((set,get) => ({
  get : authorStore=get,

  // List of descriptor objects for each of the user's current agents
  agents : {},
  // The unique id of the currently selected agent.
  agent_uid : null,
  // A promise that resolves when a selected / newly created agent is loaded
  agentPromise : null,

  // Counters for forcing rerenders in absence of meaningful state change
  transaction_count : 0, 
  n_tutor_loads : 0,

  skills : {},

  // Skill Applications (queried from the agent)
  skill_apps: {},
  sel_skill_app_uids: {},

  /* Tutor  */
  // A reference to the tutor wrapper instance.
  tutor: null,

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
  stage_undo_stack : [],
  only_count : 0,
  current_tab : "problem",

  // The current mode: "start_state", "train", "arg_foci" 
  mode : null,

  // misc
  stage_ref : null,
  stage_view_ref : null,

  /*** Project ***/
  loadProject(prob_config){
    let project = JSON.parse(window.localStorage.getItem("project"))
    if(!project){
      let config_html = prob_config['HTML']
      project = {
        interfaces : [config_html],
        questions : {[config_html] : {/*q-hash: {}*/}},
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
    let store = get()
    let {set_params, author} = training_config
    let prob_config = author?.prob_config || set_params
    store.loadProject(prob_config)
    let {agent_uid, setInterface, setAgent, createAgent, interfaces, saveProject} = get()
    console.log("INIT AUTHORING", prob_config)
    set({mode: 'train', prob_config, network_layer: network_layer})

    console.log("BEEFOR")
    if(!agent_uid){
      createAgent(training_config.agent).then((agent_uid) =>{
        setAgent(agent_uid)
      })
      saveProject()
    }else{
      setAgent(agent_uid)
    }
    
      // store.updateAgentNextActions()
    // })
    // console.log("AFTERR")
    // let store = get()
    setInterface(interfaces[0])
    
    // store.loadProblem(prob_config)



  }, 

  createAgent: (agent_config) =>  {
    let {agents, network_layer} = get()

    console.log("BEGIN CREATE AGENT")

    let agentPromise = new Promise( async (resolve, reject) =>{
      let resp = await network_layer.createAgent(agent_config)
      let {agent_uid} = resp
      agents[agent_uid] = agent_config
      set({agents})  
      resolve(agent_uid)
    })
    set({agentPromise})
    return agentPromise
  },

  setAgent: (agent_uid) => {
    let {updateSkills} = get()
    console.log("SET AGENT", agent_uid)
    set({agent_uid})
    updateSkills()
  },

  loadProblem: async (prob_config) => { 
    let store = get()
    let {tutor, stage_ref, stage_view_ref, network_layer, n_tutor_loads} = store
    if(tutor){
      let [stage,stage_view] = [stage_ref.current, stage_view_ref.current]
      let bounds = await tutor.loadProblem({...prob_config, prob_rep: n_tutor_loads}, {network_layer})
      let [midX, midY] = [(bounds.x*2+bounds.width)/2, (bounds.y*2+bounds.height)/2]
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
      // console.log("tutor_state", tutor_state)
      set({tutor_state, n_tutor_loads: n_tutor_loads+1})
    }
  },

  setTutor: (tutor) => set((store) => {
    // Triggered by tutor render. Initializes the tutor. 
    // Note: If run with altrain prob_config should be set by now.
    let {prob_config, network_layer} = store
    console.log("setTutor", tutor, prob_config)
    if(prob_config){
      store.loadProblem(prob_config)
    }
    // window.addEventListenter("keydown", ()=>{if(e.target == document){onKeyDown(e)}}, true)
    return {tutor: tutor}
  }),

  setStageViewRef : (stage_view_ref) => set((store) => ({stage_view_ref})),
  setStageRef : (stage_ref) => set((store) => ({stage_ref})),

  /*** Problem Controls */

  setInterface: async (intr) => {
    let store = get()
    let q_items = Object.keys(store.questions[intr])
    console.log("SET INTER", q_items)
    let no_qs = q_items.length == 0
    set({curr_interface: intr})

    // NOTE: Not sure why need to await in one case
    if(no_qs){
      store.loadProblem({HTML: intr})
    }else{
      await store.loadProblem({HTML: intr})
    }
    
    store.setQuestion(q_items[0] || null)
    set({mode: (no_qs ? 'start_state' : 'train')})  
    
    

  },

  setQuestion: (q_id, interal=false) => {
    let store = get()
    let {questions, curr_interface, tutor, mode,
        editing_question_menu, setFocus, updateAgentNextActions, setSkillApps} = store
    if(!interal && mode == "start_state"){
      store.confirmStartState(false,false)
    }
    if(mode == "train"){
      let question_items = questions[curr_interface] || {}
      let tutor_state = {}
      if(q_id && tutor){
        tutor.clear()
        let question = question_items[q_id]
        for (let [uid,sai] of Object.entries(question.skill_apps)){
          tutor.stageSAI(sai)
        }
        tutor_state = tutor.getState()
      }
      set({curr_question: q_id, tutor_state})  
    }else if(mode == "start_state"){
      let question_items = questions[curr_interface] || {}
      let skill_apps = {}
      if(q_id){
        tutor.clear()
        let question = question_items[q_id]
        skill_apps = question.skill_apps || {}
      }
      set({curr_question: q_id})  
      setSkillApps(skill_apps)
    }
    setFocus(null)
    updateAgentNextActions()
    
  },

  beginEditingQuestionMenu: (will_be_editing) => {
    let store = get()
    let {editing_question_menu:was_editing} = store
    if(will_be_editing){
      // if(store.mode == "start_state"){
      //   store.confirmStartState()
      // }
      set({mode: "start_state"})
      store.setQuestion(store.curr_question)
    }else{
      store.confirmStartState()
    }
    if(!was_editing && will_be_editing){
      set({editing_question_menu: true, mode : "start_state"})
    }
    if(was_editing && !will_be_editing){
      set({editing_question_menu: false, mode : "train"})
    }
  },

  confirmStartState: (force=false, return_to_train=true) =>{
    let store = get()
    let {questions, curr_interface, skill_apps, editing_question_menu, setSkillApps} = store
    let question_items = questions[curr_interface] || {}

    console.log(skill_apps)
    if(!force && Object.entries(skill_apps).length==0){
      set({mode: 'train'})
      setSkillApps({})
      return
    }
    
    let q_id;
    //Edit Case
    if(editing_question_menu){
      let {curr_question} = store
      questions = {...questions,
        [curr_interface]: {...question_items,
          [curr_question] : {...question_items[curr_question], skill_apps}
        }
      }
      q_id = curr_question
      
    // New Question Case
    }else{
      let N = 0
      for (let [id,{name,n}] of Object.entries(question_items)){
        if(n > N) N = n;
      }
      N++;
      let new_name = q_id = `Question ${N}`

      questions = {...questions,
        [curr_interface]: {...question_items,
          [new_name] : {name: new_name, n:N, skill_apps}
        }
      }
    }
    // Modify questions
    
    set({questions})
    store.saveProject()

    if(return_to_train){
      set({mode : 'train', editing_question_menu:false})
      setSkillApps({})
      store.setQuestion(q_id, true)
    }
  },

  removeQuestion: (id, intr=null) =>{
    console.log("removeQuestion!")
    let store = get()
    let {questions, curr_interface} = store
    intr = intr || curr_interface;
    let question_items = questions[intr] || {}

    delete question_items?.[id];
    questions = {...questions, [intr] : question_items}
    set({questions})

    // Choose prev question
    let keys = Object.keys(question_items)

    let new_index = keys.indexOf(id)-1
    new_index = new_index >= 0 ? new_index : 0  
    // console.log("::", keys, new_index)
    if(keys.length==0){
      // console.log("!!beginSetStartState")
      store.beginSetStartState()
    }else{
      store.setQuestion(keys[new_index])  
    }
  },

  /*** Train Controls ***/

  explainDemo : async (skill_app) => {
    let store = get()
    let {network_layer, tutor_state, skill_apps, agentPromise} = store

    set({skill_apps : {
        ...skill_apps,
        [skill_app.uid] : {...skill_apps[skill_app.uid],
        'explanation_is_pending': true
        }
      }
    })


    let skill_app_uid = skill_app.uid
    let agent_uid = await agentPromise

    // Re-get since could have updated while waiting for agent to load
    store = get()
    skill_app = store.skill_apps[skill_app_uid]
    console.log(skill_app)
    let {selection, action_type, inputs, reward=0, ...rest} = skill_app
    let sai = {selection, action_type, inputs}

    // Have agent explain the demo's sai
    let {skill_explanations, func_explanations} = 
      await network_layer.explain_demo(agent_uid, tutor_state, sai, reward, rest);

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
    let explanation_options = [
      {'label' : "Skill Explanations", options: skill_options},
      {'label' : "Function Explanations", options: func_options},
    ]

    let explanation_time = Date.now()
    console.log("Explanations", explanation_options, explanation_time)

    let explanation_selected = {...defaultOption, explicit : false}

    set({skill_apps : {
        ...skill_apps,
        [skill_app_uid] : {...skill_apps[skill_app_uid],
          explanation_options, explanation_time, explanation_selected,
          explanation_is_pending : false
        }
      }
    })

    // set(applySkillAppAttr(store, skill_app, 'explanations', explanations))
    // }
  },

  selectExplanation: (skill_app, explanation) =>{
    let {skill_apps} = get()
    set({skill_apps : {
        ...skill_apps,
        [skill_app.uid] : {...skill_apps[skill_app.uid],
          explanation_selected: {...explanation, explicit : true}
        }
      }
    })
  },

  setFocus: (skill_app) => { 
    let {explainDemo, skill_apps} = get()
    if(skill_app && !skill_apps?.[skill_app?.uid]){
      console.warn("Tried to focus un-added skill app",skill_app)
      return
    }
    // console.log("setFocus", skill_app?.selection)
    set({focus_sel : skill_app?.selection ?? "", focus_uid : skill_app?.uid ?? ""})
    if(skill_app && skill_app?.is_demo){
      explainDemo(skill_app)
    }    
  },

  // Assigned to the focus of 
  setInputFocus: (sel) => set({input_focus:sel}),

  setHover: ({sel,uid}) => set((store) => {
    return {hover_sel : sel ?? store.hover_sel , hover_uid : uid ?? store.hover_uid}     
  }),

  setStaged: (skill_app, store_prev=true) => set((store) => { 
    let changes = {staged_sel : skill_app.selection, staged_uid : skill_app.uid}
    if(store_prev && store.staged_uid != ""){
      changes['stage_undo_stack'] = [...store.stage_undo_stack, {staged_uid: store.staged_uid, staged_sel : store.staged_sel}]
    }
    return changes
  }),

  undoStaged: () => set((store) => (
    makeUndoStagedChanges(store)
  )),

  incTransactionCount: (skill_app) => set((store) => { 
    return {transaction_count : store.transaction_count + 1}
  }),

  setCurrentTab : (name) => set((store) => { 
    // console.log("current_tab!!", name)
    return {current_tab : name}
  }),

  setMode : (mode) => set((store) => {
    return {'mode' : mode}
  }),

  beginSetStartState : async () => {
    let store = get()
    let {tutor, curr_interface, n_tutor_loads} = store
    tutor.clear()
    let tutor_state = tutor.getState()
    // await store.loadProblem({"HTML" : curr_interface})

    set({mode : 'start_state', tutor_state, editing_question_menu : false})
    store.setSkillApps({})
  },

  beginSetArgFoci : () => {
    set({mode : "arg_foci"})
  },

  confirmArgFoci : () => {
    let {skill_apps, focus_uid} = get()
    let skill_app = skill_apps?.[focus_uid];
    
    console.log("confirm arg foci");
    set({mode : "train"})
    if(skill_app){
      skill_app.arg_foci_set = true;
      set({skill_apps : {...skill_apps, [focus_uid] : skill_app}})
    }  
    
  },

  setFociSelect : (sel, hasFociSelect) => { 
    let {skill_apps, focus_uid} = get()
    if(focus_uid == "") return

    let focus_app = {...skill_apps?.[focus_uid]}
    let arg_foci = focus_app?.arg_foci || []
    // console.log(arg_foci, arg_foci.filter((x)=>x!==sel))
    if(!hasFociSelect){
      // console.log(arg_foci, arg_foci.filter((x)=>x!==sel))
      arg_foci = focus_app.arg_foci = arg_foci.filter((x)=>x!==sel)
    }else if(!arg_foci.includes(sel)){
      arg_foci = focus_app.arg_foci = [...arg_foci, sel]
    }else{
      // No Change
      return
    }
    set({'skill_apps' : {...skill_apps, [focus_uid] :  focus_app}})
    let prev_focus_uid = focus_uid
    setTimeout(async ()=>{
      
      // If the arg foci haven't changed in 200ms then poll for new set of explanations
      let {skill_apps, focus_uid, explainDemo} = get()
      let focus_app = skill_apps?.[focus_uid]

      console.log("TIMEOUT TRIGGER", prev_focus_uid, focus_uid, arg_foci,  focus_app?.arg_foci ?? [])

      if(prev_focus_uid == focus_uid && arraysEqual(arg_foci,  focus_app?.arg_foci ?? [])){
        console.log("EQUAL")
        await explainDemo(focus_app)
      }
    }, EXPLAIN_DEMO_REFRESH_DELAY)

  },

  updateAgentNextActions : async () => {
    console.log("Fetch Next Actions")
    //Make sure the agent exists before we query it for actions 
    let {agentPromise} = get()
    await agentPromise

    let {network_layer, tutor_state, agent_uid, setSkillApps} = get()

    //NOTE: Should really be stashed until return to mode==train
    setSkillApps({})
    let new_skill_apps = await network_layer.act(agent_uid, tutor_state, {return_all: true, return_kind : 'skill_app'})
    console.log("new_skill_apps", new_skill_apps)
    setSkillApps(new_skill_apps)
  },

  confirmFeedback : async () => {
    let {network_layer, mode, skill_apps, tutor_state, agent_uid, staged_uid, tutor,
        confirmArgFoci, updateAgentNextActions, updateSkills, saveProject} = get()
    if(mode == 'arg_foci'){
      confirmArgFoci()
    }

    console.log("CONFIRM", agent_uid)
    for (let [key, skill_app] of Object.entries(skill_apps)){
      let {selection, action_type, inputs, reward=0, ...rest} = skill_app
      if(reward != 0){
        let sai = {selection, action_type, inputs}
        await network_layer.train(agent_uid, tutor_state, sai, reward, rest)
      }
    }

    saveProject()


    if(staged_uid){
      await tutor.stageSAI(skill_apps[staged_uid])    
    }
    

    set({focus_uid : "", hover_uid : "", staged_uid : ""})

    tutor_state = tutor.getState()
    set({tutor_state})

    await updateAgentNextActions()
    await updateSkills()

  },

  updateSkills : async () => {
    let {network_layer, agent_uid} = get()
    let skill_arr = await network_layer.get_skills(agent_uid)
    let skills = {}
    for(let skill of skill_arr){
      skills[skill.uid] = skill
    }
    console.log("SKILLS", skills)
    set({skills})
  },


  /*** Events ***/


  clickAway : () => { 
    let store = get()
    let {mode, confirmStartState, beginSetArgFoci, confirmArgFoci, setFocus, setMode} = store
    // let focus_is_demo = store.skill_apps?.[store.focus_uid]?.is_demo ?? false


    console.log("CLICK AWAY")
    if(mode == "start_state"){
      let {questions, curr_interface} = store
      let question_items = questions[curr_interface] || {}

      // Force user to confirm without click-away if no questions
      if(Object.keys(question_items).length != 0){
        confirmStartState()  
      }      
    }else{
      // console.log("Set Focus Null")
      if(mode == "arg_foci"){
        confirmArgFoci()
        // setMode('train')
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
    console.log("OUTER KEY", e.key, e)
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
      let {reward, is_demo, only} = skill_apps[uid]
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
    // console.log("::: EXPL", arg_foci, foci_explicit)
    return {arg_foci, foci_explicit}
  },

  // getHoverSkillApp : (name) => get((store) => { 
  //   return store?.skill_apps?.[store.hover_uid]
  // }),

  /*** Skill Application (Adding & Removing)  ***/

  addSkillApp: (skill_app) => { 
    let {sel_skill_app_uids, skill_apps, only_count, staged_uid} = get()
    let sel = skill_app.selection
    set({
      sel_skill_app_uids : {
      ...sel_skill_app_uids,
      [sel] : [skill_app.uid, ...(sel_skill_app_uids[sel]||[])]
      },
      skill_apps: {
        ...skill_apps,
        [skill_app.uid] : skill_app,
      },
      only_count : only_count + (skill_app?.only || 0),
      staged_uid : staged_uid || (skill_app.reward > 0 && skill_app.uid),
    })
  },

  removeSkillApp: (skill_app) => {
    if(!skill_app) return;
    let {skill_apps, sel_skill_app_uids, only_count, focus_uid, hover_uid, staged_uid} = get()
    let sel = skill_app.selection
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
    let store = get()
    let changes = applySkillAppAttr(store, skill_app,'reward', reward)
    // console.log("SET REW", store.skill_apps[skill_app.uid])
    if(skill_app.reward >= 0 && reward < 0){
      changes = makeOnlyChanges({...store,...changes}, store.skill_apps[skill_app.uid], false)
      if(skill_app.uid == store.staged_uid){
        changes = {...changes, ...makeUndoStagedChanges({...store,...changes})}
      }
    }else if(skill_app.reward <= 0 && reward > 0 && store.staged_uid == ""){
      changes = {...changes, ...makeUndoStagedChanges({...store,...changes})}
    }
    let {staged_uid} = store

    console.log("BEF", staged_uid)
    if(!staged_uid && reward > 0){
      console.log("APPLY STAGED")
      changes['staged_uid'] = skill_app.uid
    }
    set(changes)
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

  setInputs : (skill_app, inputs) => set((store) => (
    applySkillAppAttr(store, skill_app,'inputs', inputs)
  )),

  setSkillLabel : (skill_app, skill_label) => set((store) => (
    applySkillAppAttr(store, skill_app,'skill_label', skill_label)
  )),

  setHowPart : (skill_app, how_part) => set((store) => (
    applySkillAppAttr(store, skill_app,'how_part', how_part)
  )),

  setOnly: (skill_app, only) => set((store) => (
    makeOnlyChanges(store, skill_app, only)
  )),

}));

const useAuthorStoreChange = makeChangeStore(useAuthorStore)

export {authorStore, useAuthorStore, useAuthorStoreChange, test_state, test_skill_applications};
