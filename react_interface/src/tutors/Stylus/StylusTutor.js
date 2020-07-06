import Svg, {
  Circle,
  Ellipse,
  G,
  Text as SvgText,
  TSpan,
  TextPath,
  Path,
  Polygon,
  Polyline,
  Line,
  Rect,
  Use,
  Image,
  Symbol,
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  ClipPath,
  Pattern,
  Mask,
  // Filter,
  // FEGaussianBlur,
  // FEOffset,
  // FEMerge,
  // FEMergeNode,
} from 'react-native-svg';

/* Use this if you are using Expo
import { Svg } from 'expo';
const { Circle, Rect } = Svg;
*/

import React from 'react';
import {
  Icon,
  View,
  Text,
  StyleSheet,
  TouchableHighlight,
  TouchableWithoutFeedback,
  Platform, 
  // WebView
  Dimensions
} from 'react-native';

import autobind from 'class-autobind';
import BezierFit from './c_modules/bezier_fit/bezier_fit'
import Seshat from './c_modules/seshat/seshat'

const MAX_STROKE_LENGTH = 512
const MIN_DIST = 4.0
// var stroke_id_counter = 0;

const get_min = (key,strokes) => Math.min(...Object.values(strokes).map((stroke)=>stroke.bounds[key])) 
const get_max = (key,strokes) => Math.max(...Object.values(strokes).map((stroke)=>stroke.bounds[key])) 
const range = (start, end) => {
  return Array(end - start).fill().map((_, idx) => start + idx)
}
const array_equal = (a,b) => {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length != b.length) return false;
  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

const DEFAULT_START_STATE = {
      pen_down : false,
      strokes : {},
      active_elements : [],
      n_strokes : 0,
      mode : "loading",
      check_button_callback: null,
      elmUnderPoint : null,
  };

/////
export default class StylusTutor extends React.Component {
  
  state = {...DEFAULT_START_STATE, ...{strokes:{}} }

  constructor(props){
    super(props);
    autobind(this)

    // if(!this.props.gridWidth) this.props.gridWidth = 100;
    // if(!this.props.groupMode) this.props.groupMode = "grid"
      
    
    this.BezierFit = new BezierFit();
      this.BezierFit.promise.then(() => {
        this.fitCurve = this.BezierFit.fitCurve
        this.groupStrokes = this.BezierFit.groupStrokes
        this.fitCurve([[1,2],[3,4],[5,6],[7,8]])
    })

    this.Seshat = new Seshat();
      this.Seshat.promise.then(() => {
        this.recognize_symbol = this.Seshat.recognize_symbol
        // this.recognize_symbol([
        //     [
        //     [200,200],
        //     [210,210],
        //     [220,220],
        //     [230,230],
        //     [240,240],
        //     [250,250],
        //     ],
        //     [
        //     [250,200],
        //     [240,210],
        //     [230,220],
        //     [220,230],
        //     [210,240],
        //     [200,250],
        //     ],
        //     ])
        // console.log("I HAVE COMPLETED")
        // this.groupStrokes = this.BezierFit.groupStrokes
        // this.fitCurve([[1,2],[3,4],[5,6],[7,8]])
    })


    window.setMode = (mode) => {this.setState({mode : mode })}

    this.where_colors = [  "darkorchid",  "#ff884d",  "#52d0e0", "#feb201",  "#e44161", "#ed3eea", "#2f85ee",  "#562ac6", "#cc24cc"]
    // this.color_map = {
    //   "EXAMPLE" : "dodgerblue",
    //   "CORRECT" : "limegreen",
    //   "INCORRECT" : "red",
    //   "HIGHLIGHT" : "darkorchid",
    //   "START_STATE" : "darkcyan",
    //   "DEFAULT" : "black"
    //   };
    this.mode_to_color = {
      "set_start_state" : "START_STATE",
      "demonstrate" : "EXAMPLE",
      "debug" : "gray"
    }
    this.current_foci = [];
    this.start_state_history = [];
    this.highlighted_elements = [];
    this.elements = {};
    this.groups = [];
    // this.getEvaluatable = this.getEvaluatable.bind(this)
    // this.evaluate = this.evaluate.bind(this)
    // this.setStartState = this.setStartState.bind(this)
    // this.undoStroke = this.undoStroke.bind(this)
    // this.penDown = this.penDown.bind(this)
    // this.penUp = this.penUp.bind(this)
    // this.penMove = this.penMove.bind(this)

    // this.setState({"mode" : (props.mode || "set_start_state")})
    
    // this.onStartShouldSetResponder = (e) => true;
    // this.onMoveShouldSetResponder = (e) => true;
    // this.onResponderStart = this.penDown.bind(this);
    // this.onResponderRelease = this.penUp.bind(this);
    // this.onResponderMove = this.penMove.bind(this);
    // this.onMouseDown = this.penDown.bind(this);
    // this.onPress= this.penDown.bind(this);
    // this.onMouseUp = this.penUp.bind(this);
    // this.onResponderStart = this.onResponderStart.bind(this);
    // this.penDown = this.penDown.bind(this);
    // this.penUp = this.penUp.bind(this);


  }

