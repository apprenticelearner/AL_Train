import { StatusBar } from 'expo-status-bar';
import React, { Component } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import TrainingOverlay from "./src/training_overlay.js"
import autobind from "class-autobind";

const state = {
  "A" : {
    contentEditable: true,
    type : "TextField",
  },
  "B" : {
    contentEditable: true,
    type : "TextField",
  },
  "C" : {
    contentEditable: true,
    type : "TextField",
  },
  "D" : {
    contentEditable: true,
    type : "TextField",
  },
  "Button" : {
    type : "Button",
  },
  "E" : {
    contentEditable: false,
    type : "TextField",
  },
  "F" : {
    contentEditable: false,
    type : "TextField",
  },
  "G" : {
    contentEditable: true,
    type : "TextField",
  },
}

const bounding_boxes = {
  "A" : {
    x : 100,
    y : 100,
    width: 100,
    height: 100,
  },
  "B" : {
    x : 250,
    y : 200,
    width: 200,
    height: 200,
  },
  "C" : {
    x : 250,
    y : 100,
    width: 100,
    height: 100,
  },
  "D" : {
    x : 50,
    y : 300,
    width: 100,
    height: 100,
  },
  "Button" : {
    x : 150,
    y : 500,
    width: 100,
    height: 50,
  },
  "E" : {
    x : 500,
    y : 300,
    width: 100,
    height: 100,
  },
  "F" : {
    x : 650,
    y : 300,
    width: 100,
    height: 100,
  },
  "G" : {
    x : 500,
    y : 500,
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

const NO_START_REWARD = true

if(NO_START_REWARD){
  for(let skill_app of skill_applications){
    skill_app['reward'] = 0
  }
}

export default class App extends Component{
  constructor(props){
    super(props);
    autobind(this)
    this.state = {start_state_mode: false}
  }
  render(){
    let fake_items = []
    for(let bb_n in bounding_boxes){
      let bb = bounding_boxes[bb_n]
      fake_items.push(
        <View style={{left: bb.x,
                      top: bb.y,
                      width: bb.width,
                      height: bb.height,
                      backgroundColor : 'rgba(180,180,180,.3)',
                      position: "absolute"
                    }}
              key={bb_n}
        /> 
      )
    }
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={{position:"absolute",bottom:10, right: 10, width:200,height:50,backgroundColor:'green'}}
          onPress={()=>{this.setState({start_state_mode: !this.state.start_state_mode})}}
        >
          <Text>{"START STATE MODE"}</Text>
        </TouchableOpacity>
        {fake_items}
        <TrainingOverlay skill_applications ={skill_applications}
          bounding_boxes = {bounding_boxes}
          start_state_mode = {this.state.start_state_mode}
        />
      </View>
    );
  }
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eeeedc'//'beige',
    // backgroundColor: 'white',
    // alignItems: 'center',
    // justifyContent: 'center',
  },
});
