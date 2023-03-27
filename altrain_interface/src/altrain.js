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
import {useALTrainStoreChange} from './altrain_store';
import {useAuthorStore, useAuthorStoreChange} from './author/author_store';
import BatchTrainer from "./batch_train/train";
import {getURLParams} from "./utils";

import AuthoringInterface from "./author/author";
import {LoadingPage, ErrorPage} from "./shared/info_pages";


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
    const [is_batch_train, is_author, getALTrainStore,
           tutor_class,  loaded, error, setConfig, setLoaded, setTrainingConfig] = useALTrainStoreChange(
          ['@training_config.batch_train!=null', '@training_config.author!=null', 'getALTrainStore',
           '@tutor_class', '@loaded', '@error', 'setConfig', 'setLoaded', 'setTrainingConfig']
    )
    const [initializeAuthoring] = useAuthorStoreChange(["initializeAuthoring"])

    // OnMount
    useEffect(() =>{
      let f = async () => {
        setLoaded(false)
        let {training, ...config} = getURLParams()
        // If a training file was provided parse it and write any config.
        if(training){
          // console.log("BEF")
          await setTrainingConfig(training).then( ()=>{
            // Any config set in URL params should override training file.
            // console.log("THEN")
            setConfig(config)
          })
          // console.log("AFT")
        }else{
          setConfig(default_config)
        }

        setLoaded(true)
        let {network_layer, training_config} = getALTrainStore()
        // console.log("training_config", training_config)
        if(training_config.author){
          // console.log("BEF initializeAuthoring")
          initializeAuthoring(training_config, network_layer)
        }
      }
      f()
    }, [])

    // console.log("ALTRAIN RENDER", is_batch_train, is_author, loaded, error)

    if(error){
      return (<ErrorPage/>)
    }else if(!loaded){
      return (<LoadingPage/>)
    }

    if(is_author){
      if(tutor_class){
        return (<AuthoringInterface/>)  
      }else{
        return (<ErrorPage/>)
      }
    }

    if(is_batch_train){
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

}
