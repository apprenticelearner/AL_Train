import React, { useRef, useState } from 'react'
import { motion } from "framer-motion";
import '../author.css';
import '../components/scrollbar.css';
import {authorStore, useAuthorStoreChange} from "../author_store.js"

const images = {
  tap: require('../img/gesture-tap.png'),
  left_arrow: require('../img/arrow-left-bold.png'),
  double_chevron : require('../img/double_chevron_300x400.png')
};


const getFociIndex = (sel) => [
  (s) => {
    let arg_foci = s.skill_apps?.[s.focus_id]?.arg_foci ?? []
    return arg_foci.indexOf(sel) 
  },
  (o, n) => {
    return o === n
  }
]

function OverlayBounds({style, children, sel, elem, color, groupHasFocus, hasStaged, id,...props}){
    let [foci_index, foci_mode, hasFocus, toggleFoci] = useAuthorStoreChange(
        [getFociIndex(sel), "@mode=='arg_foci'", `@focus_id===${id}`, 'toggleFoci']
    )

    let wrap_index = foci_index % where_colors.length
    let actions_visible = !foci_mode || hasFocus
    // console.log("OverlayBounds", sel, foci_mode, hasFociSelect)
    let foci_cand = foci_mode && !hasFocus
    let is_foci = foci_index!==-1

    let backgroundColor = (foci_cand &&
                  ((is_foci && 'darkorchid') || 'grey')
                ) || 'transparent'
    let borderColor = (foci_cand && 'transparent') ||
                      (is_foci  && where_colors[wrap_index])
                      || color

    return (      
      <motion.div  style= {{
        ...styles.overlay_bounds,
        ...{width: elem.width, height: elem.height, x : elem.x, y : elem.y},
        ...style,
        borderWidth: ((groupHasFocus) && 8) || 4,
        borderColor: borderColor,
        backgroundColor : backgroundColor,
        opacity : (foci_cand && .4) || 1
      }}

      {...props}
      onClick={(e)=>{if(foci_cand){toggleFoci(sel)}}}
      >
        {(actions_visible && hasStaged) &&
          <img style ={styles.stage_image} src={images.double_chevron} alt={""}/>
        }
        {actions_visible && children}
      </motion.div>
  )
}

function skillAppExtractProps(skill_app, isExternalHasOnly){
  let correct = skill_app?.reward > 0 ?? false;
  let incorrect = (skill_app?.reward < 0 ?? false) || (skill_app?.reward===0 && isExternalHasOnly);
  let isDemo = skill_app?.is_demo ?? false

  let color = //(isDemo && colors.demo_color) || 
              (correct && colors.correct_color) ||
              (incorrect && colors.incorrect_color) ||
              (colors.default_color)
  let input = skill_app?.input ?? ""
  let id = skill_app?.id ?? ""
  return {correct, incorrect, isDemo, color, input, id}
}

const getOverlaySkillApp = (sel) =>{
  return [(s)=>{
      let skill_app;
      if(s?.focus_sel===sel){
        skill_app = s?.skill_apps[s.focus_id]
      }else if(s?.staged_sel===sel){
        skill_app = s?.skill_apps[s.staged_id]
      }

      if(!skill_app){
        let skill_app_ids = s.sel_skill_app_ids?.[sel]
        if(skill_app_ids?.length > 0){
          skill_app = s.skill_apps[skill_app_ids[0]]
        }
      }
      return [skill_app, s.staged_id === skill_app?.id]
    },
      ([o,os],[n,ns])=>{
        // console.log("Recalc", sel, n?.reward, o?.reward)
        return n?.id === o?.id && n?.input === o?.input && n?.reward === o?.reward && os === ns
    }]

}



const newSkillApp = (sel, action_type, input, props) =>{
  let skill_app = {
    selection: sel,
    action_type : action_type,
    input : input,
    ...props
  } 
  return skill_app
}

