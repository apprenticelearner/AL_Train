import React, { useRef } from 'react'
import { motion } from "framer-motion";
import '../author.css';
import '../components/scrollbar.css';
import {useChangedStore, test_state} from "../globalstate.js"

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
    let [foci_index, foci_mode, hasFocus, toggleFoci] = useChangedStore(
        [getFociIndex(sel), "@foci_mode", `@focus_id===${id}`, 'toggleFoci']
    )

    let wrap_index = foci_index % where_colors.length
    let actions_visible = !foci_mode || hasFocus
    // console.log("OverlayBounds", sel, foci_mode, hasFociSelect)

    let backgroundColor = (foci_mode && !hasFocus &&
                  ((foci_index!==-1 && 'darkorchid') || 'grey')
                ) || 'transparent'
    let borderColor = (foci_mode && !hasFocus && 'transparent') || (foci_index !== -1  && where_colors[wrap_index]) || color

    return (      
      <motion.div  style= {{
        ...styles.overlay_bounds,
        ...{
          width: elem.width,
          height: elem.height,
          x : elem.x,
          y : elem.y
        },
        ...style,
        borderWidth: ((foci_index !== -1 || groupHasFocus) && 8) || 4,
        borderColor: borderColor,
        backgroundColor : backgroundColor,
        opacity : (foci_mode && !hasFocus && .4) || 1
        // ...(foci_mode && {backgroundColor: 'rbga(256, 0, 120,.8)', boderColor : 'rbga(0,0,0,.0)'})
      }}
      {...props}
      onClick={(e)=>{if(foci_mode && !hasFocus){toggleFoci(sel)}}}
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
  let isDemo = skill_app?.is_demonstration ?? false

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

const genDemo = (sel, action_type, input) =>{
  let demo = {
    selection: sel,
    action_type : action_type,
    input : input,
    is_demonstration : true,
    reward : 1,
  } 
  return demo
}

function TextFieldOverlay({
    sel, elem,
  }) {

  const ref = useRef(null);
  // const did_change = useRef(null);
  const demo_app_id = useRef(null);

  let [[skill_app, hasStaged], groupHasFocus, isExternalHasOnly, addSkillApp, removeSkillApp, setInput, setFocus, setCurrentTab, setFociMode] = useChangedStore(
    [getOverlaySkillApp(sel), `@focus_sel===${sel}`, `@only_count!==0`, "addSkillApp", "removeSkillApp", "setInput", "setFocus", "setCurrentTab", "setFociMode"],
  )

  let {correct, incorrect, isDemo, color, input, id} = skillAppExtractProps(skill_app, isExternalHasOnly)

  let text = input || ""
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
         }}
        spellCheck="false"
        ref={ref}
        value={text}
        onFocus={(e) => {
          console.log("ON focus")
          if(!groupHasFocus){
            ref.current.value=""
            if(demo_app_id.current){
              setInput(skill_app, ref.current.value)    
            }
          }
          
        }}
        onBlur={(e) => {
          console.log("BLUR", demo_app_id.current, skill_app?.id)
          ref.current.value=skill_app?.input ?? ""
          if(demo_app_id.current){
            if(skill_app?.input.length===0){
              removeSkillApp(skill_app)
            }else{
              setFociMode(true)  
            }
          }
          demo_app_id.current = null
          
        }}
        onChange={(e)=>{
          console.log("On CHANGE", e.target.value)
          // did_change.current = ref.current.value !== ""

          if(!demo_app_id.current){
            let new_skill_app = genDemo(sel, "UpdateTextField", e.target.value)
            addSkillApp(new_skill_app)
            setFocus(new_skill_app)
            setCurrentTab("demonstrate")
            
            demo_app_id.current = new_skill_app.id
          }else{
            console.log(">>", text, e.target.value)
            setInput(skill_app, e.target.value)  
          }
        }}
        onKeyPress={(evt)=>{
          if(evt.key==="Enter" && !evt.shiftKey){ 
            ref.current.blur()
            
            console.log("Set Foci Mode")
          }
        }}

        />
    </OverlayBounds>
  )
}

function ButtonOverlay({
    sel, elem,
  }) {

  let [[skill_app,hasStaged], groupHasFocus,  isExternalHasOnly, addSkillApp, removeSkillApp, setInput, setFocus] = useChangedStore( 
    [getOverlaySkillApp(sel), `@focus_sel===${sel}`, `@only_count!==0`, "addSkillApp", "removeSkillApp", "setInput", "setFocus"]
  )

  let {correct, incorrect, isDemo, color, input} = skillAppExtractProps(skill_app, isExternalHasOnly)

  return (
    <OverlayBounds {...{sel, elem, color, groupHasFocus, hasStaged}}
      onClick={(e)=>{
        console.log("BUTTON")
        if(!skill_app){
          let new_skill_app = genDemo(sel,"PressButton", -1)
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

export function StateOverlayLayer({ state, style }){

  state = state || test_state
  
  // let ref = useRef(null)

  // Make interface element overlays
  let elem_overlays = []
  for (let [sel, elem] of Object.entries(state)){
    const overlay_type = overlay_element_types[elem.type]
    elem_overlays.push(
      React.createElement(overlay_type, {
        sel:sel,
        elem: elem,
        key : "overlay_element_"+sel,
      })
    )
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
