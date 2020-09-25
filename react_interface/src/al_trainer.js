/**
 * Copyright (c) 2020
 *
 * The outermost component which manages interactive or batch training.
 *   Initializes the interactive or non-interactive state machines, and
 *   the network layers, and is the outer container for the tutor interface, 
 *   training overlay, prompts, and so forth. 
 *  
 * @summary Manages training state machines, displays tutor.
 * @author Daniel Weitekamp <dannyweitekamp@gmail.com>
 *
 */


import SkillPanel from './components/skill_panel.js'
import TrainingOverlay from './components/training_overlay/src/training_overlay'//'@apprentice/training_overlay'
import Buttons from './components/buttons';
import {build_interactions_sm} from './interactions.js'
import {build_training_sm, problem_props} from './training_handler.js'
import NetworkLayer from './network_layer.js'
import { interpret } from 'xstate';
import autobind from 'class-autobind';
import path from 'path';
import pick from 'object.pick';

import React from 'react';
import Spinner from 'react-native-loading-spinner-overlay';

import { TouchableHighlight,ScrollView,View, Text, Platform, StyleSheet,SectionList,AppRegistry } from "react-native";

const bounding_boxes = {
  "A" : {
    type : "TextField",
    x : 100,
    y : 100,
    width: 100,
    height: 100,
  },
  "B" : {
    type : "TextField",
    x : 250,
    y : 200,
    width: 200,
    height: 200,
  },
  "C" : {
    type : "TextField",
    x : 250,
    y : 100,
    width: 100,
    height: 100,
  },
  "D" : {
    type : "TextField",
    x : 50,
    y : 300,
    width: 100,
    height: 100,
  },
  "Button" : {
    type : "Button",
    x : 150,
    y : 500,
    width: 100,
    height: 50,
  },
  "E" : {
    type : "TextField",
    x : 500,
    y : 300,
    width: 100,
    height: 100,
  },
  "F" : {
    type : "TextField",
    x : 650,
    y : 300,
    width: 100,
    height: 100,
  },
}
const skill_applications = [
        {"selection" : "A", "action" : "UpdateTextField", "input" : "6",
       "how": "Add(?,?,?) ","reward": -1, is_staged: true},
        { "selection" : "B", "action" : "UpdateTextField", "input" : "7",
          "how": "Add(?,?,?)", "reward": -1},
        { "selection" : "C", "action" : "UpdateTextField", "input" : "8x + 4",
          "how": "x0 + x1 + x2", "reward": 1,
          foci_of_attention: ["E","F"]
        },
        { "selection" : "C", "action" : "UpdateTextField", "input" : "16x - 8",
          "how": "Subtract(?,Add(?,?))", "reward": 1},
        { "selection" : "D", "action" : "UpdateTextField", "input" : "A VERY VERY LONG INPUT",
        "how": "Subtract(?,?,?)", "reward": 0},
        { "selection" : "Button", "action" : "PressButton", "input" : null,
        "how": "PushButton ",
         "reward": -1},
]

// export default function App() {
//   let fake_items = []
//   for(let bb_n in bounding_boxes){
//     let bb = bounding_boxes[bb_n]
//     fake_items.push(
//       <View style={{left: bb.x,
//                     top: bb.y,
//                     width: bb.width,
//                     height: bb.height,
//                     backgroundColor : 'rgba(180,180,180,.3)',
//                     position: "absolute"
//                   }}
//             key={bb_n}
//       /> 
//     )
//   }
//   return (
//     <View style={styles.container}>
//       {fake_items}
//       <TrainingOverlay skill_applications ={skill_applications}
//         bounding_boxes = {bounding_boxes}/>
//     </View>
//   );
// }


function shallow_diff(o1,o2,keys=null){
  console.log('shallow_diff',keys)
  let diff = Object.keys(o2).reduce((diff, key) => {
      if (o1[key] !== o2[key] && (keys == null || keys.includes(key))){
        diff[key] = o2[key]
      }
      return diff
    }, {})
  return diff
}



export default class AL_Trainer extends React.Component {
  constructor(props){
    super(props);
    autobind(this);
    this.onInteractionTransition = this.onInteractionTransition.bind(this)

    console.log('props',props)

    this.network_layer = new NetworkLayer(props.AL_URL,props.HOST_URL,props.OUTER_LOOP_URL)

    let working_dir = props.working_dir
    if(working_dir == null && props.training_file != null){
        var match = props.training_file.match(/(.*)[\/\\]/)
        working_dir =  !!match ? match[1] : ''; //The directory of the training.json
    }
    this.tutor = React.createRef()
    this.training_overlay = React.createRef()
    this.skill_panel = React.createRef()
    this.buttons = React.createRef()

    this.state = {
      default_props: {},
      buttons_props: {app: this},
      tutor_props: this.props.tutor_props || {},
      skill_panel_props: {},
      training_description : "????",
      agent_description : "????",
      problem_description : "????",

      interactive : this.props.interactive,
      free_author : this.props.free_author,
      tutor_mode : this.props.tutor_mode,
      tutor_handles_start_state : true,
      tutor_handles_demonstration : false,
      tutor_handles_foci : false,

      prev_interaction_state : "Start",
    }
    // this.state = {prob_obj : null};
  }

