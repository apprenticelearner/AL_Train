import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { TouchableHighlight,ScrollView,View, Text, StyleSheet } from "react-native";
import Panel from './panel.js'


// import { useMachine } from '@xstate/react';


var text_by_mode = {"choose_foci": "Select any interface elements that were used to compute this result.",
                    "set_start": "Set the start state.",
                    "press_next": "Press next to continue.",
                    "demonstrate" : "Demonstrate the next step."
                    }

// function gen_query_text(){
//   let h = <Text style={{"color":"darkorchid",'textShadowRadius':3, 'textShadowColor': "darkorchid"}}>{"highlighted"}</Text>
//   return ["Or specify if the ", h ," input is correct for the next step."]
// }
var h = <Text style={{"color":"darkorchid",'textShadowRadius':3, 'textShadowColor': "darkorchid"}}>{"highlighted"}</Text>
var query_text = ["Or specify if the ", h ," input is correct for the next step."]


class Buttons extends Component{
  constructor(props){
        super(props);
        
        // props.mode = "feedback"
        // props.yes_no = false
        // props.current
  }

  // componentDidMount() {
  //   this.service.start();
  // }

  // componentWillUnmount() {
  //   this.service.stop();
  // }


	render(){ 
    const current = this.props.current;
    console.log(current)
    const matches = (x) => current.matches ? current.matches(x) : x == "Specify_Start_State";
    const send  = (action_str) => {
      console.log(action_str)
      console.log(this.props.callbacks)
      if(this.props.callbacks && action_str in this.props.callbacks){
        this.props.callbacks[action_str]();
      }
      this.props.service.send(action_str);
    }
    // console.log(send)


		return (
          <View style={styles.container}>
            <View style={styles.button_wrapper1}>
              <Text style={styles.prompt1}> 
              {matches("Specify_Start_State") &&
               "Set the start state."}
              {matches("Query_Demonstrate") &&
               "Demonstrate the next step."}
              {matches("Explantions_Displayed") &&
               "Press next to continue. Or demonstrate the next step."}
              {matches("Request_Foci") &&
               "Select any interface elements that were used to compute this result."}
              
              </Text>

              {matches("Request_Foci") &&
              <TouchableHighlight style={styles.next_button} underlayColor="#CCCCCC"
                                onPress={() => send('FOCI_DONE')}>
               <Text style={styles.next_button_text}>{"Next"}</Text>
              </TouchableHighlight>
              } 

              {matches("Explantions_Displayed") &&
              <TouchableHighlight style={styles.next_button} underlayColor="#CCCCCC"
                                onPress={() => send('NEXT_PRESSED')}>
               <Text style={styles.next_button_text}>{"Next"}</Text>
              </TouchableHighlight>
              }

              {matches("Specify_Start_State") &&
              <TouchableHighlight style={styles.startstate_button} underlayColor="#CCCCCC"
                                onPress={ ()=> send("START_STATE_SET")}>
               <Text style={styles.startstate_button_text}>{"Start State Done"}</Text>
              </TouchableHighlight>
              }
            </View>

            
            
              
              

            {(matches({"Query_Demonstrate":"Query_Yes_No_Feedback"})
             || matches({"Query_Demonstrate":"Query_Submit_Feedback"})) &&

            <View style={styles.button_wrapper2}>
              <Text style={styles.prompt2}> 
              {matches({"Query_Demonstrate":"Query_Yes_No_Feedback"}) && query_text}
              {matches({"Query_Demonstrate":"Query_Submit_Feedback"}) &&
                "Or press submit to send the feedback from the skill panel."}
              </Text>
              {matches({"Query_Demonstrate":"Query_Yes_No_Feedback"}) &&
              <View style={styles.yes_no}>
                <TouchableHighlight style={styles.yes_button} underlayColor="#CCCCCC" 
                                  onPress={() => send('YES_PRESSED')}>
                 <Text style={styles.yes_button_text}>{"YES"}</Text>
                </TouchableHighlight>
                <TouchableHighlight style={styles.no_button} underlayColor="#CCCCCC" 
                                  onPress={() => send('NO_PRESSED')}>
                 <Text style={styles.no_button_text}>{"NO"}</Text>
                </TouchableHighlight>
              </View>
              }
              {matches({"Query_Demonstrate":"Query_Submit_Feedback"}) &&
                <TouchableHighlight style={styles.submit_button} underlayColor="#CCCCCC" 
                                  onPress={() => send('SUBMIT_SKILL_FEEDBACK')}>
                 <Text style={styles.submit_button_text}>{"Submit"}</Text>
                </TouchableHighlight>
              }
            
            </View>
            }
            
            

            
            {!this.props.debugmode && 
            <View style={styles.button_wrapper3}>
              <TouchableHighlight style={styles.nools_button} underlayColor="#CCCCCC" 
                                  onPress={this.props.nools_callback}>
               <Text style={styles.nools_button_text}>{"Generate Nools"}</Text>
              </TouchableHighlight>
            </View>
            }

            {this.props.debugmode && 
            <View style={styles.button_wrapper3}>
              <View style={{display:'absolute',bottom:0,flexDirection:"row"}}>
                <TouchableHighlight style={[styles.yes_button,{height:20}]} underlayColor="#CCCCCC"
                      onPress={() => send('DEMONSTRATE')}>
                     <Text style={{fontSize : 10}}>{"Demonstrate"}</Text>
                </TouchableHighlight>
                <TouchableHighlight style={[styles.yes_button,{height:20}]} underlayColor="#CCCCCC" onPress={ ()=>{}}
                      onPress={() => send('DONE')}>
                     <Text style={{fontSize : 10}}>{"Done"}</Text>
                </TouchableHighlight>
                <TouchableHighlight style={[styles.yes_button,{height:20}]} underlayColor="#CCCCCC" onPress={ ()=>{}}
                      onPress={() => send('APPLICABLE_SKILLS_RECIEVED')}>
                     <Text style={{fontSize : 10}}>{"Req recieved"}</Text>
                </TouchableHighlight>                
              </View>
            </View>
          }
        </View>

        

		  );
	}

}

