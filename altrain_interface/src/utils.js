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

import RJSON from "relaxed-json";
import CryptoJS, {WordArray} from "crypto-js"


export function load_training_file(training_file) {
  // console.log("load_training_file", training_file)
  return fetch(training_file)
    .then(str => str.text())
    .then(str => RJSON.parse(str))
}

export function safeParse(json) {
  var parsed;
  try {
    parsed = JSON.parse(json);
  } catch (e) {
    parsed = null;
  }
  return parsed;
}

export function getURLParams() {
  var urlParams = new URLSearchParams(window.location.search.substring(1));
  const config = {}
  for(const [key, value] of urlParams.entries()) { 
    config[key] = value;
  }
  if(!config['host_url']){

    config['host_url'] = window.location.origin
    console.log("GET ORIGIN", config['host_url'])
  }
  console.log("getURLParams", config)
  // var props = {
  //   agent_url: urlParams.get("agent_url"),
  //   outerloop_url: urlParams.get("outerloop_url"),
  //   host_url: window.location.origin,
  //   training_file: urlParams.get("training"),
  //   interactive: safeParse((urlParams.get("interactive") || "").toLowerCase()),
  //   use_arg_foci: safeParse((urlParams.get("use_arg_foci") || "").toLowerCase()),
  //   use_skill_label: safeParse((urlParams.get("use_skill_label") || "").toLowerCase()),
  //   tutor: urlParams.get("tutor"),
  //   tutor_kind: urlParams.get("tutor_kind"),
  //   tutor_path: urlParams.get("tutor_path"),
  //   nools_dir: urlParams.get("nools_dir")
  // };

  // console.log("PROPS", props, urlParams.get("interactive"));
  return config;
}

export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export const CTATGuid = {
  s4: function s4() {
    return Math.floor((1 + Math.random()) * 65536)
      .toString(16)
      .substring(1);
  },
  guid: function guid() {
    return (
      this.s4() +
      this.s4() +
      "-" +
      this.s4() +
      "-" +
      this.s4() +
      "-" +
      this.s4() +
      "-" +
      this.s4() +
      this.s4() +
      this.s4()
    );
  }
};

/* File Path Funcitons */
export function isAbsolute(str){
  if ( /^[A-Za-z]:\\/.test(str) ) return true;
  if ( str.indexOf("\\") === 0 )   return true;
  return false;
}

export function baseFile(str){
  console.log(str)
  var base = new String(str).substring(str.lastIndexOf('/') + 1); 
  return base;
}

export function baseName(str){
  var base = baseFile(str)
    if(base.lastIndexOf(".") !== -1)       
      base = base.substring(0, base.lastIndexOf("."));
  return base;
}


/* Randomness Functions */
export function shuffleArray(array) {
  array = [...array]
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array
}

export function sampleArray(array, n) {
  return shuffleArray(array).slice(0, n)
}

/* Style Functions */
export const gen_shadow = (x,kind='box',rest={}) => {
  let {red=0,green=0,blue=0,alpha} = rest
  if(!alpha){
    alpha = 0.10 + x * 0.015
  }
  let shadow_props = `0px ${(x*.4).toFixed(2)}px ${(x* .20).toFixed(2)}px rgba(${red},${green},${blue},${alpha})`
  if(kind == 'drop'){
    return `drop-shadow(${shadow_props})`
  }else{
    return shadow_props
  }
  return 
}




// TODO: This method isn't quite the same as the AL_CORE verison because it uses '-' and '_'
let randArr = CryptoJS.lib.WordArray.random
let Base64url = CryptoJS.enc.Base64url
export let randomUID = () => Base64url.stringify(randArr(30)).replace('-', 'A').replace('_', 'B');

export function shallowEqual(object1, object2) {
  let t1 = typeof object1
  let t2 = typeof object2
  if(t1 != t2){
    return false
  }
  if(t1 == "object"){
    const keys1 = Object.keys(object1);
    const keys2 = Object.keys(object2);
    if (keys1.length !== keys2.length) {
      return false;
    }
    for (let key of keys1) {
      if (object1[key] !== object2[key]) {
        return false;
      }
    }
  }
  return true;
}

export function arraysEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;
  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}


export const arg_symbols = ["A","B","C","D","E","F","G","H","I","J"]

// export {randomID, shallowEqual};



// export function removeEmpty(obj) {
//   var out = {};
//   // console.log(obj);
//   Object.keys(obj).forEach(key => {
//     console.log(key);
//     if (obj[key] != null) {
//       out[key] = obj[key];
//     }
//   });
//   return out;
// }

