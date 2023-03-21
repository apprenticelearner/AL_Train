import React, {useEffect} from "react";
import deep_equal from 'fast-deep-equal'
import {baseName, isAbsolute} from "../utils"
import queryString from "query-string"
import {LoadingPage, ErrorPage} from "../shared/info_pages";

// const queryString = require("query-string");
const $ = require("jquery");


function checkTypes(element, types) {
  for (let i = types.length - 1; i >= 0; i--) {
    let type = types[i];
    let cl = [...element.classList]
    if(typeof type == "string"){
      if (cl.some(x=>(type==x)) ){
        return true
      }
      //Assume is regex otherwise
    }else{
      if (cl.some(x=>type.test(x))){
        return true
      }
    }
    
  }
  return false;
}

const default_where_colors = ["darkorchid", "#ff884d", "#52d0e0",
  "#feb201", "#e44161", "#ed3eea", "#2f85ee","#562ac6", "#cc24cc"]

const default_color_class_map = {
  DEMO: "CTAT--example",
  EXAMPLE: "CTAT--example",
  HINT: "CTAT--example",
  HINT_REQUEST: "CTAT--example",
  CORRECT: "CTAT--correct",
  INCORRECT: "CTAT--incorrect",
  HIGHLIGHT: "CTAT--AL_highlight",
  START_STATE: "CTAT--AL_start",
  ATTEMPT: "",
  DEFAULT: ""
};

/*
 Implements DOM Editing functionality of CTAT_TutorWrapper 
*/
let DomEditMixin = (superclass) => class extends superclass {
  getComponent = (name) => this.iframe_content.CTATShellTools.findComponent(name)?.[0]
  getElement = (name) => this.iframe_content.document.getElementById(name)
  lockElement = (name) => this.getComponent(name)?.setEnabled(false)
  unlockElement = (name) => this.getComponent(name)?.setEnabled(true)
  clearElement = (name) => this.getElement(name).firstElementChild.value = ""
  
  colorElement = (name, type) => {
    this.getElement(name)?.firstElementChild?.setAttribute("class", this.color_class_map[type]);
  }

  highlightElement = (name, colorIndex = 1) => {
    this.unhighlightElement(name);
    let elm = this.getElement(name)
    elm.firstElementChild.classList.add("CTAT--AL_highlight" + colorIndex);
    this.highlighted_elements.push(name);
  }

  unhighlightElement = (name) => {
    if (this.highlighted_elements.includes(name)) {
      let elm = this.getElement(name)
      let before = elm.firstElementChild.classList.toString();
      for (let i = 1; i <= this.where_colors.length; i++) {
        let c = "CTAT--AL_highlight" + i;
        if (elm.firstElementChild.classList.contains(c)) {
          elm.firstElementChild.classList.remove(c);
        }
      }
      let after = elm.firstElementChild.classList.toString();
      let index = this.highlighted_elements.indexOf(name);
      if (index > -1) {
        this.highlighted_elements.splice(index, 1);
      }
    }
  }

  unhighlightAll = () => {
    for (let elem_str of [...this.highlighted_elements]) {
      this.unhighlightElement(elem_str);
    }
  }
}

