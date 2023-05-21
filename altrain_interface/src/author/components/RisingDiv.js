import React, { Component, createRef, useState } from 'react'
import { motion, useMotionValue, useSpring } from "framer-motion";
import { gen_shadow } from "../../utils";
// import * as Animatable from 'react-native-animatable';




let RisingDiv = ({children, style, innerRef, hoverCallback, unhoverCallback, hover_style, ...props}) =>{
  const springConfig = {
    stiffness: props?.stiffness ?? 2000,
    damping: props?.damping ?? 50 
  };
  //Control scale
  const default_scale = props?.scale ?? props?.default_scale ?? 1
  const hover_scale = props?.scale ?? props?.hover_scale ?? 1.2
  const scale = useMotionValue(default_scale);  
  const scale_anim = useSpring(scale, springConfig);
  scale.set(default_scale)
  	
  //Control shadow
  const shadow_kind = props?.shadow_kind || 'box'
  const default_elevation = props?.elevation ?? props?.default_elevation ?? 2
  const hover_elevation = props?.elevation ?? props?.hover_elevation ?? 4
  const default_shadow = gen_shadow(default_elevation, shadow_kind)
  const hover_shadow = gen_shadow(hover_elevation, shadow_kind)
  const shadow = useMotionValue(default_shadow)
  shadow.set(default_shadow)

  // console.log("RERENDER RISING DIV", style)

  return (
    <motion.div 
      ref={innerRef}
      onMouseEnter={(e) => {scale.set(hover_scale); console.log("Hover", e, scale.current); shadow.set(hover_shadow); hoverCallback?.(e)}} 
      onMouseLeave={(e) => {scale.set(default_scale); console.log("UnHover", e, scale.current); shadow.set(default_shadow); unhoverCallback?.(e)}}
      //whileHover={{ zIndex: 100,...hover_style,  transition: { duration: 0 },}}
      style={{
          ...style,
          // willChange : 'filter, scale',
          ...(props?.shadow_kind=='drop' && {filter :shadow} || {boxShadow :shadow}),
          scale : scale_anim,
      }}
        {...props}
        >
      {children}
    </motion.div>
  )
}

export default RisingDiv;