   onLayout = (e) => {
    this.setState({
      width: e.nativeEvent.layout.width,
      height: e.nativeEvent.layout.height,
      x: e.nativeEvent.layout.x,
      y: e.nativeEvent.layout.y
    })
  }

  componentDidMount(){
    console.log("PROPSMODE", this.props.mode)
    this.setState({"mode" : this.props.mode || null})
  }

  enterSetStartStateMode(){
    if(this.state.mode != "debug"){
      this.setState({mode : "set_start_state",
                     check_button_callback : this.setStartState })  
    }
    console.log("MODE!", this.state.mode)
  }

  exitSetStartStateMode(){
    let L = this.state.n_strokes+this.state.pen_down
    let new_strokes = {}
    for (var i=0; i<L;i++){
      var stroke = this.state.strokes[i]
      if(stroke['evaluation'] == "START_STATE"){
        stroke['evaluation'] = "TUTOR"
      }
      new_strokes[i] = stroke
    }
    this.setState({strokes : new_strokes,mode : null })
  }


  enterFeedbackMode(){
    this.setState({mode : "feedback",
                   check_button_callback : this.demonstrate,
                   feedback_start_stroke_id : this.state.n_strokes })  
  }

  exitFeedbackMode(){
    this.setState({mode : null ,
                   check_button_callback : null,
                   feedback_start_stroke_id : null })
  }

  getCurrentFoci(){
    if(this.current_foci){
      return this.current_foci.map((elm) => elm.id)
    }else{
      return []
    }
  }

  enterFociMode(){
    this.unhighlightAll();
    this.current_foci = []
    this.setState({mode : "foci" }) 
    
  }

  exitFociMode(){
    this.unhighlightAll();
    this.current_foci = []
    this.setState({mode : null })
  }


  printFeedback(context, event) {
    var nl = context.network_layer;
    var staged_SAI = context.staged_SAI;

    var type = context.action_type;
    // var reward = staged_SAI.reward
    if (!context.feedback_map || Object.keys(context.feedback_map).length === 0) {
      if (type == "ATTEMPT") {
        type = staged_SAI.reward > 0 ? "CORRECT" : "INCORRECT";
      }

      // var color = color_map[type]
      var inps =
        staged_SAI.inputs["value"] != null ? staged_SAI.inputs["value"] : "";

      nl.term_print(type + ": " + staged_SAI.selection + " -> " + inps, type);
    } else {
      for (var index in context.feedback_map) {
        var skill_app = context.skill_applications[index];
        var type = context.feedback_map[index].toUpperCase();
        // var color = color_map[type]
        var inps =
          skill_app.inputs["value"] != null ? skill_app.inputs["value"] : "";
        nl.term_print(type + ": " + skill_app.selection + " -> " + inps, type);
      }
    }
  }



  getCurrentFoci(){
    if(this.current_foci){
      return this.current_foci.map((elm) => elm.id);
    }else{
      return []
    }
  }
  // setStartState(){
  //   let L = this.state.n_strokes+this.state.pen_down
  //   let new_strokes = {}
  //   for (var i=0; i<L;i++){
  //     var stroke = this.state.strokes[i]
  //     if(stroke['evaluation'] == "START_STATE"){
  //       stroke['evaluation'] = "TUTOR"
  //     }
  //     new_strokes[i] = stroke
  //   }
  //   this.setState({strokes : new_strokes,mode : "authoring" })

  

  loadProblem(context){
    this.clear()
    const promise = new Promise((resolve, reject) =>
     {//this.setState({"mode" : "set_start_state"})
      resolve({ updateContext: {} })})
    return promise
  }

  clear(){
    this.setState({...DEFAULT_START_STATE, ...{strokes:{},active_elements:[]}})
    this.current_foci = [];
    this.start_state_history = [];
    this.highlighted_elements = [];
    this.elements = {};
    this.groups = [];
  }

  lockElement(name){
    var elm = this.resolve_elm(elm)
    if(!elm){return;}
    elm.locked = true
  }

  unlockElement(name){
    var elm = this.resolve_elm(elm)
    if(!elm){return;}
    elm.locked = false
  }

  colorElement(name,type){
    alert("NOT IMPLEMENTED")
    // var stroke = this.state.strokes[name]
    // stroke.color = this.color_map[type] || type
    // this.setState({strokes :this.state.strokes})
  }

  resolve_elm(elm){
    if(typeof(elm) == "string"){
      return elm in this.elements ? this.elements[elm] : null
    }else{
      return elm
    }
  }

  highlightElement(elm,colorIndex=0){
    // if(!elm) return
    // console.log(elm)
    // var stroke_ids;

    elm = this.resolve_elm(elm)
    if(elm == null){return;}
    
    if(typeof(elm) != "object" || elm.type == "strokes"){
      // if(typeof(elm) == "object"){
      var stroke_ids = elm.stroke_ids == undefined ? [elm] : elm.stroke_ids
      // }

      for(var i=0; i< stroke_ids.length; i++){
        var s_id = stroke_ids[i]
        var stroke = this.state.strokes[s_id]
        stroke.highlight = colorIndex;
        var index = this.highlighted_elements.indexOf(s_id)
        if(index == -1){
          this.highlighted_elements.push(s_id)  
        }
      }
    }else{
      elm.highlight = colorIndex
      var index = this.highlighted_elements.indexOf(elm.id)
      if(index == -1){
        this.highlighted_elements.push(elm.id)  
      }
    }
  }

