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

export function isAbsolute(str)
{
  if ( /^[A-Za-z]:\\/.test(str) ) return true;
  if ( str.indexOf("\\") === 0 )   return true;
  return false;
}

export function baseFile(str)
{
   var base = new String(str).substring(str.lastIndexOf('/') + 1); 
   return base;
}

export function baseName(str)
{
   var base = baseFile(str)
    if(base.lastIndexOf(".") !== -1)       
        base = base.substring(0, base.lastIndexOf("."));
   return base;
}

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

