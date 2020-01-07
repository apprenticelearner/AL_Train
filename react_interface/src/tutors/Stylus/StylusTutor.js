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
        this.fitCurve([[1,2],[3,4],[5,6],[7,8]])
    })
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
    // if(this.current_foci){
    //   return this.current_foci.map((elm) => elm.id)
    // }else{
    //   return []
    // }
  }

  enterFociMode(){
    this.setState({mode : "feedback" }) 
    
  }

  exitFociMode(){
    this.setState({mode : null })
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

  }

  loadProblem(context){

  }

  lockElement(name){

  }

  unlockElement(name){

  }

  colorElement(name,type){

  }

  highlightElement(name,colorIndex=1){

  }

  unhighlightElement(name){

  }

  clearElement(name){

  }

  highlightSAI(sai){

  }

  unhighlightAll(){

  }

  getState(){

  }

  clearProposedSAI(){

  }

  proposeSAI(sai){

  }

  stageSAI(sai){


  }

  confirmProposedSAI(){

  }


  penDown(e){
    console.log("HERE",typeof(e.target.className),e.target.className.baseVal == "svg_canvas" || false)
    console.log("DOWN")
    if(e.target.className.baseVal == "svg_canvas" || e.target.parentNode.className.baseVal == "svg_canvas"){
      var strokes = this.state.strokes
      var L = Object.keys(strokes).length
      strokes[L] = {}
      strokes[L].points_str = e.clientX.toString()+","+e.clientY.toString()
      strokes[L].points = [[e.clientX,e.clientY]]
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
    console.log("UP")
    if(this.state.pen_down){
      this.setState({pen_down : false,n_strokes: this.state.n_strokes+1});

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
    if(this.state.pen_down){
      var strokes = this.state.strokes 
      var stroke = strokes[this.state.n_strokes]
      var p = [e.clientX,e.clientY]
      var lp = stroke.points[stroke.points.length-1]
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
          svg_content.push(<Polyline
            points= {stroke['points_str']}
            fill="none"
            stroke={pen_color_map[stroke['evaluation']] || pen_color_map["DEFAULT"]}
            strokeWidth={this.state.mode == "debug" ? ".5" :"3"}
          />);   
          // var curve_str = "";
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
          
          // svg_content.push(<Path
          //   d= {curve_str}
          //   fill="none"
          //   stroke={'blue'}
          //   strokeWidth="3"
          // />);

          var points = stroke['points'] || [];
          for (let j=0; j<points.length;j++){
            var p = points[j];
          // for (const b of splines){
            // curve_str += "M"+b[0]+" "+b[1]+" C"+b[2]+" "+b[3]+" "+b[4]+" " +b[5]+" "+b[6]+" "+b[7]+" ";
            circles.push( <Circle cx={p[0]+""} cy={p[1]+""} r="1" fill="red" />);
          }
          svg_content = svg_content.concat(circles);   
        // }
        
      
    }

    let check_button_callback
    if(this.state.mode == "set_start_state"){
      check_button_callback = this.setStartState
    }else{
      check_button_callback = this.evaluate
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
        
        
        <Svg className="svg_canvas" style ={{"cursor" : "crosshair"}} height="100%" width="100%" >
          {svg_content}
        </Svg>

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