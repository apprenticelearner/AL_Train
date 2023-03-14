/**
 * Copyright (c) 2022
 *
 * This is the entry point for the altrain interface by passing url query
 *  strings to specify the host server, agent server, training_file 
 *  and so forth.
 * 
 * @summary Entry point for altrain interface initialized by query strings.
 * @author Daniel Weitekamp <dannyweitekamp@gmail.com>
 *
 */

import React, { useEffect } from "react";
import {useAppStoreChange} from './app_store';
import BatchTrainer from "./batch_train/batch_trainer";
import {getURLParams} from "./utils";
import {Oval} from "react-loader-spinner";
import AuthoringInterface from "./author/author";

function LoadingPage(){
  const [prompt] = useAppStoreChange(['@prompt'])
  return (
    <div style={styles.info_page}>
      <div style={{flexDirection: "column", alignSelf: "center"}}>
      <Oval
          height={160} width={160} color="#4fa94d" secondaryColor="#4fa94d"
          strokeWidth={5} strokeWidthSecondary={5}
      />
      <p style={{textAlign:'center',
                 fontFamily:"Copperplate, Courier New",
                 fontSize:40}}>
        loading
      </p>
      </div>
    </div>
  )
}
function ErrorPage({error:prop_error}){
  const [error] = useAppStoreChange(['@error'])
  return (
    <div style={{...styles.info_page, backgroundColor:"pink"}}>
      <p style={{textAlign:'center', fontSize:40}}> {prop_error || error}</p>
    </div>
  )
}

const default_config = {
  "agent" : {
    "name": "Unamed Agent",
    "type": "CREAgent",
    "args": {
      "search_depth" : 2,
      "how": "set_chaining",
      "when": "decisiontree",
      "where": "most_specific",
      "function_set" : ["Add", "Subtract", "Multiply", "Divide"],
      "feature_set" : ["Equals"],
    }
  },
  author : true
}

export default function ALTrain(){
    const [is_batch_train, is_author,
           tutor_class,  loaded, error, setConfig, setLoaded, setTrainingConfig] = useAppStoreChange(
          ['@training_config.batch_train!=null', '@training_config.author!=null', 
           '@tutor_class', '@loaded', '@error', 'setConfig', 'setLoaded', 'setTrainingConfig']
    )
    // OnMount
    useEffect(() =>{
      setLoaded(false)
      let {training, ...config} = getURLParams()
      // If a training file was provided parse it and write any config.
      if(training){
        setTrainingConfig(training).then( ()=>{
          // Any config set by the user in URL params should override training file.
          setConfig(config)
          setLoaded(true)
        })
      }else{
        setConfig(default_config)
        setLoaded(true)
      }
    }, [])

    console.log("ALTRAIN RENDER", is_batch_train, is_author, loaded, error)

    if(error){
      return (<ErrorPage/>)
    }else if(!loaded){
      return (<LoadingPage/>)
    }

    if(is_author){
      return (<AuthoringInterface/>)
    }

    if(!is_batch_train){
      if(tutor_class){
        return (<BatchTrainer/>)  
      }else{
        return (<ErrorPage/>)
      }
    }else{
      return (<ErrorPage error="Configuration Missing 'author' or 'batch_train'."/>)
    }
}

const styles = {
  info_page : {
      display:"flex",
      justifyContent:'center',
      alignSelf:'center',
      width:"100%",
      height:"100%",
  },
}
