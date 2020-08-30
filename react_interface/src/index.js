import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import SkillPanel from "./components/skill_panel";
import Buttons from "./components/buttons";
import * as serviceWorker from "./serviceWorker";
// import ButtonsMachine from './interactions.js'

import { interpret } from "xstate";
import CTAT_Tutor from "./tutors/CTAT/CTAT_Tutor";
import StylusTutor from './tutors/Stylus/StylusTutor';
import App from "./App";
import RJSON from "relaxed-json";


const tutor_map = {
  ctatttutor: CTAT_Tutor,
  ctat: CTAT_Tutor,
  "stylustutor" : StylusTutor,
  "stylus" : StylusTutor,
};




function load_training_file(training_file) {
  // console.log("SLOOPERZ",training_file)
  return fetch(training_file)
    .then(str => str.text()) //str.json())
    .then(str => RJSON.parse(str)); //str.json())
}

function safeParse(json) {
  var parsed;
  try {
    parsed = JSON.parse(json);
  } catch (e) {
    parsed = null;
  }
  return parsed;
}

function getWebProps() {
  var urlParams = new URLSearchParams(window.location.search.substring(1));
  console.log(window.location.search);
  console.log(urlParams);

  var props = {
    AL_URL: urlParams.get("al_url"),
    OUTER_LOOP_URL: urlParams.get("outer_loop_url"),
    HOST_URL: window.location.origin,
    training_file: urlParams.get("training"),
    interactive: safeParse((urlParams.get("interactive") || "").toLowerCase()),
    use_foci: safeParse((urlParams.get("use_foci") || "").toLowerCase()),
    use_skill_label: safeParse((urlParams.get("use_skill_label") || "").toLowerCase()),
    whole_conflict_set: safeParse((urlParams.get("whole_conflict_set") || "").toLowerCase()),
    tutor: urlParams.get("tutor"),
    nools_dir: urlParams.get("nools_dir")
  };

  console.log("PROPS", props, urlParams.get("interactive"));
  return props;
}

function removeEmpty(obj) {
  var out = {};
  console.log(obj);
  Object.keys(obj).forEach(key => {
    console.log(key);
    if (obj[key] != null) {
      out[key] = obj[key];
    }
  });
  return out;
}

var props = getWebProps();

props.training_file = props.training_file || "/stylus_author.json";
// console.log("WEE", props.training_file)

load_training_file(props.training_file).then(function(training_json) {
  // console.log("BOOPERSZ", training_json)
  var training_file_props = training_json.set_params;
  props = { ...training_file_props, ...removeEmpty(props) };
  props.tutor = (props.tutor || "ctat").toLowerCase().replace("_", "");
  return props
}).then(function(props){
  var tutorClass = tutor_map[props.tutor] || CTAT_Tutor
  console.log("TC", tutorClass, props.tutor)
  ////EVENTUALLY WILL WANT OT DYNAMICALLY IMPORT////
  // if(props.tutor in tutor_map){props.tutor = tutor_map[props.tutor]}
  // var tutorClass = (await import(props.tutor)).default
  /////////////////////////////////////////////////
  return [props,tutorClass]
}).then(function(args){
  var [props,tutorClass] = args
  ReactDOM.render(
    <App
      ref={app => {
        window.react_interface = app;
      }}
      //style={{ height: "100%", width : "100%" }}
      //tutorClass={tutor_map[props.tutor] || StylusTutor}
      //tutorClass={tutor_map[props.tutor]}
      tutorClass={tutorClass}
      {...props}
    />,
    document.getElementById("root")
  );
});