  onInteractionTransition(current){
    console.log("#",current.value, ":", current.context, current)

    var standard_props = {interactions_state: current,
                          interactions_service : this.interactions_service}
    let prev_interaction_state = this.state.prev_interaction_state                          
    let nxt_state = {
      default_props : standard_props,
      Interactions_Machine_State : current.value,
      start_state_mode : current.value == "Setting_Start_State",
      prev_interaction_state : current.value,
    }                           

    if(current.context.interactive){
      if(prev_interaction_state == "Querying_Apprentice"){
        nxt_state['skill_applications'] = current.context.skill_applications
        nxt_state['state'] = current.context.state
        this.updateBounds()
      }
      if(prev_interaction_state == "Setting_Start_State" ||
         prev_interaction_state == "Start"){
        nxt_state['state'] = current.context.state  
        this.updateBounds()
      }
    }

    this.setState(nxt_state)
  }

  onTrainingTransition(current){
    var c = current.context
    console.log("&", current)
    this.setState({"Training_Machine_State" : current.value})
    if(!c.interactive){
      this.setState({
        training_description : c.training_description || "???",
        agent_description : c.agent_description || "???",
        problem_description : c.problem_description || "???"
      })  
    }
    

  }

  changeInteractionMode(d){
    this.setState(d)
  }

  componentDidUpdate(prevProps,prevState){

    //Update from changeInteractionMode
    var d = shallow_diff(prevState,this.state,["interactive","free_author","tutor_mode"])
    if(Object.keys(d).length > 0){
      console.log("componentDidUpdate", d)
      this.training_service.send({
        type : "CHANGE_INTERACTION_MODE",
        data : d,
      })  
    }
  }

  componentDidMount(){
    console.log("MOUNTED")
    var tutor, nl, wd,tf
    [tutor, nl, wd,tf] = [this.tutor.current,this.network_layer,this.props.working_dir,this.props.training_file]
    

    // this.setState({
     
    // })
    this.interactions_sm = build_interactions_sm(this,
                                                 pick(this.props,problem_props))
                                                 // this.props.interactive,
                                                 // this.props.free_author,
                                                 // this.props.tutor_mode)  
    this.interactions_service = null //Will be spawned in training_sm 

    this.training_machine = build_training_sm(this,this.interactions_sm, tf, wd)
    this.training_service = interpret(this.training_machine)
    this.training_service.onTransition(this.onTrainingTransition)
    this.training_service.start()

    const sub = this.training_service.subscribe(state => {
      console.log("SUBSCRIBE:",state);
    });
    console.log("T MACHINE!", this.training_service)

    window.setTutorMode = (x) => {
      this.changeInteractionMode({"tutor_mode" : x})
    }

    window.setInteractive = (x) => {
      this.changeInteractionMode({"interactive" : x})
    }

    window.setFreeAuthor = (x) => {
      this.changeInteractionMode({"free_author" : x})
    }

    //TODO MOVE TO NW_LAYER
    window.generateBehaviorProfile = this.generateBehaviorProfile


    window.addEventListener('resize', this.updateBounds);
    window.addEventListener('scroll', this.updateBounds);
    // this.tutor.addEventListener('scroll', this.updateBounds);


  }

  updateBounds(){
    if(this.state.interactive && this.tutor){
      let bounds = this.tutor.current.getBoundingBoxes()
      delete bounds['top']; delete bounds['left'];
      delete bounds['bottom']; delete bounds['right'];
      console.log("Update Bounds", bounds)
      this.setState({bounding_boxes: bounds})
    }
  }


