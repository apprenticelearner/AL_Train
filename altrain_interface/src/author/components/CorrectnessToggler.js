
import React, { Component, createRef, useState, useRef } from 'react'
import { motion, useMotionValue, useSpring } from "framer-motion";
// import * as Animatable from 'react-native-animatable';
import autobind from "class-autobind";
import RisingDiv from "./RisingDiv.js"

const ONLY_HOLD_TIME = .2

let CorrectnessTogglerKnob = ({children, style, is_hover, hasFocus, force_show_other, inner_text, is_small, text_color, ...props}) => {
  text_color =  text_color || 
								((hasFocus || force_show_other) && 'black') ||
                'rgba(0,0,0,.4)'

  const springConfig = {
    stiffness: props?.stiffness ?? ((hasFocus && 1200) || 2000),
    damping: props?.damping ?? ((hasFocus && 28) || 50)
  };

  const x = useSpring(props?.default_pos?.x ?? 0, springConfig);  
  const y = useSpring(props?.default_pos?.y ?? 0, springConfig); 

  let next_pos = (hasFocus && props.focused_pos) ||
                 (is_hover && props.hover_pos) ||
                  (props.default_pos || {x : 0, y: 0})
  x.set(next_pos.x)
  y.set(next_pos.y)

  let scale
  if(is_small){
  	 scale = (1 + (is_hover && .15))
  }else{
  	 scale = (1 + (is_hover && .4)) * (1 + (force_show_other && .2)) * (1.25 + (!hasFocus && -.6))	
  }
  
  return(
    <RisingDiv 
      elevation={is_hover && 8 || 2}
      scale={scale}
      // {scale: (this.props.force_show_other && 1.6)||1.0},
      style={{
        ...style,
        color: text_color,
        x: x,
        y: y,}
      }>
      {inner_text || "?"}
      {children}
    </RisingDiv>
  )
}

CorrectnessTogglerKnob.defaultProps = {
	hasFocus : true,
	is_hover : false,
	force_show_other : true,
}

let OnlyBubble = () =>{
	// const scale_anim = useSpring(0,{})
	// scale_anim.set(1)
	return(
	 	<motion.div
	  style={{
	  	...styles.only_bubble,
	  	// scale: scale_anim,
	  	// opacity: scale_anim,
	  }}
	  initial={{opacity:0, scale:.1}}
	  animate={{opacity:1, scale:1}}
	  transition ={{
	  	duration : ONLY_HOLD_TIME
	  }}>
	  {"only"}
	 </motion.div>
	 )
}

const togglerMouseEvents = {

}



export let SmallCorrectnessToggler = ({style, correct, incorrect, onPress, onOnly, text_color,...props}) =>{
	const [state_correct,setCorrect] = useState(props.correct || false)
	const [state_incorrect,setIncorrect] = useState(props.incorrect || false)
	const [only,setOnly] = useState(props.only || false)
	const [is_hover, setIsHover] = useState(false)

	correct = correct | state_correct
	incorrect = incorrect | state_incorrect
	// const [is_pressed, setIsPressed] = useState(false)
	const undef = !correct && !incorrect;

	const pressedRef = useRef(false)

	// const isLongPress = useRef(false);

	// Only used in the absence of a parent to pass correct/incorrect
	const defaultToggle = () =>{
		let inc = !(undef || correct)
		let corr = !inc
		setCorrect(inc)
		setIncorrect(corr)
		setOnly(false)
	}
  let force_reward = null
  if(!correct && !incorrect){
    force_reward = (is_hover == "top" && 1) ||
                   (is_hover == "bottom" && -1) ||
                   null
  }
  
  let left_size = (force_reward < 0 && 16) ||
                  (!force_reward && 10) ||
                  7

  let right_size = (force_reward > 0 && 16) ||
                  (!force_reward && 10) ||
                  7


  let font_color = (!undef && is_hover && correct && colors.i_knob) ||
                   (!undef && is_hover && incorrect && colors.c_knob) ||
                   'black' 

  let bottom_color = (force_reward < 0 && colors.i_knob) || 'black'
  let top_color = (force_reward > 0 && colors.c_knob) || 'black'

	let text =  (((is_hover && incorrect) || (!is_hover && correct)) && "✔") || 
              (((is_hover && correct) || (!is_hover && incorrect)) && "✖") ||
              (
               <div style={{display:"flex", flexDirection: 'column', alignItems : "center"}}>
                <a style={{margin: 1, textAlign:'center',
                      fontSize: right_size, color: top_color}}>{"✔"}</a>
                 <a style={{margin: 1, textAlign:'center',
                      fontSize: left_size, color: bottom_color}}>{"✖"}</a>
               </div>
              )


  let font_size = (undef && !force_reward && 10) || 14


	let bg_color = (is_hover && 'rgb(220, 220, 220)') || 
                 (correct && 'limegreen') || 
	               (incorrect && 'red') ||
	               'rgb(220, 220, 220)'

	// console.log("<<", style)
	// let text = inner_text={((correct  || undef)
	return (
		<div 
      onMouseLeave={()=>setIsHover(false)}
      style = {{width:40, position:'absolute',  ...style}}>
			<CorrectnessTogglerKnob
          inner_text={text}
          text_color={font_color}
          is_hover={is_hover}
          hasFocus={true}
          force_show_other={false}
          is_small={true}
          style={{
          ...styles.feedback_button,
          ...{backgroundColor : bg_color}
          }}
          // ...{fontSize: font_size},
          // ...(incorrect && styles.incorrect_selected),
          // ...(correct && styles.correct_selected)}}
			/>
      <div 
        style={styles.touch_area_top}
        onClick={(e)=>{e.stopPropagation();onPress?.(force_reward);setIsHover(false)}}
        onMouseEnter={()=>{setIsHover('top');}}
      />
			<div 
        style={styles.touch_area_bottom}
        onClick={(e)=>{e.stopPropagation();onPress?.(force_reward);setIsHover(false)}}
        onMouseEnter={()=>{setIsHover('bottom');}}
        
      />
	       
		</div>
	)
}