/*
 Implements base functionality of CTAT_TutorWrapper 
*/
let BaseMixin = (superclass) => class extends superclass {
  constructor(props){
    super(props)

    this.where_colors = default_where_colors
    this.color_class_map = default_color_class_map

    this.ctat_iframe = React.createRef();
    this.relative_pos_cache = {};
    this.state = { source: null}
  }

  /*** Load Problem ***/

  _triggerWhenInitialized = () => {
    this.iframe_content = this.ctat_iframe.current.contentWindow;
    const iframe_content = this.iframe_content;

    // Check that CTAT is defined
    if (!iframe_content?.CTAT?.ToolTutor?.tutor ||
        !iframe_content?.CTATCommShell?.commShell) {
      console.log("CTAT not defined yet...");
      window.setTimeout(() => {
        this._triggerWhenInitialized();
      }, 200);
      return;
    }

    // NOTE: there is an event and property "tutorInitialized" in
    //  iframe_content?.CTATTutor but doesn't ensure graph is loaded yet
    this.graph = iframe_content.CTAT.ToolTutor.tutor.getGraph() || false;
    this.commLibrary = iframe_content.CTATCommShell.commShell.getCommLibrary();
    this.hasConfig = !!iframe_content.CTATConfiguration
    this.tracer = iframe_content.globalTracerRef || false

    // Check that CTAT has been initialized
    if ( !(this.graph || this.interactive || this.tracer) ||
         !(this.commLibrary && this.hasConfig) ) {
      // term_print('\x1b[0;30;47m' + "BLEHH2" + '\x1b[0m');
      console.log("CTAT not initialized yet...");
      window.setTimeout(() => {
        this._triggerWhenInitialized();
      }, 200);
      return
    }


    this._inject_element("link", {
      href: "/host/css/AL_colors.css",
      type: "text/css",
      rel: "stylesheet"
    });

    //Gets rid of annyoing sai printout on every call to sendXML
    iframe_content?.flashlets?.setParams({ deliverymode: "bleehhhh" });

    //Grab these event constants from CTAT
    let EventType = iframe_content.CTAT.Component.Base.Tutorable.EventType
    this.CTAT_CORRECT = EventType.correct;
    this.CTAT_INCORRECT = EventType.incorrect;
    this.CTAT_ACTION = EventType.action;
    this.CTAT_UNGRADED = EventType.ungraded;

    console.log("CTAT INITIALIZED!");
    this.init_callback?.(this);

    // Prevent CTAT from adding annoying interior scrollbars
    this.iframe_content.$("body")[0].style.overflow = "hidden";
    iframe_content.removeEventListener('scroll', this.props.updateBoundsCallback)
    iframe_content.addEventListener('scroll', this.props.updateBoundsCallback)
    
  }

  _resolve_HTML_question_file = (prob_config, context) => {
    let {abs_qf_paths=true, HTML="", question_file} = prob_config
    question_file = question_file || "/host/empty.nools"
    let {working_dir, network_layer:nl} = context

    //Repalcing ".." w/ "!u" allows the host server to fetch above working dir
    HTML = HTML.replace(/\.\./g,"!u"); 
    question_file = question_file.replace(/\.\./g,"!u"); 
    console.log("question_file", question_file)

    // Ensure that paths have correct root paths
    if (!isAbsolute(HTML)) HTML = (working_dir || "/") + HTML;
    
    if(abs_qf_paths){
      if (!isAbsolute(question_file)) question_file = (working_dir || "/") + question_file
        console.log(nl.host_url)
      question_file = nl.host_url + question_file
    } 

    let qf_type = null;
    if(question_file.endsWith(".brd")){qf_type = 'brd'}
    if(question_file.endsWith(".nools")){qf_type = 'nools'}

    return {HTML, question_file, qf_type}
  }

  _init_logging_params = (prob_config, HTML, question_file, context) => {
    let HTML_name = baseName(HTML).replace(/\.[^/.]+$/, "")
    let domain_name = prob_config["domain_name"] || HTML_name;
    let problem_name = baseName(question_file).replace(/\.[^/.]+$/, "")
    let {agent_name, session_id} = context

    let logging_params = {
      problem_name: problem_name,
      dataset_level_name1: domain_name,
      dataset_level_type1: "Domain",  
      SessionLog: "true",
      Logging: "ClientToLogServer",
      log_service_url: window.location.origin,
      user_guid: agent_name,
      session_id: session_id
    };
    if ("problem_context" in prob_config) {
      logging_params["problem_context"] = prob_config["problem_context"];
    }
    if ("custom_fields" in prob_config) {
      let custom_fields = prob_config["custom_fields"];
      for (let [i, key] of Object.keys(custom_fields).entries()) {
        logging_params["custom_field_name" + String(i)] = key;
        logging_params["custom_field_value" + String(i)] = custom_fields[key];
      }
    }
    return logging_params
  }

  loadProblem = (prob_config, context={}, ...args) => {
    this.is_done = false
    let promise = new Promise((resolve, reject) => {

      let {HTML, question_file, qf_type} = this._resolve_HTML_question_file(prob_config, context)
      if(!qf_type){
        reject(`Unexpected question file extension ${question_file}. Expected .nools or .brd`)
      }

      // Note: both prob_rep and agent_rep are necessary to ensure the query string is unique across
      //  various kinds of repetition
      let {prob_rep=1, agent_rep=1} = prob_config
      let logging_params = this._init_logging_params(prob_config, HTML, question_file, context)
      let params = {question_file, ...logging_params, prob_rep, agent_rep}
      console.log("params", params)
      
      this.HTML_path = HTML;
      this.init_callback = () => {
        // let {callback} = args
        // if(callback){
        let elements = this.generateElementList()
        let bounding_boxes = this.getBoundingBoxes(elements)
        let minX, maxX, minY, maxY;
        for(let [id, rect] of Object.entries(bounding_boxes)){
          if(!(rect.x >= minX)) minX = rect.x;
          if(!(rect.y >= minY)) minY = rect.y;
          let [extX, extY] = [rect.x+rect.width, rect.y+rect.height];
          if(!(extX <= maxX)) maxX = extX
          if(!(extY <= maxY)) maxY = extY
        }
        console.log("bounding_boxes" ,minX, maxX, minY, maxY)
        // }
        resolve({x:minX, y:minY, width: maxX-minX, height:maxY-minY});
      };
      console.log(HTML)
      let source = HTML + "?" + queryString.stringify(params);

      if(source == this.state.source){
        console.warn("Warning: CTAT wrapper's source URL has not changed between calls to loadProblem." +
                      "This may stall training by preventing rerender. Ensure prob_configs are unique.")
      }
      
      this.graph = null; this.commLibrary = null; this.hasConfig = null;
      
      this.setState({
        source: source,
        onLoad: this._triggerWhenInitialized,
        qf_type: qf_type,
        // TODO: [nr] convert elements to string?
        steps: prob_config["only_step_ids"] ? prob_config["only_step_ids"].flat() : null,
        selections: prob_config["only_Selections"]
          ? prob_config["only_Selections"].flat() : null
      });
      console.log("LOOOO")
    });
    return promise;
  }

  /*** Get State ***/

  generateElementList = () =>{
    let state_array = this.iframe_content.$("div").toArray();
    let elements = this.elements = [];
    $.each(state_array, function(idx, element) {
      if (element.classList.contains("CTATComponent") &&
         !element.classList.contains("CTATTable")) {
        elements.push(element)
      }
    })
    return elements
  }

  getBoundingBoxes = (elements) =>{
    let bounding_boxes = {}
    for(let element of elements){
      let elm = (element?.firstElementChild ?? element)
      let rect = elm.getBoundingClientRect()
      let style = getComputedStyle(elm)
      // Remove Padding
      let {paddingLeft, paddingRight, paddingTop, paddingBottom} = style
           // 
      // console.log(style)
      rect.width -= parseFloat(paddingLeft) + parseFloat(paddingRight)
      rect.height -= parseFloat(paddingTop) + parseFloat(paddingBottom) 
      // For some reason CTAT buttons are quite weird
      // if(elm !== element){
      //   let {borderLeftWidth, borderRightWidth, borderTopWidth, borderBottomWidth} = style
      //   console.log("EE", element.id, borderLeftWidth, borderRightWidth, borderTopWidth, borderBottomWidth)
      // }
      
      bounding_boxes[element.id] = rect
    }
    return bounding_boxes
  }

  getState = ({
    encode_relative = false,
    strip_offsets = false,
    use_bounds = true,
    use_class = false,
    use_id = true,
    append_ele = false,
    numeric_values = false,
    clear_editable_values = true,
  } = {}) => {
    let relative_pos_cache = this.relative_pos_cache;
    let HTML_path = this.HTML_path;

    let elements = this.generateElementList()
    let bounding_boxes = this.getBoundingBoxes(elements)
    // state_array.push({current_task: current_task});

    let state_json = {};
    let count = 0;
    // $.each(state_array, function(idx, element) {
    for(let element of this.elements){
      let obj = {};
      if (
        element.classList.contains("CTATComponent") &&
        !element.classList.contains("CTATTable")
      ) {
        // if(obj["className"] == "CTATTextField") {continue;} //Skip table objects and just use cells
        if (element.classList[0] !== "CTATTextField") {
          //Skip text fields
          if (use_class) {
            obj["dom_class"] = element.classList[0];
          }
          if (use_bounds) {
            let rect = bounding_boxes[element.id]
            rect = {x :rect.x, y : rect.y, width : rect.width, height: rect.height }
            Object.assign(obj, rect)
            // obj["offsetParent"] = element.offsetParent.dataset.silexId;
            // obj["x"] = element.x;
            // obj["y"] = element.y;
            // obj["width"] = element.width;
            // obj["height"] = element.height;
          }

          if (use_id) {
            obj["id"] = element.id;
          }

          if (checkTypes(element, ["CTATTextInput","CTATComboBox","CTATTable--cell"])) {
            obj['type'] = "TextField"
            obj["value"] = element.firstElementChild.value;
            if (numeric_values) {
              obj["value"] = Number(obj["value"]) || obj["value"];
            }
            obj["locked"] = element.firstElementChild.contentEditable !== "true";

            if(clear_editable_values && obj["locked"] === true){
              obj['value'] = ""
            }
            // obj["name"] = element.id
          }else if(checkTypes(element, [/Button/g])){
            obj['type'] = "Button"
          }
          // if(checkTypes(element, ["CTATTextField", "CTATComboBox"])){
          //  obj["textContent"] = element.textContent;
          // }

          if (checkTypes(element, ["CTATComboBox"])) {
            obj['type'] = "ComboBox"
            // if(element.options){
            //Probably not the best
            let options = element.firstElementChild.options;
            let temp = [];
            for (let i = 0; i < options.length; i++) {
              temp.push(options[i].text);
            }
            obj["options"] = Object.assign({}, temp);

          }

          // console.log(">>", element.id, element)
          obj['visible'] = !((element.firstElementChild?.disabled ?? element.firstElementChild?.visible) ?? false)

          if(!obj['type']){obj['type'] = "Component"}
          let name = (append_ele ? "?ele-" : "") + element.id;
          // console.log(name,append_ele)
          state_json[name] = obj;
          count++;
        }
      }
    }

    // Gets lists of elements that are to the left, right and above the current element
    if (encode_relative) {
      const elm_list = Object.entries(state_json);
      // console.log(elm_list);

      let rel_objs;
      if (!(HTML_path in relative_pos_cache)) {
        rel_objs = {};
        for (let i = 0; i < elm_list.length; i++) {
          // console.log(elm_list[i][0])
          rel_objs[elm_list[i][0]] = {
            to_left: [],
            to_right: [],
            above: [],
            below: []
          };
        }

        for (let i = 0; i < elm_list.length; i++) {
          for (let j = 0; j < elm_list.length; j++) {
            if (i !== j) {
              let [a_n, a_obj] = elm_list[i];
              let [b_n, b_obj] = elm_list[j];
              let [a_bb, b_bb] = [bounding_boxes[a_n],bounding_boxes[b_n]]
              if (
                a_bb.y > b_bb.y &&
                a_bb.x < b_bb.x + b_bb.width &&
                a_bb.x + a_bb.width > b_bb.x
              ) {
                let dist = a_bb.y - b_bb.y;
                rel_objs[a_n]["above"].push([b_n, dist]);
                rel_objs[b_n]["below"].push([a_n, dist]);
              }
              if (
                a_bb.x < b_bb.x &&
                a_bb.y + a_bb.height > b_bb.y &&
                a_bb.y < b_bb.y + b_bb.height
              ) {
                let dist = b_bb.x - a_bb.x;
                rel_objs[a_n]["to_right"].push([b_n, dist]);
                rel_objs[b_n]["to_left"].push([a_n, dist]);

                // console.log(a_n,b_n,dist)
              }
            }
          }
        }

        let grab1st = function(x) {
          return x[0];
        };
        let compare2nd = function(x, y) {
          return x[1] - y[1];
        };
        let grabN = function(x, n) {
          let out = [];
          for (let i = 0; i < n; i++) {
            if (i < x.length) {
              out.push(x[i]);
            } else {
              out.push(null);
            }
          }
          return out;
        };
        for (let i = 0; i < elm_list.length; i++) {
          let rel_obj = rel_objs[elm_list[i][0]];
          // rel_obj["below"] = rel_obj["below"].sort(compare2nd).map(grab1st).join(' ');
          // rel_obj["above"] = rel_obj["above"].sort(compare2nd).map(grab1st).join(' ');
          // rel_obj["to_right"] = rel_obj["to_right"].sort(compare2nd).map(grab1st).join(' ');
          // rel_obj["to_left"] = rel_obj["to_left"].sort(compare2nd).map(grab1st).join(' ');
          // console.log(elm_list[i], rel_obj["to_left"].sort(compare2nd))
          rel_obj["below"] =
            rel_obj["below"].sort(compare2nd).map(grab1st)[0] || "";
          rel_obj["above"] =
            rel_obj["above"].sort(compare2nd).map(grab1st)[0] || "";
          rel_obj["to_right"] =
            rel_obj["to_right"].sort(compare2nd).map(grab1st)[0] || "";
          rel_obj["to_left"] =
            rel_obj["to_left"].sort(compare2nd).map(grab1st)[0] || "";

          // rel_obj["below"] = grabN(rel_obj["below"].sort(compare2nd).map(grab1st),2);
          // rel_obj["above"] = grabN(rel_obj["above"].sort(compare2nd).map(grab1st),2);
          // rel_obj["to_right"] = grabN(rel_obj["to_right"].sort(compare2nd).map(grab1st),2);
          // rel_obj["to_left"] = grabN(rel_obj["to_left"].sort(compare2nd).map(grab1st),2);
        }

        // console.log(rel_objs)
        relative_pos_cache[HTML_path] = rel_objs;
      } else {
        rel_objs = relative_pos_cache[HTML_path];
      }

      for (let i = 0; i < elm_list.length; i++) {
        let obj = state_json[elm_list[i][0]];
        let rel_obj = rel_objs[elm_list[i][0]];
        // console.log(rel_obj)
        // console.log(elm_list[i][0])
        // console.log(relative_pos_cache[HTML_path])

        obj["below"] = rel_obj["below"];
        obj["above"] = rel_obj["above"];
        obj["to_right"] = rel_obj["to_right"];
        obj["to_left"] = rel_obj["to_left"];
        if (strip_offsets) {
          delete obj["y"];
          delete obj["x"];
          delete obj["width"];
          delete obj["height"];
        }

        state_json[elm_list[i][0]] = obj;
      }
    }

    console.log("STATE JSON", state_json);
    return state_json;
  }

  /* Legacy: Forgot what this was for. Probably for ignoring steps in pretraining. */ 
  _shouldSkipTraining = (sai) => {
    if (!this.state.steps && !this.state.selections) {
      return false;
    }

    if (this.state.steps) {
      let tracer = this.iframe_content.CTAT.ToolTutor.tutor.getTracer();
      let stepId = tracer.getLastResult().getStepID();
      console.log("stepId:", stepId);

      if (this.state.steps.includes(stepId)) {
        return false;
      }
    }

    if (this.state.selections &&
        this.state.selections.includes(sai.selection)) {
      return false;
    }

    return true;
  }

  
  // attemptStagedSkillApp(context, event) {
  //   const promise = new Promise((resolve, reject) => {
  //     // try {
  //     console.log("THIIIIS", context)
  //     const sai = context.skill_applications[context.staged_index || 0]
  //     let sel_elm = this.getElement(sai.selection)

  //     let {CTAT_CORRECT, CTAT_INCORRECT} = this

  //     // const CTAT_CORRECT = this.CTAT_CORRECT;
  //     // const CTAT_INCORRECT = this.CTAT_INCORRECT;
  //     // const shouldSkipTraining = this._shouldSkipTraining;
  //     // const lockElement = this.lockElement;

  //     function handle_ctat_feedback(evt) {
  //       sel_elm.removeEventListener(CTAT_CORRECT, handle_ctat_feedback);
  //       sel_elm.removeEventListener(CTAT_INCORRECT,handle_ctat_feedback);

  //       //If in test mode make sure that fields are locked on incorrect
  //       // console.log("MOOOOOOOO", context)
  //       // if(context.test_mode){
  //       //   lockElement(sai.selection)
  //       // }

  //       resolve({
  //         ...sai,
  //         reward: evt.type == CTAT_CORRECT ? 1 : -1,
  //         // skipTraining: shouldSkipTraining(sai)
  //       });
  //     }

  //     sel_elm.addEventListener(CTAT_CORRECT, handle_ctat_feedback);
  //     sel_elm.addEventListener(CTAT_INCORRECT, handle_ctat_feedback);
  //     this.applySAI(sai);
  //     // }catch(err){
  //     //   reject(err)
  //     // }
  //   });
  //   return promise;
  // }

  clickHintButton = () => {
    let message =
      "<message><properties>" +
      "<MessageType>InterfaceAction</MessageType>" +
      "<Selection><value>hint</value></Selection>" +
      "<Action><value>ButtonPressed</value></Action>" +
      "<Input><value><![CDATA[hint request]]></value></Input>" +
      "</properties></message>";
    // console.log("MESSAGE",message);
    this.commLibrary.sendXML(message);
  }

  // /* NOTE: Should Depricate */ 
  // applyNextExample(context, event) {
  //   const promise = new Promise(async (resolve, reject) => {
  //     // try{
  //     this.clickHintButton();
  //     let sai = await this.getDefaultSAI();
  //     this.colorElement(sai.selection, "EXAMPLE");
  //     this.lockElement(sai.selection)
  //     this.applySAI(sai);
  //     resolve({
  //       ...sai,
  //       reward: 1,
  //       skipTraining: this._shouldSkipTraining(sai)
  //     });
  //   });
  //   return promise;
  // }
  applyFromConflictSet = (context, event) => {
    const promise = new Promise(async (resolve, reject) => {
      for(let skill_app of context.skill_applications){
        console.log("AQUI",skill_app)
        if(skill_app.reward > 0){

          let currentElement = this.iframe_content.document.getElementById(
            skill_app.selection
          );

          const handle_ctat_feedback = (evt) => {
            this.colorElement(skill_app.selection, skill_app.outcome);
            this.lockElement(skill_app.selection);
            resolve();
          }

          currentElement.addEventListener(this.CTAT_CORRECT, handle_ctat_feedback);
          currentElement.addEventListener(this.CTAT_INCORRECT, handle_ctat_feedback);
          this.applySAI(skill_app);
          
          return
        }
      }
      reject("Ground Truth Conflict Set Empty.")
    });
    return promise;
  }

  _cleanSAI = (sai) =>{
    if(!('selection' in sai)){ sai['selection'] = sai['sel'] || null}    
    if(!('inputs' in sai)){ sai['inputs'] = {'value' : sai['input'] || null}}
    if(!('foci_of_attention' in sai)){ sai['foci_of_attention'] = sai['args'] || null} 
    console.log("CLEAN!",sai)   
    return sai
  }

  compareConflictSets = (context, event) => {
    const promise = new Promise(async (resolve, reject) => {
      let conflict_set = await this.getConflictSet();
      let responses = context.response.responses || []
      console.log("YEEEEEP", conflict_set, responses)

      let skill_applications = []
      for (let skill_app of conflict_set){
        skill_app['reward'] = 1
        skill_app['stu_resp_type'] = "HINT_REQUEST"
        skill_app['outcome'] = "HINT"
        skill_app = this._cleanSAI(skill_app)
        skill_applications.push(skill_app)  
      }
      
      if(responses && responses.length > 0){
        for(let resp of responses){
          let matches_any = false
          for (let skill_app of skill_applications){
            //SA === SA (SA-)
            if(skill_app['selection'] === resp['selection'] &&
               skill_app['action'] === resp['action']){

              //I == I (--I) <- '==' is explicit choice so '-1' == -1
              let [inps_a, inps_b] = [skill_app['inputs'],resp['inputs']]
              let eq = true
              for(let attr in inps_a){
                if(!(attr in inps_b && inps_a[attr]===inps_b[attr])){
                  eq = false
                  break
                } 
              }
              if(eq){
                // deep_equal(skill_app['inputs'],resp['inputs'])){
                matches_any = true
                skill_app['stu_resp_type'] = "ATTEMPT"
                skill_app['outcome'] = "CORRECT"
                break
              }
            }
          }
          if(!matches_any){
            resp['reward'] = -1
            resp['stu_resp_type'] = "ATTEMPT"
            resp['outcome'] = "INCORRECT"
            skill_applications.push(resp)
          }
        }
      }
      console.log("SKL",skill_applications)
      resolve({skill_applications:skill_applications})
    });
    return promise; 
  }
  //----------------------------------------------------

  applySAI = (sai) => {
    let promise = new Promise((resolve,reject) => {
      let sel_elm = this.getElement(sai.selection);

      // Add listener for CTAT feedback events
      let {CTAT_CORRECT, CTAT_INCORRECT} = this
      let set_done = () => {this.is_done = true};
      function handle_ctat_feedback(evt) {
        sel_elm.removeEventListener(CTAT_CORRECT, handle_ctat_feedback);
        sel_elm.removeEventListener(CTAT_INCORRECT,handle_ctat_feedback);
        let reward = evt.type === CTAT_CORRECT ? 1 : -1
        // console.log("HANDLE CORRECT", sai.selection, reward, sai.selection === "done" && reward > 0)
        if(sai.selection === "done" && reward > 0){
          set_done()
        }
        resolve(reward)
      }
      sel_elm.addEventListener(CTAT_CORRECT, handle_ctat_feedback);
      sel_elm.addEventListener(CTAT_INCORRECT, handle_ctat_feedback);

      //Force incorrect if edit uneditaable
      if ((sel_elm["data-ctat-enabled"] || "true") === "false") {
        let incorrect_event = new CustomEvent(this.CTAT_INCORRECT, {
          detail: { sai: sai, component: sel_elm },
          bubbles: true, cancelable: true
        });
        sel_elm.dispatchEvent(incorrect_event);
      }

      // Force buttons to have input -1.
      if (sai.action === "ButtonPressed") sai.inputs = { value: -1 };

      // Apply the SAI
      const {CTATSAI,CTATCommShell} = this.iframe_content;
      let input = (sai.inputs && sai.inputs["value"]) || sai.input
      let sai_obj = new CTATSAI(sai.selection, sai.action, input);
      CTATCommShell.commShell.processComponentAction(sai_obj, true)
      // console.log("sai_obj",sai_obj)
    })
    return promise
  }

  getConflictSet = () => {
    const promise = new Promise((resolve, reject) => {
      const callback = (e) => {
        let conflict_set = this.tracer.getFacts("ConflictSet")[0].conflict_set
        resolve(conflict_set)
      }
      this.iframe_content.document.addEventListener(
        this.CTAT_INCORRECT,
        callback,
        { once: true }
      );
      const CTATSAI = this.iframe_content.CTATSAI;
      let sai_obj = new CTATSAI('done','nothin','nothin');
      this.iframe_content.CTATCommShell.commShell.processComponentAction(
        sai_obj,
        true
      );
    })
    return promise;
  }

  getDemo = (log_demo=true) => {
    const promise = new Promise(async (resolve, reject) => {
      if(log_demo) this.clickHintButton()
      if(this.state.qf_type === "brd"){
        let sai = this.graph
        .getExampleTracer()
        .getBestNextLink()
        .getDefaultSAI();
        sai = {
          selection: sai.getSelection(),
          action: sai.getAction(),
          inputs: { value: sai.getInput() }
        };
        resolve(sai);
      }else{
        let conflict_set = await this.getConflictSet();
        let sai = this._cleanSAI(conflict_set[0])
        // console.log("EXAMPLE SAI", sai);
        
        resolve(sai);

       // console.log("IT HAS ENDED") 
      }
      // console.log("SAAAAAAI", sai)
    });
    return promise;
  }

  isDone = () => {return this.is_done};

  // componentDidMount = ()=>{
  //   let {HTML, question_file} = this?.props?.prob_config ?? {}
  //   console.log("componentDidMount", HTML, question_file)
  //   let {network_layer} = this?.props
  //   if(HTML){
  //     this.loadProblem({HTML, question_file}, {network_layer})  
  //   }
  // }

  render = () => {
    console.log("RENDER CTAT", this.state.source)
    if(this.state.source){
      return (
        <iframe
          title="CTAT_iframe"
          style={this.props.style}
          ref={this.ctat_iframe}
          //originWhitelist={["*"]}
          src={this.state.source}
          onLoad={this.state.onLoad}
          tabIndex="-1"
        />
      );
    }else{
      return (<LoadingPage/>)
    }
    
  }
}

