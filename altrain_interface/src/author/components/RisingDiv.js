import React, { Component, createRef, useState, useEffect } from 'react'
import { motion, useMotionValue, useSpring } from "framer-motion";
import { gen_shadow } from "../../utils";
// import * as Animatable from 'react-native-animatable';




let RisingDiv = ({children, style, innerRef, hoverCallback, unhoverCallback, hover_style, shadow_kind='box', ...props}) =>{
  const springConfig = {
    stiffness: props?.stiffness ?? 2000,
    damping: props?.damping ?? 50 
  };
  //Control scale
  const default_scale = props?.scale ?? props?.default_scale ?? 1
  const hover_scale = props?.scale ?? props?.hover_scale ?? 1.05
  const scale = useMotionValue(default_scale);  
  const scale_anim = useSpring(scale, springConfig);
  
  	
  //Control shadow
  const default_elevation = props?.elevation ?? props?.default_elevation ?? 2
  const hover_elevation = props?.elevation ?? props?.hover_elevation ?? 4
  const default_shadow = gen_shadow(default_elevation, shadow_kind)
  const hover_shadow = gen_shadow(hover_elevation, shadow_kind)
  const shadow = useMotionValue(default_shadow)
  

  useEffect(() => {
    shadow.set(default_shadow)
    scale.set(default_scale)
  }, []);

  // console.log("RERENDER RISING DIV", shadow_kind, props, children)

  return (
    <motion.div 
      ref={innerRef}
      onMouseEnter={(e) => {scale.set(hover_scale); shadow.set(hover_shadow); hoverCallback?.(e);
                           console.log("Hover", e, scale.current); }}
      onMouseLeave={(e) => {scale.set(default_scale);shadow.set(default_shadow); unhoverCallback?.(e);
                            console.log("UnHover", e, scale.current); }}
      //whileHover={{ zIndex: 100,...hover_style,  transition: { duration: 0 },}}
      style={{
        ...style,
        // willChange : 'filter, scale',
        ...(shadow_kind=='drop' && {filter :shadow} || {boxShadow :shadow}),
        scale : scale_anim,
      }}
        {...props}
      >
      
      {children}
      
    </motion.div>
  )
}

export default RisingDiv;
