import React from 'react';
import WebView  from 'react-native-web-webview';
import autobind from 'class-autobind';

// import WebViewFile from '../../examples/FracPreBake/FractionArithmetic/HTML/fraction_arithmetic.html';
import {
  Icon,
  View,
  Text,
  StyleSheet,
  Platform//, 
  // WebView
} from 'react-native';

const queryString = require('query-string');
const path = require("path")

var $ = require('jquery');

// const post_message = 
// "\
// function waitForBridge() {\
//    //the react native postMessage has only 1 parameter\
//    //while the default one has 2, so check the signature\
//    //of the function\
//    if (window.postMessage.length !== 1){\
//      setTimeout(waitForBridge, 200);\
//    }\
//    else {\
//      window.postMessage(document);\
//    }\
// }\
// \
// window.onload = waitForBridge;\
// ";

function checkTypes(element, types){
  var ok = false;
    for (var i = types.length - 1; i >= 0; i--) {
    var type = types[i];
    if(element.classList.contains(type)) ok = true;
  }
  return ok;
}


class CTAT_Tutor extends React.Component {
  constructor(props){
    super(props);
    autobind(this)
    // this.webview_loaded = this.webview_loaded.bind(this)
    // this.onTransition = this.onTransition.bind(this)
    // this.lockElement = this.lockElement.bind(this)
    // this.unlockElement = this.unlockElement.bind(this)
    // this.colorElement = this.colorElement.bind(this)

    // this.highlightElement = this.highlightElement.bind(this)
    // this.unhighlightElement = this.unhighlightElement.bind(this)
    // this.highlightSAI = this.highlightSAI.bind(this)
    // this.unhighlightAll = this.unhighlightAll.bind(this)

    // this._triggerWhenInitialized = this._triggerWhenInitialized.bind(this)
    // this.componentDidUpdate = this.componentDidUpdate.bind(this)
    // this.applySAI = this.applySAI.bind(this)
    // this.apply_skill_application = this.apply_skill_application.bind(this)
    // this.apply_next_example = this.apply_next_example.bind(this)

    // this.handle_user_set_state = this.handle_user_set_state.bind(this)
    // this.enter_set_start_state_mode = this.enter_set_start_state_mode.bind(this)
    // this.exit_set_start_state_mode = this.exit_set_start_state_mode.bind(this)

    // this.handle_user_example = this.handle_user_example.bind(this)
    // this.enter_feedback_mode = this.enter_feedback_mode.bind(this)
    // this.exit_feedback_mode = this.exit_feedback_mode.bind(this)
    
    // this.handle_foci_select = this.handle_foci_select.bind(this)
    // this.enter_foci_mode = this.enter_foci_mode.bind(this)
    // this.exit_foci_mode = this.exit_foci_mode.bind(this)

    this.where_colors = [  "darkorchid",  "#ff884d",  "#52d0e0", "#feb201",  "#e44161", "#ed3eea", "#2f85ee",  "#562ac6", "#cc24cc"]

    this.relative_pos_cache = {};

    this.color_class_map = {
      "EXAMPLE" : "CTAT--example",
      "CORRECT" : "CTAT--correct",
      "INCORRECT" : "CTAT--incogetDerrect",
      "HIGHLIGHT" : "CTAT--AL_highlight",
      "START_STATE" : "CTAT--AL_start",
      "DEFAULT" : ""
      };

    this.ctat_webview = React.createRef();

    this.state = {
      "source" : "../../examples/FracPreBake/FractionArithmetic/HTML/fraction_arithmetic.html?question_file=../mass_production/mass_production_brds/AD 5_9_plus_3_7.brd"
    }
    this.start_state_history = []
    this.highlighted_elements = []

  }

  componentDidMount(){
    // window.ctat_webview = this.ctat_webview.current

    
    
    console.log("THIS",this)
    // this.graph = this.iframe_content.CTAT.ToolTutor.tutor.getGraph() || false;
  }

  componentDidUpdate(prevProps,prevState){
    console.log("UPDATED", this.state)
    this.iframe = this.ctat_webview.current
    
    if(!this.init_callback){
      this.init_callback = (x) => {};
    }

    // this._triggerWhenInitialized()

  }

