// import Accordion from 'react-native-collapsible/Accordion';
// import { CollapsingToolbar }  from 'react-native-collapsingtoolbar';
// import CollapsibleList from './collapsible_list.js'
import SkillPanel from './components/skill_panel.js'
import Buttons from './components/buttons';
// import { vw, vh, vmin, vmax } from 'react-native-expo-viewport-units';
// import ButtonsMachine from './interactions.js'
import {build_interactions_sm} from './interactions.js'
import {build_training_sm} from './training_handler.js'
import NetworkLayer from './network_layer.js'
import { interpret } from 'xstate';


// 
import React from 'react';
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
export default class ALReactInterface extends React.Component {
  constructor(props){
    super(props);
    this.onInteractionTransition = this.onInteractionTransition.bind(this)
    // this.urlParams = new URLSearchParams(window.location.search);

    // this.AL_URL = this.urlParams.get('al_url');
    // this.HOST_URL = window.location.origin
    // console.log(this.AL_URL + '/create/',this.HOST_URL)
    this.network_layer = new NetworkLayer(props.AL_URL,props.HOST_URL)
    
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
      buttons_props: {},
      tutor_props: this.props.tutor_props || {},
      skill_panel_props: {},
    }
    // this.state = {prob_obj : null};
  }

  onInteractionTransition(current){
    console.log("#",current.value, ":", current.context, current)

    var standard_props = {interactions_state: current,
                          interactions_service : this.interactions_service}
    this.setState({
      default_props : standard_props
      // buttons_props: standard_props,
      // tutor_props: standard_props,
      // skill_panel_props: standard_props,
    })
  }

  changeInteractionMode(d){
    this.training_service.send({
        type : "CHANGE_INTERACTION_MODE",
        data : d,
    })
  }

  componentDidMount(){
    console.log("MOUNTED")
    var tutor, nl, wd,tf
    [tutor, nl, wd,tf] = [this.tutor.current,this.network_layer,this.props.working_dir,this.props.training_file]
      
    this.interactions_sm = build_interactions_sm(this,this.props.interactive)  
    this.interactions_service = null //Will be spawned in training_sm 

    this.training_machine = build_training_sm(this,this.interactions_sm, tf, wd)
    this.training_service = interpret(this.training_machine)

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

  }

  render(){
    const Tutor = this.props.tutorClass

    return (
  	<View style={styles.container}>
  		<View style={styles.ctat_tutor}>
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
  		<View style={styles.controls}>
  			<View style={styles.skill_panel}>
  				<SkillPanel ref={this.skill_panel}
          {...this.state.default_props}
          {...this.state.skill_panel_props}/>
  			</View>
  			<View style={styles.buttons}>
  				<Buttons ref={this.buttons}
          {...this.state.default_props}
          { ...this.state.buttons_props}/>
  			</View>
  		</View>
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