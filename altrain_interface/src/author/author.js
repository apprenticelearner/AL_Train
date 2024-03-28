import React, { Component, createRef, useState, useEffect, useRef, Profiler, Suspense, memo } from 'react'
import {useNavigate, Route, Routes, Link} from 'react-router-dom';
import { motion, useMotionValue, useSpring, useScroll } from "framer-motion";
// import * as Animatable from 'react-native-animatable';
import autobind from "class-autobind";
import './author.css';
import './components/scrollbar.css';
import RisingDiv from "./components/RisingDiv.js"
import {CorrectnessToggler, SmallCorrectnessToggler} from "./components/CorrectnessToggler.js"
import {SkillAppCardLayer, SkillAppGroup, DownChevron} from "./components/SkillAppCard.js"
import {FeedbackCounters} from "./components/icons.js"
import {StateOverlayLayer} from "./components/StateOverlay.js"
import {Icon} from "./components/icons.js"
import {Graph} from "./graph.js"
import ScrollableStage from "./stage.js"
import Color from "color"

import {useALTrainStoreChange} from '../altrain_store';
import {authorStore, setAuthorStore, useAuthorStore, useAuthorStoreChange, test_state, test_skill_applications} from "./author_store.js"
// import MyZustandTest from "./change_store_test.js"
import {shallowEqual, baseFile, gen_shadow, arg_symbols} from "../utils.js"
import CTATTutorWrapper from "../tutorwrappers/ctat"
import {colors, where_colors} from "./themes.js"
import {Oval} from "react-loader-spinner";
import Select, { StylesConfig } from 'react-select';


const images = {
  left_arrow: require('/src/img/arrow-left-bold.png'),
  crosshair: require('/src/img/crosshairs.png'),
  microphone: require('/src/img/microphone.png'),
  //pencil: require('/src/img/pencil.png'),
  pencil : require('../img/pencil.svg'),
  edit : require('../img/edit.svg'),
  next : require('../img/next.svg'),
  bar: require('/src/img/bar.png'),
};

function UnimplementedMenu({name}){
  // console.log("RENDER UnimplementedMenu")
  return (
    <div>
    <div style={{display : 'flex', alignItems : 'center', justifyContent : 'center', height: '100%',
                 backgroundColor:'red', 'margin' : 4}}>
      <div>{`Unimplemented Menu: ${name}`}</div>
    </div>
    </div>
  )
}

function SkillsMenu({}){
  return (
    <div>
      <div>{"SKILLz:"}</div>
    </div>
  )
}


let button_defaults_props = {
  focused_scale : 1.125,
  hover_scale : 1.05,
  default_scale : 1,
  focused_elevation : 12,
  hover_elevation : 16,
  default_elevation : 12
}


function getFocusOrHover(){
  return [(s)=>{
    let skill_app = s.skill_apps[s.focus_uid] || s.skill_apps[s.hover_uid]
    return skill_app
  },
  (o,n) =>{
    for (let [key, value] in n){
      if(o?.[key] != value){
        return false
      }
    }
    return true
    // return o?.id == n?.id && o?.input == n?.input && o?.skill_label == n?.skill_label
  }
  ]
}

function ArgBox({symbol, name, color}){
  let { setHoverArgFoci, toggleFoci} = authorStore()
  let [hover] = useAuthorStoreChange(
      [`@hover_arg_foci=='${name}'`],
  )

  return (
    <div style={{...styles.arg_item, borderColor: color, userSelect : 'none',}} key={`arg_${symbol}`}
            onMouseEnter={(e)=>{console.log("ENTER");setHoverArgFoci(name);e.stopPropagation()}}
            onMouseLeave={(e)=>{setHoverArgFoci("");e.stopPropagation()}}
            onMouseDown={(e)=>{toggleFoci(name); setHoverArgFoci(""); e.stopPropagation()}}
      >
      <a style={{fontWeight:"bold", color: color, 
                 fontSize:"1.5em", marginLeft:3, marginRight:5}}>
        {symbol}
      </a>
      <a style={{color:'grey'}}> {`  ${name}`}</a> 
      {hover && 
        <div style={{position: 'absolute', width: "100%", height: "100%",
                     display: "flex", justifyContent :"center", alignItems : "center"}}> 
          <div style={{width: 20, height: 20, borderRadius: 14,
                      top: -7, right: -6, backgroundColor: "rgba(100,100,120,.2)", color: "black",
                      fontSize:16, textAlign:"center", margin : 'auto'}}
          >
          {"✕"}
          </div>
        </div>
      }
    </div>
  )
}

function ArgsRow(){
  let {beginSetArgFoci, confirmArgFoci, extractArgFoci} = authorStore()
  let [skill_app, arg_foci_mode] = useAuthorStoreChange(
      [getFocusOrHover(), "@mode=='arg_foci'"],
  )
  let arg_items = []
  
  let {arg_foci, foci_explicit} = extractArgFoci(skill_app)
  if(arg_foci_mode && !foci_explicit){
    arg_foci = []
  }

  for (let [i,foci] of (arg_foci || []).entries()){
    let color = where_colors[i]
    if(!foci_explicit){
      color = Color(color).lighten(.25).hexa()
    }

    arg_items.push(<ArgBox key={`arg_${i}`}
        symbol={arg_symbols[i]} name={foci} color={color}/>
      )
  }

  let prompt = (arg_foci_mode && "Select arguments in interface. Click away to Exit." ) ||
                "Click here to begin selecting arguments."
  let prompt_weight = (arg_foci_mode && "bold") ||  "normal";

  let border_width = (arg_foci_mode && 3) || 1

  let font_size = (arg_foci_mode && 14) || 10
  let icon_size = (arg_foci_mode && 18) || 10


  const foci_mode_props = {
    default_scale : 1.08, default_elevation : 16,
    hover_scale : 1.02, hover_elevation : 8,
  }

  return (
    <div style={{...styles.value_group}}>
      <div style={styles.label}>{"Args"}</div>

      <RisingDiv 
        style={{
            ...styles.arg_area, 
            ...(arg_foci_mode && styles.arg_area_selected),
            borderWidth: border_width,
          }}
        onMouseDown={(e)=>{
          let {mode} = authorStore()
          let callback = (mode=="arg_foci" ? confirmArgFoci : beginSetArgFoci); 
          callback()
          }}
        {...(arg_foci_mode && foci_mode_props)}
        >
        <div style={{...styles.arg_prompt,
            fontWeight: prompt_weight,
            fontSize: font_size}}>
          <ArgFociPointer style={{
            width: icon_size, height: icon_size, 
            marginLeft: 2, marginRight: 4,
            ...(arg_foci_mode && {transform: "translate(0px,-2px)"})  
            }}/>
          <a>{prompt}</a>
        </div> 
        <div style={{
          ...styles.arg_container,
          ...(arg_foci_mode && {transform: "translate(0px,-3px)"})
          }}>
        {arg_items}
        </div>  
      </RisingDiv>  
      {/*
      <div style={styles.right_space}>
        <RisingDiv style={{
          ...styles.circle_button,
          zIndex : (arg_foci_mode && 2) || 1,
          flexDirection : 'column',
          ...(arg_foci_mode  && {backgroundColor : 'purple'})
        }}
        {...{...button_defaults_props,
         ...(arg_foci_mode && foci_mode_props)}}
         onMouseDown={(e)=>{let callback = (arg_foci_mode ? confirmArgFoci : beginSetArgFoci); callback()}}
        > 
          <img src={images.crosshair} style={{width:"75%",height:"75%"}} />          
          <div style={{...styles.circle_button_inner_message, 
                ...(arg_foci_mode && {backgroundColor: 'purple', color:'white'})
                }}>
             {(arg_foci_mode && "Confrim Args\n[Enter]") || "Select Args"}
          </div>
        </RisingDiv>
      </div>
      */}
    </div>
  )
}

function FxHelpRow(){
  let {startSpeechRecognition, setHowHelp, submitHowHelp} = authorStore()
  let [skill_app, arg_foci_mode, listening] = useAuthorStoreChange([
        getFocusOrHover(), "@mode=='arg_foci'", "@speech_recognition_listening"])


  const record_props = {
    default_scale : 1, default_elevation : 6,
    hover_scale : 1.05, hover_elevation : 10,
  }
  const recording_props = {
    default_scale : 1.25, default_elevation : 10,
    hover_scale : 1.2, hover_elevation : 6,
  }

  let has_help = !!skill_app?.how_help

  const [hasFocus, setHasFocus] = useState(false);
  let text_ref = useRef(null)

  return (
      <div style={styles.value_group}>
      <div style={styles.label}>{"ƒ Help"}</div>
      <textarea ref={text_ref}
                className="scrollable" 
                style={{
                  ...styles.editable_value,
                  height: 40,
                  whiteSpace: "pre-wrap",
                  ...(!has_help && !hasFocus && 
                      {fontSize: 12, color: "rgb(200,200,200)", fontWeight:'bold'})
                  }}
                onChange={(e)=>{setHowHelp(skill_app, e.target.value)}}
                onFocus={()=>{
                  setHasFocus(true)
                }}
                onBlur={()=>{
                  setHasFocus(false)
                  submitHowHelp()
                }}
                value={
                  skill_app?.how_help || 
                  (!hasFocus && "\nDescribe ƒ(𝑥) using language and/or equations.") ||
                  ""
                }
                onKeyDown={(e) => {
                  if(e.keyCode == 13 && e.shiftKey == false) {
                    e.preventDefault();
                    text_ref.current.blur()
                    // submitHowHelp();
                  }
                }}
              />
      <div style={styles.right_space}>
        <RisingDiv 
          style={{...styles.circle_button, 
                  ...(listening && {backgroundColor: 'purple', zIndex: 2})}}
          shadow_kind={'drop'}
          onClick={startSpeechRecognition}
          {...(listening && recording_props) || record_props}> 
          <img src={images.microphone} style={{width:"75%",height:"75%"}} />
          <div style={{...styles.circle_button_inner_message, 
                ...(listening && {backgroundColor: 'purple', color:'white'})
                }}>
             {(listening && "Recording...") || "Record Help"}
          </div>
        </RisingDiv> 
      </div>
    </div>
  )
}

