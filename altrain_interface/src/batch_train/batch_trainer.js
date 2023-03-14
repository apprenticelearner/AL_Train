import React, {useEffect, Suspense} from "react";
import {useAppStoreChange} from '../app_store';
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
  let [training_config, training_file, tutor_class, network_layer] = useAppStoreChange(['@training_config','@training_file', '@tutor_class', 'network_layer'])
  let [mode, setTutor, serveTrainingSet, setError] = useTrainStoreChange(['@mode', 'setTutor', 'serveTrainingSet', 'setError'])

  const Tutor = tutor_class
  // const Tutor = React.lazy(async ()=>tutor_class)
  // const Tutor = CTAT_TutorWrapper

  // On Mount / Config Change
  useEffect(() =>{
    if(training_config){
      serveTrainingSet(training_config, training_file, network_layer)
      .catch((e) => {
        setError(String(e))
        throw e
      })  
      console.log("AFTER", network_layer)
    }
  }, [training_config, tutor_class])

  console.log("RERENDER", tutor_class)

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