  loadProblem(context){
    const prob_obj = context.prob_obj
    const nl = context.network_layer
    const interactive = context.interactive
    this.interactive = context.interactive
    this.setState({"source" : {"html":LOAD_SCREEN}})
    const promise = new Promise((resolve,reject) => {
      var HTML_name = prob_obj["HTML"].substring(prob_obj["HTML"].lastIndexOf('/')+1).replace(".html", "");

      var domain_name = prob_obj["domain_name"] || HTML_name;
      

      // Point the iframe to the HTML and question_file (brd or nools) for the next problem

      // iframe_content.CTAT = null;
      // iframe_content.CTATCommShell = null;



      var HTML_PATH = prob_obj["HTML"];
      if(!path.isAbsolute(HTML_PATH)){
          HTML_PATH = context.app.props.HOST_URL + "/" + path.join(context.working_dir, HTML_PATH)  
      }
      // console.log("working_dir: ", working_dir)
      // console.log("HTML_PATH: ", HTML_PATH)


      // if(session_id == null){
      //     user_guid = "Stu_" + CTATGuid.guid();
      //     session_id = CTATGuid.guid();
      // }

      var qf_exists = prob_obj["question_file"] != undefined && prob_obj["question_file"].toUpperCase() != "INTERACTIVE";
      var BRD_name, free_authoring;
      if(qf_exists){
          BRD_name = prob_obj["question_file"].substring(prob_obj["question_file"].lastIndexOf('/')+1).replace(".brd", "").replace(".nools", "");  
            free_authoring = false;
      }else{
          BRD_name = "FREE AUTHORING"
            free_authoring = true;
      }
      // this.free_authoring = 
        // term_print(prob_obj["question_file"])
        

      nl.term_print('\x1b[0;30;47m' + "Starting Problem: " + BRD_name +  '\x1b[0m');

      var qf = qf_exists  ? {"question_file" : prob_obj["question_file"]} : {"question_file" : "/src/empty.nools"} ;

      console.log("qf",qf,interactive)
      if(!interactive && qf["question_file"].includes(".nools")){
          nl.kill_this('\x1b[0;30;47m' +'Question file cannot be nools in non-interactive mode. Use example tracing.\x1b[0m')
      }
      var logging_params = {
          "problem_name": BRD_name,
          "dataset_level_name1" : domain_name,
          "dataset_level_type1" : "Domain",
          "SessionLog" : "true",
          "Logging" : "ClientToLogServer",
          "log_service_url" : window.location.origin,
          "user_guid" : context.agent_id,
          "session_id" : context.session_id
      };
      var params = Object.assign({},qf,logging_params) //Merge dictionaries
      
      this.HTML_PATH = HTML_PATH
      this.init_callback = () => {resolve({"updateContext": {free_author : free_authoring}})}
      var source = HTML_PATH + "?" + queryString.stringify( params );
      console.log("source", source)
      this.graph = null
      this.commLibrary = null
      this.hasConfig = null
      this.setState({"source" : {"uri":source},
            "onLoad" : this._triggerWhenInitialized
        })
      // this.iframe.onLoad = this._triggerWhenInitialized;
      // this.iframe.src = HTML_PATH + "?" + queryString.stringify( params ).search;
      // setTimout(this._triggerWhenInitialized(),10)
    })
    return promise;
  }

  _inject_element(elm_type,attributes={}){
      var elm = this.iframe_content.document.createElement(elm_type);
      for (var attr in attributes){
        elm.setAttribute(attr, attributes[attr])
      }
      this.iframe_content.document.getElementsByTagName('head')[0].appendChild(elm);

  }

  /*
  _checkAndStartTrigger(){
      this.iframe_content = this.iframe.frameRef.contentWindow;
    // if(this.iframe_content.document){
      this._inject_element('link',   {href:'/CTAT/CTAT.css',type: "text/css",rel: "stylesheet"})
      this._inject_element('link',   {href:'/CTAT/normalize.css',type: "text/css",rel: "stylesheet"})
      this._inject_element('link',   {href:'/CTAT/front-end.css',type: "text/css",rel: "stylesheet"})
      this._inject_element('script', {"data-silex-static" : true, type:'text/javascript', src : "/CTAT/jquery.min.js"})
      this._inject_element('script', {"data-silex-static" : true, type:'text/javascript', src : "/CTAT/nools.js"})
      this._inject_element('script', {"data-silex-static" : true, type:'text/javascript', src : "/CTAT/ctat.min.js"})
      
      window.setTimeout(() => {
        this._inject_element('script', {"data-silex-static" : true, type:'text/javascript', src : "/CTAT/ctatloader.js"})
        this._triggerWhenInitialized()      
      }, 100);
      
    // }else{
    //   window.setTimeout(() => {this._checkAndStartTrigger()}, 200);
    // }
    
    
  }*/

