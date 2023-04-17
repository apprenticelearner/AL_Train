import React, { useRef, useState } from 'react'
import { motion } from "framer-motion";
import '../author.css';
import '../components/scrollbar.css';
import {authorStore, useAuthorStoreChange} from "../author_store.js"
import {colors, where_colors} from "../themes.js"
import Color from 'color'
import {randomUID, shallowEqual} from "../../utils.js";

const images = {
  tap: require('../img/gesture-tap.png'),
  left_arrow: require('../img/arrow-left-bold.png'),
  double_chevron : require('../img/double_chevron_300x400.png')
};


const getFociIndexAndExplicit = (elem_id) => [
  (s) => {
    let skill_app = s.skill_apps?.[s.focus_uid];
    let {arg_foci, foci_explicit} = s.extractArgFoci(skill_app)
    if(arg_foci){
      return [arg_foci.indexOf(elem_id),foci_explicit]
    }else if(skill_app?.mapping) {
      for(let [key,id] of Object.entries(skill_app?.mapping)){
        if(elem_id === id && key.includes('arg')){
         return [Number(key.match(/\d+/)[0]),foci_explicit]
        }
      }
    }
    return [-1, true]
  },
  (o, n) => {
    return o[0] === n[0] && o[1] === n[1]
  }
]

// const foci_bg_color = Color('darkorchid').alpha(.4).hexa()
// const foci_cand_bg_color = Color('grey').alpha(.4).hexa()

// console.log("foci_bg_color", foci_bg_color)
// console.log("foci_cand_bg_color", foci_cand_bg_color)

function OverlayBounds({style, children, sel, elem, bg_opacity=0, bg_foci_opacity=.4, ...props}){
    let [[skill_app, hasStaged], groupHasFocus,  mode, isExternalHasOnly, elem_locked] = useAuthorStoreChange(
      [getOverlaySkillApp(sel), `@focus_sel==${sel}`,  "@mode", "@only_count!=0", `@tutor_state.${sel}.locked`],
    )
    // console.log("OVERLAY BOUNDS", sel, elem_locked)

    let [hasFocus, [foci_index,foci_explicit], foci_mode, toggleFoci] = useAuthorStoreChange(
        [`@focus_uid==${skill_app?.uid}`, getFociIndexAndExplicit(sel), "@mode=='arg_foci'", 'toggleFoci']
    )

    let foci_cand = foci_mode && !hasFocus
    let is_foci = (foci_index!==-1) && (mode=="train" || foci_explicit)
    let wrap_index = foci_index % where_colors.length
    let foci_color = where_colors[wrap_index]
    if(!foci_explicit){
      foci_color = Color(foci_color).lighten(.35).hexa()
    }
    // let actions_visible = !foci_mode || hasFocus
    // console.log("OverlayBounds", sel, foci_mode, hasFociSelect)
    


    let {color} = skillAppExtractProps(skill_app, isExternalHasOnly)
    if(mode == "start_state"){
      color = 'teal'
    }

    let clear_bg_color  = Color("white").alpha(bg_opacity).hexa()
    let foci_cand_bg_color = Color('rgb(127,127,127)').alpha(bg_foci_opacity).hexa()

    let backgroundColor = (elem_locked && 'rgb(240,240,240)') ||
                          (hasFocus && clear_bg_color) || 
                          (is_foci && clear_bg_color) || 
                          (foci_cand && foci_cand_bg_color) ||
                          clear_bg_color

    let borderColor = ((hasFocus || mode == 'start_state') && color) || 
                      (is_foci  && foci_color) ||
                      (foci_cand && 'transparent') ||
                      (elem_locked && colors.locked_color) || 
                      (groupHasFocus && color) ||
                      colors.default_color

    let borderWidth = ((is_foci || groupHasFocus) && 5) ||
                      (foci_cand && 3) ||
                      (elem_locked && 3) || 
                      4

    // Adjust the draw rects so that centers of thick borders overlap original bounds.                
    //   Add a negative margin of same amount to keep content stationary on style change.
    let hbw = borderWidth / 2
    let rect = {width: elem.width, height: elem.height, x : elem.x-hbw, y : elem.y-hbw,
                ...((bg_opacity==1) && {marginLeft : -hbw, marginTop : -hbw,})}

    // console.log("::", sel, skill_app?.uid, color)
    let corsor_kind = (foci_cand && 'crosshair') ||
                      (elem_locked && 'default') ||
                      'auto'

    return (      
      <motion.div  style= {{
        ...styles.overlay_bounds,
        ...rect,
        borderWidth: borderWidth,
        borderColor: borderColor,
        backgroundColor : backgroundColor,
        cursor:  corsor_kind,
        ...style,
        // opacity : (foci_cand && .4) || 1
      }}

      {...props}
      onMouseDown={(
        // If toggling foci prevent default so elem doesn't take focus
        foci_cand ? (e) => {toggleFoci(sel); e.preventDefault(); console.log("click")} : props.onClick
      )}
      >
        {(hasStaged) &&
          <img style ={styles.stage_image} src={images.double_chevron} alt={""}/>
        }
        {children}
      </motion.div>
  )
}