  unhighlightElement(elm){
    // if(!elm) return



    elm = this.resolve_elm(elm)
    console.log("UNHIGHTLIGHT",elm.id,elm,typeof(elm))
    if(elm == null){return;}
    
    if(typeof(elm) != "object" || elm.type == "strokes"){
      var stroke_ids = elm.stroke_ids == undefined ? [elm] : elm.stroke_ids
      for(var i=0; i< stroke_ids.length; i++){
        var s_id = stroke_ids[i]
        var stroke = this.state.strokes[s_id]
        stroke.highlight = null
        var index = this.highlighted_elements.indexOf(s_id)
        if(index > -1){
          this.highlighted_elements.splice(index,1)  
        }
      }
    }else{
      elm.highlight = null
      var index = this.highlighted_elements.indexOf(elm.id)
      if(index > -1){
        this.highlighted_elements.splice(index,1)  
      }
    }
  }

  clearElement(name){
    //TODO
  }

  highlightSAI(sai){
    // console.log("HIGHLIGHT SAI")
    if(sai.mapping){
      var index = 0
      for (var var_str in sai.mapping){
          var elem_str = sai.mapping[var_str]
          var colorIndex = 0
          if(var_str != "?sel"){
              colorIndex = 1 + ((index-1) % (this.where_colors.length-1));
          }
          this.highlightElement(elem_str,colorIndex)
          index++
      }
    }else{
      alert("IDK WHAT THIS IS")
    }
  }
  

  unhighlightAll(){
    for(var elem_str of [...this.highlighted_elements]){
      this.unhighlightElement(elem_str);
    }
  }

  getState(){
    var out = {}


    for (let [id, elm1] of Object.entries(this.elements)) {
    // for(var i=0; i < this.elements.length; i++){
      // var elm1 = this.elements[i]
      var elmobj;

      if(this.props.groupMode == "grid"){
        var value = elm1.value != null ? elm1.value.toString() : null
        elmobj = {
          id: "e" + elm1.g_coords.x + "_" + elm1.g_coords.y,//elm1.id,
          type : "Symbol",
          value : value,
          filled : value != "" && value != null ? true : false
        }
        var c1 = elm1.g_coords
        var [above,below,to_right,to_left] = [null,null,null,null];
        for (let [id2, e2] of Object.entries(this.elements)) {
          // var e2 = this.elements[j]
          var c2 = e2.g_coords
          if(c2.x == c1.x-1){to_left = e2.id}
          if(c2.x == c1.x+1){to_right = e2.id}
          if(c2.y == c1.y-1){above = e2.id}
          if(c2.y == c1.y+1){below = e2.id}
        }
        elmobj = {...elmobj, ...{"to_left" : to_left, "to_right" : to_right,
                    "above" : above, "below" : below}}
      }

      out[elmobj.id] = elmobj
    }
    const mW = this.state.width / this.props.gridWidth
    const mH = this.state.height / this.props.gridWidth
    if(this.props.groupMode == "grid"){
      for(var i=0; i < mW; i++){
        for(var j=0; j < mH; j++){
          var id = "e" + i + "_" + j
          if(!(id in out)){
            out[id] = {
              id : id,
              type : "Symbol",
              value : "",
              filled : false
            }
          }
        }
      }
      const ts = (x) => x.toString()
      for(var i=0; i < mW; i++){
        for(var j=0; j < mH; j++){
          var id ="e" + ts(i) + "_" + ts(j)           
          out[id]["to_left"] = (i-1 >= 0) ? ("e" + ts(i-1) + "_" + ts(j))   : null
          out[id]["to_right"] = (i+1 < mW) ? ("e" + ts(i+1) + "_" + ts(j))  : null
          out[id]["above"] = (j-1 >= 0) ? ("e" + ts(i) + "_" + ts(j-1)) : null
          out[id]["below"] = (j+1 < mH) ? ("e" + ts(i) + "_" + ts(j+1)) : null
        }
      }
    }
    out['done'] = {'id': "done", type:'OverlayButton'}
    console.log("STATE:",out)
    return out
  }

  clearProposedSAI(){
    if(this.proposed_SAI){
        // this.clearElement(this.proposed_SAI.selection)
        // this.unlockElement(this.proposed_SAI.selection.replace('?ele-',""))
        this.unhighlightAll()
        this.proposed_SAI = null;
        delete this.elements[this.staged_element];
    }
  }

  proposeSAI(sai){
    console.log("PROPOSE",sai)
    this.clearProposedSAI()
    this.proposed_SAI = {...sai}
    this.stageSAI(sai)
    this.highlightSAI(sai)

    this.setState({active_elements : Object.keys(this.elements)})
  }