  _triggerWhenInitialized(){
    console.log("TRIGGER WHEN INITIALIZED")
    this.iframe_content = this.iframe.frameRef.contentWindow;
    const iframe_content = this.iframe_content

    if(typeof iframe_content.CTAT == "undefined" || iframe_content.CTAT == null ||
      typeof iframe_content.CTATCommShell == "undefined" || iframe_content.CTATCommShell == null || 
      typeof iframe_content.CTATCommShell.commShell == "undefined" || iframe_content.CTATCommShell.commShell == null ||
      typeof iframe_content.CTAT.ToolTutor == "undefined" || iframe_content.CTAT.ToolTutor == null ||
      typeof iframe_content.CTAT.ToolTutor.tutor == "undefined" || iframe_content.CTAT.ToolTutor.tutor == null){
        // term_print('\x1b[0;30;47m' + "BLEHH1" +  '\x1b[0m');
        console.log("BLEHH1")
        window.setTimeout(() => {this._triggerWhenInitialized()}, 500);
        return;       
    }
    this.graph = iframe_content.CTAT.ToolTutor.tutor.getGraph() || false;
    this.commLibrary = iframe_content.CTATCommShell.commShell.getCommLibrary();
    this.hasConfig = iframe_content.CTATConfiguration != undefined
    


    // console.log("graph")
    // console.log(graph)
    // console.log("comm")
    // console.log(commLibrary)
    // console.log(hasConfig)
    

    if((this.graph || this.interactive) && this.commLibrary && this.hasConfig){
      this._inject_element('link',{href:'/css/AL_colors.css',type: "text/css",rel: "stylesheet"})
      // var link = iframe_content.document.createElement('link');
      // link.setAttribute('rel', 'stylesheet');
      // link.setAttribute('type', 'text/css');
      // // link.setAttribute('href', "../".repeat(working_dir.split('/').length+1) + 'css/AL_colors.css');
      // link.setAttribute('href', document.location.origin + '/css/AL_colors.css');
      // iframe_content.document.getElementsByTagName('head')[0].appendChild(link);

      //Gets rid of annyoing sai printout on every call to sendXML
      iframe_content.flashVars.setParams({"deliverymode" : "bleehhhh"})

      //Grab these event constants from CTAT
      this.CTAT_CORRECT = iframe_content.CTAT.Component.Base.Tutorable.EventType.correct;
      this.CTAT_INCORRECT = iframe_content.CTAT.Component.Base.Tutorable.EventType.incorrect;
      this.CTAT_ACTION = iframe_content.CTAT.Component.Base.Tutorable.EventType.action;    

      console.log("INITIALIZED!")
      this.init_callback(this)
    }else{
      // term_print('\x1b[0;30;47m' + "BLEHH2" + '\x1b[0m');
      console.log("BLEHH2")
      window.setTimeout(() => {this._triggerWhenInitialized()}, 500);
    }
  }

  handle_user_set_state(evt){
    var sai = evt.detail.sai;
    var sel = sai.getSelection()

    // var elm = );
    // elm = this.iframe_content.document.getElementById(sai.getSelection());
    // console.log(sai.getInput())
    if(sai.getInput() != ""){
        this.colorElement(sel,"START_STATE")
        //elm.firstChild.classList.add("CTAT--AL_start");
        this.start_state_elements.push(sel);
    }else{
        // elm.firstChild.classList.remove("CTAT--AL_start");
        this.colorElement(sel,"DEFAULT")
        if(this.start_state_elements.includes(sel)){
            this.start_state_elements.remove(sel);
        }
    }
    
  }
  
  enter_set_start_state_mode(){
    this.start_state_elements = []
    this.iframe_content.document.addEventListener(this.CTAT_ACTION, this.handle_user_set_state); 
  }