const fxDropDownStyles = {
  control: (styles) => ({
   ...styles,
   backgroundColor: 'white',
   // margin: 6,

 }),
  option: (styles, { data, isDisabled, isFocused, isSelected }) => {
    // console.log("OPTION")
    return {
      ...styles,
      paddingRight : 8,
      // ...styles.submenu_item,
      color : 'black',
      border : "2px solid transparent",
      backgroundColor : 'white',
      ...(isFocused && {border : "2px solid dodgerblue",}),
      ...(isSelected && {backgroundColor : colors.menu_highlight_color}),
      ':active': {fontWeight: 'bold', backgroundColor : colors.menu_highlight_color},
    };
  },

  // input: (styles) => ({ ...styles}),
  // placeholder: (styles) => ({ ...styles}),
  // singleValue: (styles, { data }) => ({ ...styles}),
  indicatorSeparator: (styles) => ({display : 'none'}),
  dropdownIndicator: (styles) => ({...styles,padding : 4}),
  valueContainer: (styles) => ({...styles,paddingRight : 0, paddingLeft : 4}),
  menu : (styles) => ({...styles,paddingRight : 0}),
};

const makeHighlightedEquation = (func, values=null, use_values=false) => {
  let {minimal_str="??", vars=[]} = func  
  vars = vars.map(({alias})=>alias)

  let var_groups = vars.join("|")
  // let regex = new RegExp(`\d*(?<![a-zA-z])(${var_groups})\\b`, 'g')
  let regex = new RegExp(`(\d*|\\b)(${var_groups})\\b`, 'g')

  let vals_or_vars = (use_values && values) ||
                      vars.map((x)=>x.toUpperCase())
  // console.log(func, values)


  const textArray = minimal_str.split(regex);
  let output = []
  let i = 0;
  for (let str of textArray){
    if(str){
      let index = vars.indexOf(str)
      if(index != -1){
        output.push(
          <span 
            key={`${str}_${i}`}
            style={{color:  where_colors[index], fontWeight: 'bold'}}
          >{vals_or_vars[index]}</span>)
      }else{
        output.push(str)
      }
    }
    i++
  }
  return output
};

const FxOption = (props) =>{
  let {style, children, innerProps, isDisabled, isSelected, data, selectOption} = props
  let [hasHover, setHover] = useState(false)

  return (!isDisabled &&
    <div style={{
        ...styles.fx_option_container,
        ...(isSelected && styles.submenu_item_selected),
        ...(hasHover && styles.submenu_item_hover)
      }}
      onMouseDown={(e)=>{selectOption(data)}}
      onMouseEnter={(e)=>setHover(true)}
      onMouseLeave={(e)=>setHover(false)}
      >
      {children}
    </div> 
  )
}

const FxContent = ({ label, value, data={}, explicit,...rest}, {context}) => {
  // console.log("CONTENT ", label, data, rest)

  let {skills, focus_uid, skill_apps} = authorStore()
  let skill_app = skill_apps?.[focus_uid];
  let {func, skill_uid, uid, head_vals=null, matches=[]} = data;
  let skill = skills?.[skill_uid||uid||skill_app?.skill_uid];

  let selected_expl = skill_app?.explanation_selected
  explicit = explicit || (selected_expl?.explicit && selected_expl?.value == value) || false

  func = func || skill?.how?.func || {}

  let is_const = (func?.vars?.length == 0) ?? true

  let highlighted_eq = makeHighlightedEquation(func, head_vals, true)

  let button_action = skill_app?.action_type?.includes("Button") ?? false;
  if(button_action){
    highlighted_eq = "press"
  }

  let is_menu = context == "menu"
  let is_value = context == "value"
  
  let opacity = (!explicit && is_value && 0.7) || 1.0
  let dot_width = (is_menu && 22) || 12
  let dot_offset = (is_menu && 0) || -4


  return (
    <div style={styles.fx_option}>

      {/* Dot area */}
      {(is_menu || is_value) &&       
        <div style={{ display : "flex", alignSelf: "center", justifyContent: "center", color: "dodgerblue", fontSize : 20, width : dot_width}}>
            <a style={{position:'relative', left: dot_offset, fontSize:".45em"}}>
              {explicit ? "⬤" : "◯"}
            </a>
        </div>
      }

      {/* Equation */}
      <div style={{fontFamily : "Arial", color: "rbg(20,20,20)", fontSize: 20, opacity: opacity}}>
        {highlighted_eq}
      </div>
      
      {/* Constant */}
      <div style={{ marginLeft: "auto", color: "#ccc", fontSize : 12}}>
        {(is_const && 'constant') ||
          matches.join(", ")
        }
      </div>
    </div>
    )
};

const FxMenuList = (props) => {
  const { children, innerRef, innerProps } = props;
  return (
    <div
      className='scrollable'
      style={{maxHeight : 300, overflowY: "scroll"}}
      //{...getStyleProps(props, 'menu', { menu: true })}
      ref={innerRef}
      {...innerProps}
    >
      {children}
    </div>
  );
};

// export const getStyleProps = (props, name, classNamesState) => {
//   const { cx, getStyles, getClassNames, className } = props;
//   return {
//     css: getStyles(name, props),
//     className: cx(classNamesState ?? {}, getClassNames(name, props), className),
//   };
// };

let FxControl = (props) => {
  let {children, isDisabled, isFocused, innerRef, innerProps, menuIsOpen, getStyles} = props;
  let style = getStyles('control', props)

  let {clearExplanation} = authorStore()
  let [skill_app] = useAuthorStoreChange([getFocusOrHover()])

  let awaiting_expl = skill_app?.awaiting_explanation
  let is_explicit = skill_app?.explanation_selected?.explicit

  let n_s = skill_app?.explanation_options?.[0]?.options?.length ?? 0
  let n_f = skill_app?.explanation_options?.[1]?.options?.length ?? 0

  let {borderColor, borderStyle, borderWidth} = style
  let count_style = {
    position: 'absolute',
    backgroundColor : 'white',
    borderRadius : 8,
    padding : 1,
    paddingLeft : 6,
    paddingRight : 6,
    margin : 2,
    color : 'grey',
    userSelect : 'none',
    zIndex : 2,
    fontSize : 10,
    textAlign : 'center',
    ...{borderWidth,}
  }
  
  let count_text = (!n_s && !n_f && `${n_s} S,  ${n_f} F`) ||
                   (n_s && `${n_s} S`) ||
                   (n_f && `${n_f} F`) ||
                   "No Explanations"

  let [clearHover, setClearHover] = useState(false)
  return (
    <div style={{position: 'relative'}}> 
      {/* Clear Select Button*/}
      {is_explicit &&
        <div 
          style={{...count_style, bottom:-9, left:20, width: 60, ...(clearHover && {color : 'black', fontWeight: "bold"})}}
          onMouseDown={(e)=>{e.stopPropagation(); clearExplanation(skill_app); setClearHover(false)}}
          onMouseEnter={(e)=>setClearHover(true)}
          onMouseLeave={(e)=>setClearHover(false)}
        >
          {"clear select"}
        </div>
      }
      {/* Counters */}
      <div style={{...count_style, bottom:-9, right:28}}>
        {count_text}
      </div>

      {/* Content */}
      <div style={{...style, ...(awaiting_expl && {opacity: .6})}} ref={innerRef}
        {...innerProps}
      >
        {children}
      </div>

      {/* Load Spinner */}
      {awaiting_expl && 
        <div style={styles.expl_load_spinner}>
        <Oval {...styles.load_spinner_props}/>
        </div>
      }
      
    </div> 
  );
}

function FxRow(){
  let {beginSetArgFoci, confirmArgFoci, selectExplanation} = authorStore()
  let [skill_app, arg_foci_mode] = useAuthorStoreChange(
      [getFocusOrHover(), "@mode=='arg_foci'"],
  )
  // console.log(skill_app?.explanation_options)

  return (
    <div style={styles.value_group}>
      <div style={styles.label}>{`ƒ(𝑥)`}</div>
      <div style={{flex: 1}}>
        <Select 
          className="scrollable"
          styles={fxDropDownStyles}
          value={skill_app?.explanation_selected}
          options={skill_app?.explanation_options}
          formatOptionLabel={FxContent}
          onChange={(value, {action})=>{
            console.log(value, action)
            if(action == 'select-option'){
              selectExplanation(skill_app, value)
            }
          }}
          readOnly={true}
          menuPlacement={'top'}
          //menuIsOpen={true}
          components={{Option: FxOption, MenuList: FxMenuList, Control: FxControl}} 
        />
      </div>
      <div style={styles.right_space}/>
    </div>
  )
}

// -----------------------------------
// : Action / Demonstration Popups

function KeyIcon({style, key_style, side_style, text, children, shadow=0,...rest}){
  let borderRadius = style.borderRadius || 10
  let inner_content = (children ||
      <a style={{textAlign:"center", userSelect: 'none'}}>{text}</a>
  )
  return (<div style={{position:'relative', userSelect: 'none', ...style}} {...rest}>
    <div style={{position:'absolute', top: "12%", width: "100%", height:"88%",
                  borderRadius: borderRadius, backgroundColor:'lightgrey', borderWidth:2,
                  borderStyle: 'solid', borderColor: colors.default, 
                  ...(shadow && {boxShadow: gen_shadow(shadow)}),
                   ...side_style}}/>
    <div style={{position:'absolute', width: "100%", height:"88%",
                  display:'flex', alignItems: 'center', justifyContent:"center",
                  borderStyle: 'solid', borderColor: colors.default, 
                  borderRadius: borderRadius, backgroundColor:'white', borderWidth:2,
                    ...key_style}}>
      {inner_content}
    </div>
  </div>
  )
}