  stageSAI(sai){
    //TODO
    
    var [gx,gy] = sai.selection.slice(1).split("_").map(x => Number(x))
    console.log("STAGE",sai,gx,gy)
    var [x,y] = [this.props.gridWidth * (gx+.5),this.props.gridWidth * (gy-.2)]
    var width = this.props.gridWidth * .8
    var elm = { 
      id : sai.selection,
      g_coords: {x: gx,y: gy},
      value : sai.inputs['value'],
      type : 'text',
      x : x,
      y : y+this.props.gridWidth,
      bounds : {"minX":x-width*.5, "minY":y, "maxX":x+width*.5, "maxY":y+width},
      fontSize : Math.floor(this.props.gridWidth * .8)
    }
    this.elements[elm.id] = elm;
    this.staged_element = elm.id;

  }

  confirmProposedSAI(){
    console.log("confirmed",this.proposed_SAI, this.highlighted_elements)
    if(this.proposed_SAI){
      this.unhighlightAll()
      this.proposed_SAI = null  
    }
    this.setState() //Force rerender
  }


  penDown(e){
    if(this.state.mode == "loading"){
      return
    }
    if(this.state.mode == "foci"){
      this.mouseDown(e)
      return
    }
    console.log("HERE",typeof(e.target.className),e.target.className.baseVal == "svg_canvas" || false)
    console.log("PENDOWN")
    if(e.target.className.baseVal == "svg_canvas" || e.target.parentNode.className.baseVal == "svg_canvas"){
      var strokes = this.state.strokes
      var L = Object.keys(strokes).length
      strokes[L] = {"id" : L}
      strokes[L].points_str = e.clientX.toString()+","+e.clientY.toString()
      strokes[L].points = [[e.clientX,e.clientY]]
      strokes[L].bounds = {"minY": e.clientY, "maxY":e.clientY, "minX":e.clientX, "maxX" :e.clientX }
      console.log("MODE",this.state.mode)
      if(this.state.mode == "set_start_state"){
        strokes[L]['evaluation'] = "START_STATE" 
      }else{
        strokes[L]['evaluation'] = "ATTEMPT" 
      }
      // strokes.push()
      this.setState({pen_down : true,strokes:strokes});
    }
  }
  snapStrokesToGrid(strokes){
    

    var grid_assignments = {}
    var gridWidth = this.props.gridWidth
    // console.log("GW",this.props.gridWidth)

    // console.log("strokes", strokes)
    for (var s_id in strokes){
      var stroke = strokes[s_id]
      // console.log("stroke", stroke)
      var {minX,maxX,minY,maxY} = stroke.bounds
      var min_i = Math.floor(minX/gridWidth) 
      var max_i = Math.ceil(maxX/gridWidth)
      var min_j = Math.floor(minY/gridWidth) 
      var max_j = Math.ceil(maxY/gridWidth)
      if(maxX-minX > 1.5*gridWidth || maxY-minY > 1.5*gridWidth){
        continue //Skip objects that span many gridlines
      }
      // console.log("MMM",min_i,max_i,min_j,max_j)
      var [b_i, b_j, b_area] = [-1, -1, 0.0]
      for (var i=min_i; i < max_i; i++){
        for (var j=min_j; j < max_j; j++){
          var w = (Math.min(maxX,(i+1)*gridWidth) - Math.max(minX,i*gridWidth)) + 1
          var h = (Math.min(maxY,(j+1)*gridWidth) - Math.max(minY,j*gridWidth)) + 1
          var area = w * h
          // console.log("AREA", i, j,area, s_id)
          if(area > b_area){
            [b_area, b_i, b_j] = [area, i, j]
          }
        }
      }
      var b_str = b_i + "_" + b_j
      var a = grid_assignments[b_str] || []
      a.push(parseInt(s_id))
      grid_assignments[b_str] = a      
    }
    // console.log("GRID ASSIGNMENTS", grid_assignments)
    return [Object.values(grid_assignments), grid_assignments]
  }

  removeElement(stroke_ids){
    var elm;
    for (let [id, e] of Object.entries(this.elements)) {
      if(e.stroke_ids.length == stroke_ids.length){
        var ok = true
        for (var j = 0; j < e.stroke_ids.length; j++) {
          if (e.stroke_ids[j] !== stroke_ids[j]){
            ok = false; break;
          }
        }
        if(ok){ delete this.elements[id];/*this.elements.splice(i,1);*/ return elm }
      }
    }

    this.setState({active_elements : Object.keys(this.elements)})
    return undefined
  }
  addElement(stroke_ids, extra_info=null){
    // this.elements = this.elements || []
    // for (var i=0; i < groups.length; i++){
    var elm = {}
    elm.stroke_ids = stroke_ids
    elm.id = "ie" + stroke_ids.join("_")
    elm.strokes = stroke_ids.map((indx)=>this.state.strokes[indx])
    // console.log("CLOOOO",elm.strokes,Object.values(elm.strokes))
    // console.log("CLOOOO",Object.values(elm.strokes).map((stroke)=>stroke.bounds["minX"]))
    elm.bounds = {minX: get_min("minX",elm.strokes),
                  maxX: get_max("maxX",elm.strokes),
                  minY: get_min("minY",elm.strokes),
                  maxY: get_max("maxY",elm.strokes)}
    elm.type = 'strokes'              
    

    if(extra_info && this.props.groupMode == "grid"){
      for(var loc_str in extra_info){
        // console.log("MEEP", extra_info[loc_str],stroke_ids)
        if(array_equal(extra_info[loc_str],stroke_ids)){
          var coords = loc_str.split("_")
          elm.g_coords = {"x" : parseInt(coords[0]), "y" : parseInt(coords[1])} 
        }
      }
      elm.id = "e" + elm.g_coords.x.toString() + "_" + elm.g_coords.y.toString()
    }
    console.log("BEFORE", Object.keys(this.elements), elm)
    this.elements[elm.id] = elm;
    console.log("AFTER",this.elements,Object.keys(this.elements))

    this.setState({active_elements : Object.keys(this.elements)})
    // }
    // console.log(this.groupStrokes(this.state.strokes))
    return elm
  }