  exit_set_start_state_mode(){
    this.iframe_content.document.removeEventListener(this.CTAT_ACTION, this.handle_user_set_state); 

    console.log("START DONE")
    for (var i in this.start_state_elements){
        var sel = this.start_state_elements[i]
        var elm = this.iframe_content.document.getElementById(sel);
        if(elm.firstChild.value){
            this.lockElement(sel)
            // elm.setAttribute("data-ctat-enabled","false")
            // elm.firstChild.setAttribute("contentEditable","false")
            // elm.firstChild.disabled = true;    
        }
        this.colorElement(sel,"DEFAULT")
        // elm.firstChild.classList.remove("CTAT--AL_start");
        // console.log("BOOP",elm);
    }
    //Take away focus from whatever is there so it isn't treated as an example
    // document.activeElement.blur();
    // console.log("STAT",get_state())
    this.start_state_history.push(this.get_state());
    // last_action = last_proposal = null;
  }

  handle_user_example(evt){
    var sai = evt.detail.sai
    var sel = sai.getSelection();

    var elm = this.iframe_content.document.getElementById(sel)
    if(elm.firstChild.contentEditable == "false"){
        console.log("BAIL")
        return
    }
    

    // console.log("%cUSER_EXAMPLE: " + sai.getSelection() + " -> " + sai.getInput(), 'color: #2222bb; background: #DDDDDD;');
    // term_print('\x1b[0;33;44m' + "USER_EXAMPLE:" + sai.getSelection() + " -> " + sai.getInput() + '\x1b[0m')
    // this.iframe_content.document.removeEventListener(CTAT_ACTION, handle_user_example);
    // this.iframe_content.document.getElementById("done").removeEventListener("click", _done_clicked); 

    var sai = {
        selection: sai.getSelection(),
        action: sai.getAction(),
        inputs: {value: sai.getInput()},
    };

    
    // apply_sai(sai_data);
    this.lockElement(sel)
    // var comp = iframe_content.CTATShellTools.findComponent(sai.getSelection())[0];
    // comp.setEnabled(false);
    // elm.contentEditable = "false";
    // console.log(elm.firstElementChild);
    // elm.firstElementChild.setAttribute("class", "CTAT--example");
    // console.log(elm.firstElementChild);
    this.colorElement(sel,"EXAMPLE")

    // last_correct = true;

    this.props.interactions_service.send({
      type : "DEMONSTRATE",
      data : {...sai,reward : 1},
    })

    // this.clear_last_proposal();

    // if(use_foci && sai_data.selection != 'done'){
    //     if(interactive){window.state_machine_service.send("DEMONSTRATE");}
    //     current_sai_data = sai_data;
    //     // console.log("current_sai_data",current_sai_data)
    //     query_user_foci();
    // }else{
    //     send_training_data(sai_data);    
    // }
    // console.log(sai_data);
    
  }

  _done_clicked(evt){
    this.handle_user_example({detail:{sai:new this.iframe_content.CTATSAI("done", "ButtonPressed", "-1")}})
  }

  enter_feedback_mode(){
    this.iframe_content.document.addEventListener(this.CTAT_ACTION, this.handle_user_example); 
    this.iframe_content.document.getElementById("done").addEventListener("click", this._done_clicked); 
  }

  exit_feedback_mode(){
    this.iframe_content.document.removeEventListener(this.CTAT_ACTION, this.handle_user_example); 
    this.iframe_content.document.getElementById("done").removeEventListener("click", this._done_clicked); 
  }


  handle_foci_select(evt){
    console.log("FOCI SELECT!")
    for(var ele of evt.path){
        console.log("EELE", ele)
        if(ele.classList != undefined && ele.classList.contains("CTATComponent")){
            var indx = this.current_foci.indexOf(ele)
            // console.log(current_foci)
            if(indx == -1){
                this.current_foci.push(ele)
                this.highlightElement(ele.id,1)
                // ele.classList.add("CTAT--AL_highlight1");
            }else{
                this.current_foci.splice(indx,1)
                // ele.classList.remove("CTAT--AL_highlight1");
                this.unhighlightElement(ele.id)
            }
            console.log(this.current_foci)

            break
        }    
    }
    
  }

  enter_foci_mode(){
    console.log("FOCI START!")
    this.unhighlightAll()
    this.current_foci = []
    this.iframe_content.document.addEventListener("click", this.handle_foci_select)
  }

  get_current_foci(){
    if(this.current_foci){
      return this.current_foci.map((elm) => elm.id)
    }else{
      return []
    }
  }

