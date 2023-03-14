import React, { Component, createRef, useState, useEffect, useRef, Profiler } from 'react'
import { motion, useMotionValue, useSpring, useScroll } from "framer-motion";
// import * as Animatable from 'react-native-animatable';
import autobind from "class-autobind";
import './authoring_interface.css';
import './components/scrollbar.css';
import RisingDiv from "./components/RisingDiv.js"
import {CorrectnessToggler, SmallCorrectnessToggler} from "./components/CorrectnessToggler.js"
import {SkillAppCardLayer, SkillAppGroup, DownChevron} from "./components/SkillAppCard.js"
import {StateOverlayLayer} from "./components/StateOverlay.js"
import {Graph} from "./graph.js"
import {useStore, useChangedStore, test_state, test_skill_applications} from "./globalstate.js"
// import MyZustandTest from "./change_store_test.js"
import {shallowEqual} from "./utils.js"
// import microphone_image from "./img/microphone.svg"


const images = {
  left_arrow: require('./img/arrow-left-bold.png'),
  crosshair: require('./img/crosshairs.png'),
  microphone: require('./img/microphone.png'),
};

function UnimplementedMenu({name}){
  console.log("RENDER UnimplementedMenu")
  return (
    <div>
    <div style={{display : 'flex', alignItems : 'center', justifyContent : 'center', height: '100%', backgroundColor:'red'}}>
      <div>{`Unimplemented Menu: ${name}`}</div>


    </div>
    </div>
  )
}

function SkillsMenu({}){
  console.log("RENDER Skills")
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
  // let [skill_app] = useChangedStore(
  //     ["skill_app"]
  // )

  let [skill_app, foci_mode, setFociMode, addSkillApp, removeSkillApp, setInput, setFocus, ] = useChangedStore(
      [getDemoSkillApp(), "@foci_mode", "setFociMode", "addSkillApp", "removeSkillApp", "setInput", "setFocus"],
  )

  // if(skill_app)
  // let skill_app = skill_apps[focus_id] || skill_apps[hover_id]
  // if(skill_app){
  //   console.log("SKAAAAA", skill_app)
  // }

  let demo_text = skill_app?.input ?? ""
  console.log(demo_text)

  return (
    <div style={{width:"100%", height:"92%", display : 'flex', alignItems: 'center', flexDirection : 'row'}}>
      <div style={{display : 'flex', alignItems: 'center', flexDirection : 'column', width:"90%", height:"100%"}}>
        <div style={styles.value_group}>
          <div style={styles.label}>{"Demonstrated Value"}</div>
          <textarea 
            className="scrollable" style={styles.editable}
            value={demo_text}

            onChange={(e)=>{setInput(skill_app, e.target.value)}}
              
              // console.log("On CHANGE", e.target.value)

              // if(!demo_app_id.current){
              //   let new_skill_app = genDemo(sel, "UpdateTextField", e.target.value)
              //   addSkillApp(new_skill_app)
              //   setFocus(new_skill_app)
              //   setCurrentTab("demonstrate")
                
              //   demo_app_id.current = new_skill_app.id
              // }else{
              //   console.log(">>", text, e.target.value)
                
              // }
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
            ...(foci_mode  && {backgroundColor : 'purple'})
          }}
          {...{...button_defaults_props,
           ...(foci_mode && {scale : 1.15, elevation : 18})}}
           onClick={(e)=>{setFociMode(!foci_mode); e.stopPropagation()}}
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

const menus = {
  demonstrate : DemonstrateMenu,
  skills : SkillsMenu,
}


function Tab({name}){
  let [selected, setCurrentTab] = useChangedStore(
      [`@current_tab==${name}`, "setCurrentTab"]
  )
  console.log(name, selected)
  let [hasHover, setHover] = useState(false)
  return (
    <RisingDiv style={{
      ...styles.tab, 
      // ...(hasHover && {opacity : .7}),
      ...((hasHover || selected)  && {backgroundColor : 'rgba(215,215,220,1)'})
      }}
      scale={(hasHover && 1.05) || 1}
      elevation={(hasHover && 6) || 4}
      onClick={(e)=>{setCurrentTab(name); e.stopPropagation();}}
      onMouseEnter={(e)=>setHover(true)}
      onMouseLeave={(e)=>setHover(false)}
    >
      {name.charAt(0).toUpperCase() + name.slice(1)}
    </RisingDiv>)
}