  _elemsFromStrokes(strokes){
    var elem_indxs = new Set()
    for(var i=0; i < strokes.length; i++){
      var s = strokes[i]
      var stroke = typeof s != "number" ? s : this.state.strokes[s]
      for (let [id, elm] of Object.entries(this.elements)) {
      // for(var j=0; j < this.elements.length; j++){
        // var elm = this.elements[j]
        if(elm.type == 'strokes' && elm.stroke_ids.indexOf(stroke.id) != -1){
          elem_indxs.add(id)
        }  
      }
    }
    return Array.from(elem_indxs).map((e_id)=>this.elements[e_id])
  }

  _groupDiff(old_g,new_g){
    let old_s = old_g.map(x => x.join(","))
    let new_s = new_g.map(x => x.join(","))

    let added_s = new_s.filter(x => !old_s.includes(x));
    let removed_s = old_s.filter(x => !new_s.includes(x));

    let added = added_s.map(x => x.split(",").map(x => parseInt(x)))
    let removed = removed_s.map(x => x.split(",").map(x => parseInt(x)))
    // console.log(added,removed)
    return [added, removed]
  }

  penUp(e){
    console.log("penUP")
    if(this.state.mode == "loading"){
      return
    }
    if(this.state.mode == "foci"){
      this.mouseUp(e)
      return
    }
    console.log("UP",this.state.pen_down,Object.keys(this.elements))
    if(this.state.pen_down){
      this.setState({pen_down : false,n_strokes: this.state.n_strokes+1});

    }
    if(this.props.groupMode == "grid"){
      var [groups, extra_info] = this.snapStrokesToGrid(this.state.strokes)
    }else{
      var [groups, extra_info] = this.groupStrokes(this.state.strokes)
    }


    var [added, removed] = this._groupDiff(this.groups || [],groups)

    // if(this.props.groupMode == "grid"){
    //   var groups = this.snapStrokesToGrid(this.state.strokes)
    // }else{
    //   var groups = this.groupStrokes(this.state.strokes)
    // }
    this.groups = groups

    // console.log("GROUPS", groups)

    // this.removeElement(group)
    
    for(var i=0; i < removed.length; i++){
      this.removeElement(removed[i])
    }

    for(var i=0; i < added.length; i++){
      let group = added[i]
      let elm = this.addElement(group, extra_info)
      // elm.symbol_probs = this.recognize_symbol(elm.strokes)
      console.time("recognize_symbol")
      elm.symbol_probs = this.recognize_symbol(elm.strokes)
      console.timeEnd("recognize_symbol")

      console.log("Recognize Symbol: ")
      Object.entries(elm.symbol_probs).sort((a,b)=>b[1]-a[1]).forEach(function([sym,prob]){
        if(elm.value == undefined){elm.value = sym}
        console.log(sym.padStart(12),":", prob.toFixed(3))
      })
    }

  }

  penMove(e){
    // console.log(e)
    // var X,Y
    // console.log(e.type)
    // if(e.type == "mousemove"){
    //   X,Y = 
    // }

    // console.log(this.state.pen_down)
    if(this.state.mode == "foci"){
      this.mouseMove(e)
      return
    }
    if(this.state.pen_down){
      var strokes = this.state.strokes 
      var stroke = strokes[this.state.n_strokes]
      var p = [e.clientX,e.clientY]
      var lp = stroke.points[stroke.points.length-1]
      if(e.clientX < stroke.bounds.minX){stroke.bounds.minX = e.clientX}
      if(e.clientX > stroke.bounds.maxX){stroke.bounds.maxX = e.clientX}
      if(e.clientY < stroke.bounds.minY){stroke.bounds.minY = e.clientY}
      if(e.clientY > stroke.bounds.maxY){stroke.bounds.maxY = e.clientY}
      // console.log("DIST", (p[0]-lp[0])**2 + (p[1]-lp[1])**2)

      if( (p[0]-lp[0])**2 + (p[1]-lp[1])**2 >= MIN_DIST*MIN_DIST && stroke.points.length < MAX_STROKE_LENGTH){
        stroke.points.push(p)
        stroke.points_str += " " + e.clientX.toString()+","+e.clientY.toString()
        stroke.bezier_splines = this.fitCurve(stroke.points)


        this.setState({"strokes":strokes})
        // var evt = e.nativeEvent;
        // console.log("BEZ",stroke.bezier_splines);  
      }
    }
  }

