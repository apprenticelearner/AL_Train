/**
 * Copyright (c) 2022
 *
 * @summary Tools for using various sources to configure training. 
 * @author Daniel Weitekamp <dannyweitekamp@gmail.com>
 *
 */

import RJSON from "relaxed-json";

/**
 * Fetch and parse a training.json file.
 */
function load_training_file(training_file) {
  return fetch(training_file)
    .then(str => str.text()) //str.json())
    .then(str => RJSON.parse(str)) //str.json())
    .catch(err => "Training File Error")
}

/**
 * Parse JSON successfully or null.
 */
function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch (e) {
    return null
  }
}

/**
 * Removes null values from object.
 */
function removeEmpty(obj) {
  var out = {};
  Object.keys(obj).forEach(key => {
    console.log(key);
    if (obj[key] != null) {
      out[key] = obj[key];
    }
  });
  return out;
}


/**
 * Gets any props embedded in the URL's query string
 */
function getURLProps(query_str) {
  query_str = query_str || window.location.search
  query_str = query_str.substring[0] == "?" ? query_str.substring(1) : query_str
  var urlParams = new URLSearchParams(query_str);
  // console.log(window.location.search);
  // console.log(urlParams);

  var props = {
    al_url: urlParams.get("al_url"),
    outer_loop_url: urlParams.get("outer_loop_url"),
    host_url: window.location.origin,
    training_file: urlParams.get("training"),
    interactive: safeParse((urlParams.get("interactive") || "").toLowerCase()),
    // use_foci: safeParse((urlParams.get("use_foci") || "").toLowerCase()),
    // use_skill_label: safeParse((urlParams.get("use_skill_label") || "").toLowerCase()),
    // whole_conflict_set: safeParse((urlParams.get("whole_conflict_set") || "").toLowerCase()),
    tutor_kind: urlParams.get("tutor_kind"),
    // nools_dir: urlParams.get("nools_dir")
  };

  // console.log("PROPS", props, urlParams.get("interactive"));
  return props;
}

export default async function loadConfig(){
  p = new Promise((resolve, reject)=>{
    let props = getWebProps();
    if(props.training_file){
      load_training_file(props.training_file).then((training_json) => {
        var training_file_props = training_json.set_params;
        props = { ...training_file_props, ...removeEmpty(props) };
        props.tutor_kind = (props.tutor_kind || "html").toLowerCase().replace("_", "");
        resolve(props)
      })
    }else{
      resolve(props)  
    }
  })
  return p
}
