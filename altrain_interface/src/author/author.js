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
import {authorStore, useAuthorStore, useAuthorStoreChange, test_state, test_skill_applications} from "./author_store.js"
// import MyZustandTest from "./change_store_test.js"
import {shallowEqual, baseFile, gen_shadow} from "../utils.js"
import CTATTutorWrapper from "../tutorwrappers/ctat"


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

  let foci_mode_props = {
    default_scale : 1.1, default_elevation : 8,
    hover_scale : 1, hover_elevation : 4,
  }

  return (
    <div style={styles.demonstrate_menu}>
      <div style={styles.demonstrate_menu_fields}>
        <a style={styles.demonstrate_menu_title}>{"Demonstration"}</a>
        <div style={styles.value_group}>
          <div style={styles.label}>{"Value"}</div>
          <textarea 
            className="scrollable" style={styles.editable_value}
            value={demo_text}
            onChange={(e)=>{setInput(skill_app, e.target.value)}}
          />
          <div style={styles.right_space}/>

        </div>
        <div style={styles.value_group}>
          <div style={styles.label}>{"Arguments"}</div>
          <div style={styles.right_space}>
            <RisingDiv style={{
              ...styles.circle_button,
              ...(arg_foci_mode  && {backgroundColor : 'purple'})
            }}
            {...{...button_defaults_props,
             ...(arg_foci_mode && foci_mode_props)}}
             onClick={(e)=>{setMode(foci_mode ? "train" : "arg_foci"); e.stopPropagation()}}
           > 

            <img src={images.crosshair} style={{width:"75%",height:"75%"}} />
            </RisingDiv>
          </div>
        </div>
        <div style={styles.value_group}>
          <div style={styles.label}>{"Formula Hint"}</div>
          <textarea className="scrollable" style={styles.editable_value}>{"this is the value"}</textarea>
          <div style={styles.right_space}>
            <RisingDiv style={styles.circle_button} {...button_defaults_props}> 
              <img src={images.microphone} style={{width:"75%",height:"75%"}} />
            </RisingDiv> 
          </div>
        </div>
        <div style={styles.value_group}>
          <div style={styles.label}>{`Formula(s): ${0}`}</div>
          <textarea className="scrollable" style={styles.editable_value}>{"this is the value"}</textarea>
          <div style={styles.right_space}/>
        </div>
        <div style={styles.value_group}>
          <div style={styles.label}>{"Skill Label"}</div>
          <textarea className="scrollable" style={styles.editable_value}>{"this is the value"}</textarea>
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
    let skill_app = s.skill_apps?.[s.focus_id]
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

  let {beginSetStartState, confirmStartState, setQuestion, setEditingQuestionMenu} = authorStore()

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
        <div style={styles.submenu_title_area}>
          <header style={styles.submenu_title}>Question</header>
          <div style={styles.menu_button_area}>
            <MenuButton 
              style={(is_editing && styles.plus_button_start_active)}
              onClick={() => setEditingQuestionMenu(!is_editing)}
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
  let [is_demo, mode] = useAuthorStoreChange([focusIsDemo(), "@mode"])
  
  
  return (
    <div style={{...styles.popup_layer}}>
      {(mode==="start_state" &&
        <ContinueButton/>) ||
       // (mode==="arg_foci" &&
       //  <ContinueButton/>) ||
       (is_demo &&
        <DemonstrateMenu/>) 
      }
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
          </div>          
        </div>  
      </div>
  );
}

const highlight_color = 'rgb(229,244,255)'


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

    border: "2px solid",
    // borderLeftWidth: 0,
    borderColor: 'rgba(0,0,0,0.0)',
    fontFamily : "Arial",
    fontSize : 16,
    padding: 6
    // padding: "6px 6px 6px 32px",
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
    backgroundColor : '#eeeedc',
    // width:350,
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
    minWidth: "50%",
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
    fontFamily : "Arial",
    fontSize : 20,
    // width : "100%",
    // fontWeight : "bold",
    // margin : 10,
    padding: 6,
    paddingLeft : 20,
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
    alignItems : 'center',
    // padding : 2,
    margin : 6,
    width : "100%",
    flexWrap: "wrap",
    // backgroundColor : 'red',
  },
  label : {
    fontSize : 16,
    fontFamily : "Arial",
    padding : 2,
    // margin : 4,
    marginLeft : 14,
    userSelect: "none",
    width : 120,
    // backgroundColor : 'red',
  },

  editable_value : {
    flex : "1 1 auto",
    // marginRight : 50,

    fontSize : 16,
    fontFamily : "Arial",
    backgroundColor: 'white',
    textAlign:"center",
    textJustify:"center",
    color: 'black',
    resize: "none",
    lineHeight : "1em",


    borderRadius : 4,
    border : "1px solid",
    borderColor : "lightgrey"
  },

  right_space : {
    width : 64,
    height : 34,
    marginLeft : "auto",
    // backgroundColor :'yellow',
  },

  circle_button : {
    // alignSelf : 'end',
    // position : 'absolute',

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