const newDemo = (sel, action_type, input) =>{
  return newSkillApp(sel,action_type,input, {is_demo : true,reward : 1,})
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
    [getOverlaySkillApp(sel), `@focus_sel===${sel}`, `@only_count!==0`, "@mode", `@input_focus==${sel}`],
  )
  let {setInputFocus, addSkillApp, removeSkillApp, setInput, setFocus, setMode} = authorStore()
  // let empty_focus = (!skill_app?.input && has_focus)
  // console.log(not_empty.current, skill_app)

  let text, placeholder, color, id;
  if(mode == "start_state"){
    color = "teal"
    text = (!empty_focus && skill_app?.input) ||  "" 
    placeholder = (skill_app?.input) ||  "" 
    
  }else{
    let {isDemo, color, input, id} = skillAppExtractProps(skill_app, isExternalHasOnly)
    text = input || ""  
  }
  
  let L = Math.min(text.length || 1, 8)

  let mindim = Math.min(elem.width, elem.height)
  let maxdim = Math.max(elem.width, elem.height)
  let fontSize = Math.min(mindim, maxdim/((L-1)/2 + 1))

  fontSize *= .9

  return (
    <OverlayBounds {...{sel, elem, color, groupHasFocus, hasStaged, id}}>
      <textarea 
        className={"scrollable"}
        key={sel}
        style = {{
           ...styles.textfield,
           fontSize : fontSize,
           //TODO placeholder style
         }}
        spellCheck="false"
        ref={ref}
        value={text}
        {...(mode=="start_state" && {placeholder:placeholder})}
        onFocus={(e) => {
          console.log("ON focus")
          setInputFocus(sel)
          setEmptyFocus(true)
        }}
        onBlur={(e) => {
          console.log("BLUR", skill_app?.id)
          if(skill_app?.input.length===0){
            removeSkillApp(skill_app)
          }else if(mode == "train"){
            setMode("arg_foci")  
          }
          setInputFocus(null)
          setEmptyFocus(false)
          
        }}
        onChange={(e)=>{
          console.log("On CHANGE", mode, e.target.value)
          // did_change.current = ref.current.value !== ""
          let new_skill_app;
          if(mode=="train"){
            new_skill_app = newDemo(sel, "UpdateTextField", e.target.value)
          }else{
            new_skill_app = newTutorPerformed(sel, "UpdateTextField", e.target.value)
          }
          // if(mode=="train"){
          if(!skill_app){
            addSkillApp(new_skill_app)
            setFocus(new_skill_app)
            // if(mode=='train'){
            //   setCurrentTab("demonstrate")  
            // }
          }else{
            // console.log(">>", text, e.target.value)
            setInput(skill_app, e.target.value)  
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
    [getOverlaySkillApp(sel), `@focus_sel===${sel}`, `@only_count!==0`]
  )
  let {addSkillApp, removeSkillApp, setInput, setFocus} = authorStore()

  let {correct, incorrect, isDemo, color, input} = skillAppExtractProps(skill_app, isExternalHasOnly)

  return (
    <OverlayBounds {...{sel, elem, color, groupHasFocus, hasStaged}}
      onClick={(e)=>{
        console.log("BUTTON")
        if(!skill_app){
          let new_skill_app = newDemo(sel,"PressButton", -1)
          setFocus(new_skill_app)
          addSkillApp(new_skill_app)  
        }
      }}
    >
    {skill_app && 
      <img 
        style ={{...styles.button_image}}
        src={images.tap}
        alt={""}
      />
    }
    </OverlayBounds>
  )
}

export function StateOverlayLayer({ state, style }) {

  let [mode, tutor_state] = useAuthorStoreChange(['@mode', '@tutor_state'])
  state = state || tutor_state || {}
  // console.log("RENDER OVERLAY", tutor_state)
  
  // Make interface element overlays
  let elem_overlays = []
  for (let [sel, elem] of Object.entries(state)){
    const type_name = elem.type.toLowerCase()
    const overlay_type = overlay_element_types?.[type_name]

    // Prevent interacting with buttons on start state
    if(type_name == 'button' && mode == "start_state"){
      continue
    }

    let should_display = (
      elem?.visible && (
        (mode === "train" && (!elem.locked)) || 
        (mode === "start_state") || 
        (mode === "arg_foci" && elem.locked)
      )
    )

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

const colors = {
  demo_color : 'rgba(0,90,156,.7)',//'dodgerblue',
  correct_color : 'rgba(50,205,50,.7)',//'limegreen',
  incorrect_color : 'rgba(255,0,0,.7)',//'red',
  default_color : 'rgba(128,128,128,.7)',//'gray',
  focus_color : 'rgba(153,50,204,.7)',//'darkorchid',
}

//'darkorchid'
const where_colors = [ "#ff884d",  "#52d0e0",
                   "#feb201",  "#e44161", "#ed3eea",
                   "#2f85ee",  "#562ac6", "#cc24cc"]




const styles = {
  button_image : { 
    flex:1,
    position:'absolute',
    maxWidth :"100%",
    maxHeight :"100%",
    opacity : .7,
    pointerEvents:'none',
    userSelect: "none",
  },
  textfield : {

    display: "flex",
    textAlign:"center",
    // alignSelf: "center",
    color: 'black',//textColor || 'dodgerblue',
    width : "99%",
    height :"96%",
    backgroundColor :'transparent',
    borderColor :'transparent',
    resize: "none",
    lineHeight : "1em",
    // marginLeft : -2,
    // marginBottom : -2,


  },
  overlay_bounds: {
    display : 'flex',
    flex : 1,
    justifyContent : 'center',
    alignItems : 'center',
    position : 'absolute',
    borderStyle: "solid",//(!isDemo && color) || 'dodgerblue',//(hasFocus && "rgba(143,40,180, .7)") || "gray",
    borderRadius: 10,
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