const styles = StyleSheet.create({

  "container": {
    display: "flex",
    "height" : "100%",
  },

  "prompt1" : {
    fontSize: 20,
    "textAlign":"center",
    margin : 5,
  },

  "prompt2" : {
    fontSize: 20,
    "textAlign":"center",
    margin : 5,
  },

  "button_wrapper1":{
    display:"flex",
    flexDirection: "column",
    alignItems: "center",
    flexBasis : "40%",
    // "pointerEvents": "none",

  },

  "button_wrapper2":{
    display:"flex",
    flexDirection: "column",
    alignItems: "center",
    // flexBasis : "40%",
    flexShrink: 1,
    // "pointerEvents": "none",

  },

  "button_wrapper3":{
    display:"flex",
    flexDirection: "column",
    alignItems: "center",
    // flexBasis : "20%",
    marginTop: "auto",
    justifySelf: "flex-end",
    // "pointerEvents": "none",

  },

  "yes_no":{

    display:"flex",
    flexDirection: "row",
    // justifyContent: "space-between"
    // marginVertical: 10

  },

  "nools_button" : {
    position: "absolute",
    bottom: 5,
    padding: 5,
    // "top":100,
    "width":200,
    "backgroundColor": "#999999",
    // justifySelf: "bottom",
    borderRadius: 5,
    
  },

  "nools_button_text" : {
    "fontSize":18,
    "textAlign":"center",

  },

  "startstate_button" : {
    "position": "relative",
    "width":200,
    "fontSize":18,
    "backgroundColor": "#4CAF50",
     borderRadius: 5,
     padding: 5,
    // "pointerEvents": auto;
  },
  "startstate_button_text" : {
    "fontSize":20,
    "textAlign":"center",
  },

  "yes_button" :{
    "width":80,
    "backgroundColor": "#4CAF50",
    borderRadius: 6,
    margin: 8,
    padding: 4,
    // "pointerEvents": auto;
  },
  "yes_button_text" : {
    "fontSize":30,
    "textAlign":"center",
  },

   "no_button" :{
    "width":80,
    "backgroundColor": "#f44336",
    borderRadius: 6,
    margin: 8,
    padding: 4,
    // "pointerEvents": auto;
  },

  "no_button_text" : {
    "fontSize":30,
    "textAlign":"center",
  },

  "next_button" : {
    // display: "relative",
    // bottom: 0,
    width:100,
    backgroundColor: "#4CAFFF",
    borderRadius: 6,
    margin: 10,
    padding: 5,
    // "pointerEvents": auto;
  },

  "next_button_text" : {
    "fontSize":35,
    "textAlign":"center",
  },

  "submit_button" : {
    // display: "relative",
    // bottom: 0,
    width:150,
    backgroundColor: "#4CAFFF",
    borderRadius: 6,
    margin: 10,
    padding: 5,
    // "pointerEvents": auto;
  },

  "submit_button_text" : {
    "fontSize":30,
    "textAlign":"center",
  },

  "prompt_text" :{
    /*display:flex;*/
    "textAlign":"center",
    "fontSize":25,

  }, 

});


export default Buttons;