function NavigationKeys({show_yes=false, show_apply=true}){
  let [next_down, prev_down, apply_down, skill_apps] = 
    useAuthorStoreChange(["@next_down", "@prev_down", "@apply_down", "@skill_apps"])
  let {focusPrev, focusNext, confirmFeedback} = authorStore()

  let next_bg = (next_down && 'lightgrey') || "white" 
  let prev_bg = (prev_down && 'lightgrey') || "white" 
  let apply_bg = (apply_down && 'lightgrey') || "white" 

  let apply_prompt = (show_yes && <div style={{marginRight: 2}}>
                        <a style={{fontSize: "1.4em"}}>{"✔ "}</a>
                        <a style={{fontWeight: "bold"}}>{"Yes "}</a>
                      </div>) ||
                      <a style={{fontWeight: "bold"}}>{"Apply "}</a>
  
  let n_skill_apps = Object.values(skill_apps).length
  return (
    <div style={{position : 'absolute', width: "100%", height: "100%", pointerEvents: "none", zIndex: 9}}>
        {show_apply && 
          <RisingDiv style={{display:"flex", justifyContent:"center", userSelect: 'none',
                position: 'absolute', bottom: -26, width:"100%", color: '#445',
                pointerEvents:'auto'}}
              hover_scale={1.05}
              onMouseDown={()=>{setAuthorStore({apply_down:true}); confirmFeedback()}}
              onMouseUp={()=>{setAuthorStore({apply_down:false})}}
          >
            <KeyIcon 
                style={{marginTop:'auto', marginBottom: 4, alignSelf: 'center',
                        color: '#445', width: 180, height: 34, fontSize:14}}
                shadow={10}
                key_style={{backgroundColor: apply_bg}}
                children={<div style={{margin: 4, display: "flex", flexDirection: "row", alignItems:"center"}}>
                  {apply_prompt}
                  <img style={{width: 18, height:18, margin:4, filter: "invert(.3)"}} src={images.next}/>
                  <a>{" (Space Bar)"}</a>
                  </div>
                }
              />
          </RisingDiv>
        }
        {n_skill_apps > 1 && 
        <RisingDiv style={{position: 'absolute', bottom:60, left : -60, color: '#445', pointerEvents:'auto'}}
            hover_scale={1.1}
            onMouseDown={()=>{setAuthorStore({prev_down:true}); focusPrev()}}
            onMouseUp={()=>{setAuthorStore({prev_down:false})}}
          >
          <KeyIcon 
            style={{width: 42, height: 42, fontSize: 14}}
            shadow={10}
            key_style={{borderStyle: 'solid', borderColor: colors.default, backgroundColor: prev_bg}}
            children={<div style={{dispaly:'flex', flexDirection:'column', alignItems:'center'}}>
              <div><a style={{fontSize:"1.2em"}}>{"⬅"}</a><a style={{margin: 4}}>{"A"}</a></div>
              <div style={{fontSize:10, textAlign:'center'}}>{"prev"}</div>
            </div>}
          />
        </RisingDiv>
        }
        {n_skill_apps > 1 && 
        <RisingDiv style={{position: 'absolute', bottom:60, right : -54, color: '#445', pointerEvents:'auto'}}
            hover_scale={1.1}
            onMouseDown={()=>{setAuthorStore({next_down:true}); focusNext()}}
            onMouseUp={()=>{setAuthorStore({next_down:false})}}
          >
          <KeyIcon 
            style={{width: 42, height: 42}}
            shadow={10}
            key_style={{borderStyle: 'solid', borderColor: colors.default, backgroundColor: next_bg}}
            children={<div style={{dispaly:'flex', flexDirection:'column', alignItems:'center'}}>
                <div><a style={{margin: 4}}>{"D"}</a><a style={{fontSize:"1.2em"}}>{"➡"}</a></div>
                <div style={{fontSize:10, textAlign:'center'}}>{"next"}</div>
            </div>}
          />
        </RisingDiv>
        }
      </div>
  )
}


function ActionDialog({style}){
  let {getUIDIndex, applyActionDialogFeedback, setFocus, confirmFeedback} = authorStore()
  let [focus_uid, skill_apps, proposal_order] = useAuthorStoreChange(
      ["@focus_uid", "@skill_apps", "@proposal_order"]
  )
  let skill_app = skill_apps[focus_uid];
  let index = getUIDIndex(focus_uid)+1
  let L = Object.keys(skill_apps).length

  // let open_style = {top : -64, 
  //                height : 64,
  //                width: "102%", 
  //                left : "-1%",
  // }
  // let close_style = {top : -20, 
  //                    height : 20,
  //                    left : "-1%",
  // }

  let is_proposal = proposal_order.includes(focus_uid)
  let are_proposals = proposal_order.length > 0
  let are_correct_next = Object.values(skill_apps).filter((sa)=>(sa?.reward ?? 0) > 0).length > 0
  let is_correct = (skill_app?.reward ?? 0) > 0

  let pre_text = (!skill_app?.confirmed && skill_app?.is_demo && 
                  "Ensure f(x) explanation is correct. ") ||
                 (!skill_app?.confirmed && 
                  "Feedback looks good. ") ||
                  ""
  let context = (is_correct && "Apply this action ") || 
                ("Apply one of the correct actions ") 

  return (
    
    <div style={{...styles.action_dialog,
                  ...style}}>
      <div style={styles.action_counter}>
        {`Action #(${index}/${L})`}
      </div>
      {/* Proposal Yes / No case */}
      {(is_proposal && 
      <div style={styles.action_dialog_inner}>
        <div style={styles.action_dialog_back}/>
        <a>{"Is this action correct?"}</a>      
        <div style={{display: "flex", flexDirection : "row"}}>
          <RisingDiv style={{...styles.action_dialog_button, 
              marginRight:2, backgroundColor : colors.correct}} 
            onClick={()=>{applyActionDialogFeedback(1)}} >
            {"Yes"}
          </RisingDiv>
          <RisingDiv style={{...styles.action_dialog_button, 
              marginLeft:2, backgroundColor : colors.incorrect}} 
            onClick={()=>{applyActionDialogFeedback(-1)}}>
            {"No"}
          </RisingDiv>
        </div>
      </div>) || 
      /* Not a Proposal. "Show Me" case. */
      (proposal_order?.length && 
      <div style={styles.action_dialog_inner}>
        <div style={styles.action_dialog_back}/>
        <a>{"Some proposed actions need feedback."}</a>      
          <RisingDiv style={{...styles.action_dialog_button, 
                      backgroundColor : colors.demo}} 
            onClick={()=>{setFocus(proposal_order[0])}} >
            {"Show Me"}
          </RisingDiv>
      </div>) || 
      /* No remaining proposals. Apply case. */
      (are_correct_next && 
      <div style={styles.action_dialog_inner}>
        <div style={styles.action_dialog_back}/>
        <a>{pre_text+context+"to go to next state?"}</a>      
        <RisingDiv style={{...styles.action_dialog_button,   
                      backgroundColor : colors.demo}} 
          onClick={()=>{confirmFeedback()}} >
          {"Apply"}
        </RisingDiv>
      </div>) ||
      /* No remaining proposals. But no correct. */
      ( 
      <div style={styles.action_dialog_inner}>
        <div style={styles.action_dialog_back}/>
        <a>{"No staged actions are marked correct. If this is a valid state demonstrate a correct next action. "}</a>      
      </div>)
      }    
    </div>
  )
}

function DemonstrateMenu({}){
  let {setMode, addSkillApp, removeSkillApp, setInputs} = authorStore()
  let [skill_app, arg_foci_mode] = useAuthorStoreChange([
        getFocusOrHover(), "@mode=='arg_foci'"])

  let reward = skill_app?.reward ?? 0
  let demo_text = skill_app?.inputs?.value ?? skill_app?.input ?? ""
  // console.log(demo_text)
  let kind = "demo" + ((reward > 0) ? "_correct" : "_incorrect") + (skill_app?.only ? "_only" : "")
  // console.log("KIND", kind)
  let button_action = skill_app.action_type.includes("Button");
  if(button_action){
    demo_text = "press " + (skill_app?.selection ?? "??")
  }
  let allow_edit = !button_action

  let border_color = (reward > 0 && colors.demo) ||
                     (reward <= 0 && colors.incorrect) ||
                     colors.default


  return (
    <div style={{...styles.demo_menu, borderColor: border_color}}>
      <ActionDialog />
      <div style={styles.demo_menu_fields}>
        
        <div style={styles.demo_menu_title}>
          <Icon size={styles.demo_menu_title.fontSize} kind={kind}
                />
          <a style={{marginLeft: 12, fontWeight: "bold"}}>{"Demonstration"}</a>
        </div>
        <div style={styles.value_group}>
          <div style={styles.label}>{"Value"}</div>
          <textarea 
            className="scrollable" style={{
              ...styles.editable_value, ...styles.value_input,
              ...(!allow_edit && {color: "rgba(100,100,100,.3)", userSelect : "none"})
              }}
            value={demo_text}
            onChange={(e)=>{setInputs(skill_app, {value : e.target.value})}}
            readOnly={!allow_edit}

          />
          <div style={styles.right_space}/>

        </div>
        {!button_action && <FxRow/>}
        {!button_action && <ArgsRow/>}
        {!button_action && <FxHelpRow/>}
      </div>
      <NavigationKeys/>
    </div>
  )
}

function RewardKeys({skill_app}){
    let [pos_rew_down, neg_rew_down, setReward] = 
      useAuthorStoreChange(["@pos_rew_down", "@neg_rew_down", "setReward"])
    
    let corr = (skill_app?.reward ?? 0) > 0
    let incorr = (skill_app?.reward ?? 0) < 0

    let pos_bg = (pos_rew_down && 'lightgrey') || "white"
    let neg_bg = (neg_rew_down && 'lightgrey') || "white" 

    let pos_bord_c = (corr && colors.correct) || colors.default
    let neg_bord_c = (incorr && colors.incorrect) || colors.default

    let pos_bord_w = (corr && 3) || 2
    let neg_bord_w = (incorr && 3) || 2

    return (
      <div style={{display: 'flex', flexDirection : "column", margin: 10, alignItems: "end", zIndex: 10}}>
        <RisingDiv style={{position: 'relative', margin: 6, color: '#445'}}
          hover_scale={1.1}
          onMouseDown={()=>{setAuthorStore({pos_rew_down:true});}}
          onMouseUp={()=>{setAuthorStore({pos_rew_down:false}); 
                          setReward(skill_app, corr ? 0 : 1)}
                    }
          >
          <KeyIcon 
            style={{width: 42, height: 42, fontSize: 14}}
            shadow={10}
            key_style={{backgroundColor: pos_bg, borderColor: pos_bord_c, borderWidth: pos_bord_w}}
            children={(<div style={{dispaly:'flex', flexDirection:'column', alignItems:'center'}}>
              <div><a style={{fontSize:"1.2em", margin: 2}}>{"⬆"}</a><a style={{margin: 4}}>{"W"}</a></div>
              <div style={{marginTop: -2, fontSize: "1.1em", textAlign:'center',
                color: colors.correct}}>{'✔'}</div>
            </div>)}
          />
        </RisingDiv>
        <RisingDiv style={{position: 'relative', margin: 6, color: '#445'}}
          hover_scale={1.1}
          onMouseDown={()=>{setAuthorStore({neg_rew_down:true})}}
          onMouseUp={()=>{setAuthorStore({neg_rew_down:false}); 
                          setReward(skill_app, incorr ? 0 : -1)}
                    }
          >
          <KeyIcon 
            style={{width: 42, height: 42}}
            shadow={10}
            key_style={{backgroundColor: neg_bg, borderColor: neg_bord_c, borderWidth: neg_bord_w}}
            children={(<div style={{dispaly:'flex', flexDirection:'column', alignItems:'center'}}>
                <div><a style={{fontSize:"1.2em", margin: 2}}>{"⬇"}</a><a style={{margin: 4}}>{"S"}</a></div>
                <div style={{marginRight: 2, marginTop: -2, fontSize: "1.1em", textAlign:'center',
                  color: colors.incorrect}}>{'✖'}</div>
            </div>)}
          />
        </RisingDiv>
      </div>
    ) 
}

