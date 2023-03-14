import React from "react";
import {create} from "zustand";
import {load_training_file, sleep} from "./utils";
import {makeChangeStore} from "change-store";
import NetworkLayer from "./network_layer";

const tutor_wrappers = (() => ({
  'ctat' : React.lazy(() => import('./tutorwrappers/ctat')),
}))() // Wrap in function then call to force rebuilt on page refresh

const bool_params = ['interactive', 'use_arg_foci', 'use_skill_label']

export const useAppStore = create((set,get) => ({
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

    // Whether is in interactive or batch mode 
    interactive: true,

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

    // A prompt 
    prompt : "",

    // Whether or not has finished loading
    loaded : false,

    // An error message 
    error : false,


    setTutorKind: async (tutor_kind) =>  {
      // Normalize the tutor kind and path

      // if(false){
      //   let split = tutor_kind.split("/")
      //   let dir = split.slice(0,-1).join("/") || "./tutorwrappers/"
      //   tutor_kind = split[split.length-1]
      //   let tutor_kind_path = `${dir}${tutor_kind}`
      //   console.log(tutor_kind_path)
      //   // Lazy import the tutor class 
      //   let tutor_class = await import(`${dir}${tutor_kind}`).catch(
      //       (e) => {
      //         console.log("ERROR", e);
      //         set({"error": e})
      //         return null
      //       }
      //   )
      //   set({tutor_kind, tutor_kind_path, tutor_class, error:false})
      // }
      let tutor_class = tutor_wrappers[tutor_kind]
      console.log("BLEHH", tutor_kind, tutor_class)
      set({tutor_kind, tutor_class, error:false})
      // return 
    },

    setTrainingFile: async (filepath) => {
      set({training_file: filepath, 
           error: filepath ? null: "Cannot Batch Train. No Training File Provided."})
      if(!filepath){return}

      let state = get()

      // console.log("START", filepath)
      // Load the training file
      let training_config = await load_training_file(filepath).catch((e)=>{
        let error = "Error Loading Training File:\n" + e
        console.error(error)
        set({error})
      })
      if(!training_config){return}

      let {tutor_kind, tutor,...config} = training_config?.set_params ?? {}
      tutor_kind = (tutor_kind || tutor || state.tutor_kind)

      // console.log("THERE", tutor_kind)

      // Set with specialized setTutorKind
      if(tutor_kind){
        await state.setTutorKind(tutor_kind)
      }else{
        set({"error" : `Unrecognized Tutor Kind: ${tutor_kind}`})
      }
      // console.log("CONFIG", training_config)
      set({training_config: training_config, error:null})
    },

    setConfig: (config) => set((state) => {
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
        return {...config, network_layer: nl}
      }
      return config
    }),

    setLoaded: (loaded) => set((state) => {return {loaded: loaded}}),

}))

export let useAppStoreChange = makeChangeStore(useAppStore)