  exit_foci_mode(){
    this.unhighlightAll();
    console.log("FOCI DONE!")
    // var foci_of_attention = [];
    // for(var ele of this.current_foci){
    //     // ele.classList.remove("CTAT--AL_highlight1");
    //     this.colorElement(ele.id)
    //     // foci_of_attention.push(ele.id);
    // }
    // console.log(foci_of_attention)
    // current_sai_data.foci_of_attention = foci_of_attention;
    this.current_foci = []
    this.iframe_content.document.removeEventListener("click", this.handle_foci_select)

  }

  //---------- Xstate API with promises ----------------
  apply_skill_application(context,event){
    const promise = new Promise((resolve, reject) => {
      // try {
        const resp = context.response
        var currentElement = this.iframe_content.document.getElementById(resp.selection);
        const CTAT_CORRECT = this.CTAT_CORRECT
        const CTAT_INCORRECT = this.CTAT_INCORRECT

        function handle_ctat_feedback(evt){
          currentElement.removeEventListener(CTAT_CORRECT, handle_ctat_feedback);
          currentElement.removeEventListener(CTAT_INCORRECT, handle_ctat_feedback);
          resolve({...resp,reward: evt.type == CTAT_CORRECT ? 1 : -1})            
        }

        currentElement.addEventListener(CTAT_CORRECT, handle_ctat_feedback);
        currentElement.addEventListener(CTAT_INCORRECT, handle_ctat_feedback);    
        this.applySAI(resp)  
      // }catch(err){
      //   reject(err)
      // }
      

    });
    return promise
  }
  apply_next_example(context,event){
    const promise = new Promise((resolve, reject) => {
      // try{
        this.applyHint()
        var sai = this.getDefaultSAI()
        this.colorElement(sai.selection, "EXAMPLE")
        this.applySAI(sai)    
        resolve({...sai, reward : 1})
    //   }catch(err){
    //     reject(err)
    //   }
    });
    return promise
  }
  //----------------------------------------------------


  applySAI(sai){
    var sel_elm = this.iframe_content.document.getElementById(sai.selection)
    if((sel_elm["data-ctat-enabled"] || 'true') == 'false'){
      //Force incorrect if try to edit uneditaable
        var incorrect_event = new CustomEvent(this.CTAT_INCORRECT, {detail:{'sai':sai, 'component':sel_elm}, bubbles:true, cancelable:true});
        sel_elm.dispatchEvent(incorrect_event);
    }


    if(sai.action == "ButtonPressed"){
        sai.inputs = {"value" : -1}
    }

    // last_action = sai
    const CTATSAI = this.iframe_content.CTATSAI
    var sai_obj = new CTATSAI(sai.selection, sai.action,sai.inputs["value"]);
    this.iframe_content.CTATCommShell.commShell.processComponentAction(sai_obj,true)
  }


  lockElement(name){
    var comp = this.iframe_content.CTATShellTools.findComponent(name)[0];
    comp.setEnabled(false);
  }

  unlockElement(name){
    var comp = this.iframe_content.CTATShellTools.findComponent(name)[0];
    comp.setEnabled(true);
  }

  colorElement(name,type){
    var elm = this.iframe_content.document.getElementById(name);
    // if(type == "DEFAULT"){
    //   for (const [key, value] of Object.entries(this.color_class_map)) {
    //     if(elm.firstElementChild.classList.contains(value)){
    //       elm.firstElementChild.classList.remove(value);     
    //     }
    //   }
    // }else{
      // this.colorElement(name,"DEFAULT")
    if(elm && elm.firstElementChild){
      elm.firstElementChild.setAttribute("class", this.color_class_map[type]); 
    }
      // elm.firstElementChild.classList.add(this.color_class_map[type]); 
  //   }
  }

  // highlightSAI(sai){

  //   if(sai.mapping){
  //       Object.entries(sai.mapping).forEach(function(v,index){
  //           const [var_str, elem_str] = v
  //           var colorIndex = 1
  //           if(var_str != "?sel"){
  //               colorIndex = 2 + ((index-1) % (this.where_colors.length-1));
  //               console.log(colorIndex)
  //           }
  //           // elm = this.iframe_content.document.getElementById(elem_str.replace('?ele-',""));
  //           this.highlightElement(elem_str,colorIndex)
  //       });
  //   }else{
  //     alert("IDK WHAT THIS IS")
  //       // this.highlighted_elements.push(elm.firstElementChild.id)
  //       // elm.firstElementChild.classList.add("CTAT--AL_highlight1")
  //   }
  // }