/*
if (false) {
  // function setSkillWindowState(evt){

  // }
  // window.state_machine = ButtonsMachine.initialState
  // window.state_machine_service = interpret(ButtonsMachine)
  // window.state_machine_service.start()

  // const state = {
  //   current:
  // };
  // window.state_machine_service.onTransition(current => {
  // 	console.log("current.value")
  // 	console.log(current.value)
  // 	setButtonsState(current,window.debugmode)

  //   // this.setState({ current : current })
  //   }
  // );

  // function setButtonCallbacks(callbacks){
  // window.button_callbacks = callbacks
  // }
  // window.setButtonCallbacks = setButtonCallbacks

  // function setNoolsCallback(callback){
  // 	window.nools_callback = callback
  // }
  // window.setNoolsCallback = setNoolsCallback

  function setSkillWindowState(
    skill_set,
    select_callback,
    correctness_callback,
    initial_select = null,
    where_colors = null
  ) {
    ReactDOM.render(
      //<View>
      <CTAT_Tutor></CTAT_Tutor>,
      //<SkillPanel skill_set={skill_set}
      //						select_callback={select_callback}
      //						correctness_callback={correctness_callback}
      //							initial_select={initial_select}
      //							where_colors={where_colors || undefined}
      //								current = {window.state_machine}
      //								service = {window.state_machine_service}
      //
      //								/>
      //		</View>
      document.getElementById("skill_panel")
    );
  }

  function setButtonsState(current, debugmode = false) {
    window.state_machine = current;
    ReactDOM.render(
      <Buttons
        current={current}
        service={window.state_machine_service}
        debugmode={debugmode}
        callbacks={window.button_callbacks}
        nools_callback={window.nools_callback}
      />,
      document.getElementById("buttons")
    );
  }

  window.setSkillWindowState = setSkillWindowState;
  window.setButtonCallbacks = setSkillWindowState;
  window.setButtonsState = setButtonsState;

  // function render(){
  // let sections = [
  // 	              {title: 'D', data: ['Devin the long named fool']},
  // 	              {title: 'J', data: ['Jackson', 'James', 'Jillian', 'Jimmy', 'Joel', 'John', 'Julie']},
  // 	              {title: 'B', data: ['Backson', 'Bames', 'Billian', 'Bimmy', 'Boel', 'Bohn', 'Bulie']},
  // 	            ];

  let test_skills = {
    explanations: [
      {
        name: "E0 + E1",
        how: "E0 + E1",
        where: { A: { B: 1 } },
        when: "WHEN PART",
        which: 7.0,
        mapping: { "?sel": "A1", "?arg0": "B1", "?arg1": "C1" }
      },
      {
        name: "E0 + E1",
        how: "E0 + E1",
        where: "WHERE PART",
        when: "WHEN PART",
        which: 7.0,
        mapping: { "?sel": "A2", "?arg0": "B2", "?arg1": "C2" }
      },
      {
        name: "(E0 + E1) // 10",
        how: "(E0 + E1) // 10",
        where: "WHERE PART",
        when: "WHEN PART",
        which: 4.0,
        mapping: { "?sel": "A1", "?arg0": "B1", "?arg1": "C1" }
      },
      {
        name: "(E0 + E1) // 10",
        how: "(E0 + E1) // 10",
        where: "WHERE PART",
        when: "WHEN PART",
        which: 4.0,
        mapping: { "?sel": "A2", "?arg0": "B2", "?arg1": "C2" }
      }
    ],
    "other skills": [
      {
        name: "(E0 + E1) // 10",
        how: "E0 + E1 + E2",
        where: "WHERE PART (E0 + E1 + E2)",
        when: "WHEN PART (E0 + E1 + E2)",
        which: 3.0
      },
      {
        name: "(E0 + E1 + E2) // 10",
        how: "E0 + E1",
        where: "WHERE PART ((E0 + E1 + E2) // 10)",
        when: "WHEN PART ((E0 + E1 + E2) // 10)",
        which: 8.0
      }
    ]
  };
  // setSkillWindowState({"skills:": []});

  if (!process.env.NODE_ENV || process.env.NODE_ENV === "development") {
    window.debugmode = true;
    window.query_apprentice = () => {};
    setButtonsState(window.state_machine, true);
    setSkillWindowState(test_skills);
  } else {
    window.debugmode = false;
  }
}*/
// setButtonsState("press_next",true,true);

// }
// document.getElementById('render_button').addEventListener("click",render)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
