import React, { useState, useEffect, useRef } from 'react'
import {useAuthorStoreChange, authorStore} from "./author_store.js"
import { motion, useMotionValue, useSpring } from "framer-motion";

/*
<svg width="26" height="26" viewBox="-12,-12 24,24" xmlns="http://www.w3.org/2000/svg">

  <!---<rect x="-12" y="-12" width="24" height="24" rx="1" 
      fill="grey" />-->

  <rect x="-2" y="-11" width="4" height="8" rx="2" 
      stroke-width="1" stroke="white" fill="#ff884d" />

  <rect x="-2" y="3" width="4" height="8" rx="2" 
      stroke-width="1" stroke="white" fill="#feb201" />

  <rect x="-11" y="-2" width="8" height="4" rx="2" 
      stroke-width="1" stroke="white" fill="#e44161" />

  <rect x="3" y="-2" width="9" height="4" rx="2" 
      stroke-width="1" stroke="white" fill="#42bfcf" />

  <!--<circle x="0" y="0" r="2" fill="black" /> -->
</svg>
*/



const ScrollableStage = React.forwardRef(({children, style, stage_style}, ref) => {
  let {stage_cursor_ref} = authorStore()
  let [clickAway, setStageViewRef, setStageRef] = useAuthorStoreChange(['@clickAway', 'setStageViewRef', 'setStageRef'])
  let [stage_ref, stage_view_ref] = [ref || useRef(null), useRef(null)]

  useEffect(() =>{
    setStageRef(stage_ref)
    setStageViewRef(stage_view_ref)
  },[])
  

  const [startX, startY] = [useRef(0), useRef(0)]
  const [scrollLeft, scrollTop] = [useRef(0), useRef(0)]
  const is_dragging_stage = useRef(false);
  // const [scollX_anim, scrollY_anim] = [useMotionValue(0), useMotionValue(0)]

  console.log("RERENDER")

  const targetIsBackground = (e) => {
    return (e.target == stage_view_ref.current || //is stage_view
            e.target == stage_ref.current || //is stage
            e.target.parentElement == stage_ref.current //is an immediate child of stage)
          )
  }
  // const [trackMouse, setTrackMouse] = useState(false);
  const handleMouseDown = (e) => {
    if(targetIsBackground(e)){
      is_dragging_stage.current = true
      startX.current = e.pageX - stage_view_ref.current.offsetLeft;
      scrollLeft.current = stage_view_ref.current.scrollLeft;
      startY.current = e.pageY - stage_view_ref.current.offsetTop;
      scrollTop.current = stage_view_ref.current.scrollTop;
      let {pushCursor} = authorStore()
      pushCursor("move")
      // stage_view_ref.current.style.cursor = "move"
      console.log()
    }
  }
  const handleMouseUp = (e) => {
    if(is_dragging_stage.current && targetIsBackground(e)){
      clickAway()
    }
    is_dragging_stage.current = false
    let {popCursor} = authorStore()
    popCursor('move')
    // stage_view_ref.current.style.cursor = "auto"
  }
  const handleMouseLeave = () => {
    is_dragging_stage.current = false

    // let cursor = stage_cursor_ref.current
    // if(cursor){
    //   cursor.hidden = true
    // }
  };
  const handleMouseEnter = (e) => {
    // let cursor = stage_cursor_ref.current
    // if(cursor){
    //   cursor.hidden = false
    // }
  };
  const handleMouseMove = (e) => {    
    if(!stage_view_ref.current || !is_dragging_stage.current) return;
    // console.log(e)
    const xVal = e.pageX - stage_view_ref.current.offsetLeft;
    const diffX = (xVal - startX.current);
    stage_view_ref.current.scrollLeft = scrollLeft.current-diffX*2 //scroll-fast

    const yVal = e.pageY - stage_view_ref.current.offsetTop;
    const diffY = (yVal - startY.current); 
    stage_view_ref.current.scrollTop = scrollTop.current-diffY*2 //scroll-fast   
  } 
  return (
    <div className="stage_scroll" style={{...styles.stage_view,...style}}
         onMouseDown={handleMouseDown}
         onMouseUp={handleMouseUp}
         onMouseMove={handleMouseMove}
         onMouseLeave={handleMouseLeave}
         onMouseEnter={handleMouseEnter}
         ref={stage_view_ref}
    >  
      <div style={{...styles.stage, ...stage_style}} ref={stage_ref}>  
        {children}
      </div>
    </div>
  )

})

export default ScrollableStage


const styles = {
  stage : {
    position: "relative"

  },
  stage_view : {
    position : 'relative',
    overflow : "scroll",
    backgroundColor : 'rgb(230,230,230)',
    width : "100%",
    height : "100%",
    userSelect:"none",
  },
}
