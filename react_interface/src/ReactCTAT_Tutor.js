import React from 'react';
import WebView  from 'react-native-web-webview';
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

export default class CTAT_Tutor extends React.Component {
  constructor(props){
    super(props);
    // this.webview_loaded = this.webview_loaded.bind(this)
    // this.onTransition = this.onTransition.bind(this)
    this.lockElement = this.lockElement.bind(this)
    this.unlockElement = this.unlockElement.bind(this)
    this.colorElement = this.colorElement.bind(this)
    this.makeHighlights = this.makeHighlights.bind(this)
    this.clearHighlights = this.clearHighlights.bind(this)
    this._triggerWhenInitialized = this._triggerWhenInitialized.bind(this)
    this.componentDidUpdate = this.componentDidUpdate.bind(this)
    this.applySAI = this.applySAI.bind(this)
    this.apply_skill_application = this.apply_skill_application.bind(this)
    this.apply_next_example = this.apply_next_example.bind(this)
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

  }

  componentDidMount(){
    window.ctat_webview = this.ctat_webview
    this.iframe = this.ctat_webview
    this.iframe_content = this.ctat_webview.frameRef.contentWindow;
    
    console.log("THIS",this)
    // this.graph = this.iframe_content.CTAT.ToolTutor.tutor.getGraph() || false;
  }

  componentDidUpdate(prevProps,prevState){
    console.log("UPDATED", prevProps)

    if(!this.init_callback){
      this.init_callback = (x) => {};
    }

    this._triggerWhenInitialized()

  }

  loadProblem(context){
    const prob_obj = context.prob_obj
    const nl = context.network_layer
    const interactive = context.interactive
    const promise = new Promise((resolve,reject) => {
      var HTML_name = prob_obj["HTML"].substring(prob_obj["HTML"].lastIndexOf('/')+1).replace(".html", "");

      var domain_name = prob_obj["domain_name"] || HTML_name;
      

      // Point the iframe to the HTML and question_file (brd or nools) for the next problem

      // iframe_content.CTAT = null;
      // iframe_content.CTATCommShell = null;



      var HTML_PATH = prob_obj["HTML"];
      if(!path.isAbsolute(HTML_PATH)){
          HTML_PATH = context.working_dir + "/" + HTML_PATH  
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
        // term_print(prob_obj["question_file"])
        

      nl.term_print('\x1b[0;30;47m' + "Starting Problem: " + BRD_name +  '\x1b[0m');

      var qf = qf_exists  ? {"question_file" : prob_obj["question_file"]} : {"question_file" : "/src/empty.nools"} ;

        console.log(qf)
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
      this.init_callback = resolve
      this.iframe.onload = this.componentDidUpdate;
      this.iframe.src = HTML_PATH + "?" + queryString.stringify( params ).search;
    })
    return promise;
  }

  _triggerWhenInitialized(){
    console.log("TRIGGER WHEN INITIALIZED")
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
    

    if(this.graph && this.commLibrary && this.hasConfig){
      var link = iframe_content.document.createElement('link');
      link.setAttribute('rel', 'stylesheet');
      link.setAttribute('type', 'text/css');
      // link.setAttribute('href', "../".repeat(working_dir.split('/').length+1) + 'css/AL_colors.css');
      link.setAttribute('href', document.location.origin + '/css/AL_colors.css');
      iframe_content.document.getElementsByTagName('head')[0].appendChild(link);

      //Gets rid of annyoing sai printout on every call to sendXML
      iframe_content.flashVars.setParams({"deliverymode" : "bleehhhh"})

      //Grab these event constants from CTAT
      this.CTAT_CORRECT = iframe_content.CTAT.Component.Base.Tutorable.EventType.correct;
      this.CTAT_INCORRECT = iframe_content.CTAT.Component.Base.Tutorable.EventType.incorrect;
      this.CTAT_ACTION = iframe_content.CTAT.Component.Base.Tutorable.EventType.action;    

      this.init_callback(this)
    }else{
      // term_print('\x1b[0;30;47m' + "BLEHH2" + '\x1b[0m');
      console.log("BLEHH2")
      window.setTimeout(() => {this._triggerWhenInitialized()}, 500);
    }
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
    console.log("THIS1",this)
    var elm = this.iframe_content.document.getElementById(name)
    elm.firstElementChild.setAttribute("class", this.color_class_map[type]);
  }

  clearElement(name){
    var elm = this.iframe_content.document.getElementById(name);    
    elm.firstElementChild.value = "";
  }

  makeHighlights(sai){
    
  }

  clearHighlights(){
    
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

  executeSAI(sai){
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

        if(! (HTML_PATH in relative_pos_cache) ){
            var rel_objs = {};
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
            for (var i = 0; i < elm_list.length; i++) {
                var obj = state_json[elm_list[i][0]];
                var rel_obj = relative_pos_cache[HTML_PATH][elm_list[i][0]];
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


    }

    // console.log(state_json);
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

  setRef = webview => {
    this.ctat_webview = webview; 
    this.iframe_content = webview.frameRef.contentWindow;
  }
  render() {
    return (
      <WebView
            //title="hey"
            ///*ref={function(webview) {window.ctat_webview = webview;*/}
            //                        this.iframe_content = webview.frameRef.contentWindow;
            //                        console.log("THIS",this)
            //                        // this.graph = this.iframe_content.CTAT.ToolTutor.tutor.getGraph() || false;
             //                       console.log("MOOP",webview)}}
            ref={this.setRef}
            // style={{ height: 700, width: 400 }}
            originWhitelist={['*']}
            // source={{"uri": "http://0.0.0.0:8000/HTML/fraction_arithmetic.html?question_file=../mass_production/mass_production_brds/AD 5_9_plus_3_7.brd"}}
            source={{"uri": "../../examples/FracPreBake/FractionArithmetic/HTML/fraction_arithmetic.html?question_file=../mass_production/mass_production_brds/AD 5_9_plus_3_7.brd"}}
            // source={{"html": "<!DOCTYPE html><html><head></head><body> HERE IS THE TUTOR... ARE YOU LEARNING YET? </body></html>"}}
            // source={{"html": "<? echo file_get_contents('http://0.0.0.0:8000/HTML/fraction_arithmetic.html'); ?>"}}
            // injectedJavaScript={"window.booger = document"}
            // onMessage={this.webview_loaded}

      />
    );
  }
  
}
