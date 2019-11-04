// import Accordion from 'react-native-collapsible/Accordion';
// import { CollapsingToolbar }  from 'react-native-collapsingtoolbar';
// import CollapsibleList from './collapsible_list.js'
import SkillPanel from './components/skill_panel.js'
import Buttons from './components/buttons';
import CTAT_Tutor from './ReactCTAT_Tutor';
import { vw, vh, vmin, vmax } from 'react-native-expo-viewport-units';
import ButtonsMachine from './state_machine.js'
import NonInteractive_SM from './state_machine.js'
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
var state_machine = ButtonsMachine.initialState
var state_machine_service = interpret(ButtonsMachine)
state_machine_service.start()

var ctat_state_machine = NonInteractive_SM.initialState
var ctat_state_machine_service = interpret(NonInteractive_SM)
ctat_state_machine_service.start()

// ctat_state_machine_service.onTr

// ctat_state_machine_service.onTransition(current => {
//     setButtonsState(current,window.debugmode)
    
//     // this.setState({ current : current })
//     }
//   );


const HomeScreen = () => {
  return (
	<View style={styles.container}>
		<View style={styles.ctat_tutor}>
			<CTAT_Tutor
        ref={function(tutor) {window.tutor = tutor; console.log("TUTOR IS:",tutor)}}
        id="tutor_iframe"
        current_state={ctat_state_machine}
        sm_service={ctat_state_machine_service}
        interactive={false}
      />
		</View>
		<View style={styles.controls}>
			<View style={styles.skill_panel}>
				<SkillPanel/>
			</View>
			<View style={styles.buttons}>
				<Buttons
				current={state_machine}
				service={state_machine_service}
				debugmode={true}
				callbacks={window.button_callbacks}
				nools_callback={window.nools_callback}/>
			</View>
		</View>
	</View>
  );
};


const styles = StyleSheet.create({
	container : {
	  justifyContent: "stretch",
      // padding: 20,
      // alignItems:'center',
      // backgroundColor: "blue",
      flex: 1,
        flexDirection: "column",
        // flexWrap: "wrap"
      },
      ctat_tutor: {

      	// backgroundColor: 'powderblue',
      	// flexBasis: 600,
      	// flexGrow: 1,
      	// height : "65%",
      	// width : "100%",
        // width:800,
        // height: vh(64),
        // flexGrow: 100,
        margin: 4,
        flex: 1,

      },
      controls :{

      	// flexGrow: 1,
      	// flexBasis: 300,
        // display: "flex",
        // width : 
        
        flexDirection: "row",
        // flexWrap: "wrap",
        // width : 600,
        // flexGrow: 1,
        // flexBasis:  600,
        // height: vh(35),
        // justifyContent: "center",
      },
      
      skill_panel : {
      	width: "65%",
      	// height: 300,
        // height: vh(35),
        // flexBasis: 6,
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
        /*width:300px;*/
        flexWrap: "wrap",
        justifySelf : "space-around",
        
        // flexBasis: 32,
        /*justify-self:  start;*/
        /*align-self:  ;*/
        /*padding: 60px,*/
        // justifyContent: "auto",
        
        // alignContent: "center"
        
      }

});

export default HomeScreen;