function AgentActionMenu({}){
  let [skill_app] = useAuthorStoreChange([getFocusOrHover()])

  let reward = skill_app?.reward ?? 0
  let border_color = (reward > 0 && colors.correct) ||
                     (reward < 0 && colors.incorrect) ||
                     colors.default

  let kind = 'undef'
  if((skill_app?.reward ?? 0) != 0){
    kind = ((skill_app.reward > 0) ? "correct" : "incorrect") + (skill_app?.only ? "_only" : "")
  }



  return (
    <div style={{...styles.agent_action_menu, borderColor: border_color}}>
      <ActionDialog />
      <div style={styles.agent_action_menu_fields}>
        <div style={styles.agent_action_menu_title}>
          <Icon size={styles.agent_action_menu_title.fontSize} kind={kind}/>
          <a style={{marginLeft: 12, fontWeight: "bold"}}>{"Agent Action"}</a>
        </div>
        <div style={styles.value_group}>
          <div style={styles.label}>{`ƒ(𝑥)`}</div>
          <FxContent
            data={skill_app}
          />
          <div style={styles.right_space}/>
        </div>
        <RewardKeys skill_app={skill_app}/>
      </div>
      <NavigationKeys 
        show_yes={kind == 'undef'}
        show_apply={kind != "incorrect"}/>
    </div>
  )
}


function Tab({name}){
  let [selected, setCurrentTab] = useAuthorStoreChange(
      [`@current_tab==${name}`, "setCurrentTab"]
  )
  // console.log(name, selected)
  let [hasHover, setHover] = useState(false)
  return (
    <div style={{
      ...styles.tab, 
      ...((selected  && styles.tab_selected) || (hasHover && styles.tab_hover))
      }}
      onClick={(e)=>{setCurrentTab(name); e.stopPropagation();}}
      onMouseEnter={(e)=>setHover(true)}
      onMouseLeave={(e)=>setHover(false)}
    >
      {name.charAt(0).toUpperCase() + name.slice(1)}
    </div>)
}


function focusIsDemo(){
  return [(s)=>{
    let skill_app = s.skill_apps?.[s.focus_uid];
    return skill_app?.is_demo ?? false
  },
  (o,n) =>{
    return o == n
  }
  ]
}

function focusIsConfirmed(){
  return [(s)=>{
    let skill_app = s.skill_apps?.[s.focus_uid];
    return skill_app?.is_confirmed ?? false
  },
  (o,n) =>{
    return o == n
  }
  ]
}

function focusExplanationExplicit(){
  return [(s)=>{
    let skill_app = s.skill_apps?.[s.focus_uid];
    return skill_app?.explanation_selected?.explicit ?? false
  },
  (o,n) =>{
    return o == n
  }
  ]
}

function QuestionSubMenuItem({id, selected, children, onClick, is_editing, show_buttons, style}){
  let {removeQuestion, beginEditingQuestionMenu} = authorStore()
  let [hasHover, setHover] = useState(false)
  let ref = useRef(null)
  // let [selected, setSelected] = useState(false)
  let button_props = {
    default_scale : 1,
    default_elevation : 3,
    hover_scale : 1.05,
    hover_elevation : 6  
  }
  // console.log("QSM", is_editing)
  show_buttons = show_buttons != null ? show_buttons : selected

  return (<div  style={{
            ...styles.submenu_item,
            ...(hasHover && styles.submenu_item_hover),
            ...(selected && styles.submenu_item_selected),
            ...style,
            }}
            onClick={(e)=>{onClick(e)}}
            onMouseEnter={(e)=>setHover(true)}
            onMouseLeave={(e)=>setHover(false)}
            ref={ref}
          >
          {/*left margin*/}
          <div style={{height : 20, width : 30}}/>
          
          {children}
          {show_buttons && <div style={styles.submenu_item_buttons_area}>
            <RisingDiv 
              style={{...styles.submenu_item_button, ...(is_editing && {backgroundColor: colors.start_state})}}
              
              onClick={() => beginEditingQuestionMenu(!is_editing)}
              {...button_props}
            >
              <a >{"edit"}</a>
              <img src={images.edit} style={{marginBottom:2, width:"70%",height:"70%"}}/>
            </RisingDiv>
            <RisingDiv style={{...styles.submenu_item_button
              }}
              onClick={(e)=>{e.stopPropagation(); removeQuestion(id);}}
              {...button_props}
            >
              <a >{"remove"}</a>
              <a style={{fontSize:14}}>{"✕"}</a>
            </RisingDiv>
          </div>
          }
          </div>)
}



function SubMenuItem({id, selected, children, onClick, is_editing, style}){
  let {removeQuestion} = authorStore()
  let [hasHover, setHover] = useState(false)
  let ref = useRef(null)
  // let [selected, setSelected] = useState(false)
  return (<div  style={{
            ...styles.submenu_item,
            ...(hasHover && styles.submenu_item_hover),
            ...(selected && styles.submenu_item_selected),
            ...style,
            }}
            onClick={(e)=>{
              if(onClick){onClick(e)}
            }}
            onMouseEnter={(e)=>setHover(true)}
            onMouseLeave={(e)=>setHover(false)}
            ref={ref}
          >
          <div style={{height : 20, width : 30}}/>
          
          {children}
          {(selected && 
            <RisingDiv style={{...styles.menu_button, 
                fontSize: 14, fontWeight:'bold', borderWidth: 1, borderColor: 'lightgrey',
                height : 20, width : 20, marginLeft: 'auto', borderRadius: 20,
              }}
              default_elevation={4}
              hover_elevation={6}
              onClick={(e)=>{
                e.stopPropagation()
                removeQuestion(id); 
              }}
            >
              {"✕"}
            </RisingDiv>)
          }
          </div>)
}

function MenuButton({onClick, style, children}){
    // let [hasHover, setHover] = useState(false)
  return (
    <RisingDiv style={{...styles.menu_button,...style}}
         onClick={onClick}
         hover_scale={1.15}
         hover_elevation={4}
         default_elevation={0}
         //onMouseEnter={active && ((e)=>setHover(true)) || null}
         //onMouseLeave={active && ((e)=>setHover(false))|| null}
    >{children}</RisingDiv> 
  )
}

function ProblemMenu({}){
  let [mode, curr_interface, curr_question, interfaces, questions, is_editing] = useAuthorStoreChange(
    ['@mode','@curr_interface', '@curr_question', '@interfaces', '@questions', '@editing_question_menu'])

  let {beginSetStartState, confirmStartState,
      setInterface, setQuestion, beginEditingQuestionMenu} = authorStore()

  // console.log(curr_interface)
  let question_items = {...questions?.[curr_interface] || {}}
  
  // console.log(curr_interface, curr_question)
  // console.log(Object.keys(interfaces))

  let is_new = !is_editing && mode == "start_state"

  if(is_new){
    question_items["__start_state__"] = {"name" : "... setting start state ...", in_progress : true}
    curr_question = "__start_state__"
  }
  
  // interfaces = ['Interface 1']
  // question_items = ['question 1','question 2', 'question 3', 'question 4', 'question 5', 'question 6','question 7', 'question 8', 'question 9', 'question 10']
  // let [intr, setInterface] = useState("")
  // let [question, setQuestion] = useState("")
  return (
    <div style={{...styles.problem_menu, overflow: "hidden"}}>

      {/* Interface Menu */}
      <div style={{... styles.submenu}}>
        <div style={styles.submenu_title_area}>
          <header style={styles.submenu_title}>Interface</header>
          <MenuButton>
            <a style={{marginBottom:2}}>{'+'}</a>
          </MenuButton>
        </div>
        <div className='scrollable' style={styles.submenu_content}>
          {interfaces && Object.keys(interfaces).map((intr_name)=>(
            <SubMenuItem
              onClick={(e)=>setInterface(intr_name)}
              selected={intr_name===curr_interface}
              key={"question:"+intr_name}
            >
            <a style={{alignSelf: "center"}}>{intr_name}</a>
            </SubMenuItem>)
          )}
        </div>
      </div>

      {/* Question Menu */}
      <div style={{... styles.submenu, overflow: "hidden"}}> 

        {/* Question Menu - Title Area */}
        <div style={styles.submenu_title_area}>
          <header style={styles.submenu_title}>{"Question"}</header>
          <div style={styles.menu_button_area}>
            
            <MenuButton 
              style={{flex: 1,
                flexDirection : "row",
                width : 'auto',
                height : 'auto',
                ...(is_new && styles.plus_button_start_active)
                }}
              onClick={(e) => {is_new ? confirmStartState() : beginSetStartState()}}
            >
              <a style={{margin:4, width: 40, textAlign: "center", fontWeight : 'bold', fontSize: 10}}>{'New Question'}</a>
              <a style={{margin:2}}>{'+'}</a>
            </MenuButton>
            
          </div>
        </div>

        {/* Question Menu - Options */}
        <div className='scrollable' style={styles.submenu_content}>
          {question_items && Object.entries(question_items).map(([x,{name, in_progress}])=>(
            <QuestionSubMenuItem
              onClick={(e)=>{
                console.log(e.target)
                setQuestion(x)

              }}
              style={{...(in_progress && {"backgroundColor" : colors.start_state})}}
              selected={x===curr_question}
              is_editing={is_editing}
              id={x}
              key={"question:"+x}
              {...(in_progress && {show_buttons : false})}

            >
              <a style={{alignSelf: "center"}}>{(name || x)}</a>
            </QuestionSubMenuItem>)
          )}
        </div>
      </div>
    </div>
  )
}

const menus = {
  // demonstrate : DemonstrateMenu,
  // skills : SkillsMenu,
  problem : ProblemMenu
}

function MultiMenu({style}){
  let [is_demo, current_tab, setCurrentTab] = useAuthorStoreChange(
      [focusIsDemo(), "@current_tab", "setCurrentTab"]
  )
  // if(current_tab == "demonstrate" && !is_demo){
    // current_tab = 'other'
    // setCurrentTab("other")
  // }
  let menu_class = menus[current_tab] || UnimplementedMenu
  console.log("current_tab", current_tab)
  let menu = React.createElement(menu_class, {name: current_tab})

  return (
    <div style={styles.multimenu}>
      <div style={styles.tab_row}>
        {/*(is_demo && 
          <Tab name={"demonstrate"}/>) || (

          )*/
        }
        <Tab name={"problem"}/>
      </div>
      {menu}
      <div style={styles.stopper} /> 
    </div>
  )
}