  generateBehaviorProfile(ground_truth_path="/al_train/ground_truth.json",out_dir=""){
    // window.generateBehaviorProfile = (ground_truth_path,out_dir="") => {
    let f = this.network_layer.generateBehaviorProfile

    let t_context = this.training_service._state.context
    // let i_context = this.training_service.context
    if(ground_truth_path != null){

      let to_json_list = (in_list) => {
        let out = []
        for (let line of in_list){
          if(line != ""){
            let json = JSON.parse(line)
            out.push(json)
          }
        }
        return out;
      }
      // let rq_h = this.network_layer.return
      // let path =  ground_truth_path
      if(ground_truth_path[0] != "/"){
        ground_truth_path = (t_context.working_dir|| "/") + ground_truth_path
      }
      return fetch(ground_truth_path)
        .then((resp) => resp.text())
        .then((text) => text.split("\n"))
        .then((split) => to_json_list(split))
        .then((resps) => f(t_context,{data:{requests:resps,out_dir: out_dir}}))

    }else{
      return f(t_context)  
    }
      
  }

  render(){
    const Tutor = this.props.tutorClass
    let {training_description, agent_description, problem_description,
      tutor_mode, default_props, buttons_props, skill_panel_props,
      use_legacy_interface, interactive, start_state_mode, 
      skill_applications, bounding_boxes, tutor_handles_start_state,
      tutor_handles_demonstration, tutor_handles_foci} = this.state

    var lower_display;
    if(!interactive){
      let prompt_text = 
        training_description + "\n" +
        agent_description + "\n" +
        problem_description + "\n"

      lower_display = 
      <View style={styles.prompt}>
        <Text>
        {prompt_text}
        </Text>
      </View>
    }else if(use_legacy_interface){
      lower_display = 
      <View style={styles.controls}>
        {!tutor_mode &&
        <View style={styles.skill_panel}>
          <SkillPanel ref={this.skill_panel}
          {...default_props}
          {...skill_panel_props}/>
        </View>
        }
        <View style={styles.buttons}>
          <Buttons ref={this.buttons}
          {...default_props}
          {...buttons_props}
          {...{tutor_mode: tutor_mode}}/>
        </View>
      </View>
    }
    // lower_display = null
    // <View style={styles.overlay}>
        //   <Text style={styles.overlay_text}>
        //     LOADING
        //   </Text>
        // </View>
    console.log("TRANING MACHINE STATE",this.state.Training_Machine_State)
    return (
  	<View style={styles.container}>
  		<View style={styles.ctat_tutor}>
        {(this.state.Training_Machine_State == "Creating_Agent")
          &&
          <View style={[styles.overlay,styles.loader]}>
            <Spinner
              color={'#000000'}
              size={150}
              visible={true}
              textContent={'Loading...'}
              textStyle={styles.spinnerTextStyle}
            />
          </View> 
        }
        {(interactive && !use_legacy_interface) && 
          <TrainingOverlay 
            ref={this.training_overlay}
            start_state_mode = {start_state_mode}
            skill_applications ={skill_applications}
            bounding_boxes = {bounding_boxes}
            state = {this.state.state}
            interactions_service={this.interactions_service}
            tutor_handles_start_state={tutor_handles_start_state}
            tutor_handles_demonstration={tutor_handles_demonstration}
            tutor_handles_foci={tutor_handles_foci}
          />
        }
  			{<Tutor
          style ={styles.overlay}
          updateBoundsCallback={this.updateBounds}
          //tutor_props = {this.state.prob_obj}
          ref={this.tutor}//{function(tutor) {window.tutor = tutor; console.log("TUTOR IS:",tutor)}}
          id="tutor_iframe"
          //current_state={ctat_state_machine}
          //sm_service={ctat_state_machine_service}
          interactive={false}
          {...this.state.default_props}
          {...this.state.tutor_props}
        />}
  		</View>

  		{lower_display}
  	</View>
    );
  }
}

//current={state_machine}
//service={state_machine_service}
//debugmode={true}
//callbacks={window.button_callbacks}
//nools_callback={window.nools_callback}/>

const styles = StyleSheet.create({
      spinnerTextStyle: {
        color: '#000000'
      },
      overlay: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        flex: "100%",
        justifyContent: "center",
        alignItems: "center"
      },
      loader :{
        backgroundColor: 'rgba(50, 50, 50, 0.3)',
      },
      overlay_text: {
        textAlign: 'center',
      },
	     container : {
        height : "100%",
        width : "100%",
        display : "flex",
        alignItems : 'stretch',
        overflow: "hidden",
        flexGrow: 1,
        flexDirection: "column",
      },
      ctat_tutor: {
        flex: 65,
        margin: 4,
      },
      prompt : {
        flex: 35,
        textAlign : "center"
      },
      controls :{
        maxHeight : "35%",
        flex: 35,
        flexDirection: "row",
        alignItems: "stretch",
      },
      
      skill_panel : {
        flex : 60,
      },
      

      buttons : {
        flex : 40,
        flexDirection: "column",
        justifySelf : "space-around",
      }

});
