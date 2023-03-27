import React, { useState, useEffect, useRef } from 'react'
import {useAuthorStoreChange} from "./author_store.js"


const ScrollableStage = React.forwardRef(({children}, ref) => {
  let [clickAway, setStageViewRef, setStageRef] = useAuthorStoreChange(['@clickAway', 'setStageViewRef', 'setStageRef'])
  let [stage_ref, stage_view_ref] = [ref || useRef(null), useRef(null)]

  useEffect(() =>{
    setStageRef(stage_ref)
    setStageViewRef(stage_view_ref)
  },[])

  let sw = window.screen.width//-styles.side_tools.width;
  let sh = window.screen.height*1.5;

  let tv_marg = 0;
  // Proportion of stage width, height tutor should get
  let tv_pw = .5
  let tv_ph = .7
  let tutor_view = {width: sw+tv_marg,
                    height : sh+tv_marg,
                    left : sw*(1-tv_pw)+ tv_marg,
                    top : sh*(1-tv_ph)+ tv_marg,}

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
    }
  }
  const handleMouseUp = (e) => {
    if(targetIsBackground(e)){
      clickAway()
    }
    is_dragging_stage.current = false
  }
  const handleMouseLeave = () => {
    is_dragging_stage.current = false
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
    <div className="stage_scroll" style={{...styles.stage_view}}
         onMouseDown={handleMouseDown}
         onMouseUp={handleMouseUp}
         onMouseMove={handleMouseMove}
         onMouseLeave={handleMouseLeave}
         ref={stage_view_ref}
    >  
      <div style={{...styles.stage, ...tutor_view}} ref={stage_ref}>  
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
    overflow : "scroll",
    backgroundColor : 'rgb(230,230,230)',
    width : "100%",
    height : "100%",
    userSelect:"none",
  },
}