SmallCorrectnessToggler.defaultProps = {
	
}


export class CorrectnessToggler extends Component {
  constructor(props){
    super(props);
    autobind(this)
    this.state = {top_hover:false,bottom_hover:false,hover_fresh:false}
    this.label_text = createRef()
  }

  topHoverStart(){this.setState({top_hover:true,hover_fresh:true})}
  topHoverEnd(){this.setState({top_hover:false})}
  bottomHoverStart(){this.setState({bottom_hover:true,hover_fresh:true})}
  bottomHoverEnd(){this.setState({bottom_hover:false})}

  topPress(){this.handlePress(true)}
  bottomPress(){this.handlePress(false)}
  handlePress(is_top){
    let [correct,incorrect] = [this.getCorrect(),this.getIncorrect()]
    let undef = !correct && !incorrect
    let next_state; 
    if(undef){
      next_state = {correct:is_top,incorrect:!is_top,hover_fresh:false}
    }else{
      next_state = {correct:!correct,incorrect:!incorrect,hover_fresh:false}
    }
    if(this.props.onPress){
      this.props.onPress(next_state)
      this.setState({hover_fresh:false})
    }else{
      this.setState(next_state)
    }
    if(this.props.focusCallback){
      this.props.focusCallback()
    }
  }
  getCorrect = () => this.state?.correct ?? this.props?.correct ?? false
  getIncorrect = () => this.state?.incorrect ?? this.props?.incorrect ?? false

  render(){
    let correct = this.getCorrect()
    let incorrect = this.getIncorrect()
    // console.log("RERENDER", correct,incorrect)
    let undef = !correct && !incorrect
    let is_hover = this.state.top_hover || this.state.bottom_hover
    let disp_top_hover = (this.state.top_hover && undef) || 
                         (is_hover && this.state.hover_fresh && incorrect)
    let disp_bottom_hover =(this.state.bottom_hover && undef) ||
                           (is_hover && this.state.hover_fresh && correct)

    let bg_color = (correct && colors.c_knob_back) || 
                   (incorrect && colors.i_knob_back) ||
                   colors.u_knob_back
    return (
      <div style = {{...this.props.style,  width:30, position:'absolute'}}>
        <div style = {{...styles.toggler, backgroundColor: bg_color}}>
          <div style={{display:'flex', 'flexDirection':'row', alignItems:'center'}}/>
          <CorrectnessTogglerKnob 
            
            hasFocus={correct}
            is_hover={disp_top_hover}
            force_show_other={undef}  
            default_pos = {{x: -1.6, y: -2}}
            focused_pos = {{x: -1.6, y: 2}}
            inner_text={((correct || disp_top_hover || undef)
                           && "✔")||" "}
            style={{
            ...styles.feedback_button, 
            ...(correct && styles.correct_selected),
            ...(incorrect && {backgroundColor:bg_color}),
            zIndex: correct*10
          }}>
          {(correct && this.props.only && <OnlyBubble/>)}
          </CorrectnessTogglerKnob>
          <CorrectnessTogglerKnob 
            
            hasFocus={incorrect}
            is_hover={disp_bottom_hover}
            force_show_other={undef}  
            default_pos = {{x: -1.6, y: 24}}
            focused_pos = {{x: -1.6, y: 20}}
            inner_text={((incorrect || disp_bottom_hover || undef)
                           && "✖")||" "}
            style={{
            ...styles.feedback_button, 
            ...(incorrect && styles.incorrect_selected),
            ...(correct && {backgroundColor:bg_color}),
            zIndex: incorrect*10
          }}/>

        </div>

        <div 
          style = {this.props.top_touch_area}
          onClick={this.topPress}
          onMouseEnter={this.topHoverStart}
          onMouseLeave={this.topHoverEnd}/>
        <div
          style = {this.props.bottom_touch_area}
          onClick={this.bottomPress}
          onMouseEnter={this.bottomHoverStart}
          onMouseLeave={this.bottomHoverEnd}/>
      </div>
    )
  }
}