  highlightElement(name,colorIndex=1){
    this.unhighlightElement(name)
    var elm = this.iframe_content.document.getElementById(name.replace('?ele-',""));
    elm.firstElementChild.classList.add("CTAT--AL_highlight"+colorIndex)
    this.highlighted_elements.push(name)
    // console.log("H", this.highlighted_elements)
  }

  unhighlightElement(name){

    if(this.highlighted_elements.includes(name)){

      var elm = this.iframe_content.document.getElementById(name.replace('?ele-',""));
      var before = elm.firstElementChild.classList.toString()
      for (var i = 1; i <= this.where_colors.length; i++) { 
          var c = "CTAT--AL_highlight"+i;
          // console.log(c)
          if(elm.firstElementChild.classList.contains(c)) {
            elm.firstElementChild.classList.remove(c)
          }
      }
      var after = elm.firstElementChild.classList.toString()
      // console.log("BEF-AFT:", before,after)
      var index = this.highlighted_elements.indexOf(name)
      if(index > -1){
        this.highlighted_elements.splice(index,1)  
      }
      
    }
  }

  clearElement(name){
    var elm = this.iframe_content.document.getElementById(name);    
    elm.firstElementChild.value = "";
  }

  highlightSAI(sai){
    if(sai.mapping){
        var index = 0
        for (var var_str in sai.mapping){
            var elem_str = sai.mapping[var_str]
            var colorIndex = 1
            if(var_str != "?sel"){
                colorIndex = 2 + ((index-1) % (this.where_colors.length-1));
                // console.log(colorIndex)
            }
            // elm = this.iframe_content.document.getElementById(elem_str.replace('?ele-',""));
            this.highlightElement(elem_str,colorIndex)
            index++
        }
    }else{
      alert("IDK WHAT THIS IS")
        // this.highlighted_elements.push(elm.firstElementChild.id)
        // elm.firstElementChild.classList.add("CTAT--AL_highlight1")
    }
  }

  unhighlightAll(){
    // console.log("HIGHLIGHTED_/", this.highlighted_elements)
    for(var elem_str of [...this.highlighted_elements]){
      this.unhighlightElement(elem_str);
    }
  }

  getDefaultSAI(){
    var sai = this.graph.getExampleTracer().getBestNextLink().getDefaultSAI();
    sai = {
      selection: sai.getSelection(),
      action: sai.getAction(),
      inputs: {value: sai.getInput()},
    }
    return sai
  }

  clearLastProposal(){
    if(this.last_proposal){
        this.clearElement(this.last_proposal.selection)
        this.lockElement(this.last_proposal.selection.replace('?ele-',""))
        this.unhighlightAll()
    }
  }

  proposeSAI(sai){
    // console.log("EVDA", event.data)
    // var sai = event.data
    this.clearLastProposal()
    this.last_proposal = {...sai}
    this.highlightSAI(sai)
    this.stageSAI(sai)
  }

  stageSAI(sai){
    var comp = this.iframe_content.CTATShellTools.findComponent(sai.selection)[0];
    var sai_obj =  new this.iframe_content.CTATSAI(sai.selection, sai.action,sai.inputs["value"]);
    comp.executeSAI(sai_obj);
    comp.setEnabled(false);
  }

  applyHint(){
  
    var message = "<message><properties>" +
                    "<MessageType>InterfaceAction</MessageType>" +
                    "<Selection><value>hint</value></Selection>" +
                    "<Action><value>ButtonPressed</value></Action>" +
                    "<Input><value><![CDATA[hint request]]></value></Input>" +
                "</properties></message>";
    // console.log("MESSAGE",message);
    this.commLibrary.sendXML(message);   
}