  mouseMove(e){
    var ele = this.getElementUnderPoint(e.clientX,e.clientY)
    // var id = ele ? ele.id : null
    this.setState({elmUnderPoint : ele})
  }

  mouseDown(e){
    console.log("MOUSE DOWN")
    var ele = this.getElementUnderPoint(e.clientX,e.clientY)
    // var id = ele ? ele.id : null
    this.setState({mouseDownElm : ele,
                    elmUnderPoint : ele})
  }

  mouseUp(e){
    console.log("MOUSE UP")
    var ele = this.getElementUnderPoint(e.clientX,e.clientY)
    // var id = ele ? ele.id : null
    if(ele && ele == this.state.mouseDownElm){
      var indx = this.current_foci.indexOf(ele)
      if(indx == -1){
          this.current_foci.push(ele)
          this.highlightElement(ele,0)
      }else{
          this.current_foci.splice(indx,1)
          this.unhighlightElement(ele)
      }
    }
    // console.log(this.current_foci)
    this.setState({mouseDownElm : null,
                    elmUnderPoint : ele})
  }

  getStokeUnderPoint(x,y,padding=10){
    var strokeCandidates = []
    for (let i=0; i<this.state.n_strokes;i++){
        var stroke = this.state.strokes[i]
        // console.log(stroke.bounds.minX,stroke.bounds.minY,stroke.bounds.maxX,stroke.bounds.maxY)
        if(stroke &&
           x > stroke.bounds.minX-padding && x < stroke.bounds.maxX+padding &&
           y > stroke.bounds.minY-padding && y < stroke.bounds.maxY+padding){
          strokeCandidates.push(stroke)
        }
    }
    if(strokeCandidates.length == 0){return null};
    var minDist = Number.MAX_VALUE;
    var minStroke;
    for(let stroke of strokeCandidates){
      for(let i=0; i<stroke.points.length;i++){
        let p = stroke.points[i]
        var d = (x-p[0])**2 + (y-p[1])**2
        if(d < minDist){
          minDist = d
          minStroke = stroke
        }
      }
    }
    return minStroke
  }

  getElementUnderPoint(x,y,padding=10){
    for (let [id, elm] of Object.entries(this.elements)) {
      console.log("ET:",id, elm)
      if( x > elm.bounds.minX-padding && x < elm.bounds.maxX+padding &&
          y > elm.bounds.minY-padding && y < elm.bounds.maxY+padding){
        return elm        
      }
    }
    return null

  }

  undoStroke(e){
    const strokes = this.state.strokes
    if(this.state.n_strokes > 0){
      const last_ev = strokes[this.state.n_strokes-1]['evaluation']
      if(last_ev == "INCORRECT" || last_ev == "ATTEMPT" || last_ev == "START_STATE"){
        delete strokes[this.state.n_strokes-1]
        this.setState({"strokes" : strokes, "n_strokes" : this.state.n_strokes-1})
      }
    }

  }



  demonstrate(){
    var L = this.state.n_strokes
    var start = this.state.feedback_start_stroke_id
    var d_strokes = range(start,L).map(x => this.state.strokes[x])

    for(var i=0; i < d_strokes.length; i++){
      d_strokes[i].evaluation = "DEMONSTRATE"
    }

    var elems = this._elemsFromStrokes(d_strokes)
    if(elems.length > 0){
      var e = elems[0];  
      this.props.interactions_service.send({
        type: "DEMONSTRATE",
        data: { 
                selection : e.id,
                action : "WriteExpr",
                inputs : {'value' : e.value},
                reward: 1 
              }
      });
    }
    


    
    // } else if (type == "ATTEMPT") {
    //   console.log("SEND ATTEMPT", sai);
    //   this.props.interactions_service.send({
    //     type: "ATTEMPT",
    //     data: { ...sai }
    //   });
  }

  pressDone(){
    this.props.interactions_service.send({
        type: "DEMONSTRATE",
        data: { selection:"done",
                action : "ButtonPressed",
                inputs : {value : -1},
                reward: 1 
              }
      });
  }

  getEvaluatable(){
    let i=0;
    let L = this.state.n_strokes+this.state.pen_down
    for (; i<L;i++){
      let ev = this.state.strokes[i]['evaluation'];
      if(ev == "ATTEMPT" || ev == "INCORRECT"){
          break
      }
    }
    console.log("hee", i)
    let out = {}
    for (; i<L;i++){
      out[i] = this.state.strokes[i]
    }

    return out
  }

  evaluate(){
    let ev_strokes = {};
    if(this.props.evaluate){
      ev_strokes = this.props.evaluate(this.getEvaluatable())
    }else{
      ev_strokes = this.getEvaluatable()
      // console.log("bleep", ev_strokes)
      // for (let i=0; i<ev_strokes.length;i++){
      for(var i in ev_strokes){
        ev_strokes[i]['evaluation'] = "INCORRECT"
      }
    }
    // console.log("bloop", ev_strokes)
    this.setState({strokes: {...this.state.strokes,...ev_strokes}})
  }