function skillAppExtractProps(skill_app, isExternalHasOnly){
  let correct = skill_app?.reward > 0 ?? false;
  let incorrect = (skill_app?.reward < 0 ?? false) || (skill_app?.reward===0 && isExternalHasOnly);
  let isDemo = skill_app?.is_demo ?? false

  // console.log(isDemo, correct, incorrect, colors.demo_color)
  let color = (isDemo && colors.demo_color) || 
              (correct && colors.correct_color) ||
              (incorrect && colors.incorrect_color) ||
              (colors.default_color)
  // console.log(isDemo, correct, incorrect, colors.demo_color, color)
  let input = skill_app?.inputs.value ?? skill_app?.input ?? ""
  let uid = skill_app?.uid ?? ""
  return {correct, incorrect, isDemo, color, input, uid}
}

const getOverlaySkillApp = (sel) =>{
  return [(s)=>{
      let skill_app;
      if(s?.focus_sel===sel){
        skill_app = s?.skill_apps[s.focus_uid]
      }else if(s?.staged_sel===sel){
        skill_app = s?.skill_apps[s.staged_uid]
      }

      if(!skill_app){
        let skill_app_uids = s.sel_skill_app_uids?.[sel]
        if(skill_app_uids?.length > 0){
          skill_app = s.skill_apps[skill_app_uids[0]]
        }
      }
      return [skill_app, s.staged_uid === skill_app?.uid]
    },
      ([o,os],[n,ns])=>{
        // console.log("Recalc", sel, n?.reward, o?.reward)
        return n?.uid === o?.uid && shallowEqual(n?.inputs, o?.inputs)   && n?.reward === o?.reward && os === ns
    }]
}

// const getOverlayIsLocked = (sel) =>{

// }



const newSkillApp = (sel, action_type, input, props) =>{
  let skill_app = {
    uid : `SKA_${randomUID()}`,
    selection: sel,
    action_type : action_type,
    inputs : {value :input},
    ...props
  } 
  return skill_app
}

const newDemo = (sel, action_type, input) =>{
  return newSkillApp(sel,action_type,input, {is_demo : true, reward : 1,})
}

const newTutorPerformed = (sel, action_type, input) =>{
  return newSkillApp(sel,action_type,input, {tutor_performed : true})
}