CorrectnessToggler.defaultProps = {
  only : false,
  button_scale_elevation : {
    grabbed_scale : 1.500,
    focused_scale : 1.400,
    hover_scale : 1.200,
    default_scale : .8,

    grabbed_elevation : 10,
    focused_elevation : 8,
    hover_elevation : 6,
    default_elevation : 1
  },
  c_anim : {
    focused_pos : {x: -6, y: 0},
    default_pos : {x: -6, y: 0}
  },
  i_anim : {
    focused_pos : {x: -6, y: 40},
    default_pos : {x: -6, y: 40}
  },
  top_touch_area: { 
    width:30,
    height:24,
    position:'absolute',
    alignItems:"center",
    top: -2,//-4,
    left: -8,
    // backgroundColor: 'rgba(0,255,0,.2)',
    // opacity : .2,
  },
  bottom_touch_area: { 
    width:30,
    height:23,
    position:'absolute',
    alignItems:"center",
    top: 22,
    left: -8,
    // backgroundColor: 'rgba(255,0,0,.2)',
    // opacity : .2,
  }
}


const colors = {
  "c_bounds" : 'rgba(10,220,10,.6)',
  "i_bounds" : 'rgba(255,0,0,.6)',
  "u_bounds" : 'rgba(120,120,120,.5)',
  "c_knob" : 'limegreen',
  "i_knob" : 'red',
  "u_knob" : 'lightgray',
  "c_knob_back" : 'rgb(100,200,100)',
  "i_knob_back" : 'rgb(200,100,100)',
  "u_knob_back" : 'rgb(180,180,180)'
}

const styles = {

  feedback_button:{
    display : "flex",
    alignItems : "center",
    justifyContent : "center",

    userSelect: "none",
    // position: 'absolute',
    // fontSize : 14,
    // flex: 1,
    borderRadius: 8,
    height:24,
    width : 16,
    padding : 2,
    backgroundColor: 'rgba(170,170,170,.8)',//'rgba(190,190,190,.8)'//"lightgray",
    textAlign:'center',
    pointerEvents:'none'
    // paddingTop:1,
  },
  // incorrect_selected:{
  //   backgroundColor: "red",
  // },
  // correct_selected:{
  //   backgroundColor: "limegreen",
  // },
  staged_selected:{
    backgroundColor: "dodgerblue",
  },

  toggler: {
    height:38,
    width:12,
    left: 3,
    top: 6,
    borderColor:'rgba(120,120,120,.2)',
    borderWidth: 1,
    borderRadius: 20,
    backgroundColor: colors.u_knob_back,
    // ...gen_shadow(5)
  },

  touch_area_top: {
		width:32,
    height:24,
    position:'absolute',
    alignItems:"center",
    top: -10,
    left: -2,
    // backgroundColor: 'rgba(0,255,0,.2)',	
  },
  touch_area_bottom: {
    width:32,
    height:24,
    // right : 15,
    position: 'absolute',
    alignItems: "center",
    top:  14,
    left: -2,
    // backgroundColor: 'rgba(0,0,255,.2)',  
  },
  only_bubble: {
  	position : "absolute",
  	width:12,
  	height:6,
  	backgroundColor: "#fff",//colors.c_knob_back,
  	fontSize: 6,
  	borderRadius: 4,
  	padding:.5,
  	fontFamily : "Geneva",
  	textAlign: "center",
  	bottom: -6,
  	left: 1,
  	pointerEvents:'none',
  }
}

export default CorrectnessToggler;