function ContinueButton() {
  let [input_focus, confirmStartState] = useAuthorStoreChange(["@input_focus", "confirmStartState"])
  let no_input_focus = !input_focus
  console.log("input_focus", input_focus, )
  return (
    <RisingDiv 
      style={styles.start_confirm_button}
      {...{scale : 1, elevation : 4,
           ...button_defaults_props,
           ...(no_input_focus && {scale : 1.1, elevation : 10})
      }}
      onClick={(e)=>{confirmStartState()}}
    >
      <a>{"Confirm"}</a><a>{"Start State"}</a>
      <div style={styles.start_confirm_button_inner_message}>
        {"Press Enter"}
      </div>
    </RisingDiv>
  )
}

function ArgFociPointer({style, use_text=false, use_indicator=false}){
  let {getFociIndexInfo} = authorStore();
  // let [skill_app] = useAuthorStoreChange(["@skill_app"])

  let indicator;
  if(use_indicator){
    let [[foci_index, foci_explicit, foci_hover],
       focus_uid, foci_mode, skill_apps, 
       any_hover, any_sym_hover] = useAuthorStoreChange(
      [getFociIndexInfo(),
       `@focus_uid`,  "@mode=='arg_foci'", "@skill_apps", 
       "@hover_sel!=''", "@hover_arg_foci!=''",]
    )
    // let skill_app = skill_apps?.[focus_uid]
    // console.log("foci_index", foci_index, skill_app)
    // if(foci_index == -1){
    //   foci_index = skill_app?.arg_foci.length
    // }
    // let var_name = arg_symbols?.[foci_index];
    // let foci_color = where_colors[foci_index % where_colors.length]

    // indicator = (
    //   <div style={{position: 'absolute', top:16, left:16,
    //                borderRadius : 8, padding: 2, fontSize: 12,
    //                fontWeight : "bold",
    //                backgroundColor: foci_color, color: "white"}}>
    //     {`+${var_name}`}
    //   </div>
    // )
    indicator = (!(any_sym_hover || any_hover) && 
      <div style={{position: 'absolute', top:14, left:14,
                   borderRadius : 8, padding: 2, fontSize: 14,
                   fontWeight : "bold", color: "rgba(50,50,70,.2)"}}>
        {`⟲`}
      </div>
    )

  }
  
  return(
    <div style={style}>
      <svg viewBox="-13,-13 26,26">
        <rect x="-3" y="-12" width="6" height="10" rx="2" 
            strokeWidth="1" stroke="white" fill="white"/>
        <rect x="-3" y="2" width="6" height="10" rx="2" 
            strokeWidth="1" stroke="white" fill="white"/>
        <rect x="-12" y="-3" width="10" height="6" rx="2" 
            strokeWidth="1" stroke="white" fill="white"/>
        <rect x="2" y="-3" width="10" height="6" rx="2" 
            strokeWidth="1" stroke="white" fill="white"/>
        <rect x="-2" y="-11" width="4" height="8" rx="1" 
            strokeWidth="1" stroke="#333" fill="#ff884d" />
        <rect x="-2" y="3" width="4" height="8" rx="1" 
            strokeWidth="1" stroke="#333" fill="#feb201" />
        <rect x="-11" y="-2" width="8" height="4" rx="1" 
            strokeWidth="1" stroke="#333" fill="#e44161" />
        <rect x="3" y="-2" width="8" height="4" rx="1" 
            strokeWidth="1" stroke="#333" fill="#42bfcf" />
      </svg>
      {indicator}
      {use_text && 
        <a style={{position: 'absolute', top:18,left:20, fontSize:8, width: 40}}>{"select args"}</a>
      }
    </div>
  )

}

function SmallKeyIcon({text}){
  return <KeyIcon 
            style={{display: "inline-block", color: "#333", width: 18, height: 18, fontSize: 12, marginLeft: 2, marginRight: 7, 
                    transform : "translate(0,-2px)"}}
            shadow={10}
            key_style={{backgroundColor: "white", borderColor: "grey", borderWidth: 2, borderRadius:4}}
            side_style={{borderRadius:4}}
            children={<div style={{fontWeight : "bold"}}>{text}</div>}
          />
}

function SmallSpaceBar(){
  return <KeyIcon 
            style={{display: "inline-block", color: "#333", width: 40, height: 18, fontSize: 12, marginLeft: 5, marginRight: 7, 
                    transform : "translate(0,-2px)"}}
            shadow={10}
            key_style={{backgroundColor: "white", borderColor: "grey", borderWidth: 2, borderRadius:4}}
            side_style={{borderRadius:4}}
            children={<div style={{fontWeight : "bold"}}>{"space"}</div>}
          />
}

function ControlsLine(){
  return (<div style={styles.prompt_line}>          
          <a>{"Navigate actions with "}</a>
          <SmallKeyIcon text={"A"}/>
          <a>{" / "}</a>
          <SmallKeyIcon text={"⬅"}/>
          <a>{" + "}</a>
          <SmallKeyIcon text={"D"}/>
          <a>{" / "}</a>
          <SmallKeyIcon text={"➡"}/>
          <a>{"and apply "}</a>
          {<img style={{top:4, width: 18, height:18, transform: "translateY(20%)", filter: "invert(1)"}} src={images.next}/>}
          <a>{" with "}</a>
          <SmallSpaceBar/>
          <a>{"."}</a>
        </div>
      )
}

function Prompt(){
  let {focus_uid} = authorStore()
  let [skill_app, is_demo, is_confirmed, fx_explicit, 
       any_focus, skill_apps, mode, in_done_state] = useAuthorStoreChange([
      `@skill_apps[${focus_uid}]`, focusIsDemo(), focusIsConfirmed(), focusExplanationExplicit(), 
      "@focus_uid!=''", "@skill_apps", "@mode", "@in_done_state"
  ])
  let no_skill_apps = Object.keys(skill_apps).length == 0
  console.log("FX SEL", is_demo, is_confirmed, fx_explicit, skill_apps, no_skill_apps)
  let correct = (skill_app?.reward ?? 0) > 0
  let incorrect = (skill_app?.reward ?? 0) < 0
  let undef = (skill_app?.reward ?? 0) == 0

  let prompt = null
  if(in_done_state){
    prompt = (
      <div style={{...styles.prompt}}>
        <div style={styles.prompt_line}>
          <a>{"You have entered the done state."}</a>
        </div>
      </div>
    )  
  }else if(mode == "start_state"){
    prompt = (
      <div style={{...styles.prompt}}>
        <div style={styles.prompt_line}>
          <a>{"Fill in a start state for this problem."}</a>
        </div>
      </div>
    )  
  }else if(mode == "arg_foci"){
    prompt = (
      <div style={{...styles.prompt}}>
        <div style={styles.prompt_line}>
          <ArgFociPointer style={{width: 24, height: 24, marginRight: 10}}/>
          <a>{"Click interface elements to select any arguments you used to compute this value."}</a>
        </div>
      </div>
    )
  }else if(no_skill_apps){
    prompt = (
      <div style={{...styles.prompt}}>
        <div style={styles.prompt_line}>
          <Icon style={{fontSize: 24, marginRight: 8, filter: "drop-shadow(0px 0px 2px rgb(200,200,200))" }} kind={"demo"}/>
          <a>{"Demonstrate the next step for this question."}</a>
        </div>
      </div>
    )
  }else if(is_demo && !is_confirmed && !fx_explicit){
    prompt = (
      <div style={{...styles.prompt}}>
        <div style={styles.prompt_line}>
           <Icon style={{display: "inline-block", fontSize:24,marginRight: 8, filter: "drop-shadow(0px 0px 2px rgb(200,200,200))"}} kind={"demo"}/>
           <a>{"Double-check ƒ(𝑥). Select the correct ƒ explanation or describe ƒ(𝑥) in 'ƒ Help' to reduce the options."}</a>
        </div>
        <ControlsLine/>
      </div>
    )
  }else if(is_demo && fx_explicit){
    prompt = (
      <div style={{...styles.prompt}}>
        <div style={styles.prompt_line}>
           <Icon style={{fontSize:24,marginRight: 8, filter: "drop-shadow(0px 0px 2px rgb(200,200,200))"}} kind={"demo"}/>
           {<a>{"Apply "}</a>}
           {<img style={{top:4, width: 18, height:18, transform: "translateY(20%)", filter: "invert(1)"}} src={images.next}/>}
           {<a>{" to begin the next step."}</a>}
        </div>
      </div>
    )
  }else if(!is_demo && undef){
    prompt = (
      <div style={{...styles.prompt}}>
        <div style={styles.prompt_line}>          
          <a>{"Mark "}</a>
          <Icon style={{fontSize:24, filter: "drop-shadow(0px 0px 2px rgb(200,200,200))"}} kind={"undef"}/>
          <a>{" proposed actions as "}</a>
          <Icon style={{fontSize:24, filter: "drop-shadow(0px 0px 2px rgb(200,200,200))"}} kind={"correct"}/>
          <a>{"correct "}</a>
          <SmallKeyIcon text={"W"}/>
          <a>{" / "}</a>
          <SmallKeyIcon text={"⬆"}/>
          <a>{" or "}</a>
          <Icon style={{fontSize:24, filter: "drop-shadow(0px 0px 2px rgb(200,200,200))"}} kind={"incorrect"}/>
          <a>{" incorrect "}</a>        
          <SmallKeyIcon text={"S"}/>
          <a>{" / "}</a>
          <SmallKeyIcon text={"⬇"}/>
          <a>{"."}</a>
        </div>
        <ControlsLine/>
      </div>
    )
  }


  return prompt
}

function Cursor() {
  let {setStageCursorElem} = authorStore()
  let [cursor] = useAuthorStoreChange(['@stage_cursor'])

  // let cursor_ref = useRef(null)

  // useEffect(()=>{
  //   setStageCursorRef(cursor_ref)
  // },[])

  let ptr;
  let prompt;
  if(cursor == 'arg_foci'){
    ptr = <ArgFociPointer use_text={false} use_indicator={true} style={{
      width : 24, height :24, transform: 'translate(-50%, -50%)', pointerEvents: "none"}}/>
  }
  console.log("RENDER CURSOR", cursor, ptr)
  return (<div style={{position:'absolute', pointerEvents: "none", zIndex:100}} 
            ref={setStageCursorElem}>
            {ptr}
            {prompt}
          </div>)
}

function PopupLayer({children}) {
  let {focus_uid} = authorStore()
  let [is_demo, any_focus, mode] = useAuthorStoreChange([focusIsDemo(), "@focus_uid!=''", "@mode"])
  
  // console.log("any_focus", any_focus, focus_uid)
  return (
    <div style={{...styles.popup_layer}}>

      {(mode==="start_state" &&
        <ContinueButton/>) ||
       // (mode==="arg_foci" &&
       //  <ContinueButton/>) ||
        
        (is_demo &&
          <DemonstrateMenu/>) ||
        (any_focus && 
          <AgentActionMenu/>
        )
      }
      <Prompt/> 
    </div>
  )
}