  render() {
    // console.log("RERENDER",[...this.highlighted_elements])
    // console.log(this.state.strokes)
    let svg_content = []
    // svg_content.push( <Circle cx={300} cy={200} r="50" fill="red" />);
    for (let i=0; i<this.state.n_strokes+this.state.pen_down;i++){

        var stroke = this.state.strokes[i]
        // if(this.state.mode != "debug"){
                 
        // }else{
        var elmUnderCursor =this.state.elmUnderPoint
        var elmUnderCursor_strokes = elmUnderCursor ? elmUnderCursor.stroke_ids || [] : [] 
        var strokeWidth = this.state.mode == "debug" ? ".5" :(elmUnderCursor_strokes.indexOf(stroke.id) != -1  ?  "4": "3")
        if(stroke.highlight != null){
          svg_content.push(<Polyline
            points= {stroke['points_str']} fill="none"
            stroke={this.where_colors[stroke.highlight]}
            strokeWidth={strokeWidth*3 +1}
            strokeOpacity={0.15}
            strokeLinecap='round'
          />);   
          svg_content.push(<Polyline
            points= {stroke['points_str']} fill="none"
            stroke={this.where_colors[stroke.highlight]}
            strokeWidth={strokeWidth*2}
            strokeOpacity={0.4}
            strokeLinecap='round'
          />);   
        }

        if(stroke.points.length > 1){
          svg_content.push(<Polyline
            points= {stroke['points_str']} fill="none"
            stroke={pen_color_map[stroke['evaluation']] || pen_color_map["DEFAULT"]}
            strokeWidth={strokeWidth}
            strokeLinecap='round'
          />);   
        }else{
          svg_content.push(<Circle
            cx= {stroke.points[0][0]}
            cy= {stroke.points[0][1]}
            r={strokeWidth*1.5}
            fill = {pen_color_map[stroke['evaluation']] || pen_color_map["DEFAULT"]}
          />);   
        }
        
        // var curve_str = "";
        if(this.state.mode == "debug"){
          var splines = stroke['bezier_splines'] || [];
          var circles = []
          for (let j=0; j<splines.length;j++){
            var b = splines[j];
          // for (const b of splines){
            var curve_str = "M"+b[0]+" "+b[1]+" C"+b[2]+" "+b[3]+" "+b[4]+" " +b[5]+" "+b[6]+" "+b[7]+" ";
            svg_content.push(<Path
              d= {curve_str}
              fill="none"
              stroke={'blue'}
              strokeWidth="3"
              strokeLinecap='round'
            />);

            circles.push( <Circle cx={b[0]+""} cy={b[1]+""} r="3" fill="red" />);
          }
          
          var points = stroke['points'] || [];
          for (let j=0; j<points.length;j++){
            var p = points[j];
            circles.push( <Circle cx={p[0]+""} cy={p[1]+""} r="1" fill="red" />);
          }
          svg_content = svg_content.concat(circles);   

          
        }
    }

    var winWidth = this.state.width//Dimensions.get("window").width
    var winHeight = this.state.height//Dimensions.get("window").height
    var gridWidth = this.props.gridWidth || 100
    for (let i=0; i<winWidth/gridWidth;i++){
      svg_content.push(<Polyline
        points= {i*gridWidth+","+"0"+" "+i*gridWidth+","+winHeight}
        fill="none"
        stroke={'gray'}
        strokeWidth=".5"
        strokeOpacity={0.4}
      />);
    }

    for (let i=0; i<winHeight/gridWidth;i++){
      svg_content.push(<Polyline
        points= {"0"+","+i*gridWidth+" "+winWidth+","+i*gridWidth}
        fill="none"
        stroke={'gray'}
        strokeWidth=".5"
        strokeOpacity={0.4}
      />);
    }
    // console.log("svg_content",svg_content)

    // for (let j=0; j<10;j++){
        
    // }

    // svg_content.push(<SvgText x={100} y={100}
    //                                  fontSize={80}
    //                                  stroke={this.where_colors[2]}
    //                                  strokeOpacity={0.15}
    //                                  strokeWidth={3*(80.0/40.0) + 1}
    //                         > {7} </SvgText>);  
    // svg_content.push(<SvgText x={100} y={100}
    //                                  fontSize={80}
    //                                  stroke={this.where_colors[2]}
    //                                  strokeOpacity={0.45}
    //                                  strokeWidth={2*(80.0/40.0)}
    //                         > {7} </SvgText>);  
    // svg_content.push(<SvgText x={100} y={100} fontSize={80}
                            // > {42} </SvgText>);
    // var elems = this.elements || {};
    // for (let j=0; j<elems.length;j++){
    for (let [id, elm] of Object.entries(this.elements)) {
       var b = elm.bounds;
        if(elm.id == "done"){continue}
        if(elm.type == 'text'){
          if(elm.highlight != null){
            svg_content.push(<SvgText x={elm.x} y={elm.y}
                                     fontSize={elm.fontSize}
                                     stroke={this.where_colors[elm.highlight]}
                                     strokeOpacity={0.15}
                                     strokeWidth={elm.fontSize/14.0 + 1}
                                     textAnchor="middle"
                            > {elm.value.toString()} </SvgText>);  
            svg_content.push(<SvgText x={elm.x} y={elm.y} 
                                    fontSize={elm.fontSize}
                                     stroke={this.where_colors[elm.highlight]}
                                     strokeOpacity={0.45}
                                     strokeWidth={elm.fontSize/20.0}
                                     textAnchor="middle"
                            > {elm.value.toString()} </SvgText>);
          }else{
            svg_content.push(<SvgText x={elm.x} y={elm.y} 
                            fontSize={elm.fontSize}
                            textAnchor="middle"
                            > {elm.value.toString()} </SvgText>);
          }
          
          // console.log(elm.value.toString())
        }else if(elm.type == 'strokes'){
          svg_content.push( <Rect x={b.minX} y={b.minY} width={b.maxX-b.minX} height={b.maxY-b.minY}
                            stroke='orange' strokeWidth=".5" fill='none'/> ); 
        }

    }



    // let check_button_callback
    // if(this.state.mode == "set_start_state"){
    //   check_button_callback = this.setStartState
    // }else if(this.state.mode == "set_start_state"){
    //   check_button_callback = this.demonstrate
    // }else{  
      
    //   check_button_callback = this.evaluate
    // }
    
    
    var cursor;
    if(this.state.mode == "foci"){
      cursor = this.state.elmUnderPoint == null ? "default" : "pointer"
    }else{
      cursor = cursor_map[this.state.mode] || cursor_map[null]
    }


    // console.log("CURSOR", cursor)
    return (

      <TouchableWithoutFeedback
        /*onStartShouldSetResponder = {(e) => true}
        onMoveShouldSetResponder = {(e) => true}*/
        onMouseDown = {this.penDown}
        onMouseUp = {this.penUp}
        onMouseLeave = {this.penUp}
        onMouseMove = {this.penMove}
        style={{height:"100%", width:"100%" }}
        /*onResponderStart = {this.penDown.bind(this)}
        onResponderRelease = {this.penUp.bind(this)}
        onResponderMove = {this.penMove.bind(this)}*/
        >
      
      <View
        onLayout = {this.onLayout}
        style={[
          StyleSheet.absoluteFill,
          {  justifyContent: 'center', height:"100%", width:"100%" },
        ]}>
        
        
        <Svg className="svg_canvas" style ={{"cursor" : cursor}} height="100%" width="100%" >
         <Defs>
            {/*<Filter
                id="a"
                filterUnits="userSpaceOnUse"
                x={0}
                y={0}
                width={200}
                height={120}
            >
                <FEGaussianBlur
                    in="SourceAlpha"
                    stdDeviation={4}
                    result="blur"
                />
                <FEOffset in="blur" dx={4} dy={4} result="offsetBlur" />
                <FEMerge>
                    <FEMergeNode in="offsetBlur" />
                    <FEMergeNode in="SourceGraphic" />
                </FEMerge>
            </Filter>*/}
        </Defs>
          {svg_content}
        </Svg>

        {(this.state.mode != "foci" && this.state.mode != "loading")  &&
          <View>
            <TouchableHighlight
              style = {[styles.circle_buttons,styles.undo_button]}
              onPress = {this.undoStroke}>
              <Text style={styles.undo_button_text}>{'\u21B6'}</Text>
            </TouchableHighlight>
            {(this.state.mode != "set_start_state") && [
            <TouchableHighlight
              style = {[styles.circle_buttons,styles.check_button]}
              onPress = {this.state.check_button_callback}>
              <Text style={styles.check_button_text}>{'\u2713'}</Text>
            </TouchableHighlight>,
            <TouchableHighlight
              style = {[styles.circle_buttons,styles.done_button]}
              onPress = {this.pressDone}>
              <Text style={styles.done_button_text}>{'Done'}</Text>
            </TouchableHighlight>
            ]}
            
          </View>
        }

      </View>
      </TouchableWithoutFeedback>

      
    );
  }
}

