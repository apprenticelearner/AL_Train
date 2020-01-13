import Svg, {
  Circle,
  Ellipse,
  G,
  // Text,
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
  Platform//, 
  // WebView
} from 'react-native';

import autobind from 'class-autobind';
import BezierFit from './c_modules/bezier_fit/bezier_fit'

const MAX_STROKE_LENGTH = 512
const MIN_DIST = 4.0
// var stroke_id_counter = 0;



/////
export default class StylusTutor extends React.Component {
  state = {
      pen_down : false,
      strokes : {},
      n_strokes : 0,
      // mode : "set_start_state"
  }

  constructor(props){
    super(props);
    autobind(this)

    this.BezierFit = new BezierFit();
      this.BezierFit.promise.then(() => {
        this.fitCurve = this.BezierFit.fitCurve
        this.groupStrokes = this.BezierFit.groupStrokes
        this.fitCurve([[1,2],[3,4],[5,6],[7,8]])
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

  componentDidMount(){
    console.log("PROPSMODE", this.props.mode)
    this.setState({"mode" : this.props.mode || null})
  }

  enterSetStartStateMode(){
    if(this.state.mode != "debug"){
      this.setState({mode : "set_start_state" })  
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
    this.setState({mode : "feedback" }) 
  }

  exitFeedbackMode(){
    this.setState({mode : null })
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


  // get_current_foci(){
  //   if(this.current_foci){
  //     return this.current_foci.map((elm) => elm.id);
  //   }else{
  //     return []
  //   }
  // }
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

  // }

  loadProblem(context){
    //TODO
  }

  lockElement(name){
    var stroke = this.state.strokes[name]
    stroke.locked = true
    this.setState({strokes :this.state.strokes})
  }

  unlockElement(name){
    var stroke = this.state.strokes[name]
    stroke.locked = false
    this.setState({strokes :this.state.strokes})
  }

  colorElement(name,type){
    alert("NOT IMPLEMENTED")
    // var stroke = this.state.strokes[name]
    // stroke.color = this.color_map[type] || type
    // this.setState({strokes :this.state.strokes})
  }

  highlightElement(name,colorIndex=0){
    var stroke = this.state.strokes[name]
    stroke.highlight = colorIndex;
    var index = this.highlighted_elements.indexOf(name)
    if(index == -1){
      this.highlighted_elements.push(name)  
    }
  }

  unhighlightElement(name){
    var stroke = this.state.strokes[name]
    stroke.highlight = null
    var index = this.highlighted_elements.indexOf(name)
      if(index > -1){
        this.highlighted_elements.splice(index,1)  
      }
  }

  clearElement(name){
    //TODO
  }

  highlightSAI(sai){
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
    //TODO
  }

  clearProposedSAI(){
    if(this.proposed_SAI){
        this.clearElement(this.proposed_SAI.selection)
        this.unlockElement(this.proposed_SAI.selection.replace('?ele-',""))
        this.unhighlightAll()
        this.proposed_SAI = null;
    }
  }

  proposeSAI(sai){
    this.clearProposedSAI()
    this.proposed_SAI = {...sai}
    this.highlightSAI(sai)
    this.stageSAI(sai)
  }

  stageSAI(sai){
    //TODO
  }

  confirmProposedSAI(){
    if(this.proposed_SAI){
      this.unhighlightAll()
      this.proposed_SAI = null  
    }
  }


  penDown(e){
    if(this.state.mode == "foci"){
      this.mouseDown(e)
      return
    }
    console.log("HERE",typeof(e.target.className),e.target.className.baseVal == "svg_canvas" || false)
    console.log("DOWN")
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

  penUp(e){
    if(this.state.mode == "foci"){
      this.mouseUp(e)
      return
    }
    console.log("UP")
    if(this.state.pen_down){
      this.setState({pen_down : false,n_strokes: this.state.n_strokes+1});

    }
    console.log(this.groupStrokes(this.state.strokes))

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
        // console.log(strokes);  
      }
    }
  }

  mouseMove(e){
    var ele = this.getElementUnderPoint(e.clientX,e.clientY)
    var id = ele ? ele.id : null
    this.setState({elmUnderPointID : id})
  }

  mouseDown(e){
    console.log("MOUSE DOWN")
    var ele = this.getElementUnderPoint(e.clientX,e.clientY)
    var id = ele ? ele.id : null
    this.setState({mouseDownElmID : id,
                    elmUnderPointID : id})
  }

  mouseUp(e){
    console.log("MOUSE UP")
    var ele = this.getElementUnderPoint(e.clientX,e.clientY)
    var id = ele ? ele.id : null
    if(ele && id == this.state.mouseDownElmID){
      var indx = this.current_foci.indexOf(ele)
      if(indx == -1){
          this.current_foci.push(ele)
          this.highlightElement(ele.id,0)
      }else{
          this.current_foci.splice(indx,1)
          this.unhighlightElement(ele.id)
      }
    }
    // console.log(this.current_foci)
    this.setState({mouseDownElmID : null,
                    elmUnderPointID : id})
  }

  getElementUnderPoint(x,y,padding=10){
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
      console.log("bleep", ev_strokes)
      // for (let i=0; i<ev_strokes.length;i++){
      for(var i in ev_strokes){
        ev_strokes[i]['evaluation'] = "INCORRECT"
      }
    }
    console.log("bloop", ev_strokes)
    this.setState({strokes: {...this.state.strokes,...ev_strokes}})
  }

  // resolveCursor(mode,elmUnderPointID){
    
    
  // }
  // onStartShouldSetResponder (e) {
  //   return true;
  // }

  // onMoveShouldSetResponder(e) {
  //   return true;
  // }


  





  // onResponderMove(e) {
  //   // console.log(e)
    
    
  // }


  render() {
    let svg_content = []
    // svg_content.push( <Circle cx={300} cy={200} r="50" fill="red" />);
    for (let i=0; i<this.state.n_strokes+this.state.pen_down;i++){

        var stroke = this.state.strokes[i]
        // if(this.state.mode != "debug"){
                 
        // }else{
        strokeWidth = this.state.mode == "debug" ? ".5" :(stroke.id == this.state.elmUnderPointID ?  "4": "3")
        if(stroke.highlight != null){
          svg_content.push(<Polyline
            points= {stroke['points_str']} fill="none"
            stroke={this.where_colors[stroke.highlight]}
            strokeWidth={strokeWidth*3 +1}
            strokeOpacity={0.15}
          />);   
          svg_content.push(<Polyline
            points= {stroke['points_str']} fill="none"
            stroke={this.where_colors[stroke.highlight]}
            strokeWidth={strokeWidth*2}
            strokeOpacity={0.4}
          />);   
        }

          svg_content.push(<Polyline
            points= {stroke['points_str']} fill="none"
            stroke={pen_color_map[stroke['evaluation']] || pen_color_map["DEFAULT"]}
            strokeWidth={strokeWidth}
          />);   
          
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



    let check_button_callback
    if(this.state.mode == "set_start_state"){
      check_button_callback = this.setStartState
    }else{
      check_button_callback = this.evaluate
    }
    
    
    var cursor;
    if(this.state.mode == "foci"){
      cursor = this.state.elmUnderPointID == null ? "default" : "pointer"
    }else{
      cursor = cursor_map[this.state.mode] || "crosshair"
    }

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

        {this.state.mode != "foci" &&
          <View>
            <TouchableHighlight
              style = {[styles.circle_buttons,styles.undo_button]}
              onPress = {this.undoStroke}>
              <Text style={styles.undo_button_text}>{'\u21B6'}</Text>
            </TouchableHighlight>
            <TouchableHighlight
              style = {[styles.circle_buttons,styles.check_button]}
              onPress = {check_button_callback}>
              <Text style={styles.check_button_text}>{'\u2713'}</Text>
            </TouchableHighlight>
          </View>
        }

      </View>
      </TouchableWithoutFeedback>

      
    );
  }
}

const pen_color_map = { 
  'DEFAULT' : 'black',
  'ATTEMPT' : 'slategray',
  'TUTOR' : 'black',
  'START_STATE' : 'teal',
  'CORRECT' : 'limegreen', 
  'INCORRECT' : 'crimson', //Crimson better than red since looks same as limegreen for people w/ deuteranopia 
}

var cursor_map = {
    "debug" : "crosshair",
    "foci" : "pointer",
    "set_start_state" : "crosshair",
    null : "progress"
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
  }



})