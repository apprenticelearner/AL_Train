import create from "zustand";
import {randomID} from "./utils.js";
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
        {"selection" : "A", "action" : "UpdateTextField", "input" : "6",
          "how": "Add(?,?,?) ","reward": 0, only: false},

        { "selection" : "B", "action" : "UpdateTextField", "input" : "long long long long long long long long sdf sdf sjif sd",
          "how": "Add(?,?,?)", "reward": 0},
        { "selection" : "B", "action" : "UpdateTextField", "input" : "8x + 4 + 7 + 9 + 2+6+5",
          "how": "x0 + x1 + x2", "reward": 0,
          arg_foci: ["E","F"]},
        { "selection" : "B", "action" : "UpdateTextField", "input" : "9",
          "how": "Add(?,?,?)", "reward": 0},
        { "selection" : "B", "action" : "UpdateTextField", "input" : "5",
          "how": "Add(?,?,?)", "reward": 0},
        { "selection" : "B", "action" : "UpdateTextField", "input" : "12",
          "how": "Add(?,?,?)", "reward": 0},
        { "selection" : "B", "action" : "UpdateTextField", "input" : "16x - 8",
          "how": "Subtract(?,Add(?,?))", "reward": 0},

        { "selection" : "C", "action" : "UpdateTextField", "input" : "8x + 4",
          "how": "x0 + x1 + x2", "reward": 0,
          arg_foci: ["E","F"]},
        { "selection" : "C", "action" : "UpdateTextField", "input" : "9",
          "how": "Add(?,Subtract(?,?,?),?, Subtract(?,?,?))", "reward": 0},
        { "selection" : "C", "action" : "UpdateTextField", "input" : "5",
          "how": "Add(?,?,?)", "reward": 0},
        { "selection" : "C", "action" : "UpdateTextField", "input" : "12",
          "how": "Add(?,?,?)", "reward": 0},
        { "selection" : "C", "action" : "UpdateTextField", "input" : "16x - 8",
          "how": "Subtract(?,Add(?,?))", "reward": 0},

        // { "selection" : "Button", "action" : "PressButton", "input" : "-1",
        //   "how": "-1", "reward": 0},
]

for(let sa of test_skill_applications){
  sa.id = randomID()
}


const removeKey = (key, {[key]: _, ...rest}) => rest;

const setSkillAppAttr = (store, skill_app, attr, val) => {
  return {skill_apps : {
        ...store.skill_apps,
        [skill_app.id] : {...store.skill_apps[skill_app.id], [attr]:val}
  }}
}

const makeOnlyChanges = (store, skill_app, only) => {
  let old = store.skill_apps[skill_app.id].only ?? false
  let changes = setSkillAppAttr(store, skill_app, 'only', only)
  if(old != only){
    let only_count = changes['only_count'] = store.only_count+(only-old)
    console.log("-------", changes['only_count'], (only-old), only, old)
  }
  return changes
}

const findStageCandidate = (store) =>{

}


