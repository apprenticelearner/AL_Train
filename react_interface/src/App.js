// import Accordion from 'react-native-collapsible/Accordion';
// import { CollapsingToolbar }  from 'react-native-collapsingtoolbar';
// import CollapsibleList from './collapsible_list.js'
import SkillPanel from './components/skill_panel.js'
import Buttons from './components/buttons';
// import { vw, vh, vmin, vmax } from 'react-native-expo-viewport-units';
// import ButtonsMachine from './interactions.js'
import {build_interactions_sm} from './interactions.js'
import {build_training_sm, problem_props} from './training_handler.js'
import NetworkLayer from './network_layer.js'
import { interpret } from 'xstate';
import autobind from 'class-autobind';
import path from 'path';
import pick from 'object.pick';

// 
import React from 'react';
import Spinner from 'react-native-loading-spinner-overlay';
// import "react-loader-spinner/dist/loader/css/react-spinner-loader.css"
// import Loader from 'react-loader-spinner'
// import { View, Text, StyleSheet } from "react-native";
// import logo from './logo.svg';
// import './App.css';

import { TouchableHighlight,ScrollView,View, Text, Platform, StyleSheet,SectionList,AppRegistry } from "react-native";


// const instructions = Platform.select({
//   ios: "Press Cmd+R to reload,\n" + "Cmd+D or shake for dev menu",
//   android:
//     "Double tap R on your keyboard to reload,\n" +
//     "Shake or press menu button for dev menu",
//   web: "Your browser will automatically refresh as soon as you save the file."
// });
// var state_machine = ButtonsMachine.initialState
// var state_machine_service = interpret(ButtonsMachine)
// state_machine_service.start()

// var NonInteractive_SM = build_SM_NonInteractive()
// var ctat_state_machine = NonInteractive_SM.initialState
// var ctat_state_machine_service = interpret(NonInteractive_SM)
// ctat_state_machine_service.start()
// window.ctat_state_machine = ctat_state_machine
// window.ctat_state_machine_service = ctat_state_machine_service

// var urlParams = new URLSearchParams(window.location.search);
// var AL_URL = urlParams.get('al_url');
// var HOST_URL = window.location.origin
// window.network_layer = new NetworkLayer(AL_URL,HOST_URL)

// ctat_state_machine_service.onTr

// ctat_state_machine_service.onTransition(current => {
//     setButtonsState(current,window.debugmode)
    
//     // this.setState({ current : current })
//     }
//   );
function shallow_diff(o1,o2,keys=null){
  console.log(keys)
  let diff = Object.keys(o2).reduce((diff, key) => {
      if (o1[key] !== o2[key] && (keys == null || keys.includes(key))){
        diff[key] = o2[key]
      }
      return diff
    }, {})
  return diff
}



export default class ALReactInterface extends React.Component {
  constructor(props){
    super(props);
    autobind(this);
    this.onInteractionTransition = this.onInteractionTransition.bind(this)
    // this.urlParams = new URLSearchParams(window.location.search);

    // this.AL_URL = this.urlParams.get('al_url');
    // this.HOST_URL = window.location.origin
    // console.log(this.AL_URL + '/create/',this.HOST_URL)
    this.network_layer = new NetworkLayer(props.AL_URL,props.HOST_URL,props.OUTER_LOOP_URL)
    
    // this.training_file = this.urlParams.get('training');
    // this.interactive = this.urlParams.get('interactive') == "true";
    // this.use_foci = this.urlParams.get('use_foci') == "true";

    // var working_dir = this.urlParams.get('wd')
    if(props.working_dir == null && props.training_file != null){
        var match = props.training_file.match(/(.*)[\/\\]/)
        props.working_dir =  !!match ? match[1] : ''; //The directory of the training.json
    }
    this.tutor = React.createRef()
    this.skill_panel = React.createRef()
    this.buttons = React.createRef()

    this.state = {
      default_props: {},
      buttons_props: {app: this},
      tutor_props: this.props.tutor_props || {},
      skill_panel_props: {},
      "training_description" : "????",
      "agent_description" : "????",
      "problem_description" : "????",

      "interactive" : this.props.interactive,
      "free_author" : this.props.free_author,
      "tutor_mode" : this.props.tutor_mode,
    }
    // this.state = {prob_obj : null};
  }

  onInteractionTransition(current){
    console.log("#",current.value, ":", current.context, current)

    var standard_props = {interactions_state: current,
                          interactions_service : this.interactions_service}
    this.setState({
      default_props : standard_props,
      "Interactions_Machine_State" : current.value
      // buttons_props: standard_props,
      // tutor_props: standard_props,
      // skill_panel_props: standard_props,
    })
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


  }