  get_state({encode_relative=true,strip_offsets=true, use_offsets=true, use_class=true, use_id=true,append_ele=true}={}){
    var relative_pos_cache = this.relative_pos_cache
    var HTML_PATH = this.HTML_PATH
    var state_array = this.iframe_content.$('div').toArray();
    // state_array.push({current_task: current_task});

    var state_json = {}
    var count = 0;
    $.each(state_array, function(idx, element){

      obj = {}
      if(element.classList.contains("CTATComponent")
             && !element.classList.contains("CTATTable")) {
            // if(obj["className"] == "CTATTextField") {continue;} //Skip table objects and just use cells
            if(element.classList[0] != "CTATTextField") { //Skip text fields
            if(use_class){obj["type"] = element.classList[0];}
                if(use_offsets){
                obj["offsetParent"] = element.offsetParent.dataset.silexId;
                obj["offsetLeft"] = element.offsetLeft;
                    obj["offsetTop"] = element.offsetTop;
                    obj["offsetWidth"] = element.offsetWidth;
                obj["offsetHeight"] = element.offsetHeight;
                }


            if(use_id){obj["id"] = element.id;}

            if(checkTypes(element, ["CTATTextInput","CTATComboBox","CTATTable--cell"])){
              obj["value"] = element.firstElementChild.value;
              obj["contentEditable"] = (element.firstElementChild.contentEditable == 'true');
              // obj["name"] = element.id
            }
            // if(checkTypes(element, ["CTATTextField", "CTATComboBox"])){
            //  obj["textContent"] = element.textContent;
            // }

            if(checkTypes(element, ["CTATComboBox"])){
              // if(element.options){
                //Probably not the best
              var options = element.firstElementChild.options;
              var temp = [];
              for (var i = 0; i < options.length; i++) {
                temp.push(options[i].text);
              }
              obj["options"] = Object.assign({}, temp)

              // }
              
            }
            let name = (append_ele ? "?ele-":"") + element.id
                // console.log(name,append_ele)
            state_json[name] = obj;
              count++;
            }
      }
        // add question marks for apprentice
        // element = jQuery.extend({}, element);
        // element = jQuery.data(element);
        // if(element && !jQuery.isEmptyObject(element) && element.CTATComponent){
        //  console.log("ELEEMENT", element);
        //  // element = jQuery.data(element.CTATComponent);
        //  element = element.CTATComponent;
        //  // if(element.CTATComponent){
        //    // element.CTATComponent = jQuery.data(element.CTATComponent);
        //  // }
        //  console.log("KEY ", idx, element.className);
         //  state_json["?ele-" + idx] = element;
         //  count++;
        // }
        
        // element.component = jQuery.data(element.component);
        

        // if(element.hasAttribute("removeData") ){
        //  element.removeData();
        //  console.log("WOOOPS");
        // }

    });


    
    // Gets lists of elements that are to the left, right and above the current element
    if(encode_relative){
        const elm_list = Object.entries(state_json);
        // console.log(elm_list);

        var rel_objs;
        if(! (HTML_PATH in relative_pos_cache) ){
            rel_objs = {};
            for (var i = 0; i < elm_list.length; i++) {
                // console.log(elm_list[i][0])
                rel_objs[elm_list[i][0]] = {
                    "to_left" : [],
                    "to_right" : [],
                    "above" : [],
                    "below" : []
                }
            }

            for (var i = 0; i < elm_list.length; i++) {
                for (var j = 0; j < elm_list.length; j++) {
                    if(i != j){
                        var [a_n, a_obj] = elm_list[i];
                        var [b_n, b_obj] = elm_list[j];
                        if(a_obj.offsetTop > b_obj.offsetTop 
                            && a_obj.offsetLeft < b_obj.offsetLeft + b_obj.offsetWidth
                            && a_obj.offsetLeft + a_obj.offsetWidth > b_obj.offsetLeft){

                            var dist = a_obj.offsetTop-b_obj.offsetTop;
                            rel_objs[a_n]["above"].push([b_n, dist]);
                            rel_objs[b_n]["below"].push([a_n, dist]);
                        }
                        if(a_obj.offsetLeft < b_obj.offsetLeft 
                            && a_obj.offsetTop + a_obj.offsetHeight > b_obj.offsetTop
                            && a_obj.offsetTop < b_obj.offsetTop + b_obj.offsetHeight){

                            var dist = b_obj.offsetLeft-a_obj.offsetLeft;
                            rel_objs[a_n]["to_right"].push([b_n, dist]);
                            rel_objs[b_n]["to_left"].push([a_n, dist]);

                            // console.log(a_n,b_n,dist)

                        }
                    }
                }
            }

            var grab1st = function(x){return x[0];};
            var compare2nd = function(x,y){return x[1] - y[1];};
            var grabN = function(x,n){
                let out = []
                for (var i = 0; i < n; i++){
                    if(i < x.length){
                        out.push(x[i])
                    }else{
                        out.push(null)
                    }
                }
                return out
            }
            for (var i = 0; i < elm_list.length; i++) {
                var rel_obj = rel_objs[elm_list[i][0]];
                // rel_obj["below"] = rel_obj["below"].sort(compare2nd).map(grab1st).join(' '); 
                // rel_obj["above"] = rel_obj["above"].sort(compare2nd).map(grab1st).join(' '); 
                // rel_obj["to_right"] = rel_obj["to_right"].sort(compare2nd).map(grab1st).join(' '); 
                // rel_obj["to_left"] = rel_obj["to_left"].sort(compare2nd).map(grab1st).join(' '); 
                // console.log(elm_list[i], rel_obj["to_left"].sort(compare2nd))
                rel_obj["below"] = rel_obj["below"].sort(compare2nd).map(grab1st)[0] || "";
                rel_obj["above"] = rel_obj["above"].sort(compare2nd).map(grab1st)[0] || "";
                rel_obj["to_right"] = rel_obj["to_right"].sort(compare2nd).map(grab1st)[0] || "";
                rel_obj["to_left"] = rel_obj["to_left"].sort(compare2nd).map(grab1st)[0] || "";
            
                // rel_obj["below"] = grabN(rel_obj["below"].sort(compare2nd).map(grab1st),2);
                // rel_obj["above"] = grabN(rel_obj["above"].sort(compare2nd).map(grab1st),2);
                // rel_obj["to_right"] = grabN(rel_obj["to_right"].sort(compare2nd).map(grab1st),2);
                // rel_obj["to_left"] = grabN(rel_obj["to_left"].sort(compare2nd).map(grab1st),2);
            }
            
            // console.log(rel_objs)
            relative_pos_cache[HTML_PATH] = rel_objs;
        }else{
            rel_objs = relative_pos_cache[HTML_PATH];
        }

        for (var i = 0; i < elm_list.length; i++) {
            var obj = state_json[elm_list[i][0]];
            var rel_obj = rel_objs[elm_list[i][0]];
            // console.log(rel_obj)
            // console.log(elm_list[i][0])
            // console.log(relative_pos_cache[HTML_PATH])

            obj["below"] = rel_obj["below"];
            obj["above"] = rel_obj["above"];
            obj["to_right"] = rel_obj["to_right"];
            obj["to_left"] = rel_obj["to_left"];
            if(strip_offsets){
                delete obj["offsetTop"];
                delete obj["offsetLeft"];
                delete obj["offsetWidth"];
                delete obj["offsetHeight"];
            }

            state_json[elm_list[i][0]] = obj;
        }
        


    }

    console.log("STATE JSON", state_json);
    return state_json;

}