function TextFieldOverlay({sel, elem}) {
  const ref = useRef(null);
  // const did_change = useRef(null);

  // True if has focus and empty
  const [empty_focus, setEmptyFocus] = useState(false);

  let [[skill_app, hasStaged], groupHasFocus, isExternalHasOnly, mode, has_focus] = useAuthorStoreChange(
    [getOverlaySkillApp(sel), `@focus_sel==${sel}`, `@only_count!=0`, "@mode", `@input_focus==${sel}`],
  )
  let {setInputFocus, addSkillApp, removeSkillApp, setInputs, setFocus, beginSetArgFoci} = authorStore()
  // let empty_focus = (!skill_app?.input && has_focus)
  // console.log(not_empty.current, skill_app)


  // let {color} = skillAppExtractProps(skill_app, isExternalHasOnly)
  let input = skill_app?.inputs.value ?? skill_app?.input

  let text, fontColor, placeholder;
  if(mode == "start_state"){
    // color = "teal"
    fontColor = 'black'
  }else{
    fontColor = ((groupHasFocus || !input) && 'black') || 'lightgrey'
  }


  
  text = (!empty_focus &&  input) ||  (elem.value) || "" 
  placeholder = (input) ||  ""   
  //Ensure only highlight color on focus
  
  
  let L = Math.min(text.length || 1, 8)
  let mindim = Math.min(elem.width, elem.height)
  let maxdim = Math.max(elem.width, elem.height)
  let fontSize = Math.min(mindim, maxdim/((L-1)/2 + 1)) *.9

  let corsor_kind = (!elem.locked && 'text') || 'inherit'


  // fontSize *= .9
  // {...(elem.locked && {readonly:true})}
  // console.log("<<", sel , color)
  return (
    <OverlayBounds {...{sel, elem, bg_opacity : 1, bg_foci_opacity : 1}}>
      <textarea 
        className={"scrollable"}
        key={sel}
        style = {{
           ...styles.textfield,
           fontSize : fontSize,
           color : fontColor,
           // width : elem.width + 200,
           // ...(elem.locked && {
           // })
           cursor : corsor_kind,
         }}
        spellCheck="false"
        ref={ref}
        value={text}
        {...(mode=="start_state" && {placeholder:placeholder})}
        onFocus={(e) => {
          console.log("ON focus")
          setInputFocus(sel)
          if(!groupHasFocus || mode=="start_state"){
            setEmptyFocus(true)  
          }
        }}
        readOnly={mode!="start_state" && elem.locked}
        onBlur={(e) => {
          console.log("BLUR", skill_app?.uid, e)
          let target = e?.relatedTarget || null
          
          //   console.log("Target is clickable thing", target)
          // }else{
          //   console.log("Target is not clickable thing", target)
          // }
          // console.log(target)
          // If something else was clicked don't blur
          if(!target){
            let input = skill_app?.inputs.value ?? skill_app?.input ?? ""
            if((input.length ?? 0)===0){
              removeSkillApp(skill_app)
            }else if(mode == "train"){
              if(!(skill_app?.arg_foci_set ?? false)){
                beginSetArgFoci()  
              }
            }
          }
          setInputFocus(null)
          setEmptyFocus(false)
          
        }}
        onChange={(e)=>{
          console.log("On CHANGE", mode, e.target.value)
          // did_change.current = ref.current.value !== ""
          
          // if(mode=="train"){
          if(!skill_app || empty_focus){
            console.log("New Input", text, e.target.value)

            let new_skill_app;
            if(mode=="train"){
              new_skill_app = newDemo(sel, "UpdateTextField", e.target.value)
            }else{
              new_skill_app = newTutorPerformed(sel, "UpdateTextField", e.target.value)
            }

            // In start_state mode replace instead of add. 
            if(mode=="start_state"){
              removeSkillApp(skill_app)
            }
            addSkillApp(new_skill_app)
            setFocus(new_skill_app)
            // if(mode=='train'){
            //   setCurrentTab("demonstrate")  
            // }
          }else{
            console.log("Set Input", text, e.target.value)
            setInputs(skill_app, {value: e.target.value})  
          }
          setEmptyFocus(false)
          // }else{
          //   ref.current.value += e.target.value
          //   console.log(ref.current.value)
          // }
          
          
        }}
        onKeyDown={(evt)=>{
          console.log("KEY", evt.key, has_focus, evt)
          if((evt.key==="Enter" && !evt.shiftKey) || evt.key==="Escape"){ 
            ref.current.blur()
          }
          if(mode === "start_state" && empty_focus){
            if(evt.key==="Delete" || evt.key==="Backspace"){ 
              removeSkillApp(skill_app)
            }
          }
        }}

        />
    </OverlayBounds>
  )
}