/* Implements interactive training functionality of CTAT_TutorWrapper 
   NOTE: Most of the content of this class is depricated and based on
   a previous implementation of interactive training which supported 
   interactivity by injecting styles and components directly into a
   CTAT tutor iframe. The the latest implementation instead uses an
   overlay 
*/
let InteractiveMixin = (superclass) => class extends superclass {
  constructor(props){
    super(props)
    this.start_state_history = [];
    this.highlighted_elements = [];
  }

  _inject_element = (elm_type, attributes = {}) => {
    let elm = this.iframe_content.document.createElement(elm_type);
    for (let attr in attributes) {
      elm.setAttribute(attr, attributes[attr]);
    }
    this.iframe_content.document
      .getElementsByTagName("head")[0]
      .appendChild(elm);
  }

  handle_user_set_state = (evt) => {
    let sai = evt.detail.sai;
    let sel = sai.getSelection();

    // let elm = );
    // elm = this.iframe_content.document.getElementById(sai.getSelection());
    // console.log(sai.getInput())
    if (sai.getInput() !== "") {
      this.colorElement(sel, "START_STATE");
      //elm.firstChild.classList.add("CTAT--AL_start");
      this.start_state_elements.push(sel);
    } else {
      // elm.firstChild.classList.remove("CTAT--AL_start");
      this.colorElement(sel, "DEFAULT");
      if (this.start_state_elements.includes(sel)) {
        this.start_state_elements.remove(sel);
      }
    }
  }

  enterSetStartStateMode = () => {
    this.start_state_elements = [];
    this.iframe_content.document.addEventListener(
      this.CTAT_ACTION,
      this.handle_user_set_state
    );
  }

  exitSetStartStateMode = () => {
    this.iframe_content.document.removeEventListener(
      this.CTAT_ACTION,
      this.handle_user_set_state
    );

    console.log("START DONE");
    for (let i in this.start_state_elements) {
      let sel = this.start_state_elements[i];
      let elm = this.iframe_content.document.getElementById(sel);
      if (elm.firstChild.value) {
        this.lockElement(sel);
        // elm.setAttribute("data-ctat-enabled","false")
        // elm.firstChild.setAttribute("contentEditable","false")
        // elm.firstChild.disabled = true;
      }
      this.colorElement(sel, "DEFAULT");
      // elm.firstChild.classList.remove("CTAT--AL_start");
      // console.log("BOOP",elm);
    }
    console.log("FINISHED LOCKING");
    //Take away focus from whatever is there so it isn't treated as an example
    // document.activeElement.blur();
    // console.log("STAT",getState())
    this.start_state_history.push(this.getState());
    // last_action = proposed_SAI = null;
  }

  handleUserExample = (evt) => {
    this.handleUserInput(evt, "DEMO");
  }
  handleUserAttempt = (evt) => {
    this.handleUserInput(evt, "ATTEMPT");
  }

  handleUserInput = (evt, type) => {
    let sai = evt.detail.sai;
    let sel = sai.getSelection();

    let elm = this.iframe_content.document.getElementById(sel);
    if (elm.firstChild.contentEditable === "false") {
      console.log("BAIL");
      return;
    }

    sai = {
      selection: sai.getSelection(),
      action: sai.getAction(),
      inputs: { value: sai.getInput() }
    };

    this.lockElement(sel);
    this.colorElement(sel, type);

    // if(this.state.mode == "train"){
    if (type === "EXAMPLE") {
      this.props.interactions_service.send({
        type: "DEMONSTRATE",
        data: { ...sai, reward: 1, "stu_resp_type" : "HINT_REQUEST" }
      });
    } else if (type === "ATTEMPT") {
      console.log("SEND ATTEMPT", sai);
      this.props.interactions_service.send({
        type: "ATTEMPT",
        data: { ...sai, "stu_resp_type" : "ATTEMPT" }
      });
    } else {
      throw "uknown type given";
    }
    // }else if(this.state.mode == "tutor"){
    //   this.props.interactions_service.send({
    //     type : "ATTEMPT",
    //     data : {...sai,reward : 1},
    //   });
    // }
  }

  displayCorrectness = (context, event) => {
    let sai = context.skill_applications[context.staged_index];
    let sel = sai.selection;
    if (event.data === 1) {
      this.colorElement(sel, "CORRECT");
    } else {
      this.colorElement(sel, "INCORRECT");
      this.unlockElement(sel);
    }
  }

  reprSkillApplication = (skill_app) =>{
    let value = skill_app.inputs["value"] !== null ? skill_app.inputs["value"] : "";
    return skill_app.selection + " -> " + value
  }

  _done_clicked_example = (evt) => {
    this.handleUserExample({
      detail: {
        sai: new this.iframe_content.CTATSAI("done", "ButtonPressed", "-1")
      }
    });
  }

  enterFeedbackMode = () => {
    this.iframe_content.document.addEventListener(
      this.CTAT_ACTION,
      this.handleUserExample
    );
    this.iframe_content.document
      .getElementById("done")
      .addEventListener("click", this._done_clicked_example);
  }

  exitFeedbackMode = () => {
    this.iframe_content.document.removeEventListener(
      this.CTAT_ACTION,
      this.handleUserExample
    );
    this.iframe_content.document
      .getElementById("done")
      .removeEventListener("click", this._done_clicked_example);
  }

  _done_clicked_attempt = (evt) => {
    this.handleUserAttempt({
      detail: {
        sai: new this.iframe_content.CTATSAI("done", "ButtonPressed", "-1")
      }
    });
  }

  enterTutoringMode = () => {
    this.iframe_content.document.addEventListener(
      this.CTAT_ACTION,
      this.handleUserAttempt
    );
    this.iframe_content.document
      .getElementById("done")
      .addEventListener("click", this._done_clicked_attempt);
  }

  exitTutoringMode = () => {
    this.iframe_content.document.removeEventListener(
      this.CTAT_ACTION,
      this.handleUserAttempt
    );
    this.iframe_content.document
      .getElementById("done")
      .removeEventListener("click", this._done_clicked_attempt);
  }



  handle_foci_select = (evt) => {
    console.log("FOCI SELECT!");
    for (let ele of evt.path) {
      console.log("EELE", ele);
      if (
        ele.classList !== undefined &&
        ele.classList.contains("CTATComponent")
      ) {
        let indx = this.current_foci.indexOf(ele);
        // console.log(current_foci)
        if (indx === -1) {
          this.current_foci.push(ele);
          this.highlightElement(ele.id, 1);
          // ele.classList.add("CTAT--AL_highlight1");
        } else {
          this.current_foci.splice(indx, 1);
          // ele.classList.remove("CTAT--AL_highlight1");
          this.unhighlightElement(ele.id);
        }
        console.log(this.current_foci);

        break;
      }
    }
  }

  enterFociMode = () => {
    console.log("FOCI START!");
    this.unhighlightAll();
    this.current_foci = [];
    this.iframe_content.document.addEventListener(
      "click",
      this.handle_foci_select
    );
  }

  getCurrentFoci = () => {
    if (this.current_foci) {
      return this.current_foci.map(elm => elm.id);
    } else {
      return [];
    }
  }

  exitFociMode = () => {
    this.unhighlightAll();
    console.log("FOCI DONE!");
    // let foci_of_attention = [];
    // for(let ele of this.current_foci){
    //     // ele.classList.remove("CTAT--AL_highlight1");
    //     this.colorElement(ele.id)
    //     // foci_of_attention.push(ele.id);
    // }
    // console.log(foci_of_attention)
    // current_sai_data.foci_of_attention = foci_of_attention;
    this.current_foci = [];
    this.iframe_content.document.removeEventListener(
      "click",
      this.handle_foci_select
    );
  }

  clearProposedSAI = () => {
    if (this.proposed_SAI) {
      this.clearElement(this.proposed_SAI.selection);
      this.unlockElement(this.proposed_SAI.selection.replace("?ele-", ""));
      this.unhighlightAll();
      this.proposed_SAI = null;
    }
  }

  highlightSAI = (sai) => {
    if (sai.mapping) {
      let index = 0;
      for (let let_str in sai.mapping) {
        let elem_str = sai.mapping[let_str];
        let colorIndex = 1;
        if (let_str !== "?sel") {
          colorIndex = 2 + ((index - 1) % (this.where_colors.length - 1));
          // console.log(colorIndex)
        }
        // elm = this.iframe_content.document.getElementById(elem_str.replace('?ele-',""));
        this.highlightElement(elem_str, colorIndex);
        index++;
      }
    } else {
      alert("RESPONSE IS MISSING FIELD:'mapping'");
      // this.highlighted_elements.push(elm.firstElementChild.id)
      // elm.firstElementChild.classList.add("CTAT--AL_highlight1")
    }
  }

  proposeSkillApp = (sai) => {
    // console.log("EVDA", event.data)
    // let sai = event.data
    this.clearProposedSAI();
    this.proposed_SAI = { ...sai };
    this.highlightSAI(sai);
    this.stageSAI(sai);
  }

  stageSAI = (sai) => {
    let comp = this.iframe_content.CTATShellTools.findComponent(
      sai.selection
    )[0];
    let sai_obj = new this.iframe_content.CTATSAI(
      sai.selection,
      sai?.action_type ?? sai.action,
      sai?.inputs?.value ?? sai.input,
    );
    console.log(sai.selection,
      sai.action,
      sai?.inputs?.value ?? sai.input)
    comp.executeSAI(sai_obj);
    this.lockElement(sai.selection);
  }

  confirmProposedSAI = () => {
    if (this.proposed_SAI) {
      this.unhighlightAll();
      this.proposed_SAI = null;
    }
  }
}