  // state_update(state){

  // }

  // webview_loaded(message){
  //   console.log(message)
  //   var d = message.nativeEvent.data;
  //   console.log("document&:",d)
  //   console.log(document.getElementsByClassName('background-initial'))
  //   // window.document.domain = "http://0.0.0.0:8000"
  // }

  // setRef = webview => {
  //   this.ctat_webview = webview; 
  // }
  render() {
    return (
      <WebView
            //title="hey"
            ///*ref={function(webview) {window.ctat_webview = webview;*/}
            //                        this.iframe_content = webview.frameRef.contentWindow;
            //                        console.log("THIS",this)
            //                        // this.graph = this.iframe_content.CTAT.ToolTutor.tutor.getGraph() || false;
             //                       console.log("MOOP",webview)}}
            ref={this.ctat_webview}
            // style={{ height: 700, width: 400 }}
            originWhitelist={['*']}
            // source={{"uri": "http://0.0.0.0:8000/HTML/fraction_arithmetic.html?question_file=../mass_production/mass_production_brds/AD 5_9_plus_3_7.brd"}}
            source={ this.state.source}
            onLoad={this.state.onLoad}
            // source={{"html": "<!DOCTYPE html><html><head></head><body> HERE IS THE TUTOR... ARE YOU LEARNING YET? </body></html>"}}
            // source={{"html": "<? echo file_get_contents('http://0.0.0.0:8000/HTML/fraction_arithmetic.html'); ?>"}}
            // injectedJavaScript={"window.booger = document"}
            // onMessage={this.webview_loaded}

      />
    );
  }
  
}

const LOAD_SCREEN = '<!DOCTYPE html> \
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
'

export default CTAT_Tutor;