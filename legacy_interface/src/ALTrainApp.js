/**
 * Copyright (c) 2020
 * 
 * @summary Entry point for AL Train App initialized by query strings.
 * @author Daniel Weitekamp <dannyweitekamp@gmail.com>
 *
 */

import React, { Component, createRef, useState, useEffect, useRef, Profiler } from 'react'
import RJSON from "relaxed-json";
import loadConfig from "./config.js"




export function ALTrainApp({}){
  const [is_loaded, setLoaded] = useState(false)

  //On mount load config.
  useEffect(async () => {
    let config = await loadConfig()
    console.log(config)
  }, []);

  return (
    //Show loading Screen
    (!is_loaded && 
      <div>I'm bob</div>
    ||
    //Show App
      <div>I'm loaded bob</div>
    )
  )
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