  generateBehaviorProfile(ground_truth_path="/ground_truth.json",out_dir=""){
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

    var lower_display;
    var use_prompt = false
    if(!this.state.interactive){
      use_prompt = true
      var prompt_text
      // if(this.state.tutor_mode == true){
      //   prompt_text = "TUTOR MODE\n"
      // }else if(!this.state.interactive){
      prompt_text = 
        this.state.training_description + "\n" +
        this.state.agent_description + "\n" +
        this.state.problem_description + "\n"

      lower_display = 
      <View style={styles.prompt}>
        <Text>
        {prompt_text}
        </Text>
      </View>
    }else{
      lower_display = 
      <View style={styles.controls}>
        {!this.state.tutor_mode &&
        <View style={styles.skill_panel}>
          <SkillPanel ref={this.skill_panel}
          {...this.state.default_props}
          {...this.state.skill_panel_props}/>
        </View>
        }
        <View style={styles.buttons}>
          <Buttons ref={this.buttons}
          {...this.state.default_props}
          {...this.state.buttons_props}
          {...{tutor_mode: this.state.tutor_mode}}/>
        </View>
      </View>
    }
    
    // <View style={styles.overlay}>
        //   <Text style={styles.overlay_text}>
        //     LOADING
        //   </Text>
        // </View>
    console.log("TRANING MACHINE STATE",this.state.Training_Machine_State)
    return (
  	<View style={styles.container}>
  		<View style={styles.ctat_tutor}>
        {(this.state.Training_Machine_State == "Creating_Agent") //||
          // this.state.Interactions_Machine_State == "Querying_Apprentice" ||
          // this.state.Interactions_Machine_State == "Sending_Feedback")
          &&
          <View style={styles.overlay}>
            <Spinner
              color={'#000000'}
              size={100}
              visible={true}
              textContent={'Loading...'}
              textStyle={styles.spinnerTextStyle}
            />
          </View> 
        }
        
  			<Tutor
          //tutor_props = {this.state.prob_obj}
          ref={this.tutor}//{function(tutor) {window.tutor = tutor; console.log("TUTOR IS:",tutor)}}
          id="tutor_iframe"
          //current_state={ctat_state_machine}
          //sm_service={ctat_state_machine_service}
          interactive={false}
          {...this.state.default_props}
          {...this.state.tutor_props}
        />
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
        backgroundColor: 'rgba(50, 50, 50, 0.3)',
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
      },
      overlay_text: {
        textAlign: 'center',
      },
	     container : {
        // justifyContent: "stretch",
        // padding: 20,
        // alignItems:'center',
        // backgroundColor: "blue",
        flex: 1,
        flexDirection: "column",
        // flexWrap: "wrap"
      },
      ctat_tutor: {

      	// backgroundColor: 'powderblue',
      	
      	// flexGrow: 1,
      	// height : "65%",
      	// width : "100%",
        // width:800,
        // height: vh(64),
        // flexGrow: 100,
        margin: 4,
        flexBasis: "65%",
        flex: 1,
        

      },
      prompt : {
        flex: 1,
        textAlign : "center"
      },
      controls :{

      	// flexGrow: 1,
      	// flexBasis: 300,
        // display: "flex",
        // height : "35%",
        flex: 1,
        flexBasis: "35%",
        flexDirection: "row",
        // flexWrap: "wrap",
        // width : 600,
        // flexGrow: 1,
        // flexBasis:  600,
        // height: vh(35),
        // justifyContent: "center",
      },
      
      skill_panel : {
      	// width: "65%",
      	// height: 300,
        // height: vh(35),
        flex : 1,
        flexBasis: "60%",
        // flexGrow : 0
        // flexDirection: "row",
        // flexShrink: 1,
        // flexBasis: 1
        /*height: 320px*/

      },
      

      buttons : {
        flexGrow: 1,
        // display: "flex",
        // width : 1000,
        // flexBasis: 2,
        flexDirection: "column",
        // height: vh(35),
        // width: "35%",
        flexBasis : "40%",
        /*width:300px;*/
        // flexWrap: "wrap",
        justifySelf : "space-around",
        
        // flexBasis: 32,
        /*justify-self:  start;*/
        /*align-self:  ;*/
        /*padding: 60px,*/
        // justifyContent: "auto",
        
        // alignContent: "center"
        
      }

});