const makeUndoStagedChanges = (store) => {
  let stack = store.stage_undo_stack
  let changes = {staged_id: "", staged_sel:"", stage_undo_stack:[]}
  let okay = false
  while(stack.length > 0){

    changes = {...stack.pop(), stage_undo_stack:stack}
    if(store.skill_apps[changes.staged_id]?.reward > 0){
      okay = true
      break
    }
  }
  if(!okay){
    console.log("STACK EXHAUSTED")
    for(let skill_app of Object.values(store.skill_apps)){
      if(skill_app?.reward > 0){
        console.log("+++", skill_app.input)
        changes = {staged_id: skill_app.id, staged_sel:skill_app.selection, stage_undo_stack:[]}
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

  // Counters for forcing rerenders in absence of meaningful state change
  transaction_count : 0, 
  n_tutor_loads : 0,

  // Skill Applications (queried from the agent)
  skill_apps: {},
  sel_skill_app_ids: {},

  /* Tutor  */
  // A reference to the tutor wrapper instance.
  tutor: null,

  // The JSON state of the tutor experienced by the agent
  tutor_state : null,

  // The problem configuration, typically {HTML: ???, question_file: ???}
  prob_config: null,

  /* Authoring Interactivity States  */
  input_focus : "",
  focus_id : "",
  focus_sel : "",
  hover_id : "",
  hover_sel : "",
  staged_id : "",
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
        curr_agent : "",
      }
      window.localStorage.setItem("project", JSON.stringify(project))
    }
    console.log("PROJECT", project)
    // If project has no question_files then 
    set(project)
  },

  saveProject(){

    let store = get()
    let {interfaces, questions, agents, curr_interface, curr_question, curr_agent} = store
    let project = {interfaces, questions, agents, curr_interface, curr_question, curr_agent}
    console.log("SAVE PROJECT", project)
    window.localStorage.setItem("project", JSON.stringify(project))
  },

  /*** Initialize ***/
  // The entry point for authoring 
  initializeAuthoring: (training_config, network_layer) => { 
    let store = get()
    let {set_params, author} = training_config
    let prob_config = author?.prob_config || set_params
    console.log(store)
    store.loadProject(prob_config)
    store = get()
    console.log("INIT AUTHORING", prob_config)
    set({mode: 'train', prob_config, network_layer: network_layer})
    store.createAgent(training_config.agent)

    // let store = get()
    store.setInterface(store.interfaces[0])
    
    // store.loadProblem(prob_config)



  }, 

  createAgent: (agent_config) => set(async (store) => { 
    let resp = await store.network_layer.createAgent(agent_config)
    return {"agent_config" : {...agent_config, ...resp}}
  }),

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

  setQuestion: (q_id) => {
    let store = get()
    let {questions, curr_interface, tutor, mode, editing_question_menu} = store
    if(!editing_question_menu && mode == "start_state"){
      store.confirmStartState()
    }
    if(mode == "train"){
      let question_items = questions[curr_interface] || {}
      let tutor_state = {}
      if(q_id){
        tutor.clear()
        let question = question_items[q_id]
        for (let [id,sai] of Object.entries(question.skill_apps)){
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
      store.setSkillApps(skill_apps)
    }
    
  },

  setEditingQuestionMenu: (is_editing) => {
    let store = get()
    let {editing_question_menu:was_editing} = store
    if(is_editing){
      if(store.mode == "start_state"){
        store.confirmStartState()
      }
      set({mode: "start_state"})
      store.setQuestion(store.curr_question)
    }else{
      store.confirmStartState()
    }
    if(!was_editing && is_editing){
      set({editing_question_menu: true, mode : "start_state"})
    }
    if(was_editing && !was_editing){
      set({editing_question_menu: false, mode : "train"})
    }
  },

  confirmStartState: (force=false) =>{
    let store = get()
    let {questions, curr_interface, skill_apps, editing_question_menu} = store
    let question_items = questions[curr_interface] || {}

    console.log(skill_apps)
    if(!force && Object.entries(skill_apps).length==0){
      set({mode: 'train', skill_apps: {}, sel_skill_app_ids: {}})
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
    
    set({questions, mode: 'train', skill_apps: {}, sel_skill_app_ids: {}, editing_question_menu:false})
    // if(editing_question_menu){
    store.setQuestion(q_id)
    store.saveProject()
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
    console.log("::", keys, new_index)
    if(keys.length==0){
      console.log("!!beginSetStartState")
      store.beginSetStartState()
    }else{
      store.setQuestion(keys[new_index])  
    }
  },

  /*** Train Controls ***/

  setFocus: (skill_app) => set((store) => { 
    // console.log("setFocus", skill_app?.selection)
    return {focus_sel : skill_app?.selection ?? "", focus_id : skill_app?.id ?? ""}
  }),

  // Assigned to the focus of 
  setInputFocus: (sel) => set({input_focus:sel}),

  setHover: ({sel,id}) => set((store) => {
    return {hover_sel : sel ?? store.hover_sel , hover_id : id ?? store.hover_id}     
  }),

  setStaged: (skill_app, store_prev=true) => set((store) => { 
    let changes = {staged_sel : skill_app.selection, staged_id : skill_app.id}
    if(store_prev && store.staged_id != ""){
      changes['stage_undo_stack'] = [...store.stage_undo_stack, {staged_id: store.staged_id, staged_sel : store.staged_sel}]
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

  setHasFociSelect : (sel, hasFociSelect) => set((store) => { 
    if(store.focus_id == ""){ return {}}

    let focus_app = {...store.skill_apps?.[store.focus_id]}
    let arg_foci = focus_app?.arg_foci || []
    console.log(arg_foci, arg_foci.filter((x)=>x!==sel))
    if(!hasFociSelect){
      console.log(arg_foci, arg_foci.filter((x)=>x!==sel))
      focus_app.arg_foci = arg_foci.filter((x)=>x!==sel)
    }else if(!arg_foci.includes(sel)){
      focus_app.arg_foci = [...arg_foci, sel]
    }else{
      // No Change
      return {}
    }
    return {'skill_apps' : {...store.skill_apps, [store.focus_id] :  focus_app}}
  }),


  /*** Events ***/


  clickAway : () => { 
    let store = get()
    let {mode, confirmStartState} = store
    if(mode == "start_state"){
      let {questions, curr_interface} = store
      let question_items = questions[curr_interface] || {}

      // Force user to confirm without click-away if no questions
      if(Object.keys(question_items).length != 0){
        confirmStartState()  
      }      
    }
  },

  toggleFoci : (sel) => { let store = get();
    let selected = store.skill_apps?.[store.focus_id]?.arg_foci?.includes(sel) ?? false
    store.setHasFociSelect(sel, !selected)
  },

  onKeyDown : (e) => {
    console.log("OUTER KEY", e.key, e)
    if(e.target == document.body){
      if(e.key == "Enter"){
        let {input_focus, mode, confirmStartState} = get()
        if(mode==="start_state" && !input_focus){
          confirmStartState(true)
        } 
      }
    }
  },

  /*** Getters ***/

  // getFocusedSkillApp : (name) => get((store) => {
  //   return store?.skill_apps?.[store.focus_id]
  // }),

  // getHoverSkillApp : (name) => get((store) => { 
  //   return store?.skill_apps?.[store.hover_id]
  // }),

  /*** Adding + Removing Skill Applications ***/

  addSkillApp: (skill_app) => set((store) => { 
    let sel = skill_app.selection
    skill_app.id = skill_app.id || randomID()
    return {
      sel_skill_app_ids : {
      ...store.sel_skill_app_ids,
      [sel] : [skill_app.id, ...(store.sel_skill_app_ids[sel]||[])]
      },
      skill_apps: {
        ...store.skill_apps,
        [`${skill_app.id}`] : skill_app,
      },
      only_count : store.only_count + (skill_app?.only || 0)
    }
  }),

  removeSkillApp: (skill_app) => set((store) => {
    if(!skill_app) return {};
    let sel = skill_app.selection
    console.log(sel, store.sel_skill_app_ids[sel])
    console.log(skill_app.id)
    console.log("%%", store.sel_skill_app_ids[sel].filter((x)=>x!=skill_app.id))
    return {
      skill_apps: removeKey(skill_app.id, store.skill_apps),
      sel_skill_app_ids : {
        ...store.sel_skill_app_ids,
        [sel] : store.sel_skill_app_ids[sel].filter((x)=>x!=skill_app.id)
      },
      only_count : store.only_count - (skill_app?.only || 0)
    }
  }),

  setSkillApps: (skill_apps) => set((store) => {
    let skill_apps_by_sel = {}
    let _skill_apps = {}
    let staged = {staged_id: "", staged_sel : "", stage_undo_stack: []}

    // Make skill_apps and sel_skill_app_ids
    for (let sa of Object.values(skill_apps)){
      let lst = skill_apps_by_sel?.[sa.selection] ?? []
      lst.push(sa.id)
      skill_apps_by_sel[sa.selection] = lst
      _skill_apps[sa.id] = sa

      //Ensure that we stage a skill app if it came with reward > 0
      if(staged.staged_id == "" && sa.reward > 0){
        staged.staged_id = sa.id
        staged.staged_sel = sa.sel
      }
    }
    let changes = {
        skill_apps: _skill_apps,
        sel_skill_app_ids: skill_apps_by_sel,
        ...staged
    }
    return changes
  }),

  /*** Modifying Skill Applications ***/

  setReward : (skill_app, reward) => set((store) => {
    let changes = setSkillAppAttr(store, skill_app,'reward', reward)
    // console.log("SET REW", store.skill_apps[skill_app.id])
    if(skill_app.reward >= 0 && reward < 0){
      changes = makeOnlyChanges({...store,...changes}, store.skill_apps[skill_app.id], false)
      if(skill_app.id == store.staged_id){
        changes = {...changes, ...makeUndoStagedChanges({...store,...changes})}
      }
    }else if(skill_app.reward <= 0 && reward > 0 && store.staged_id == ""){
      changes = {...changes, ...makeUndoStagedChanges({...store,...changes})}
    }
    console.log("SET REW", changes)
    return changes
  }),

  setInput : (skill_app, input) => set((store) => (
    setSkillAppAttr(store, skill_app,'input', input)
  )),

  setSkillLabel : (skill_app, skill_label) => set((store) => (
    setSkillAppAttr(store, skill_app,'skill_label', skill_label)
  )),

  setHowPart : (skill_app, how_part) => set((store) => (
    setSkillAppAttr(store, skill_app,'how_part', how_part)
  )),

  setOnly: (skill_app, only) => set((store) => (
    makeOnlyChanges(store, skill_app, only)
  )),

}));

const useAuthorStoreChange = makeChangeStore(useAuthorStore)

export {authorStore, useAuthorStore, useAuthorStoreChange, test_state, test_skill_applications};
