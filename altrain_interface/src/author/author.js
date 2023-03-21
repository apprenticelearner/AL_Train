import React, { Component, createRef, useState, useEffect, useRef, Profiler, Suspense } from 'react'
import { motion, useMotionValue, useSpring, useScroll } from "framer-motion";
// import * as Animatable from 'react-native-animatable';
import autobind from "class-autobind";
import './author.css';
import './components/scrollbar.css';
import RisingDiv from "./components/RisingDiv.js"
import {CorrectnessToggler, SmallCorrectnessToggler} from "./components/CorrectnessToggler.js"
import {SkillAppCardLayer, SkillAppGroup, DownChevron} from "./components/SkillAppCard.js"
import {StateOverlayLayer} from "./components/StateOverlay.js"
import {Graph} from "./graph.js"
import ScrollableStage from "./stage.js"

import {useALTrainStoreChange} from '../altrain_store';
import {useAuthorStore, useAuthorStoreChange, test_state, test_skill_applications} from "./author_store.js"
// import MyZustandTest from "./change_store_test.js"
import {shallowEqual, baseFile} from "../utils.js"
import CTATTutorWrapper from "../tutorwrappers/ctat"
// import microphone_image from "./img/microphone.svg"


const images = {
  left_arrow: require('./img/arrow-left-bold.png'),
  crosshair: require('./img/crosshairs.png'),
  microphone: require('./img/microphone.png'),
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
    let skill_app = s.skill_apps[s.focus_id] || s.skill_apps[s.hover_id]
    return skill_app
  },
  (o,n) =>{
    return o?.id == n?.id && o?.input == n?.input && o?.skill_label == n?.skill_label
  }
  ]
}



function DemonstrateMenu({}){
  

  let [skill_app, arg_foci_mode, setMode, addSkillApp, removeSkillApp, setInput, setFocus, ] = useAuthorStoreChange(
      [getDemoSkillApp(), "@mode=='arg_foci'", "setMode", "addSkillApp", "removeSkillApp", "setInput", "setFocus"],
  )

  let demo_text = skill_app?.input ?? ""
  // console.log(demo_text)

  return (
    <div style={{width:"100%", height:"92%", display : 'flex', alignItems: 'center', flexDirection : 'row'}}>
      <div style={{display : 'flex', alignItems: 'center', flexDirection : 'column', width:"90%", height:"100%"}}>
        <div style={styles.value_group}>
          <div style={styles.label}>{"Demonstrated Value"}</div>
          <textarea 
            className="scrollable" style={styles.editable}
            value={demo_text}

            onChange={(e)=>{setInput(skill_app, e.target.value)}}
          />
        </div>
        <div style={styles.value_group}>
          <div style={styles.label}>{"Formula Hint"}</div>
          <textarea className="scrollable" style={styles.editable}>{"this is the value"}</textarea>
        </div>
        <div style={styles.value_group}>
          <div style={styles.label}>{`Formula(s): ${0}`}</div>
          <textarea className="scrollable" style={styles.editable}>{"this is the value"}</textarea>
        </div>
        <div style={styles.value_group}>
          <div style={styles.label}>{"Skill Label"}</div>
          <textarea className="scrollable" style={styles.editable}>{"this is the value"}</textarea>
        </div>
      </div>
      <div style={styles.button_area}>
        <RisingDiv style={{
            ...styles.circle_button,
            ...(arg_foci_mode  && {backgroundColor : 'purple'})
          }}
          {...{...button_defaults_props,
           ...(arg_foci_mode && {scale : 1.15, elevation : 18})}}
           onClick={(e)=>{setMode(foci_mode ? "train" : "arg_foci"); e.stopPropagation()}}
         > 

          <img style={{width:"75%",height:"75%"}}src={images.crosshair}/>
        </RisingDiv> 
        <RisingDiv style={styles.circle_button} {...button_defaults_props}> 
          <img style={{width:"75%",height:"75%"}}src={images.microphone}/>
        </RisingDiv> 
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
    let skill_app = s.skill_apps?.[s.focus_id]
    return skill_app?.is_demo ?? false
  },
  (o,n) =>{
    return o == n
  }
  ]
}

