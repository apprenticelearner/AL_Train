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
import AuthoringInterface from "authoring-interface";
import "./index.css";

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
function ErrorPage(){
  const [error] = useAppStoreChange(['@error'])
  return (
    <div style={{...styles.info_page, backgroundColor:"pink"}}>
      <p style={{textAlign:'center', fontSize:40}}> {error}</p>
    </div>
  )
}

export default function ALTrain(){
    const [tutor_class, interactive, loaded, error, setConfig, setLoaded,
           setTrainingFile] = useAppStoreChange(
          ['@tutor_class', '@interactive', '@loaded', '@error', 'setConfig', 'setLoaded',
            'setTrainingFile']
    )
    // OnMount
    useEffect(() =>{
      setLoaded(false)
      let {training, ...config} = getURLParams()
      // If a training file was provided parse it and write any config.
      setTrainingFile(training).then( ()=>{
        // Any config set by the user in URL params should override training file.
        setConfig(config)
        setLoaded(true)
      })
    }, [])

    if(error){
      return (<ErrorPage/>)
    }else if(!loaded){
      return (<LoadingPage/>)
    }

    if(!interactive){
      if(tutor_class){
        return (<BatchTrainer/>)  
      }else{
        return (<ErrorPage/>)
      }
    } else{
      return (<AuthoringInterface/>)
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
