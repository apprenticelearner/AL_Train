import React, { useRef, useState, memo } from 'react'
import { motion } from "framer-motion";
import '../author.css';
import '../components/scrollbar.css';
import RisingDiv from "./RisingDiv.js"
import {authorStore, useAuthorStoreChange} from "../author_store.js"
import {colors, where_colors} from "../themes.js"
import Color from 'color'
import {randomUID, shallowEqual, arraysEqual,  arg_symbols, gen_shadow} from "../../utils.js";
import {SmallCorrectnessToggler} from "./CorrectnessToggler.js"

const images = {
  tap: require('../img/gesture-tap.png'),
  left_arrow: require('../img/arrow-left-bold.png'),
  // double_chevron : require('../img/double_chevron_300x400.png')
  double_chevron : require('../../img/double_chevron_300x400.svg'),
  next : require('../../img/next.svg')
};

const getFociIndexInfo = (elem_id) => [
  (s) => {
    let skill_app = s.skill_apps?.[s.focus_uid];
    let hover = false
    if(!skill_app){
      skill_app = s.skill_apps?.[s.hover_uid];   
      hover = !!skill_app
    }
    let {arg_foci, foci_explicit} = s.extractArgFoci(skill_app)
    
    if(arg_foci){
      let index = arg_foci.indexOf(elem_id)
      return [index, foci_explicit, hover && (index != -1)]
    }
    return [-1, true, false]
  },
  (o, n) => {
    return o[0] === n[0] && o[1] === n[1] && o[2] === n[2]
  }
]

let PopUpConfirmButton = memo(({sel, skill_app}) => {
  let {setStaged, setReward, confirmFeedback} = authorStore();
  let rd_props = {
    hover_scale : 1.1,
    default_scale : 1,
    hover_elevation : 10,
    default_elevation : 6
  }
  let is_undef = (skill_app?.reward ?? 0) == 0

  let [hasHover, setHover] = useState(false)

  return (<RisingDiv
      hoverCallback={(e)=>{setHover(true)}}
      unhoverCallback={(e)=>{setHover(false)}}
      onClick={()=>{if(is_undef){setReward(skill_app, 1)}; setStaged(skill_app); confirmFeedback(false,true)}}
      scale={(hasHover && 1.1) || 1}
      elevation={(hasHover && 10) || 6}
      //onMouseEnter={(e)=>{console.log("OVER:", e)}}
      //onMouseLeave={(e)=>{console.log("LEAVE:", e)}}
      style={{position: "absolute", display: "flex", flexDirection:'row', alignItems:'center', 
               bottom: -12, left: -7, padding: 6, paddingBottom:1, paddingTop:1, borderRadius: 5,  
               backgroundColor: 'rgb(230,230,230)',
               color: (is_undef && hasHover && colors.correct) || 'black',
               fontWeight:'bold',
               fontSize:12}}
      //{...rd_props}
  > 
    {is_undef && 
      <a style={{margin: 1, pointerEvents:'none', fontSize : '1.1em',
                }}>{"✔"}</a>
    }
    <a style={{margin: 1, pointerEvents:'none'}}>{(is_undef && "Yes") || "Apply"}</a>
    <img style={{width:12, height:12, margin: 1, marginLeft:2, pointerEvents:'none'}} 
         src={images.next}

       />
  </RisingDiv>
  )
})

let RemoveButton = memo(({skill_app}) => {
  let {removeSkillApp} = authorStore();
  let rd_props = {
    hover_scale : 1.1,
    default_scale : 1,
    hover_elevation : 10,
    default_elevation : 6
  }
  let [hasHover, setHover] = useState(false)

  return (<RisingDiv
      hoverCallback={(e)=>{setHover(true)}}
      unhoverCallback={(e)=>{setHover(false)}}
      scale={(hasHover && 1.1) || 1}
      elevation={(hasHover && 10) || 6}
      //onMouseEnter={(e)=>{console.log("OVER:", e)}}
      //onMouseLeave={(e)=>{console.log("LEAVE:", e)}}
      style={styles.remove_button}
      //{...rd_props}
      onMouseDown={(e)=>{
          e.stopPropagation()
          removeSkillApp?.(skill_app);
          }}
        >{"✕"}

      {hasHover && 
        <div style={styles.popup_button_text}>remove</div>
      }
      </RisingDiv>    
  )
})



// const foci_bg_color = Color('darkorchid').alpha(.4).hexa()
// const foci_cand_bg_color = Color('grey').alpha(.4).hexa()

// console.log("foci_bg_color", foci_bg_color)
// console.log("foci_cand_bg_color", foci_cand_bg_color)

