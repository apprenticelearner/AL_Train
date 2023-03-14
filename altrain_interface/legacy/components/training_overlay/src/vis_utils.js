import {Platform } from "react-native";


const FRAME_RATE = 60
function simple_animate(inst,attr,next,config={speed: 20}){
  inst.sa_frame_tracker = inst.sa_frame_tracker || {}
  if(inst.sa_frame_tracker[attr]){
    cancelAnimationFrame(inst.sa_frame_tracker[attr])
  }
  const step = (timestamp) => {
      var diff = next - inst.state[attr]
      let speed = (config.speed || 20) / (1000/FRAME_RATE) * (diff > 0 ? 1 : -1)
      // console.log("speed",speed,config.speed)
      if(Math.abs(diff) > Math.abs(speed)){
        let update = {}
        update[attr] = inst.state[attr] + speed
        // console.log(update)
        inst.setState(update)
        inst.sa_frame_tracker[attr] = requestAnimationFrame(step)
      }else{
        let update = {}
        update[attr] = next
        // console.log(update)
        inst.setState(update)
        cancelAnimationFrame(inst.sa_frame_tracker[attr])
      }

    }
    inst.sa_frame_tracker[attr] = requestAnimationFrame(step)
}

function gen_shadow(elevation){
  if(Platform.OS == 'android'){
    return {elevation : elevation}
  }else{
    return {shadowRadius: elevation * .627,
    shadowOpacity: 0.10 + elevation * 0.015,
    shadowOffset : {
      width : 0,
      height: elevation /2,
      }
    }
  }
}

export {simple_animate, gen_shadow}