function focusIsDemo(){
  return [(s)=>{
    let skill_app = s.skill_apps?.[s.focus_id]
    return skill_app?.is_demonstration ?? false
  },
  (o,n) =>{
    return o == n
  }
  ]
}

function MultiMenu({style}){
  let [is_demo, current_tab, setCurrentTab] = useChangedStore(
      [focusIsDemo(), "@current_tab", "setCurrentTab"]
  )
  if(current_tab == "demonstrate" && !is_demo){
    current_tab = 'other'
    // setCurrentTab("other")
  }
  let menu_class = menus[current_tab] || UnimplementedMenu
  console.log("current_tab", current_tab)
  let menu = React.createElement(menu_class, {name: current_tab})

  return (
    <div style={{...styles.multi_menu, ...style}}>
      <div style={{...styles.tab_row}}>
        {is_demo && 
          <Tab name={"demonstrate"}/>
        }
        <Tab name={"skills"}/>
        <Tab name={"other"}/>
        <Tab name={"another"}/>
      </div>
      {menu}
    </div>
  )

}


export default function AuthoringInterface({state, ...props}) {
  // console.log("RERENDER APP")

  // const cmp_skill_apps = (o,n) =>{
  //   console.log(Object.keys(o), Object.keys(n), Object.keys(o) == Object.keys(n))
  //   return Object.keys(o) == Object.keys(n)
  // }

  let [_, skill_apps,  clickAway, addSkillApp, removeSkillApp, setSkillApps, setStaged, incTransactionCount, setFocus] = useChangedStore(
    ["@transaction_count", "skill_apps", "clickAway", "addSkillApp", "removeSkillApp", "setSkillApps", "setStaged", "incTransactionCount", "setFocus"],
  )

  console.log("RERENDER APP", skill_apps)
  // OnMount
  useEffect(() =>{
    let skill_apps = test_skill_applications
    setSkillApps(skill_apps)
    incTransactionCount()
    console.log("ON MOUNT", Object.values(skill_apps)[0])
  }, [])

  state = state || test_state
  
  let ref = useRef(null)

  // Make interface element overlays
  // let elem_overlays = []
  // for (let [sel, elem] of Object.entries(state)){
  //   const overlay_type = overlay_element_types[elem.type]
  //   elem_overlays.push(
  //     React.createElement(overlay_type, {
  //       sel:sel,
  //       elem: elem,
  //       key : "overlay_element_"+sel,
  //     })
  //   )
  // }

  return (
      <div 
        ref={ref}
        onClick={(e)=>{if(e.target==ref.current){clickAway()}}}
        style={{
          position : "relative",
          display:'flex',
          flexDirection: 'column',
          // backgroundColor : '#eeeedc',
          width:1000,
          height:1000
      }}>
        <Profiler id="Graph" onRender={(id,phase,actualDuration)=>{
          console.log("actualDuration", actualDuration)
        }}>
          <Graph style={{width:"40%", height:"50%"}}/>
        </Profiler>


        <MultiMenu style={{left:0, top: "50%", height : "50%", width: "40%"}}/>
        

        {/*<MyZustandTest/>*/}
        
        {/*<div style={{position:"absolute", top:340, left:400, zIndex: 10}} >
          {skill_app_groups}
        </div>*/}

        <StateOverlayLayer parentRef={ref} state={state} style={{position:"absolute", top:340, left:450}}/>
        <SkillAppCardLayer parentRef={ref} state={state} style={{position:"absolute", top:340, left:450, zIndex: 10}}/>
        

        {/*<div  >
          {elem_overlays}
        </div>*/}

        {/*<div style={{position:"absolute", display:'flex',height:200, alignItems : "center",}} >
          <CorrectnessToggler style={{top:0}}/>
          <SmallCorrectnessToggler style={{top:0}}/>
        </div>*/}
      </div>
  );
}


const styles = {
  multi_menu : {
    boxShadow: "1px 1px 3px rgba(0,0,0,1)",
    backgroundColor: 'rgba(80,80,120,.1)',
    borderRadius: 5,
  },
  tab : {
    height: 20,
    fontSize: 20,
    padding: 10,
    backgroundColor: 'rgba(235,235,235,1)',
    userSelect: "none",
    borderRadius : 5,
    margin : 2,
  },
  tab_row : {
    display:"flex",
    flexDirection:"row",
    width: "100%",
    margin : 4,
    // backgroundColor : 'darkgrey',
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

  

  full_width: {

  }


}