//<select style={styles.agent_select} name="agents" id="agents">
//          {Object.entries(agents).map( ([key, info]) => (
//            console.log("MAPPP",key, info ) ||
//            <option value="key">
//              <div>
//              {info?.name || "Unnamed"}
//              </div>
//              <div style={{fontColor: "lightgrey", leftMargin:'auto'}}>
//                {key.slice(3,8)}
//              </div>
//            </option>
//            ))
//          }
//          <option value="Agent A">{"Agent A"}</option>
//          <option value="Agent B">{"Agent B"}</option>
//          <option value="Agent C">{"Agent C"}</option>
//        </select>



const agentDropDownStyles = {
  control: (styles) => ({
   ...styles,
   backgroundColor: 'white',
   margin: 6
 }),
  option: (styles, { data, isDisabled, isFocused, isSelected }) => {
    console.log()
    return {
      ...styles,
      paddingRight : 8,
      // ...styles.submenu_item,
      color : 'black',
      border : "2px solid transparent",
      backgroundColor : 'white',
      ...(isFocused && {border : "2px solid dodgerblue",}),
      ...(isSelected && {backgroundColor : colors.menu_highlight_color}),
      ':active': {fontWeight: 'bold', backgroundColor : colors.menu_highlight_color},
    };
  },
  input: (styles) => ({ ...styles}),
  placeholder: (styles) => ({ ...styles}),
  singleValue: (styles, { data }) => ({ ...styles}),
  indicatorSeparator: (styles, { data }) => ({display : 'none'}),
  dropdownIndicator: (styles, { data }) => ({...styles,padding : 4}),
  valueContainer: (styles, { data }) => ({...styles,paddingRight : 0}),
};

const agentFormatOptionLabel = ({ value, label, uid }, {context}) => (
  console.log("REST", context) || 
  <div style={{ display: "flex", flexDirection : 'row', alignItems: 'end', paddingRight: 2}}>
    <div>{label}</div>
    {context == 'menu' && 
      <div style={{ marginLeft: "auto", color: "#ccc", fontSize : 10, fontFamily : 'monospace'}}>
        {uid}
      </div>
    }
  </div>
);

function AgentArea(){
  let [agents, awaiting_agent] = useAuthorStoreChange(
      [[(s)=>s.agents, (o,n) => shallowEqual(o, n)], "@awaiting_agent"]
  )
  console.log("AGENT AREA", JSON.stringify(agents))

  let options = Object.entries(agents).map( ([key, info]) => (
    {value : key, label: info.name || "Unnamed",  uid:  key.slice(3,8)}
  ))

  const defaultOption = options[0];

  

  return(
    <div style={{...styles.submenu, ...styles.agent_area}}>
      <div style={styles.submenu_title_area}>
          <header style={styles.submenu_title}>Agent</header>
          <div style={styles.agent_load_spinner}>
            {awaiting_agent && 
              <Oval {...{...styles.load_spinner_props, width: 16, height: 16}}/>
            }
          </div>
      </div>
      <div style={{...styles.submenu_content, overflow : "visible"}}>
          <Select 
            styles={agentDropDownStyles}
            options={options}
            value={defaultOption}
            placeholder="Select an option" 
            formatOptionLabel={agentFormatOptionLabel}
            readOnly={true} 
          />
      </div>
    </div>
  )
}

function SkillArea(){
  let [skills] = useAuthorStoreChange(["@skills"])

  let skill_items = []
  console.log("SKILLS", skills)

  for (let [uid, skill] of Object.entries(skills)){
    // console.log(uid, skill)
    skill_items.push(
      <SubMenuItem
        selected={false}
        key={uid}
      >
        <FxContent data={{skill_uid : uid}} /> 
      </SubMenuItem>  
    )
  }

  
  console.log("SKILL ITEMS", skill_items)

  


  return(
  <div style={{...styles.submenu, ...styles.skills_area}}>
      <div style={styles.submenu_title_area}>
          <header style={styles.submenu_title}>Skills</header>
      </div>
      <div className='scrollable' style={styles.submenu_content}>
      
        {skill_items}
      </div>
    </div>
  )
}



function ConfirmButton() {
  let {confirmStartState, confirmFeedback} = authorStore()
  return (
    <RisingDiv 
      style={styles.confirm_button}
      {...{default_scale : 1, default_elevation : 8}}
      {...{hover_scale : 1.05, hover_elevation : 12}}
      onClick={() => confirmFeedback(false,true)}
    >
      {"Confirm"}
      {false && 
      <div style={styles.confirm_button_inner_message}
        >
        {"Press Enter"}
      </div>
      }
    </RisingDiv>
  )
}

function GenCompletenessButton() {
  let {genCompletenessProfile} = authorStore()
  return (
    <RisingDiv 
      style={{...styles.eval_completeness_button,left:10}}
      {...{default_scale : 1, default_elevation : 8}}
      {...{hover_scale : 1.05, hover_elevation : 12}}
      onClick={genCompletenessProfile}
    >
      {"Gen Completeness"}
    </RisingDiv>
  )
}

function EvalCompletenessButton() {
  let {evalCompleteness, completeness_profile='ground_truth.txt'} = authorStore()
  return (
    <RisingDiv 
      style={{...styles.eval_completeness_button,right:10}}
      {...{default_scale : 1, default_elevation : 8}}
      {...{hover_scale : 1.05, hover_elevation : 12}}
      onClick={()=>evalCompleteness(completeness_profile)}
    >
      {"Eval Completeness"}
    </RisingDiv>
  )
}

function StagedFeedbackArea(){
  return(
  <div style={{...styles.submenu, ...styles.stage_feedback_area}}>
      <div style={styles.submenu_title_area}>
          <header style={styles.submenu_title}>{"Total Feedback"}</header>
      </div>
      <div style={{
          ...styles.submenu_content, 
          ...styles.staged_feedback_submenu
          }}>
        <div style={styles.feedback_counters_area}> 
          <FeedbackCounters 
            
            counter_style={{
              fontSize : 18,
              borderWidth: 2,
              // padding: 2,
              paddingTop: 2,
              paddingBottom: 2,
              paddingRight: 6,
              paddingLeft: 6
            }}
            count_text_style={{minWidth: 16}}
          />
        </div>
        
      </div>
      <div style={styles.bottom_buttons_area}>
          {/*<ConfirmButton/>   
          <GenCompletenessButton/>*/}
          <EvalCompletenessButton/>
      </div>
    </div>
  )
}

export default function AuthoringInterface({props}) {

  let [training_config, training_file, tutor_class, network_layer] = useALTrainStoreChange(
    ['@training_config','@training_file', '@tutor_class', 'network_layer'])
  let [transaction_count, large_window, study_index] = useAuthorStoreChange(["@transaction_count", "@window_size=='large'", "@study_index"])
  let {addSkillApp, removeSkillApp,  setSkillApps, setStaged, onKeyDown, onKeyUp, setCenterContentRef,
      incTransactionCount, setConfig, setTutor, resizeWindow, clearProject, required_problems} = authorStore()

  let Tutor = tutor_class

  console.log("RENDER AUTHOR", transaction_count, tutor_class, network_layer)
    
  const stage_ref = useRef(null)
  const center_content_ref = useRef(null)

  // OnMount
  let cursor;
  useEffect(() =>{
    setCenterContentRef(center_content_ref)
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    window.addEventListener("resize", resizeWindow);
    ({stage_cursor_elem: cursor} = authorStore())
    return function cleanup() {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      window.removeEventListener("resize", resizeWindow);
    }
  }, [])

  let state = state || test_state

  let fallback_page = (<div style={styles.tutor}>Loading...</div>)

  
  // const ref = useRef(null)

  let sw = window.screen.width
  let sh = window.screen.height*1.5;

  console.log("SCREEN", window)

  // Proportion of stage width, height tutor should get
  let tv_pw = .5
  let tv_ph = .7

  let graph_style = {width: large_window ? 650 : 450 , flex : 50}

  // const navigate = useNavigate();
  // const handleOnClick = () => 

  return (
      <div style={styles.authoring}
        //onKeyDown={(e)=>{console.log(e.target);;}}
        //Necessary for key presses to be registered
        //tabIndex="-1"
        //ref={ref}
      >
        <div style={styles.header}>
          <div style={{display : "flex" , flexDirection: "column"}}>
            <div style={{color: "white", fontSize: 10, margin : 4}}>{"Do not click these until directed"}</div>
            <div style={{display : "flex" , flexDirection: "row"}}>
              <RisingDiv style={{...styles.header_button,
                  ...(study_index==1 && styles.header_button_selected)}}
                  path='/privacy-policy' onClick={() => {
                  clearProject()
                  location.replace('http://ai2t.online/build/index.html?training=/author_mc.json&agent_url=http://ai2t.online/agent')
                  return null;
              }}>
              1
              </RisingDiv>

              <RisingDiv style={{...styles.header_button,
                  ...(study_index==2 && styles.header_button_selected)}}
                  path='/privacy-policy' onClick={() => {
                  clearProject()
                  location.replace('http://ai2t.online/build/index.html?training=/author_fractions.json&agent_url=http://ai2t.online/agent')
                  return null;
              }}>
              2
              </RisingDiv>

              <RisingDiv style={{...styles.header_button,
                  ...(study_index==3 && styles.header_button_selected)}}
                  path='/privacy-policy' onClick={() => {
                  clearProject()
                  location.replace('http://ai2t.site/build/index.html?training=/author_algebra.json&agent_url=http://ai2t.site/agent')
                  return null;
              }}>
              3
              </RisingDiv>

          {/*<a target='_blank' style={styles.header_button}
            rel='noopener noreferrer' href="https://ai2t.site/build/index.html?training=/author_mc.json&agent_url=http://ai2t.site:8001">1</a>
          }*/}
            </div>
          </div>  
        </div>

        <div style={styles.main_content}>

          {/* Left Tools */}
          <div style={styles.left_tools}>
            <Profiler id="Graph" onRender={(id,phase,actualDuration)=>{
              console.log("actualDuration", actualDuration)
            }}>
              <Graph style={graph_style}/>
            </Profiler>
            <MultiMenu/>
            
          </div>

          {/* Center Stage */}
          <div 
            style={styles.center_content}
            ref={center_content_ref}
            onMouseMove={(e)=>{
              let cs = cursor?.style
              if(!cs){
                //NOTE: This presumably fixes a hard to reproduce issue
                //  where the select args cursor doesn't follow the mouse.
                ({stage_cursor_elem: cursor} = authorStore())  
                cs = cursor?.style
              }
              if(cs){cs.left = `${e.pageX}px`; cs.top =  `${e.pageY}px`}
            }}
            //onMouseLeave={(e) => {
              // let {stage_cursor_elem: cursor} = authorStore()
            //  if(cursor) cursor.hidden = true;
            //}}
            //onMouseEnter={(e) => {
            //  // let {stage_cursor_elem: cursor} = authorStore()
            //  if(cursor) cursor.hidden = false;
            //}}
          > 
            <ScrollableStage ref={stage_ref} 
              stage_style={{
                left:window.screen.width*.3,
                top:window.screen.height*.3,
                width:window.screen.width*.8,
                height:window.screen.height*1.4,
              }}>
              <Suspense fallback={fallback_page}>        
                <Tutor style={{...styles.tutor, width: sw*tv_pw, height:sh*tv_ph}}
                  ref={setTutor}
                />
              </Suspense>
              <StateOverlayLayer parentRef={stage_ref} 
               style={{...styles.overlay_layer,   zIndex: 1}}/>
              {/*<SkillAppCardLayer parentRef={stage_ref} 
                style={{...styles.overlay_layer,   zIndex: 2, "backgroundColor": 'pink'}}/>*/}
            </ScrollableStage>
            <PopupLayer style={styles.popup_layer}/>
          </div>

          {/* Right Side Tools */}
          <div style={styles.right_tools}> 
            <AgentArea/>
            <SkillArea/>

            {required_problems && 
              <div style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
                <a style={{fontWeight: "bold", margin: 4}}>Target Problems</a>
                <div style={{display: "flex", flexDirection: "column"}}>
                {required_problems.map((prob, index) =>(
                  <a key={index} style={{margin: 4}}>{`${index+1}. ${prob}`}</a>
                ))}
                </div>
                <a style={{fontWeight: "bold", margin: 4}}>
                  {"...Then come up with new problems until you think the AI can solve any 3-digit by 3-digit problem"}
                </a>
              </div>
            }
            <StagedFeedbackArea/>
            <div style={styles.stopper}/>
          </div>
        </div>
        <Cursor/>  
      </div>
  );
}

