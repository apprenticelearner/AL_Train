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
import {authorStore, useAuthorStore, useAuthorStoreChange} from './author/author_store';
import BatchTrainer from "./batch_train/train";
import {getURLParams} from "./utils";

import AuthoringInterface from "./author/author";
import {LoadingPage, ErrorPage} from "./shared/info_pages";


const default_config = {
  "agent" : {
    "name": "Unnamed Agent",
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
           tutor_class,  loaded, error, getALTrainStore] = useALTrainStoreChange(
          ['@training_config.batch_train!=null', '@training_config.author!=null', 
           '@tutor_class', '@loaded', '@error', 'getALTrainStore']
    )

    // OnMount
    useEffect(() =>{
      let f = async () => {
        let {setConfig, setLoaded, setTrainingConfig} = getALTrainStore()
        setLoaded(false)
        let {training, ...config} = getURLParams()
        let network_layer, training_config;
        // If a training file was provided parse it and write any config.
        if(training){
          training_config = await setTrainingConfig(training)
          // Apply after so configs set in URL params override training file.
          setConfig(config)
          // Abort loading/parsing training config parsing (ensures earliest error shown).
          if(!training_config){return};
        }else{
          setConfig(default_config)
        }

        ({network_layer, training_config, setLoaded} = getALTrainStore());
        setLoaded(true)
        if(!training_config){return};
        if(training_config.author){
          let {initializeAuthoring} = authorStore()
          initializeAuthoring(training_config, network_layer)
        }
      }
      f()
    }, [])

    // console.log("ALTRAIN RENDER", is_batch_train, is_author, loaded, error)
    let choose_content = () =>{
      if(error){
        return <ErrorPage/>
      }else if(!loaded){
        return <LoadingPage/>
      }

      if(is_author){
        if(tutor_class){
          return <AuthoringInterface/>
        }else{
          return <ErrorPage/>
        }
      }

      if(is_batch_train){
        if(tutor_class){
          return <BatchTrainer/>
        }else{
          return <ErrorPage/>
        }
      }else{
        return <ErrorPage error="Configuration Missing 'author' or 'batch_train'."/>
      }
    }

    return (
      <React.StrictMode>
        {choose_content()}
      </React.StrictMode>
    )
}