export default class CTAT_TutorWrapper extends  InteractiveMixin(BaseMixin(DomEditMixin(React.Component))) {
// export default class CTAT_TutorWrapper extends  React.Component {
  constructor(props) { super(props) }
  // render(){
  //   return (<p>HI</p>)
  // }
}

const LOAD_SCREEN =
  '<!DOCTYPE html> \
<html>\
<head>\
<meta name="viewport" content="width=device-width, initial-scale=1">\
<style>\
.loader {\
  border: 16px solid #f3f3f3;\
  border-radius: 50%;\
  border-top: 16px solid #3498db;\
  width: 120px;\
  height: 120px;\
  -webkit-animation: spin 2s linear infinite; /* Safari */\
  animation: spin 2s linear infinite;\
  position: absolute;\
  left: 50%;\
  top: 50%;\
  transform: translate(-50%, -50%);*/\
}\
\
/* Safari */\
@-webkit-keyframes spin {\
  0% { -webkit-transform: rotate(0deg); }\
  100% { -webkit-transform: rotate(360deg); }\
}\
\
@keyframes spin {\
  0% { transform: rotate(0deg); }\
  100% { transform: rotate(360deg); }\
}\
</style>\
</head>\
<body>\
\
<h2>How To Create A Loader</h2>\
\
<div class="loader"></div>\
\
</body>\
</html>\
';

