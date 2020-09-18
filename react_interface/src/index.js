/**
 * Copyright (c) 2020
 *
 * This is the entry point for using AL_Trainer by passing url query
 *  strings to specify the host server, AL server, training_file 
 *  and so forth.
 * 
 * @summary Entry point for AL_Trainer initialized by query strings.
 * @author Daniel Weitekamp <dannyweitekamp@gmail.com>
 *
 */

import { registerRootComponent } from 'expo';
import React from "react";
import {View, Text} from "react-native";
import RJSON from "relaxed-json";
import autobind from 'class-autobind';

import CTAT_Tutor from "./tutors/CTAT/CTAT_Tutor";
import StylusTutor from './tutors/Stylus/StylusTutor';
import AL_Trainer from "./al_trainer";

const tutor_map = {
  ctatttutor: CTAT_Tutor,
  ctat: CTAT_Tutor,
  "stylustutor" : StylusTutor,
  "stylus" : StylusTutor,
};

function load_training_file(training_file) {
  return fetch(training_file)
    .then(str => str.text()) //str.json())
    .then(str => RJSON.parse(str)) //str.json())
    .catch(err => "Training File Error")
}

function safeParse(json) {
  var parsed;
  try {
    parsed = JSON.parse(json);
  } catch (e) {
    parsed = null;
  }
  return parsed;
}

function getWebProps() {
  var urlParams = new URLSearchParams(window.location.search.substring(1));
  console.log(window.location.search);
  console.log(urlParams);

  var props = {
    AL_URL: urlParams.get("al_url"),
    OUTER_LOOP_URL: urlParams.get("outer_loop_url"),
    HOST_URL: window.location.origin,
    training_file: urlParams.get("training"),
    interactive: safeParse((urlParams.get("interactive") || "").toLowerCase()),
    use_foci: safeParse((urlParams.get("use_foci") || "").toLowerCase()),
    use_skill_label: safeParse((urlParams.get("use_skill_label") || "").toLowerCase()),
    whole_conflict_set: safeParse((urlParams.get("whole_conflict_set") || "").toLowerCase()),
    tutor: urlParams.get("tutor"),
    nools_dir: urlParams.get("nools_dir")
  };

  console.log("PROPS", props, urlParams.get("interactive"));
  return props;
}

function removeEmpty(obj) {
  var out = {};
  console.log(obj);
  Object.keys(obj).forEach(key => {
    console.log(key);
    if (obj[key] != null) {
      out[key] = obj[key];
    }
  });
  return out;
}

class QueryStrInitializedTrainer extends React.Component {
  constructor(props){
    super(props);
    autobind(this);
    this.state ={prompt: "loading..."}
  }
  componentDidMount(){
    var props = getWebProps();

    props.training_file = props.training_file || "/stylus_author.json";

    load_training_file(props.training_file).then((training_json) => {
      var training_file_props = training_json.set_params;
      props = { ...training_file_props, ...removeEmpty(props) };
      props.tutor = (props.tutor || "ctat").toLowerCase().replace("_", "");
      return props
    }).then((props) => {
      var tutorClass = tutor_map[props.tutor] || CTAT_Tutor
      if(props && tutorClass){
        this.setState({props: props, tutorClass: tutorClass})  
      }else{
        this.setState({prompt: 'ERROR!'})  
      }
    })
  }
  render() {
    if(!this.state.props || !this.state.tutorClass){
      return (
        <View style={{width:"100%",height:"100%",
          justifyContent:'center',alignContent:'center', backgroundColor:"pink"}}>
          <Text style={{textAlign:'center', fontSize:40}}> {this.state.prompt}</Text>
        </View>
      )
    }else{
      return (
        <AL_Trainer
          ref={app => {
            window.react_interface = app;
          }}        
          tutorClass={this.state.tutorClass}
          {...this.state.props}
        />
      )
    }
  }
}

registerRootComponent(QueryStrInitializedTrainer);

