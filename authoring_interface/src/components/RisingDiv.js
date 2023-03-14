import React, { Component, createRef, useState } from 'react'
import { motion, useMotionValue, useSpring } from "framer-motion";
// import * as Animatable from 'react-native-animatable';

let gen_shadow = (x,kind='box') => {
	let shadow_props = `0px ${(.5+x*.4).toFixed(2)}px ${(x* .20).toFixed(2)}px rgba(0,0,0,${0.10 + x * 0.015})`
	if(kind == 'drop'){
		return `drop-shadow(${shadow_props})`
	}else{
		return shadow_props
	}
  return 
}


let RisingDiv = ({children, style, innerRef, hoverCallback, unhoverCallback, ...props}) =>{
  const springConfig = {
    stiffness: props?.stiffness ?? 2000,
    damping: props?.damping ?? 50 
  };
  //Control scale
  const default_scale = props?.scale ?? props?.default_scale ?? 1
  const hover_scale = props?.scale ?? props?.hover_scale ?? 1.2
  const scale = useMotionValue(default_scale);  
  const scale_anim = useSpring(scale, springConfig);
  if('scale' in props){scale.set(default_scale)}
  	

  //Control shadow
  const shadow_kind = props?.shadow_kind || 'box'
  const default_elevation = props?.elevation ?? props?.default_elevation ?? 2
  const hover_elevation = props?.elevation ?? props?.hover_elevation ?? 4
  const default_shadow = gen_shadow(default_elevation, shadow_kind)
  const hover_shadow = gen_shadow(hover_elevation, shadow_kind)
  const shadow = useMotionValue(default_shadow)
  if('elevation' in props){shadow.set(default_shadow)}

  // console.log("RERENDER", shadow_kind, default_shadow)
  return (
    <motion.div 
      ref={innerRef}
      onMouseEnter={() => {scale.set(hover_scale); shadow.set(hover_shadow); hoverCallback?.()}} 
      onMouseLeave={() => {scale.set(default_scale); shadow.set(default_shadow); unhoverCallback?.()}}
      whileHover={{ zIndex: 100 }}
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