// const highlight_color = 'rgb(229,244,255)'


const styles = {
  header :{
    display: "flex",
    flexDirection : "row",
    height : 50,
    backgroundColor : "rgb(50,50,50)"
  },

  header_button_selected :{
    backgroundColor : "rgb(200,200,240)"
  },
  header_button :{
    display: "flex",
    justifyContent : "center",
    alignItems : "center",
    margin : 10, 
    marginTop : 2, 
    width : 26,
    height : 26,
    borderRadius : 20,
    userSelect : "none",
    backgroundColor : "rgb(150,150,150)"
  },

  authoring: {
    height : "100%",
    display:'flex',
    flexDirection: 'column',
    overflow : "hidden",
  },
  
  main_content :{
    display:'flex',
    flex: 1,
    flexDirection: 'row',
    overflow : "hidden",
    // height : "100%"
  },
  multimenu :{
    boxShadow: "1px 1px 3px rgba(0,0,0,1)",
    backgroundColor: "white",//'rgba(80,80,120,.1)',
    borderRadius: 5, left:0,
    height : "50%", width: "100%",
    userSelect: 'none',
    flex: 50,
    display : 'flex',
    flexDirection : 'column',
  },
  
  tab: {
    fontFamily : "Arial",
    fontSize: 18,
    color : 'grey',
    margin: 8,
  },
  tab_selected: {
    color : 'black',
    fontWeight: "bold",
  },
  tab_hover: {
    color : 'black',
  },
  problem_menu: {
    display : 'flex',
    flexDirection : 'column',
    //height:"85%",
    flex: "1 1 auto",
    // marginBottom : 5,
    // minHeight: 0,
    // maxHeight: "100%",
  },
  stopper : {
    height : 10,
  },

  submenu : {
    display : 'flex',
    flexDirection : 'column',
    // minHeight: 0,
    // maxHeight: "100%",

    border: '0px solid',
    borderBottomWidth: 1,
    borderColor: 'lightgrey',
    paddingBottom: 8,
    // backgroundColor: 'red',
  },
  submenu_content : {
    display : 'flex',
    flexDirection : 'column',

    // minHeight: 0,
    // maxHeight: "100%",
    // height: "80%",
    width : "100%",
    overflowY : 'scroll',
    
  },
  submenu_title_area : {
    position: 'relative',
    display : 'flex',
    flexDirection : 'row',
    justifyContent : 'space-between',
    alignItems : 'end',
    padding: 8,
    paddingLeft: 20,
  },
  submenu_title : {
    display : 'flex',
    flexDirection : 'column',
    justifyContent : 'center',
    alignItems : 'center',
    fontFamily : "Arial",
    fontSize : 16,    
    fontWeight: "bold",
    // backgroundColor : 'red'
  },
  menu_button_area : {
    display : 'flex',
    flexDirection : 'row',
    height : 26,
  },
  menu_button : {
    display : 'flex',
    flexDirection : 'column',
    justifyContent : 'center',
    alignItems : 'center',
    width : 25,
    height : 25,
    fontSize : 26,
    marginLeft : 6,
    borderRadius : 100,
    backgroundColor : 'transparent'
  },
  // plus_button_hover :{
  //   fontWeight : "bold"
  //   // backgroundColor : highlight_color
  // },
  plus_button_start_active:{
    backgroundColor: colors.start_state,
    color:'darkgrey',
    border : "1px solid",
    borderColor : 'rgb(100,200,200)'
  },

  submenu_item : {
    position : 'relative',
    display : 'flex',
    flexDirection : 'row',

    border: "2px solid transparent",
    // borderLeftWidth: 0,
    // borderColor: 'rgba(0,0,0,0.0)',
    fontFamily : "Arial",
    fontSize : 16,
    padding: 6
    // padding: "6px 6px 6px 32px",
  },
  submenu_item_hover : {
    border: "2px solid dodgerblue",
    // borderColor: 'dodgerblue',
  },
  submenu_item_selected : {
    backgroundColor : colors.menu_highlight
  },

  submenu_item_buttons_area : {
    // position: 'absolute',
    display: 'flex',
    flexDirection :'row',
    alignItems : 'center',
    justifyContent : 'end',
    marginLeft : 'auto',
    right: 0,
    // top:-4, 
    // zIndex:5,
  },

  submenu_item_button : {
    display : 'flex',
    flexDirection : 'column',
    justifyContent : 'center',
    alignItems : 'center',

    fontSize: 10,
    // width : 24,
    height : 24,
    margin: -4,
    marginRight: 6,
    marginLeft: 6,
    borderRadius : 5,
    backgroundColor : 'transparent',
    borderWidth : 1,
    padding: 4,
    paddingBottom: 2,
    paddingTop: 2,

    
    fontWeight:'bold',
  },
  // legacy_tab : {
  //   height: 20,
  //   fontSize: 20,
  //   padding: 10,
  //   backgroundColor: 'rgba(245,245,245,1)',
  //   // backgroundColor: 'white',
  //   userSelect: "none",
  //   borderRadius : 5,
  //   margin : 2,
  // },
  tab_row : {
    display:"flex",
    flexDirection:"row",
    // margin : 4,
    paddingTop : 4,
    paddingLeft : 12,
    // backgroundColor : 'darkgrey',
    border: '0px solid',
    borderBottomWidth: 1,
    borderColor: 'lightgrey',
    flex : "0 1 auto",
  },
  // button_area: {
  //   height: "100%",
  //   display : 'flex',
  //   flexDirection : 'column',
  //   paddingTop: 72,
  // },
  
  



  

  left_tools: {
    // Fixed Width
    display:'flex',
    // flex: "1 0 450px",
    flexDirection: 'column',
    // marginBottom: 4,
    // flex : 0,
    // backgroundColor : '#eeeedc',
    // width:350,
    // height:"100%",
    zIndex: 4,
  },

  center_content : {
    display : "flex",
    flexDirection: 'column',
    // width : "100%",
    // height : "100%",
    overflow : "hidden",
  },

  right_tools: {
    // Fixed Width
    flex: "0 0 200px",
    display:'flex',
    flexDirection: 'column',
    // flex : 0,
    // backgroundColor : '#eeeedc',
    // width:350,
    userSelect: 'none',
    // height:"100%",
    zIndex: 4,
  },

  
  // graph: {
  //   large_width: 650,
  //   medium_width: 450,
  //   small_width: 350,
  //   height:"50%"
  // },

  // stage_view : {
  //   overflow : "scroll",
  //   backgroundColor : 'rgb(230,230,230)',
  //   width : "100%",
  //   height : "100%",
  //   userSelect:"none",
  // },
  

  tutor : {
    pointerEvents:"none",
    zIndex: 0,
    width : "100%",
    height : "100%"
  },
  tutor_stage : {
    width: "100%",
    height : "100%",
    top : "30%",
    left : "30%",
    // marginTop : "30%",
    // marginLeft : "30%",
    marginRight : "60%",
    marginBottom : "60%",
  },
  overlay_layer : {
    position : "absolute",
    margin : 0,
    left: 0,
    top: 0,
  },
  prompt : {
    display : "flex",
    flexDirection: 'column',
    justifyContent : "start",
    alignItems : "center",
    position: "absolute",
    padding : 10,
    paddingRight : 14,
    paddingLeft : 14,
    fontSize : 18,
    color : 'white',
    backgroundColor : 'rgb(110,110,116)',
    border : 'solid 3px darkgrey',
    borderRadius : 20,
    top : 68
  },
  prompt_line : {
    display: "flex",
    // flexDirection : "row",
    flex: 1,
    whiteSpace: "pre-wrap",
    textAlign : "center",
    marginTop : 2,
    marginBottom : 1,
  },

  popup_layer:{
    display : "flex",
    flexDirection: 'column',
    justifyContent : "end",
    alignItems : "center",
    position: "absolute",
    zIndex : 4,
    margin: 0,
    left: 350,
    right: 200,
    top: 0,
    bottom: 0,
    pointerEvents: "none"
  },

  start_confirm_button : {
    display : "flex",
    flexDirection: 'column',
    justifyContent : "center",
    alignItems : "center",
    textAlign : 'center',
    fontWeight : 'bold',
    color: 'rgb(20,20,20)',
    fontSize: 18,
    width : 140,
    height : 54,
    border : "2px solid",
    borderRadius : 100,
    backgroundColor : colors.start_state,
    borderColor : 'rgb(100,200,200)',
    marginBottom : 60,
    pointerEvents: "auto",
    userSelect: 'none',
  },

  start_confirm_button_inner_message : {
    position : "absolute",
    fontSize: 10,
    borderRadius : 10,
    width : 60,
    padding : 3.5,
    color: 'white',
    textAlign : 'center',
    backgroundColor : 'rgb(100,200,200)',
    bottom: -26,
  },

  demo_menu :{
    position : 'relative',
    display : 'flex',
    flexDirection : 'row',
    minWidth: "42%",
    maxWidth:"90%",
    minHeight:"30%",
    maxHeight:"40%",
    alignItems: 'center', 
    
    marginBottom : 30,
    backgroundColor : 'white',
    border: '4px solid',
    borderColor: colors.demo,
    borderRadius: 10,
    pointerEvents: "auto",
    boxShadow : gen_shadow(14),

    // Make not in center
    // alignSelf: 'start', 
  },

  demo_menu_fields :{
    display : 'flex',
    flexDirection : 'column',
    // minWidth: 0,
    // maxWidth: "100%",
    // backgroundColor : 'green',
    // alignItems: 'center', 
    width:"100%",
    height:"100%",
    // margin: 6,
  },

  demo_menu_title :{
    display : 'flex',
    flexDirection : 'row',
    fontFamily : "Arial",
    fontSize : 20,
    alignItems : 'center',
    // width : "100%",
    // fontWeight : "bold",
    // margin : 10,
    padding: 6,
    paddingLeft : 12,
    // left : 0,
    // backgroundColor  : 'red',
    border: '0px solid',
    borderBottomWidth: 1,
    borderColor: 'lightgrey',
    // backgroundColor : 'blue',
  },

  agent_action_menu :{
    position : 'relative',
    display : 'flex',
    flexDirection : 'row',
    minWidth: "40%",
    maxWidth: "90%",
    height:"24%",
    // maxHeight:"30%",
    alignItems: 'center', 
    
    marginBottom : 30,
    backgroundColor : 'white',
    border: '4px solid',
    borderColor: colors.default,
    borderRadius: 10,
    pointerEvents: "auto",
    boxShadow : gen_shadow(14),

    // Make not in center
    // alignSelf: 'start', 
  },

  agent_action_menu_fields :{
    display : 'flex',
    flexDirection : 'column',
    // minWidth: 0,
    // maxWidth: "100%",
    // backgroundColor : 'green',
    // alignItems: 'center', 
    width:"100%",
    height:"100%",
    // margin: 6,
  },

  agent_action_menu_title :{
    display : 'flex',
    flexDirection : 'row',
    fontFamily : "Arial",
    fontSize : 20,
    alignItems : 'center',
    // width : "100%",
    // fontWeight : "bold",
    // margin : 10,
    padding: 6,
    paddingLeft : 12,
    // left : 0,
    // backgroundColor  : 'red',
    border: '0px solid',
    borderBottomWidth: 1,
    borderColor: 'lightgrey',
    // backgroundColor : 'blue',
  },

  action_counter : {
    fontSize: 12, 
    fontFamily: 'monospace',
     color : "eef",// "#445",
    fontWeight : 'bold',
     borderRadius : 5,
     padding: 3,
     paddingRight: 6,
     paddingLeft: 6
  },

  action_dialog : {
    position : "absolute",
    top : -68, 
    height : 68,
    width: "102%", 
    left : "-1%",
    borderRadius : 5,
    backgroundColor : 'rgba(200,200,220,.4)',
    userSelect : "none",
    fontWeight: "bold"
  },

  action_dialog_back: {
    margin : 10,
    width : 20, 
    height : 20
  },
  action_dialog_inner: {
    display : "flex", 
    justifyContent : "space-between",
    alignItems : "center"
  },

  action_dialog_button : {
    display : "flex",
    alignItems : "center",
    justifyContent: "center",
    width : 80,
    height : 30,
    margin: 10,
    marginTop: 4, 
    borderRadius: 8, 
    fontSize: 16,
     fontWeight: "bold",
  },


  value_group : {
    flexDirection : 'row',
    display:"flex",
    justifyContent : 'stretch',
    alignItems : 'stretch',
    // padding : 2,
    margin : 8,
    // width : "100%",
    // flexWrap: "wrap",
    // backgroundColor : 'red',
  },

  value_input : {
    height : 36,
    // minHeight : 20,
    // maxHeight : 34,
  },

  label : {
    fontSize : 20,
    // fontFamily : "Arial",
    padding : 4,
    // margin : 4,
    marginLeft : 14,
    userSelect: "none",
    width : 84,
    // fontWeight : 'bold'
    // backgroundColor : 'red',
  },

  editable_value : {
    flex : "1 0 90px",
    minWidth : 0,
    // marginRight : 50,

    fontSize : 20,
    fontFamily : "Arial",
    backgroundColor: 'white',
    textAlign: "center",
    textJustify: "center",
    color: 'black',
    resize: "none",
    
    lineHeight : "1em",
    // height : 20,
    padding : 4,

    borderRadius : 4,
    border : "1px solid",
    borderColor : "lightgrey",
  },

  right_space : {
    width : 50,
    // minWidth : 64,
    // maxWidth : 70,
    height : 34,
    marginLeft : "auto",
    // backgroundColor :'yellow',
  },

  arg_area : {
    flex : 1,
    display : 'flex',
    flexDirection : 'column',
    padding : 2,
    height : 36,
    borderStyle : 'solid',
    borderWidth : 1,
    borderColor : 'lightgrey',
    marginRight : 8,
    paddingBottom: 8,

    
    // maxWidth : "80%",
    // minWidth : "40%",
    // backgroundColor : 'red',
    borderRadius : 5,
  },

  arg_area_selected : {
    borderColor : "#668",
    marginRight : 14,
    // borderColor : where_colors[0],
    // borderRightColor : where_colors[1],
    // borderBottomColor : where_colors[2],
    // borderLeftColor : where_colors[3],
  },

  arg_prompt : {
    flex : 1,
    display : 'flex',
    flexDirection : 'row',
    fontSize : 10,
    color : "grey",
    userSelect : 'none',
  },

  arg_container : {
    flex : 1,
    display : 'flex',
    flexDirection : 'row',
  },

  arg_item : {
    display : "flex",
    position : 'relative',
    alignItems : "center",
    margin: 2,
    padding: 0,
    paddingLeft: 1,
    paddingRight: 4,
    fontSize: 12,


    // backgroundColor : '#EEE',
    // backgroundColor : 'grey',
    border : "2px solid",
    borderColor : "darkgrey",
    borderRadius : 4,
    

  },

  circle_button_inner_message : {
    position : "absolute",
    fontFamily : "Arial",
    backgroundColor : "rgba(200,200,205,1)",
    color : "rgba(60,60,70,1)",
    userSelect: "none",
    fontSize:  9,
    borderRadius : 10,
    width : 54,
    padding : 2,
    // color: 'white',
    textAlign : 'center',
    // backgroundColor : 'purple',
    top: 26,

  },

  circle_button : {
    // alignSelf : 'end',
    position : 'relative',

    display : 'flex',
    alignItems:'center',
    justifyContent:'center',
    backgroundColor : 'rgba(200,200,205,1)',
    // right : 0,
    marginLeft : 16,
    
    width : 34,
    height : 34,
    borderRadius : 100,
  },

  /** Agent Area **/

  agent_area : {
    // maxHeight : "10%",
    minHeight : "10%",
    marginTop : 4,
    overflow : 'visible',
  },

  agent_select: {
    // height : 20,
    flex : 1,
    margin : 8,
    padding : 4,
    borderRadius : 5,
    borderColor : 'lightgrey',
    backgroundColor : 'white',
  },

  /** Skills Area **/

  skills_area : {
    maxHeight : "20%",
    marginTop : 4,
  },

  /** Staged Feedback Area **/

  stage_feedback_area : {
    height : "20%",
    marginTop : "auto",
    borderColor : "auto",
    // border: '0px solid',
    borderTopWidth: 2,
    borderColor: 'lightgrey',
  },

  staged_feedback_submenu : {
    height : "20%",
    width : "100%",
    overflow : 'hidden',
    alignItems : "stretch",
    // padding : 8,
  },

  feedback_counters_area :{
    display : 'flex',
    flexDirection : 'row',
    flex : "0 0 28px",
    // height : 30,
    // border: '0px solid',
    // borderBottomWidth: 1,
    // borderColor: 'lightgrey',
    alignItems : 'center',
    backgroundColor : 'rgb(242,242,242)',
    marginLeft:  8,
    marginRight:  8,
    borderRadius : 10,
    padding : 3,
  },

  bottom_buttons_area :{
    // position : 'relative',
    display: "flex",
    flexDirection : 'column',
    justifyContent:  "end",
    alignItems:  "end",
    flex : 1,
  },

  confirm_button :{
    // position : 'relative',
    display : "flex",
    flexDirection: 'column',
    justifyContent : "center",
    alignItems : "center",
    fontSize: 24,
    width : 120,
    height : 60,
    // border : "2px solid",
    borderRadius : 20,
    backgroundColor : 'lightgrey',
    // borderColor : 'lightgrey',
    marginBottom : 60,
    pointerEvents: "auto",
    userSelect: 'none',
    marginTop : 30
  },

  eval_completeness_button :{
    // position : 'absolute',
    display : "flex",
    flexDirection: 'column',
    justifyContent : "center",
    alignItems : "center",
    textAlign : "center",
    fontSize: 10,
    width : 80,
    height : 30,
    bottom : 2,
    // border : "2px solid",
    borderRadius : 20,
    backgroundColor : 'lightgrey',
    // borderColor : 'lightgrey',
    // marginBottom : 2,
    pointerEvents: "auto",
    userSelect: 'none',
    // marginTop : 30
  },

  confirm_button_inner_message : {
    position : "absolute",
    fontSize: 14,
    borderRadius : 10,
    width : 80,
    padding : 3.5,
    color: 'white',
    textAlign : 'center',
    backgroundColor : 'grey',
    bottom: -20,
  },

  fx_option_container : {
    border: "2px solid transparent",
  },

  fx_option : {
    // display : 'block',
    flex : 1,
    display : 'flex',
    flexDirection : 'row',
    alignItems : 'end',
    

    padding : 3,
    userSelect : "none",
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  agent_load_spinner: {
    position:'absolute', 
    left: 70, 
    top:6
  },
  expl_load_spinner: {
    position:'absolute', 
    left: -30, 
    top:6
  },
  load_spinner_props : {
    height : 22,
    width : 22, 
    color : "#4fa94d",
    secondaryColor : "#4fa94d",
    strokeWidth : 5,
    strokeWidthSecondary : 5
  }




}



/* Project File
{
  interfaces : [
  
  ],
  questions : {
    <interface-name> : [
      {<question-hash> : {name:"", ....}} 
    ...]
  },
  agents : {
    <agent-id> : {
      "name" : null,
      ...
    }
  },
  selected_interface : "",
  selected_question : ""
}
*/
