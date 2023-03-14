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

const setSkillAppAttr = (state, skill_app, attr, val) => {
  return {skill_apps : {
        ...state.skill_apps,
        [skill_app.id] : {...state.skill_apps[skill_app.id], [attr]:val}
  }}
}

const makeOnlyChanges = (state, skill_app, only) => {
  let old = state.skill_apps[skill_app.id].only ?? false
  let changes = setSkillAppAttr(state, skill_app, 'only', only)
  if(old != only){
    let only_count = changes['only_count'] = state.only_count+(only-old)
    console.log("-------", changes['only_count'], (only-old), only, old)
  }
  return changes
}

const findStageCandidate = (state) =>{

}


const makeUndoStagedChanges = (state) => {
  let stack = state.stage_undo_stack
  let changes = {staged_id: "", staged_sel:"", stage_undo_stack:[]}
  let okay = false
  while(stack.length > 0){

    changes = {...stack.pop(), stage_undo_stack:stack}
    if(state.skill_apps[changes.staged_id]?.reward > 0){
      okay = true
      break
    }
  }
  if(!okay){
    console.log("STACK EXHAUSTED")
    for(let skill_app of Object.values(state.skill_apps)){
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

const useStore = create((set,get) => ({
  transaction_count : 0, 
  skill_apps: {},
  sel_skill_app_ids: {},
  focus_id : "",
  focus_sel : "",
  hover_id : "",
  hover_sel : "",
  staged_id : "",
  staged_sel : "",
  stage_undo_stack : [],
  only_count : 0,
  current_tab : "",

  foci_mode : false,

  /*** Initialize ***/
  createAgent: (config, network_layer) =>{
    set({"agent_config" : config,
         "network_layer" : network_layer})
  },
  setConfig: (config) =>{
    set({"config" : config})
  },


  /*** Controls ***/

  setFocus: (skill_app) => set((state) => { 
    console.log("setFocus", skill_app?.selection)
    return {focus_sel : skill_app?.selection ?? "", focus_id : skill_app?.id ?? ""}
  }),

  setHover: ({sel,id}) => set((state) => {
    return {hover_sel : sel ?? state.hover_sel , hover_id : id ?? state.hover_id}     
  }),

  setStaged: (skill_app, store_prev=true) => set((state) => { 
    let changes = {staged_sel : skill_app.selection, staged_id : skill_app.id}
    if(store_prev && state.staged_id != ""){
      changes['stage_undo_stack'] = [...state.stage_undo_stack, {staged_id: state.staged_id, staged_sel : state.staged_sel}]
    }
    return changes
  }),

  undoStaged: () => set((state) => (
    makeUndoStagedChanges(state)
  )),

  incTransactionCount: (skill_app) => set((state) => { 
    return {transaction_count : state.transaction_count + 1}
  }),

  setCurrentTab : (name) => set((state) => { 
    // console.log("current_tab!!", name)
    return {current_tab : name}
  }),

  setFociMode : (foci_mode) => set((state) => {
    return {'foci_mode' : foci_mode}
  }),

  setHasFociSelect : (sel, hasFociSelect) => set((state) => { 
    if(state.focus_id == ""){ return {}}

    let focus_app = {...state.skill_apps?.[state.focus_id]}
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
    return {'skill_apps' : {...state.skill_apps, [state.focus_id] :  focus_app}}
  }),


  /*** Events ***/


  clickAway : () => { let state = get();
    console.log('CLICK AWAY')
    if(!state.foci_mode){
      console.log("CLICK AWAY")
      state.setFocus(null)  
    }
  },

  toggleFoci : (sel) => { let state = get();
    let selected = state.skill_apps?.[state.focus_id]?.arg_foci?.includes(sel) ?? false
    state.setHasFociSelect(sel, !selected)
  },

  /*** Getters ***/

  // getFocusedSkillApp : (name) => get((state) => {
  //   return state?.skill_apps?.[state.focus_id]
  // }),

  // getHoverSkillApp : (name) => get((state) => { 
  //   return state?.skill_apps?.[state.hover_id]
  // }),

  /*** Adding + Removing Skill Applications ***/

  addSkillApp: (skill_app) => set((state) => { 
    let sel = skill_app.selection
    skill_app.id = skill_app.id || randomID()
    return {
      sel_skill_app_ids : {
      ...state.sel_skill_app_ids,
      [sel] : [skill_app.id, ...(state.sel_skill_app_ids[sel]||[])]
      },
      skill_apps: {
        ...state.skill_apps,
        [`${skill_app.id}`] : skill_app,
      },
      only_count : state.only_count + (skill_app?.only || 0)
    }
  }),
  removeSkillApp: (skill_app) => set((state) => {
    let sel = skill_app.selection
    console.log(sel, state.sel_skill_app_ids[sel])
    console.log(skill_app.id)
    console.log("%%", state.sel_skill_app_ids[sel].filter((x)=>x!=skill_app.id))
    return {
      skill_apps: removeKey(skill_app.id, state.skill_apps),
      sel_skill_app_ids : {
        ...state.sel_skill_app_ids,
        [sel] : state.sel_skill_app_ids[sel].filter((x)=>x!=skill_app.id)
      },
      only_count : state.only_count - (skill_app?.only || 0)
    }
  }),
  setSkillApps: (skill_apps) => set((state) => {
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

  setReward : (skill_app, reward) => set((state) => {
    let changes = setSkillAppAttr(state, skill_app,'reward', reward)
    // console.log("SET REW", state.skill_apps[skill_app.id])
    if(skill_app.reward >= 0 && reward < 0){
      changes = makeOnlyChanges({...state,...changes}, state.skill_apps[skill_app.id], false)
      if(skill_app.id == state.staged_id){
        changes = {...changes, ...makeUndoStagedChanges({...state,...changes})}
      }
    }else if(skill_app.reward <= 0 && reward > 0 && state.staged_id == ""){
      changes = {...changes, ...makeUndoStagedChanges({...state,...changes})}
    }
    console.log("SET REW", changes)
    return changes
  }),

  setInput : (skill_app, input) => set((state) => (
    setSkillAppAttr(state, skill_app,'input', input)
  )),

  setSkillLabel : (skill_app, skill_label) => set((state) => (
    setSkillAppAttr(state, skill_app,'skill_label', skill_label)
  )),

  setHowPart : (skill_app, how_part) => set((state) => (
    setSkillAppAttr(state, skill_app,'how_part', how_part)
  )),

  setOnly: (skill_app, only) => set((state) => (
    makeOnlyChanges(state, skill_app, only)
  )),

}));

const useChangedStore = makeChangeStore(useStore)

export {useStore, useChangedStore, test_state, test_skill_applications};