StylusTutor.defaultProps = {
    gridWidth : 100,
    groupMode : "grid"
  };

const pen_color_map = { 
  'DEFAULT' : 'black',
  'ATTEMPT' : 'slategray',
  'TUTOR' : 'black',
  'DEMONSTRATE' : 'dodgerblue',
  'START_STATE' : 'teal',
  'CORRECT' : 'limegreen', 
  'INCORRECT' : 'crimson', //Crimson better than red since looks same as limegreen for people w/ deuteranopia 
}

var cursor_map = {
    "debug" : "crosshair",
    "foci" : "pointer",
    "set_start_state" : "crosshair",
    "feedback" : "crosshair",
    null : "progress",
    "loading" : "progress"
  }

const styles = StyleSheet.create({
  circle_buttons: {
    position : "absolute",
    backgroundColor : "gray",
    borderRadius:60,
    height:60,
    width:60,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2
  },
  undo_button: {
    bottom : 50,
    right : 120,
  },
  undo_button_text: {
    fontSize: 40
  },
  check_button: {
    bottom : 50,
    right: 50,
  },
  check_button_text: {
    fontSize: 40
  },
  done_button : {
    bottom : 50,
    left: 50,
    width:80,
    height:40,
  },
  done_button_text: {
    fontSize: 24
  },
  



})