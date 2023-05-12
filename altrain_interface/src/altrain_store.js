import React from "react";
import {create} from "zustand";
import {load_training_file, sleep} from "./utils";
import {makeChangeStore} from "change-store";
import NetworkLayer from "./network_layer";

const tutor_wrappers = (() => ({
  'ctat' : React.lazy(() => import('./tutorwrappers/ctat')),
}))() // Wrap in function then call to force rebuilt on page refresh

const bool_params = ['use_arg_foci', 'use_skill_label']

export const useALTrainStore = create((set,get) => ({
    // The URL of the server running the agent. 
    agent_url: "",

    // The URL of an outerloop controller process which selects next problems for the agent.
    outerloop_url: "",

    // The URL of the HOST server which provides tutor files and logging.
    host_url: null,

    // A .json file configuration file for configuring and training the agent
    training_file: "",

    // The parsed contents of training_file 
    training_config: "",

    // Whether should prompt for or automatically provide argument foci
    use_arg_foci: true,

    // Whether should prompt for or automatically provide skill labels
    use_skill_label: true,

    // The variety of tutoring system wrapper being used (e.g. "CTAT")
    tutor_kind: "ctat",

    // A react class for the tutor component
    tutor_class: null,    

    // The directory of Nools
    nools_dir: "",

    // Whether or not has finished loading
    loaded : false,

    // An error message 
    error : false,

    getALTrainStore: () => get(),

    setTutorKind: async (tutor_kind) =>  {
      // Normalize the tutor kind and path
      let tutor_class = tutor_wrappers[tutor_kind]
      console.log("BLEHH", tutor_kind, tutor_class)
      set({tutor_kind, tutor_class, error:false})
    },

    setTrainingConfig: async (training_config) => {
      let filepath;
      if(typeof training_config == "string"){
        filepath = training_config
        set({training_file: filepath})
        training_config = await load_training_file(filepath).catch((e)=>{
          let error = "Error Loading Training File:\n" + e
          console.error(error)
          set({error})
        })
        if(!training_config){return}
      }
      

      set({training_config : training_config, 
            error: filepath ? null: "No Training Configuration Provided."})  
      if(!training_config){return}

      let store = get()
      let {tutor_kind, tutor,...config} = training_config
      tutor_kind = (tutor_kind || tutor || store.tutor_kind)

      // Set with specialized setTutorKind
      if(tutor_kind){
        await store.setTutorKind(tutor_kind)
      }else{
        set({"error" : `Unrecognized Tutor Kind: ${tutor_kind}`})
      }
      console.log("CONFIG", training_config)
      set({training_config: training_config, error:null})
      return training_config
    },

    setConfig: (config) => {
      let d = {}
      let rebuild_network_layer = false
      for (const [key, value] of Object.entries(config)) {
        if(key.includes("url")){rebuild_network_layer = true}
        if(bool_params.includes(key)){
          d[key] = value !== "false"
        }else{
          d[key] = value
        }
      }
      if(rebuild_network_layer){
        let {agent_url, host_url, outerloop_url} = config
        let nl = new NetworkLayer(agent_url, host_url, outerloop_url)
        set({...config, network_layer: nl})
        return 
      }
      set(config)
    },

    setLoaded: (loaded) => {
      set({loaded: loaded})
    }

}))

export let useALTrainStoreChange = makeChangeStore(useALTrainStore)