function OverlayBounds({style, children, sel, elem, bg_opacity=0, bg_foci_opacity=.4, ...props}){
    let {setHover, setHoverSel, setFocus, toggleReward} = authorStore()
    let [[skill_app, hasStaged], groupHasFocus, hasHover, skill_app_uids,
          mode, isExternalHasOnly, elem_locked, in_done_state] = useAuthorStoreChange(
      [getOverlaySkillApp(sel), `@focus_sel==${sel}`, `@hover_sel==${sel}`, `@sel_skill_app_uids.${sel}`,
       "@mode", "@only_count!=0", `@tutor_state.${sel}.locked`, '@in_done_state'],
    )
    // console.log("OVERLAY BOUNDS", sel, skill_app)

    // TODO: HARD-CODED, more extensible way to ignore certain interface elements
    if(sel == 'hint'){
      return
    }

    let [[foci_index, foci_explicit, foci_hover],
         hasSkillAppFocus, foci_mode, toggleFoci] = useAuthorStoreChange(
        [getFociIndexInfo(sel),
         `@focus_uid==${skill_app?.uid}`,  "@mode=='arg_foci'", 'toggleFoci']
    )

    let first_uid = skill_app_uids?.[0] || ""
    let var_name = arg_symbols?.[foci_index];

    let foci_cand = foci_mode && !hasSkillAppFocus
    let is_foci = (foci_index!==-1) && (mode=="train" || foci_explicit)
    let correct = (skill_app?.reward ?? 0) > 0
    let incorrect = (skill_app?.reward ?? 0) < 0
    let isImplicit = isExternalHasOnly && reward == 0;
    let is_demo = skill_app?.is_demo || false

    let foci_color = null
    if(foci_index !== -1){
      foci_color = where_colors[foci_index % where_colors.length]
    }

    if(!foci_explicit || foci_hover){
      foci_color = Color(foci_color).lighten(.25).hexa()
    }

    // console.log("UPDATE OVERLAY", sel, "|", hasSkillAppFocus, ":", foci_index, arg_hover)

    let arg_hover = mode=='arg_foci' && hasHover
    // let actions_visible = !foci_mode || hasFocus
    // console.log("OverlayBounds", sel, arg_hover)
    


    let {color} = skillAppExtractProps(skill_app, isExternalHasOnly)
    

    if(mode == "start_state"){
      color = 'teal'
      elem_locked = false
    }else{
      if(in_done_state){
        elem_locked = true
      }
      if(skill_app && !hasSkillAppFocus && !hasHover){
        color = Color(color).lighten(.25).hexa()
      }
    }    


    let clear_bg_color  = Color("white").alpha(bg_opacity).hexa()
    let foci_cand_bg_color = Color('rgb(127,127,127)').alpha(bg_foci_opacity).hexa()

    let backgroundColor = (elem_locked && 'rgb(240,240,240)') ||
                          (hasSkillAppFocus && clear_bg_color) || 
                          (is_foci && clear_bg_color) || 
                          (foci_cand && foci_cand_bg_color) ||
                          clear_bg_color

    let borderColor = ((hasSkillAppFocus || mode == 'start_state') && color) || 
                      ((is_foci || foci_hover) && foci_color) ||
                      (arg_hover && color) ||
                      (foci_cand && 'transparent') ||
                      (elem_locked && colors.locked) || 
                      (groupHasFocus && color) ||
                      color



    let borderWidth = (arg_hover && foci_color && 4) ||
                      ((is_foci || groupHasFocus) && 5) ||
                      (arg_hover && 4) ||
                      ((hasHover) && 4) ||
                      
                      (foci_cand && 3) ||
                      (elem_locked && 3) || 
                      3

    // Adjust the draw rects so that centers of thick borders overlap original bounds.                
    //   Add a negative margin of same amount to keep content stationary on style change.
    let pw = (skill_app && 2) || 0
    let bw =  borderWidth-1
    let hbw =  borderWidth / 2
    let rect = {width: elem.width-bw+pw, height: elem.height-bw+pw, x : elem.x-hbw, y : elem.y-hbw-pw}
                //transform: `translate(-${hbw},-${hbw})`}

    let click_rect = {...rect, borderRadius: 13, padding:8} //backgroundColor: 'red', opacity: 0.5} //borderStyle: 'solid', 
                      //borderColor: (skill_app && '#214') || 'transparent', 
                      //padding: ((hasHover || groupHasFocus) && 5 )  || 4,
                      //opacity : ((hasHover || groupHasFocus) && 0.05 ) || 0.3,
                      //borderWidth: 4,
                      //boxShadow: "10px 5px 5px red"}

    // console.log("::", sel, skill_app?.uid, color)
    let cursor_kind = (foci_cand && 'none') ||
                      (elem_locked && 'default') ||
                      (skill_app && !groupHasFocus && 'pointer') || 
                      'auto'
    let transp_ptr_evts = (mode == "start_state"  && 'none') ||
                          (groupHasFocus && 'none') ||
                          (!skill_app && 'none') ||
                          'auto'

    
    // let shadow_colors = {red:0, green: 10, blue: 30}

    // let shadow =  //gen_shadow(16,'box', shadow_colors)
    // console.log("SHADOW",shadow)
    //"3px 6px 4px #025"
    // console.log("__>", sel, borderColor, foci_color, foci_index, foci_explicit, foci_hover)
    // console.log("OC", props.onClick, mode)
    // let mouse_down = 

    return (      
      <motion.div  style= {{
        ...styles.overlay_bounds,
        ...rect,
        borderWidth: borderWidth,
        borderColor: borderColor,
        backgroundColor : backgroundColor,
        cursor:  cursor_kind,
        ...(skill_app && {boxShadow: "4px 6px 4px rgba(0,20,60,0.6)"}),
        ...style,
        // opacity : (foci_cand && .4) || 1
      }}


      {...props}
      onMouseDown={(
        // If toggling foci prevent default so elem doesn't take focus
        (foci_cand && ((e) => {
          toggleFoci(sel); 
          e.preventDefault(); //Prevents highlighting
        })) ||
        (skill_app && !groupHasFocus && mode != 'start_state' && 
          ((e) => {
          
          setFocus(skill_app?.uid); 
          e.preventDefault(); //Prevents highlighting
        })) ||
        props.onClick
      )}
      onMouseEnter={()=>{mode=='arg_foci' ? setHoverSel(sel) : setHover(first_uid)  }}
      onMouseLeave={()=>{mode=='arg_foci' ? setHoverSel("")  : setHover("")}}
      >
        {/* Transparent Background Div to make slightly larger */}
        <div style={{position: "absolute", backgroundColor: "transparent", 
                      pointerEvents : transp_ptr_evts,
                       ...click_rect}}/>

        {/* Multiple Action Indicator like (1/2) */}
        {skill_app_uids?.length > 1 && 
        <div style={{position: "absolute", backgroundColor: "white", pointerEvents:'auto',
            fontSize: 7, fontFamily: 'Monospace', color: "grey",
            userSelect: "none", top: -4-(groupHasFocus && 1),
            left: -8-hbw, paddingBottom: 2, paddingTop: 2, paddingLeft: -2, paddingRight: 4}}>
          {`(${skill_app_uids.indexOf(skill_app.uid)+1}/${skill_app_uids.length})`}
        </div>}

        {/* Next Icon */}
        {(hasStaged) &&
          <img style ={{...styles.stage_image, top:"5%", height:"90%", width:"90%"}} src={images.next} alt={""}/>
        }

        {/* Variable Name Indictor */}
        {(is_foci && var_name) &&
          <div style={{...styles.var_indicator, backgroundColor : borderColor}}> 
            {var_name.toUpperCase()}
          </div>
        }

        {/* Internals e.g. textarea, button, etc. */}
        {children}

        {/* Pop-up Confirm Button */}
        {(mode != "start_state" && groupHasFocus && !incorrect) && 
          <PopUpConfirmButton sel={sel} skill_app={skill_app}/>
        }

        {/*Remove Button*/}
        {(mode != "start_state" && groupHasFocus && 
          ( (is_demo && <RemoveButton skill_app={skill_app}/>) ||
            <SmallCorrectnessToggler 
              style={{...styles.toggler_small}}
              text_color={(isImplicit && 'white') || 'black'}
              correct={correct}
              incorrect={incorrect}
              onPress={(force_reward) => toggleReward(skill_app, force_reward)}
            />
          )
        )}

      </motion.div>
  )
}