function SubMenuItem({selected, children, onClick, style}){
  let [hasHover, setHover] = useState(false)
  // let [selected, setSelected] = useState(false)
  return (<a  style={{
            ...styles.submenu_item,
            ...(hasHover && styles.submenu_item_hover),
            ...(selected && styles.submenu_item_selected),
            ...style,
            }}
            onClick={onClick}
            onMouseEnter={(e)=>setHover(true)}
            onMouseLeave={(e)=>setHover(false)}
          >
          {children}
          </a>)
}

function PlusButton({onClick, style, active=true}){
    let [hasHover, setHover] = useState(false)
  return (
    <div style={{...styles.plus_button,...(hasHover && styles.plus_button_hover),...style}}
         onClick={active && onClick || null}
         onMouseEnter={active && ((e)=>setHover(true)) || null}
         onMouseLeave={active && ((e)=>setHover(false))|| null}
    ><a style={{marginBottom:2}}>{'+'}</a></div> 
  )
}

function ProblemMenu({}){
  let [mode, curr_interface, curr_question, interfaces, questions] = useAuthorStoreChange(
    ['@mode','@curr_interface', '@curr_question', '@interfaces', '@questions'])

  console.log(curr_interface)
  let question_items = {...questions[curr_interface] || {}}
  
  console.log(curr_interface, curr_question)
  console.log(interfaces.map((x)=>baseFile(x)))

  if(mode == "start_state"){
    question_items["z"] = {"name" : "In Progress...", in_progress : true}
  }
  // interfaces = ['Interface 1']
  // question_items = ['question 1','question 2', 'question 3', 'question 4', 'question 5', 'question 6','question 7', 'question 8', 'question 9', 'question 10']
  // let [intr, setInterface] = useState("")
  // let [question, setQuestion] = useState("")
  return (
    <div style={styles.problem_menu}>
      <div style={{... styles.submenu, maxHeight: "30%"}}>
        <div style={styles.submenu_title_area}>
          <header style={styles.submenu_title}>Interface</header>
          <PlusButton/>
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
      <div style={{... styles.submenu, maxHeight: "70%"}}> 
        <div style={styles.submenu_title_area}>
          <header style={styles.submenu_title}>Question</header>
          <PlusButton 
            style={(mode==='start_state' && styles.plus_button_start_active)}
            active={(mode!=='start_state')}
          />
        </div>
        <div className='scrollable' style={styles.submenu_content}>
          {question_items && Object.entries(question_items).map(([x,{name, in_progress}])=>(
            <SubMenuItem
              //onClick={(e)=>setQuestion(x)}
              style={in_progress && {"backgroundColor" : 'teal'}}
              selected={x===curr_question}
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
  demonstrate : DemonstrateMenu,
  skills : SkillsMenu,
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
  let [input_focus, confimStartState] = useAuthorStoreChange(["@input_focus", "confirmStartState"])
  let no_input_focus = !input_focus
  console.log("input_focus", input_focus, )
  return (
    <RisingDiv 
      style={styles.continue_button}
      {...{scale : 1, elevation : 4,
           ...button_defaults_props,
           ...(no_input_focus && {scale : 1.1, elevation : 10})
      }}
      onClick={(e)=>{confimStartState()}}
    >
      {"✔"}
      <div style={styles.continue_button_inner_message}>
        {"Press Enter"}
      </div>
    </RisingDiv>
  )
}

function PopUpLayer({children}) {
  let [mode] = useAuthorStoreChange(["@mode"])
  return (
    <div style={{...styles.popup_layer}}>
      {(mode==="start_state" &&
        <ContinueButton/>)
      }
    </div>
  )
}




export default function AuthoringInterface({props}) {
  let [training_config, training_file, tutor_class, network_layer] = useALTrainStoreChange(
    ['@training_config','@training_file', '@tutor_class', 'network_layer'])
  let [transaction_count, clickAway, addSkillApp, removeSkillApp, 
       setSkillApps, setStaged, incTransactionCount, setFocus, setConfig, createAgent,
       setTutor] = useAuthorStoreChange(
      ["@transaction_count", "clickAway", "addSkillApp", "removeSkillApp", 
       "setSkillApps", "setStaged", "incTransactionCount", "setFocus", "setConfig", "createAgent",
       "setTutor"]
  )

  let Tutor = tutor_class

  console.log("RENDER AUTHOR", transaction_count, tutor_class, network_layer)
  // OnMount
  // useEffect(() =>{
    // let skill_apps = test_skill_applications
    // setSkillApps(skill_apps)
    // incTransactionCount()
    // console.log("ON MOUNT", Object.values(skill_apps)[0])
    // setConfig({network_layer: network_layer})
    // createAgent(training_config.agent)
  // }, [])

  let state = state || test_state

  let fallback_page = (<div style={styles.tutor}>Loading...</div>)

  const stage_ref = useRef(null)

  let sw = window.screen.width
  let sh = window.screen.height*1.5;

  // Proportion of stage width, height tutor should get
  let tv_pw = .5
  let tv_ph = .7

  return (
      <div style={styles.authoring}>
        <div style={styles.side_tools}>
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
          <PopUpLayer style={styles.overlay_layer}/>
        </div>
        
      </div>
  );
}

const highlight_color = 'rgb(229,244,255)'


const styles = {
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
  plus_button : {
    display : 'flex',
    flexDirection : 'column',
    justifyContent : 'center',
    alignItems : 'center',
    width : 24,
    height : 24,
    fontSize : 26,
    borderRadius : 100,
    // backgroundColor : 'lightgrey'
  },
  plus_button_hover :{
    fontWeight : "bold"
    // backgroundColor : highlight_color
  },
  plus_button_start_active:{
    backgroundColor:'teal',
    color:'darkgrey',
    border : "1px solid",
    borderColor : 'rgb(100,200,200)'
  },
  submenu_item : {
    border: "2px solid",
    // borderLeftWidth: 0,
    borderColor: 'rgba(0,0,0,0.0)',
    fontFamily : "Arial",
    fontSize : 16,
    padding: "6px 6px 6px 32px",
  },
  submenu_item_hover : {
    borderColor: 'dodgerblue',
  },
  submenu_item_selected : {
    backgroundColor : highlight_color
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
  button_area: {
    height: "100%",
    display : 'flex',
    flexDirection : 'column',
    paddingTop: 72,
  },
  circle_button : {
    display : 'flex',
    alignItems:'center',
    justifyContent:'center',
    backgroundColor : 'rgba(200,200,205,1)',
    margin : 10,
    marginBottom : 32,
    width : 50,
    height : 50,
    borderRadius : 1000,
  },
  value_group : {
    flexDirection : 'column',
    display:"flex",
    padding : 2,
    margin : 4,
    width : "100%",
    flexWrap: "wrap"
  },
  label : {
    padding : 2,
    margin : 4,
    marginLeft : 14,
    userSelect: "none",
  },

  editable : {
    padding : 2,
    margin : 4,
    marginLeft : 10,
    marginRight : 10,
    backgroundColor: 'white',
    textAlign : 'center',
    // flex : "0 0 1",

    maxWidth : "100%",


    display: "flex",
    textAlign:"center",
    // alignSelf: "center",
    color: 'black',//textColor || 'dodgerblue',
    // width : "99%",
    maxHeight : 200,
    // backgroundColor :'transparent',
    borderColor :'transparent',
    resize: "none",
    borderRadius : 4,
    // lineHeight : "1em",
  },

  value : {
    padding : 2,
    margin : 4,
    backgroundColor: 'lightgrey',
    borderRadius : 2,
  },

  authoring: {
    display:'flex',
    flexDirection: 'row',
    // backgroundColor : '#eeeedc',
    // width:1000,
    overflow : "hidden",
    // height:"100%",
    // width:"100%"
  },

  side_tools: {
    display:'flex',
    flexDirection: 'column',
    flex : 0,
    // backgroundColor : '#eeeedc',
    width:350,
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
  center_content : {
    display : "flex",
    flexDirection: 'column',
    width : "100%",
    height : "100%",
    overflow : "hidden",
  },

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
    right: 0,
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
