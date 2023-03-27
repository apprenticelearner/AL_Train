import React, {useEffect, Suspense, useRef} from "react";
import {useALTrainStoreChange} from '../altrain_store';
import {useTrainStoreChange} from './train_store';


function BatchInfo({style}){
    let [train_desc, agent_desc, prob_desc, message, error, is_done] = (
      useTrainStoreChange(['@train_desc', '@agent_desc', '@prob_desc', '@message', '@error', '@mode=="AllDone"'])
    )
    console.log("BatchInfo", message, error, is_done)
    if(error){
      return (  
        <div style={{ ...style,...(error && {backgroundColor: 'pink'}) }}>
          <p>{error}</p>
        </div>
      )
    }else{
      message = (is_done && "All Done!") || message
      return (  
        <div style={{ ...style,...(is_done && {backgroundColor: 'green'}) }}>
          <p>{message||" "}</p>
          <p>{train_desc||"??"}</p>
          <p>{agent_desc||"??"}</p>
          <p>{prob_desc||"??"}</p>
        </div>
      )
    }
}

export default function BatchTrainer(){
  let [training_config, training_file, tutor_class, network_layer] = useALTrainStoreChange(['@training_config','@training_file', '@tutor_class', 'network_layer'])
  let [mode, setTutor, serveTrainingSet, setError] = useTrainStoreChange(['@mode', 'setTutor', 'serveTrainingSet', 'setError'])

  const Tutor = tutor_class
  let hasStarted = useRef(false)
  // On Mount / Config Change
  useEffect(() =>{
    
    if(training_config && !hasStarted.current){
      console.log("training_config", training_config)
      hasStarted.current = true
      serveTrainingSet(training_config, training_file, network_layer)
      .catch((e) => {
        setError(String(e))
        throw e
      })  
    }
  }, [training_config, tutor_class])

  let fallback_page = (<div style={styles.tutor}>Loading...</div>)

  return (
    <div style={styles.container}>
      {(Tutor && (
        <Suspense fallback={fallback_page}>
          <Tutor style={styles.tutor} ref={setTutor}/>
        </Suspense>) || fallback_page
      )}
      <BatchInfo style={styles.info}/>
    </div>
  )
}


const styles = {
  container: {
    height : "100%",
    width : "100%",
    display : "flex",
    alignItems : 'stretch',
    overflow: "hidden",
    flexGrow: 1,
    flexDirection: "column",
  },
  tutor : {
    flex: 65,
    margin: 4,
    // backgroundColor: "red"
  },
  info : {
    flex: 35,
    textAlign : "center",
    // backgroundColor: "blue"
  },
  prompt : {
    
  },
}