function ButtonOverlay({
    sel, elem,
  }) {

  let [[skill_app,hasStaged], groupHasFocus,  isExternalHasOnly] = useAuthorStoreChange( 
    [getOverlaySkillApp(sel), `@focus_sel==${sel}`, `@only_count!=0`]
  )
  let {addSkillApp, removeSkillApp, setInput, setFocus} = authorStore()

  console.log("skill_app", skill_app)
  let {correct, incorrect, isDemo, color, input} = skillAppExtractProps(skill_app, isExternalHasOnly)

  color = (groupHasFocus && color) ||
          (elem.locked && colors.locked_color) || 
          colors.default_color

  return (
    <OverlayBounds {...{sel, elem, color}}
      style={{cursor : skill_app ? 'auto' : 'pointer', overflow: 'clip'}}
      onClick={(e)=>{
        console.log("BUTTON")
        if(!skill_app){
          let new_skill_app = newDemo(sel, "PressButton", -1)
          addSkillApp(new_skill_app)  
          setFocus(new_skill_app)
        }
      }}
    >
    {skill_app &&
      <div style={{
        borderRadius:100,
        ...(groupHasFocus && {backgroundColor: color})
        }}> 
        <img 
          style ={{...styles.button_image,
            ...(!groupHasFocus && {opacity: .5})}}
          src={images.tap}
          alt={"tap"}
        />
      </div>
    }
    </OverlayBounds>
  )
}

export function StateOverlayLayer({ state, style }) {
  // let {getFocusApp} = authorStore()
  // let focus_app = getFocusApp()
  let [mode, tutor_state, focus_sel] = useAuthorStoreChange(['@mode', '@tutor_state', '@focus_sel'])
  state = state || tutor_state || {}
  // console.log("RENDER OVERLAY")
  
  // Make interface element overlays
  let elem_overlays = []
  for (let [sel, elem] of Object.entries(state)){

    const type_name = elem.type.toLowerCase()
    const overlay_type = overlay_element_types?.[type_name];

    // Prevent interacting with buttons on start state
    if(type_name == 'button' && mode == "start_state"){
      continue
    }

    let should_display = (
      elem?.visible && (
        (mode === "train") || //&& (!elem.locked)) || 
        (mode === "start_state") || 
        (mode === "arg_foci" && (elem.locked || sel===focus_sel))
      )
    )
    // console.log("::", sel, focus_sel, should_display)

    if(overlay_type && should_display){
      elem_overlays.push(
        React.createElement(overlay_type, {
          sel:sel,
          elem: elem,
          key : "overlay_element_"+sel,
        })
      )  
    }
  }

  return (
    <div style={{...style}}>
      {elem_overlays}
    </div>
  )
}


const overlay_element_types = {
  'button' : ButtonOverlay,
  'textfield' : TextFieldOverlay,
}

// const colors = {
//   demo_color : 'rgba(0,90,156,.7)',//'dodgerblue',
//   correct_color : 'rgba(50,205,50,.7)',//'limegreen',
//   incorrect_color : 'rgba(255,0,0,.7)',//'red',
//   default_color : 'rgba(128,128,128,.7)',//'gray',
//   focus_color : 'rgba(153,50,204,.7)',//'darkorchid',
// }

// //'darkorchid'
// const where_colors = [ "#ff884d",  "#52d0e0",
//                    "#feb201",  "#e44161", "#ed3eea",
//                    "#2f85ee",  "#562ac6", "#cc24cc"]




const styles = {
  button_image : { 
    flex:1,
    // position:'absolute',
    maxWidth :"100%",
    maxHeight :"100%",
    // opacity : .7,
    pointerEvents:'none',
    userSelect: "none",
  },
  textfield : {

    // display: "flex",
    textAlign:"center",
    // alignSelf: "center",
    color: 'black',//textColor || 'dodgerblue',
    caretColor: 'black',//textColor || 'dodgerblue',
    width : "99%",
    height :"96%",
    backgroundColor :'transparent',
    borderColor :'transparent',
    resize: "none",
    lineHeight : "1em",

    overflowY: "overlay",
    overflowX: "clip",
  },
  overlay_bounds: {
    display : 'flex',
    flex : 1,
    justifyContent : 'center',
    alignItems : 'center',
    position : 'absolute',
    borderStyle: "solid",//(!isDemo && color) || 'dodgerblue',//(hasFocus && "rgba(143,40,180, .7)") || "gray",
    borderRadius: 10,
    // overflowWrap: 'break-word',
    // backgroundColor : 'grey'
  },
  stage_image : {
    flex:1,
    position:'absolute',
    maxWidth:"100%",
    maxHeight:"100%",
    zIndex:-1,
    opacity:.08,
    top:"-6%",
    pointerEvents : "none",
    userSelect: "none",
  }

}
