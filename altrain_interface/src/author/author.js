import React, { Component, createRef, useState, useEffect, useRef, Profiler, Suspense, memo } from 'react'
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
import {authorStore, useAuthorStore, useAuthorStoreChange, test_state, test_skill_applications} from "./author_store.js"
// import MyZustandTest from "./change_store_test.js"
import {shallowEqual, baseFile, gen_shadow} from "../utils.js"
import CTATTutorWrapper from "../tutorwrappers/ctat"
import {colors, where_colors} from "./themes.js"



const images = {
  left_arrow: require('/src/img/arrow-left-bold.png'),
  crosshair: require('/src/img/crosshairs.png'),
  microphone: require('/src/img/microphone.png'),
  pencil: require('/src/img/pencil.png'),
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


function getDemoSkillApp(){
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


function ArgsRow(){
  let {beginSetArgFoci, confirmArgFoci, extractArgFoci} = authorStore()
  let [skill_app, arg_foci_mode] = useAuthorStoreChange(
      [getDemoSkillApp(), "@mode=='arg_foci'"],
  )
  let arg_items = []
  
  let {arg_foci, foci_explicit} = extractArgFoci(skill_app)
  if(arg_foci_mode && !foci_explicit){
    arg_foci = []
  }

  for (let [i,foci] of (arg_foci || []).entries()){
    let color = where_colors[i]
    if(!foci_explicit){
      color = Color(color).lighten(.35).hexa()
    }

    arg_items.push(
      <div style={{...styles.arg_item, borderColor: color}} key={`arg${i}`}>
        <a style={{fontWeight:"bold", color: color, fontSize:"1.1em", marginLeft:3, marginRight:7}}>
          {arg_symbols[i]}
        </a>
        <a style={{color:'grey'}}> {`  ${foci}`}</a> 
      </div>)
  }

  const foci_mode_props = {
    default_scale : 1.25, default_elevation : 12,
    hover_scale : 1.2, hover_elevation : 8,
  }

  return (
    <div style={styles.value_group}>
      <div style={styles.label}>{"Args"}</div>
      <div style={styles.arg_container}>
        {arg_items}
      </div>  
      <div style={styles.right_space}>
        <RisingDiv style={{
          ...styles.circle_button,
          flexDirection : 'column',
          ...(arg_foci_mode  && {backgroundColor : 'purple'})
        }}
        {...{...button_defaults_props,
         ...(arg_foci_mode && foci_mode_props)}}
         onMouseDown={(e)=>{let callback = (arg_foci_mode ? confirmArgFoci : beginSetArgFoci); callback()}}
        > 
          <img src={images.crosshair} style={{width:"75%",height:"75%"}} />
          {arg_foci_mode && 
          <div style={styles.foci_button_inner_message}>
            {"Press Enter"}
          </div>
          }
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
  valueContainer: (styles) => ({...styles,paddingRight : 0}),
  menu : (styles) => ({...styles,paddingRight : 0}),
};

const highlightVars = (text, vars) => {
  let var_groups = vars.join("|")
  let regex = new RegExp(`\d*(?<![a-zA-z])(${var_groups})\\b`, 'g')

  const textArray = text.split(regex);
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
          >{str.toUpperCase()}</span>)
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

const FxFormatOptionLabel = ({ label, data={} }, {context}) => {
  let {skills} = authorStore()

  let {func, skill_uid, uid, matches=[]} = data
  func = func || skills?.[skill_uid||uid]?.how?.func || {}
  let {minimal_str="??", vars=[]} = func
  

  let is_const = (vars?.length == 0) ?? true

  let highlighted_eq = highlightVars(minimal_str, vars.map(({alias})=>alias))
  
  return (
    <div style={styles.fx_option}>
      <div style={{fontFamily : "Arial", color: "rbg(20,20,20)", fontSize: 20}}>
        {highlighted_eq}
      </div>
      
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

function FxRow(){
  let {beginSetArgFoci, confirmArgFoci, selectExplanation} = authorStore()
  let [skill_app, arg_foci_mode] = useAuthorStoreChange(
      [getDemoSkillApp(), "@mode=='arg_foci'"],
  )
  console.log(skill_app?.explanation_options)

  return (
    <div style={styles.value_group}>
      <div style={styles.label}>{`ƒ(𝑥)`}</div>
      <div style={{flex: 1}}>
        <Select 
          className="scrollable"
          styles={fxDropDownStyles}
          value={skill_app?.explanation_selected}
          options={skill_app?.explanation_options}
          formatOptionLabel={FxFormatOptionLabel}
          onChange={(value, {action})=>{
            console.log(value, action)
            if(action == 'select-option'){
              selectExplanation(skill_app, value)
            }
          }}
          readOnly={true}
          menuPlacement={'top'}
          //menuIsOpen={true}
          components={{Option: FxOption, MenuList: FxMenuList}} 
        />
      </div>
      <div style={styles.right_space}/>
    </div>
  )
}

const arg_symbols = ["A","B","C","D","E","F","G","H","I","J"]

function DemonstrateMenu({}){
  let [skill_app, arg_foci_mode, setMode, addSkillApp, removeSkillApp, setInput, setFocus] = useAuthorStoreChange(
      [getDemoSkillApp(), "@mode=='arg_foci'", "setMode", "addSkillApp", "removeSkillApp", "setInput", "setFocus"],
  )

  let demo_text = skill_app?.inputs?.value ?? skill_app?.input ?? ""
  // console.log(demo_text)
  let kind = "demo" + ((skill_app.reward > 0) ? "_correct" : "_incorrect") + (skill_app?.only ? "_only" : "")
  // console.log("KIND", kind)

  return (
    <div style={styles.demonstrate_menu}>
      <div style={styles.demonstrate_menu_fields}>
        
        <div style={styles.demonstrate_menu_title}>
          <Icon size={styles.demonstrate_menu_title.fontSize} kind={kind}
                />
          <a style={{marginLeft: 12, fontWeight: "bold"}}>{"Demonstration"}</a>
        </div>
        <div style={styles.value_group}>
          <div style={styles.label}>{"Value"}</div>
          <textarea 
            className="scrollable" style={{...styles.editable_value, height : 34}}
            value={demo_text}
            onChange={(e)=>{setInput(skill_app, e.target.value)}}
          />
          <div style={styles.right_space}/>

        </div>
        <FxRow/>
        <ArgsRow/>
        <div style={styles.value_group}>
          <div style={styles.label}>{"ƒ Hint"}</div>
          <textarea className="scrollable" 
                    style={styles.editable_value}
                    onChange={()=>{}}
                    value={"this is the value"}/>
          <div style={styles.right_space}>
            <RisingDiv style={styles.circle_button} {...button_defaults_props}> 
              <img src={images.microphone} style={{width:"75%",height:"75%"}} />
            </RisingDiv> 
          </div>
        </div>
        {/*
        <div style={styles.value_group}>
          <div style={styles.label}>{"Skill Label"}</div>
          <textarea className="scrollable" style={styles.editable_value}
                    value={"this is the value"}/>
          <div style={styles.right_space}/>
        </div>
        */}
      </div>
    </div>
  )
}

function AgentActionMenu({}){
  let [skill_app] = useAuthorStoreChange([getDemoSkillApp()])

  let reward = skill_app?.reward ?? 0
  let border_color = (reward > 0 && colors.correct_color) ||
                     (reward < 0 && colors.incorrect_color) ||
                     colors.default_color

  let kind = 'undef'
  if((skill_app?.reward ?? 0) != 0){
    kind = ((skill_app.reward > 0) ? "correct" : "incorrect") + (skill_app?.only ? "_only" : "")
  }


  return (
  <div style={{...styles.agent_action_menu, borderColor: border_color}}>
      <div style={styles.agent_action_menu_fields}>
        <div style={styles.agent_action_menu_title}>
          <Icon size={styles.agent_action_menu_title.fontSize} kind={kind}
                />
          <a style={{marginLeft: 12, fontWeight: "bold"}}>{"Agent Action"}</a>
        </div>
        <div style={styles.value_group}>
          <div style={styles.label}>{`ƒ(𝑥)`}</div>
          <FxFormatOptionLabel
            data={skill_app}
          />
          <div style={styles.right_space}/>
        </div>
      </div>
    </div>
  )
}




// function LegacyTab({name}){
//   let [selected, setCurrentTab] = useAuthorStoreChange(
//       [`@current_tab==${name}`, "setCurrentTab"]
//   )
//   console.log(name, selected)
//   let [hasHover, setHover] = useState(false)
//   return (
//     <RisingDiv style={{
//       ...styles.tab, 
//       // ...(hasHover && {opacity : .7}),
//       ...((selected  && styles.tab_selected) || (hasHover && styles.tab_hover))
//       }}
//       scale={(hasHover && 1.05) || 1}
//       elevation={(hasHover && 6) || 4}
//       onClick={(e)=>{setCurrentTab(name); e.stopPropagation();}}
//       onMouseEnter={(e)=>setHover(true)}
//       onMouseLeave={(e)=>setHover(false)}
//     >
//       {name.charAt(0).toUpperCase() + name.slice(1)}
//     </RisingDiv>)
// }

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
    let skill_app = s.skill_apps?.[s.focus_uid]
    return skill_app?.is_demo ?? false
  },
  (o,n) =>{
    return o == n
  }
  ]
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
              onClick(e)
            }}
            onMouseEnter={(e)=>setHover(true)}
            onMouseLeave={(e)=>setHover(false)}
            ref={ref}
          >
          {(is_editing && 
            <RisingDiv style={{...styles.menu_button,
                height : 20, width : 20, marginLeft: 4, marginRight: 6, borderRadius: 0,
              }}
              default_elevation={0}
              hover_elevation={0}
              onClick={(e)=>{removeQuestion(id); e.stopPropagation()}}
            ><img src={images.bar} style={{width:16,height:12}}/>
            </RisingDiv>) ||
            <div style={{height : 20, width : 30}}/>
          }
          <a>{children}</a>
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

  let {beginSetStartState, confirmStartState, setQuestion, beginEditingQuestionMenu} = authorStore()

  console.log(curr_interface)
  let question_items = {...questions?.[curr_interface] || {}}
  
  console.log(curr_interface, curr_question)
  console.log(interfaces.map((x)=>baseFile(x)))

  let is_new = !is_editing && mode == "start_state"

  if(is_new){
    question_items["__start_state__"] = {"name" : "Set Start State...", in_progress : true}
    curr_question = "__start_state__"
  }
  
  // interfaces = ['Interface 1']
  // question_items = ['question 1','question 2', 'question 3', 'question 4', 'question 5', 'question 6','question 7', 'question 8', 'question 9', 'question 10']
  // let [intr, setInterface] = useState("")
  // let [question, setQuestion] = useState("")
  return (
    <div style={styles.problem_menu}>

      {/* Interface Menu */}
      <div style={{... styles.submenu, maxHeight: "30%"}}>
        <div style={styles.submenu_title_area}>
          <header style={styles.submenu_title}>Interface</header>
          <MenuButton>
            <a style={{marginBottom:2}}>{'+'}</a>
          </MenuButton>
        </div>
        <div className='scrollable' style={styles.submenu_content}>
          {interfaces && interfaces.map((x)=>(
            <SubMenuItem
              //onClick={(e)=>setInterface(x)}
              selected={x===curr_interface}
              key={"question:"+x}
            >{baseFile(x)}
            </SubMenuItem>)
          )}
        </div>
      </div>

      {/* Question Menu */}
      <div style={{... styles.submenu, maxHeight: "70%"}}> 

        {/* Question Menu - Title Area */}
        <div style={styles.submenu_title_area}>
          <header style={styles.submenu_title}>Question</header>
          <div style={styles.menu_button_area}>
            <MenuButton 
              style={(is_editing && styles.plus_button_start_active)}
              onClick={() => beginEditingQuestionMenu(!is_editing)}
            >
              <img src={images.pencil} style={{width:"60%",height:"60%"}}/>
            </MenuButton>
            <MenuButton 
              style={(is_new && styles.plus_button_start_active)}
              onClick={(!is_new && beginSetStartState) || confirmStartState}
            >
              <a style={{marginBottom:2}}>{'+'}</a>
            </MenuButton>
            
          </div>
        </div>

        {/* Question Menu - Options */}
        <div className='scrollable' style={styles.submenu_content}>
          {question_items && Object.entries(question_items).map(([x,{name, in_progress}])=>(
            <SubMenuItem
              onClick={(e)=>{
                console.log(e.target)
                setQuestion(x)
              }}
              style={in_progress && {"backgroundColor" : 'teal'}}
              selected={x===curr_question}
              is_editing={is_editing}
              id={x}
              key={"question:"+x}
            >{(name || x)}
            </SubMenuItem>)
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
    </div>
  )
}

function ContinueButton() {
  let [input_focus, confirmStartState] = useAuthorStoreChange(["@input_focus", "confirmStartState"])
  let no_input_focus = !input_focus
  console.log("input_focus", input_focus, )
  return (
    <RisingDiv 
      style={styles.continue_button}
      {...{scale : 1, elevation : 4,
           ...button_defaults_props,
           ...(no_input_focus && {scale : 1.1, elevation : 10})
      }}
      onClick={(e)=>{confirmStartState()}}
    >
      {"✔"}
      <div style={styles.continue_button_inner_message}>
        {"Press Enter"}
      </div>
    </RisingDiv>
  )
}

function PopupLayer({children}) {
  let {focus_uid} = authorStore()
  let [is_demo, any_focus, mode] = useAuthorStoreChange([focusIsDemo(), "@focus_uid!=''", "@mode"])
  
  console.log("any_focus", any_focus, focus_uid)
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
//                {key.slice(4,8)}
//              </div>
//            </option>
//            ))
//          }
//          <option value="Agent A">{"Agent A"}</option>
//          <option value="Agent B">{"Agent B"}</option>
//          <option value="Agent C">{"Agent C"}</option>
//        </select>

import Select, { StylesConfig } from 'react-select';


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
  let [agents] = useAuthorStoreChange(
      [[(s)=>s.agents, (o,n) => shallowEqual(o, n)]]
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
  return(
  <div style={{...styles.submenu, ...styles.skills_area}}>
      <div style={styles.submenu_title_area}>
          <header style={styles.submenu_title}>Skills</header>
      </div>
      <div className='scrollable' style={styles.submenu_content}>
        { [1,2,3,4,5,6,7,8].map((x) =>(
          <SubMenuItem
            selected={x===1}
            key={"question:"+x}
          >
            {`Skill ${x}`}
          </SubMenuItem>  
          ))
        
        }
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
      onClick={confirmFeedback}
    >
      {"Confirm"}
      <div style={styles.confirm_button_inner_message}
        >
        {"Press Enter"}
      </div>
    </RisingDiv>
  )
}

function StagedFeedbackArea(){
  return(
  <div style={{...styles.submenu, ...styles.stage_feedback_area}}>
      <div style={styles.submenu_title_area}>
          <header style={styles.submenu_title}>Confirm Feedback</header>
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
        <div style={styles.confirm_button_area}>
          <ConfirmButton/>         
        </div>
      </div>
    </div>
  )
}

export default function AuthoringInterface({props}) {
  let [training_config, training_file, tutor_class, network_layer] = useALTrainStoreChange(
    ['@training_config','@training_file', '@tutor_class', 'network_layer'])
  let [transaction_count] = useAuthorStoreChange(["@transaction_count"])
  let {addSkillApp, removeSkillApp,  setSkillApps, setStaged, onKeyDown,
      incTransactionCount, setFocus, setConfig, createAgent, setTutor} = authorStore ()

  let Tutor = tutor_class

  console.log("RENDER AUTHOR", transaction_count, tutor_class, network_layer)
  
  // OnMount
  useEffect(() =>{
    document.addEventListener('keydown', onKeyDown);
    return function cleanup() {
      document.removeEventListener('keydown', onKeyDown);
    }
  }, [])

  let state = state || test_state

  let fallback_page = (<div style={styles.tutor}>Loading...</div>)

  const stage_ref = useRef(null)
  // const ref = useRef(null)

  let sw = window.screen.width
  let sh = window.screen.height*1.5;

  // Proportion of stage width, height tutor should get
  let tv_pw = .5
  let tv_ph = .7

  return (
      <div style={styles.authoring}
        //onKeyDown={(e)=>{console.log(e.target);;}}
        //Necessary for key presses to be registered
        //tabIndex="-1"
        //ref={ref}
      >
        <div style={styles.header}>
        </div>

        <div style={styles.main_content}>
          <div style={styles.left_tools}>
            <Profiler id="Graph" onRender={(id,phase,actualDuration)=>{
              console.log("actualDuration", actualDuration)
            }}>
              <Graph style={styles.graph}/>
            </Profiler>
            <MultiMenu/>
          </div>

          <div style={styles.center_content}> 
            <ScrollableStage ref={stage_ref}>
              <Suspense fallback={fallback_page}>        
                <Tutor style={{...styles.tutor, width: sw*tv_pw, height:sh*tv_ph}}
                  ref={setTutor}
                />
              </Suspense>
              <StateOverlayLayer parentRef={stage_ref} 
               style={{...styles.overlay_layer,   zIndex: 1}}/>
              <SkillAppCardLayer parentRef={stage_ref} 
                style={{...styles.overlay_layer,   zIndex: 2, "backgroundColor": 'pink'}}/>
            </ScrollableStage>
            <PopupLayer style={styles.popup_layer}/>
          </div>

          <div style={styles.right_tools}> 
            <AgentArea/>
            <SkillArea/>
            <StagedFeedbackArea/>
          </div>          
        </div>  
      </div>
  );
}

// const highlight_color = 'rgb(229,244,255)'


const styles = {
  authoring: {
    display:'flex',
    flexDirection: 'column',
    overflow : "hidden",
  },
  header :{
    height : 80,
    backgroundColor : "rgb(50,50,50)"
  },
  main_content :{
    display:'flex',
    flexDirection: 'row',
    overflow : "hidden",
  },
  multimenu :{
    boxShadow: "1px 1px 3px rgba(0,0,0,1)",
    backgroundColor: "white",//'rgba(80,80,120,.1)',
    borderRadius: 5,
    left:0, top: "50%", height : "50%", width: "100%",
    userSelect: 'none',

    // flex: "1 1 auto",
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
    height:"100%",
    // minHeight: 0,
    // maxHeight: "100%",
  },
  submenu : {
    display : 'flex',
    flexDirection : 'column',
    minHeight: 0,
    maxHeight: "100%",

    border: '0px solid',
    borderBottomWidth: 1,
    borderColor: 'lightgrey',
    paddingBottom: 10,
    // backgroundColor: 'red',
  },
  submenu_content : {
    display : 'flex',
    flexDirection : 'column',

    minHeight: 0,
    maxHeight: "100%",
    width : "100%",
    overflowY : 'scroll',
    
  },
  submenu_title_area : {
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
    width : 24,
    height : 24,
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
    backgroundColor:'teal',
    color:'darkgrey',
    border : "1px solid",
    borderColor : 'rgb(100,200,200)'
  },
  submenu_item : {
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
    backgroundColor : colors.menu_highlight_color
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
  },
  // button_area: {
  //   height: "100%",
  //   display : 'flex',
  //   flexDirection : 'column',
  //   paddingTop: 72,
  // },
  
  



  

  left_tools: {
    // Fixed Width
    flex: "0 0 350px",
    display:'flex',
    flexDirection: 'column',

    // flex : 0,
    // backgroundColor : '#eeeedc',
    // width:350,
    height:"100%",
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
    height:"100%",
    zIndex: 4,
  },

  
  graph: {
    width:350,
    height:"50%"
  },

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
  overlay_layer : {
    position : "absolute",
    margin : 0,
    left: 0,
    top: 0,
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

  continue_button : {
    display : "flex",
    flexDirection: 'column',
    justifyContent : "center",
    alignItems : "center",
    fontSize: 40,
    width : 50,
    height : 50,
    border : "2px solid",
    borderRadius : 100,
    backgroundColor : 'teal',
    borderColor : 'rgb(100,200,200)',
    marginBottom : 60,
    pointerEvents: "auto",
    userSelect: 'none',
  },

  continue_button_inner_message : {
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

  demonstrate_menu :{
    display : 'flex',
    flexDirection : 'row',
    minWidth: "40%",
    maxWidth:"90%",
    height:"30%",
    alignItems: 'center', 
    
    marginBottom : 30,
    backgroundColor : 'white',
    border: '4px solid',
    borderColor: 'dodgerblue',
    borderRadius: 10,
    pointerEvents: "auto",
    boxShadow : gen_shadow(14),

    // Make not in center
    // alignSelf: 'start', 
  },

  demonstrate_menu_fields :{
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

  demonstrate_menu_title :{
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
    display : 'flex',
    flexDirection : 'row',
    minWidth: "40%",
    maxWidth: "90%",
    height: "20%",
    alignItems: 'center', 
    
    marginBottom : 30,
    backgroundColor : 'white',
    border: '4px solid',
    borderColor: colors.default_color,
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


  value_group : {
    flexDirection : 'row',
    display:"flex",
    justifyContent : 'stretch',
    // alignItems : 'end',
    // padding : 2,
    margin : 10,
    width : "100%",
    flexWrap: "wrap",
    // backgroundColor : 'red',
  },
  label : {
    fontSize : 20,
    fontFamily : "Arial",
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
    height : 20,
    padding : 4,

    borderRadius : 4,
    border : "1px solid",
    borderColor : "lightgrey",
  },

  right_space : {
    width : 64,
    height : 34,
    marginLeft : "auto",
    // backgroundColor :'yellow',
  },

  arg_container : {
    flex : "1 1 auto",
    display : 'flex',
    flexDirection : 'row',
    flexWrap: 'wrap',
    maxWidth : "60%",
    // backgroundColor : 'red',
  },

  arg_item : {
    display : "flex",
    alignItems : "center",
    margin: 2,
    padding: 4,

    // backgroundColor : '#EEE',
    // backgroundColor : 'grey',
    border : "2px solid",
    borderColor : "darkgrey",
    borderRadius : 4,
    

  },

  foci_button_inner_message : {
    position : "absolute",
    userSelect: "none",
    fontSize: 8,
    borderRadius : 10,
    width : 50,
    padding : 3.5,
    color: 'white',
    textAlign : 'center',
    backgroundColor : 'purple',
    bottom: -10,

  },

  circle_button : {
    // alignSelf : 'end',
    position : 'relative',

    display : 'flex',
    alignItems:'center',
    justifyContent:'center',
    backgroundColor : 'rgba(200,200,205,1)',
    // right : 0,
    marginLeft : 14,
    
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
    height : "25%",
    marginTop : "auto",
    borderColor : "auto",
    // border: '0px solid',
    borderTopWidth: 2,
    borderColor: 'lightgrey',
  },

  staged_feedback_submenu : {
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

  confirm_button_area :{
    display: "flex",
    justifyContent:  "center",
    alignItems:  "center",
    flex : 1,
  },

  confirm_button :{
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
    

    padding : 4,
    userSelect : "none",
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },




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