function skillAppExtractProps(skill_app, isExternalHasOnly){
  let correct = skill_app?.reward > 0 ?? false;
  let incorrect = (skill_app?.reward < 0 ?? false) || (skill_app?.reward===0 && isExternalHasOnly);
  let isDemo = skill_app?.is_demo ?? false

  // console.log(isDemo, correct, incorrect, colors.demo)
  let color = (isDemo && colors.demo) || 
              (correct && colors.correct) ||
              (incorrect && colors.incorrect) ||
              (colors.default)
  // console.log(isDemo, correct, incorrect, colors.demo, color)
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

      // If skill_app is not focused or staged then prefer demos and correct
      if(!skill_app){
        let skill_app_uids = s.sel_skill_app_uids?.[sel];
        if(skill_app_uids?.length > 0){
          let skill_apps = skill_app_uids.map((uid)=>s.skill_apps[uid])
          skill_apps?.sort((sa,sb)=>{
            let r0 = (sa?.reward ?? 0) + (sa?.is_demo ?? 0)
            let r1 = (sb?.reward ?? 0) + (sb?.is_demo ?? 0)
            return r1 - r0
          })
          skill_app = skill_apps[0];
        }
      }
      return [skill_app, s.staged_uid === skill_app?.uid]
    },
      ([o,os],[n,ns])=>{
        // console.log("Recalc", sel, n?.reward, o?.reward)
        return n?.uid === o?.uid && shallowEqual(n?.inputs, o?.inputs)  && n?.reward === o?.reward && os === ns
    }]
}

// const getOverlayIsLocked = (sel) =>{

// }



const newSkillApp = (sel, action_type, input, props) =>{
  let skill_app = {
    uid : `A_${randomUID()}`,
    selection: sel,
    action_type : action_type,
    inputs : {value :input},
    has_changed : true,
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

  let [[skill_app, hasStaged], groupHasFocus, isExternalHasOnly, mode, has_focus, in_done_state] = useAuthorStoreChange(
    [getOverlaySkillApp(sel), `@focus_sel==${sel}`, `@only_count!=0`, "@mode", `@input_focus==${sel}`, '@in_done_state'],
  )
  let {setInputFocus, addSkillApp, removeSkillApp, setInputs, setFocus, beginSetArgFoci, confirmArgFoci} = authorStore()
  // let empty_focus = (!skill_app?.input && has_focus)
  // console.log(not_empty.current, skill_app)


  // let {color} = skillAppExtractProps(skill_app, isExternalHasOnly)
  let input = skill_app?.inputs.value ?? skill_app?.input

  let text, fontColor, placeholder;
  if(mode == "start_state"){
    // color = "teal"
    fontColor = 'black'
  }else{
    fontColor = ((groupHasFocus || !input) && 'black') || 'grey'
  }

  if(!empty_focus && skill_app){
    text = input
  }else if(mode != "start_state"){
    text = elem.value
  }

  text = text || ""
  placeholder = (input) ||  ""   

  //Ensure only highlight color on focus
  let L = text.length || 1//Math.min(text.length || 1, 12)
  let fL = Math.max(L || 1, 2)//Math.min(text.length || 1, 12)
  let mindim = Math.min(elem.width, elem.height)
  let maxdim = Math.max(elem.width, elem.height)

  let fontSize = Math.floor(Math.max( (mindim+2) / (fL+(L-fL)*.6) ,16)) // Min font 
  // let 
  // let pred_n_lines = Math.floor(L/2+1)
  let pred_n_lines = Math.ceil(L / ((elem.width+2) / fontSize) )
  // let fontSize = Math.min(mindim, maxdim/pred_n_lines) *.75
  let pad_top = pred_n_lines == 1 && Math.floor(Math.max(0,(elem.height-fontSize)))
  console.log("P!", pred_n_lines, L / (elem.width / fontSize) , fontSize, pad_top, (elem.height*1.1-fontSize))
  
  //(!groupHasFocus) ||
  let focus_locked = (mode != "start_state" && elem.locked || in_done_state)
  let cursor_kind = (!groupHasFocus  && "inherit") ||
                    (focus_locked  && "inherit") ||
                    'text'
  // console.log("focus_locked", focus_locked)   
  // console.log("cursor_kind", cursor_kind)
  return (
    <OverlayBounds {...{sel, elem, bg_opacity : 1, bg_foci_opacity : 1}}>
      <textarea 
        className={"scrollable"}
        key={sel}
        style = {{
           ...styles.textfield,
           fontSize : fontSize,
           color : fontColor,
           paddingTop: pad_top,
           // width : elem.width + 200,
           // ...(elem.locked && {
           // })
           cursor : cursor_kind,
         }}
        spellCheck="false"
        ref={ref}
        value={text}
        {...(mode=="start_state" && {placeholder:placeholder})}
        onFocus={(e) => {
          console.log("ON focus", e)
          setInputFocus(sel)
          if(!groupHasFocus || mode=="start_state" || !skill_app?.is_demo){
            console.log("INNER")
            setEmptyFocus(true)  
          }
        }}
        readOnly={focus_locked}
        onBlur={(e) => {
          // console.log("BLUR", skill_app?.uid, e)
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
              // if(!(skill_app?.arg_foci_set ?? false)){
              //   beginSetArgFoci()  
              // }
            }
          }
          setInputFocus(null)
          setEmptyFocus(false)
          
        }}
        onChange={(e)=>{
          let new_value = e.target.value
          // console.log("On CHANGE", mode, new_value)
          // did_change.current = ref.current.value !== ""

          // In start_state mode remove when empty
          if(skill_app && mode=="start_state" && (!new_value || empty_focus)){
            removeSkillApp(skill_app)
            skill_app = null
          }
          
          if((!skill_app || empty_focus) && new_value){
            console.log("New Input", text, new_value, skill_app, empty_focus)

            let new_skill_app;
            if(mode=="train"){
              new_skill_app = newDemo(sel, "UpdateTextField", new_value)
            }else{
              new_skill_app = newTutorPerformed(sel, "UpdateTextField", new_value)
            }
            
            addSkillApp(new_skill_app)
            setFocus(new_skill_app.uid)
            if(mode == "train"){
              beginSetArgFoci()  
            }
            

          }else if(skill_app){
            console.log("Set Input", text, "->", new_value)
            setInputs(skill_app, {value: new_value})  
          }
          setEmptyFocus(false)
          
        }}
        onKeyDown={(evt)=>{
          console.log("KEY", evt.key, has_focus, evt)
          if((evt.key==="Enter" && !evt.shiftKey) || evt.key==="Escape"){ 
            ref.current.blur()

            // Only confirm foci on blur if any were set
            // if(skill_app?.arg_foci?.length > 0 && mode == "arg_foci"){
            if(mode == "arg_foci"){
              confirmArgFoci()
            }
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

  let [[skill_app,hasStaged], groupHasFocus,  isExternalHasOnly, in_done_state] = useAuthorStoreChange( 
    [getOverlaySkillApp(sel), `@focus_sel==${sel}`, `@only_count!=0`, '@in_done_state']
  )
  let {addSkillApp, removeSkillApp, setFocus} = authorStore()

  // console.log("skill_app", skill_app)
  let {correct, incorrect, isDemo, color, input} = skillAppExtractProps(skill_app, isExternalHasOnly)

  color = (groupHasFocus && color) ||
          (elem.locked && colors.locked) || 
          colors.default

  let click_locked = skill_app || in_done_state;

  return (
    <OverlayBounds {...{sel, elem, color}}
      style={{cursor : click_locked  ? 'auto' : 'pointer'}}
      onClick={(e)=>{
        // console.log("BUTTON")
        if(!click_locked){
          let new_skill_app = newDemo(sel, "PressButton", -1)
          addSkillApp(new_skill_app)  
          setFocus(new_skill_app.uid)
        }
      }}
    >
    {skill_app &&
      <div style={{
        borderRadius:100, overflow: 'clip',
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
    borderRadius: 8,
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
  },

  var_indicator : {
    display : "flex",
    justifyContent : 'center',
    alignItems : 'center',
    flex:1,
    position:'absolute',
    maxWidth:"100%",
    maxHeight:"100%",
    fontSize : 14,
    fontWeight : 'bold',
    color : 'white',

    width : 18,
    height : 18,
    borderRadius : 20,
    padding : 2,
    // zIndex:-1,
    // opacity:.08,
    right:-11,
    top:-10,
    pointerEvents : "none",
    userSelect: "none",
  },

  remove_button: {
    display : "flex",
    alignItems : 'center',
    justifyContent : 'center',
    position : 'absolute',
    right:-14,
    top:-12,
    padding : "2px 2px 2px 2px",
    margin : 2,
    // opacity : .2,
    // border : "solid 1px rgb(230,230,230)",
    // border : "solid 1px black",
    // backgroundColor : 'rgb(240,256,240)',
    color : "black",
    backgroundColor : 'rgb(230,230,230)',
    width: 12,
    height: 12,
    fontSize : 14,
    fontWeight : 'bold',
    borderRadius: 20,
    textAlign:'center',
  },

  popup_button_text: {
    display : "flex",
    position:'absolute',
    backgroundColor : "white",
    border : "solid 1px lightgray",
    color : "black",
    padding : 1,
    paddingRight : 2,
    paddingLeft : 2,
    borderRadius : 6,
    top: 0,
    right: 16,
    fontSize: 9,
  },

  toggler_small: {
    width: 18,
    height: 26,
    right: -12,
    top: -12,
    position:'absolute',
    display:"flex",
    justifyContent : "center",
    alignItems : "center",
  },



  // var_indicator_text : {
    
  // }


}
