// import Svg, {
  // Circle,
  // Ellipse,
  // G,
  // Text as SvgText,
  // TSpan,
  // TextPath,
  // Path,
  // Polygon,
  // Polyline,
  // Line,
  // Rect,
  // Use,
  // Image,
  // Symbol,
  // Defs,
  // LinearGradient,
  // RadialGradient,
  // Stop,
  // ClipPath,
  // Pattern,
  // Mask,
// } from 'react-native-svg';

import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { TouchableHighlight, ScrollView,View, Text, StyleSheet, Image,
         Animated, PanResponder,TouchableWithoutFeedback,TouchableOpacity} from "react-native";
// import { TouchableOpacity} from 'react-native-gesture-handler'         
import autobind from "class-autobind";
import SkillAppBox from './skill_app_box.js'
import SkillAppProposal from './skill_app_proposal.js'
import deep_equal from 'fast-deep-equal'
import {gen_shadow} from "./vis_utils.js"

const images = {
  check: require('./img/check.png'),
};

const prompts = {
  select_foci : "Select any elements used to compute this value.",
  start_state_mode : "Propose a problem by filling out its initial state.",
  demonstrate : "Demonstrate the next step.",
  feedback : "Give feedback to all the proposed actions. Or demonstrate the next step.",
}

function breakUpBounds(bounding_boxes){
  let minX = Number.MAX_SAFE_INTEGER
  let minY = Number.MAX_SAFE_INTEGER

  for(var bn in bounding_boxes){
    let bb = bounding_boxes[bn]
    if(bb.x < minX) minX = bb.x
    if(bb.y < minY) minY = bb.y
  }
  let offset_bounds = {}
  for(var bn in bounding_boxes){
    let bb = bounding_boxes[bn]
    offset_bounds[bn] = {
      x: Math.round(bb.x - minX),
      y: Math.round(bb.y - minY),
      width: bb.width, height: bb.height
    }
  }
  return [minX,minY,offset_bounds]
}


class Prompts extends Component{
  constructor(props){
    super(props);
    autobind(this)
  }
  submit_button(){

  }
  render(){
    return (
        <View
          pointerEvents={'box-none'}
          style={[
            styles.overlay,
            {alignItems:'center', zIndex:1000},
          ]}
        >
        {this.props.prompt && 
          <View style={styles.prompt}>
            <Text selectable={false} style={styles.prompt_text}>
              {this.props.prompt}
            </Text>
          </View>
        }
        {this.props.submitCallback && 
          <TouchableOpacity 
            style={styles.submit_button}
            onPress={this.props.submitCallback}
          >
            <Image
              style={styles.submit_button_image}
              source={images.check}
            />
          </TouchableOpacity>
        }
      </View>
    )
  }
}

class ElemHighlight extends Component{
  constructor(props){
    super(props);
    autobind(this)
    this.state={opacity:1.0}
  }

  render(){
    let {hasFocus,bounds,onPress, color,backgroundColor,zIndex} = this.props
    return (
      
      <TouchableOpacity 
        onPress={onPress}
        onMouseEnter={()=>this.setState({opacity:.6})}
        onMouseLeave={()=>this.setState({opacity:1.0})}
        style={[{position:"absolute", left: -6, top: -6,
             // zIndex:zIndex,
             opacity:this.state.opacity,
             width:bounds.width+12,
             height:bounds.height+12,
             backgroundColor:backgroundColor,
             transform: [
                {translateX : bounds.x},
                {translateY : bounds.y},
             ]},
             (hasFocus && {borderColor:color, borderWidth:8, borderRadius:10}),
          ]}
      />
      
        
    )
  }
}

class TrainingOverlay extends Component{
  constructor(props){
    super(props);
    autobind(this)
    let sk_apps = this.props.skill_applications || null

    let [minX,minY,offset_bounds] = breakUpBounds(this.props.bounding_boxes)    
    this.state = {
     focus_sel : (sk_apps && sk_apps[0].selection) || null,
     focus_index : 0,
     demonstrate_sel: null,
     demonstrate_index: null,
     staged_sel : null,//this.props.skill_applications[0].selection,
     only_show_focused_sel: false,
     only_show_focused_index: false,
     // only_show_focused_sel: false,
     // staged_index : 0,
     staged_index : null,
     ...this.group_skill_apps(sk_apps,{}),
     // z_order: [...Array((sk_apps || []).length).keys()]
     offset : new Animated.ValueXY({x: minX, y: minY}),
     offset_bounds: offset_bounds,
     // ignore_props : false
    }
    

  }

  group_skill_apps(next_sk_apps,prev_sk_apps){
    if(!next_sk_apps){
      return {selection_order: [],
              selection_groups: {}
             }
    }
    let selection_groups = {}
    // let toggleCallback_groups = {}
    let selection_order = []
    let first_sel;
    for (let j=0; j < next_sk_apps.length; j++){
      let skill_app = next_sk_apps[j] 
      let sel = skill_app.selection
      if(!first_sel){first_sel = sel}
      
      let sel_g = []
      // let cb_g = []
      // let index
      if(sel in selection_groups){
        sel_g = selection_groups[sel]
        // index = sel_g[0].index
        // cb_g = toggleCallback_groups[sel]
      }else{
        selection_order.push(sel)
      }

      // let i = sel_g.length
      // let cb = (nxt)=>{
      //   console.log("CALLBACK",sel,i,nxt)
      //   let sgs = this.state.selection_groups
      //   // let i = this.state.selection_order[j]
      //   sgs[sel][i] = {...sgs[sel][i],reward:nxt.correct ? 1 : -1}
      //   this.setState({selection_groups:sgs})
      // }

      sel_g.push({...skill_app})
      // cb_g.push(cb)
      selection_groups[sel] = sel_g
      // toggleCallback_groups[sel] = cb_g
      
    }
    return {//staged_sel : first_sel,
            //staged_index : 0,
            selection_order: selection_order,
            selection_groups: selection_groups,
            // toggleCallback_groups: toggleCallback_groups}
          }
  }

  resolveStaged(){
    let {staged_sel,staged_index} = this.state
    if(this.state.staged_sel == null || this.state.staged_index == null){
      for (let sel in this.state.selection_groups){
        let sg = this.state.selection_groups[sel]
        for (let i=0; i<sg.length; i++){
          let skill_app = sg[i]
          if(skill_app.reward > 0){
            return [skill_app.selection, i,true]
          }
        }
      }
      return [Object.keys(this.state.selection_groups)[0], 0,true]
    }else{
      return [staged_sel,staged_index,false]
    }
  }

 


  static getDerivedStateFromProps(nextProps,prevState){
    // console.log("BOOOOPPERS",nextProps,prevState)
    let out = {}
    let [minX,minY,offset_bounds] = breakUpBounds(nextProps.bounding_boxes)
    prevState.offset.setValue({x:minX,y:minY})
    if(!prevState.offset_bounds || !deep_equal(offset_bounds,prevState.offset_bounds)){
      console.log("BEEEEEEPPERS",prevState.offset_bounds,offset_bounds)
      // this.setState()
      out['offset_bounds'] = offset_bounds  
    }

    return out
  }

  // static getDerivedStateFromProps(nextProps,prevState){
  //   return this.updateBounds(nextProps,prevState)
  // }

  shouldComponentUpdate(prevProps,prevState){
    if(!deep_equal(prevProps.bounding_boxes, this.props.bounding_boxes)){
      return false  
    }
    return true
  }

  componentDidUpdate(prevProps) {
    let prev_sk_apps = prevProps.skill_applications || []
    let next_sk_apps = this.props.skill_applications || []
    if (!deep_equal(prev_sk_apps, next_sk_apps)) {
      this.setState(this.group_skill_apps(next_sk_apps,prev_sk_apps))
    }
  }

  send_transition(action_str){
    this.props.interactions_service.send(action_str);
  }

  focusCallback(sel,index){
    console.log("Set FOCUS", sel,index)
    this.state.selection_order.splice(
      this.state.selection_order.indexOf(sel),1)
    let new_sel_order = [...this.state.selection_order,sel]
    this.setState({"focus_sel" : sel,"focus_index":index, selection_order: new_sel_order})
    console.log("selection_order",new_sel_order)
  }

  stageCallback(sel,index){
    console.log("STAGE", sel,index)
    if(this.state.staged_sel == sel && this.state.staged_index == index ){
      this.setState({"staged_sel" : null,"staged_index": null})
    }else{
      this.setState({"staged_sel" : sel,"staged_index": index})  
    }
  }

  toggleCallback(sel,nxt,index){
    console.log("CALLBACK",sel,index,nxt)
    let _sgs = this.state.selection_groups
    // let i = this.state.selection_order[j]
    _sgs[sel][index] = {..._sgs[sel][index],reward:nxt.correct ? 1 : -1}
    this.setState({selection_groups:_sgs})
  }

  toggleFociModeCallback(sel,index,force_false){
    if(!force_false)this.focusCallback(sel,index)
    if(force_false || 
      (this.state.foci_mode_sel == sel &&
       this.state.foci_mode_index == index)){
      this.setState({foci_mode_sel : null,
                     foci_mode_index: null,
                     only_show_focused_sel :false,
                     only_show_focused_index :false
      })
    }else{
      this.setState({foci_mode_sel : sel,
                     foci_mode_index: index,
                     only_show_focused_sel : true,
                     only_show_focused_index :true
      })
    }
  }

  demonstrateCallback(sel,action,input){
    let _sgs = this.state.selection_groups
    let _sgs_sel = _sgs[sel] || []
    _sgs_sel.push({
            selection:sel,
            action: action,
            input:input,
            stu_resp_type : "HINT_REQUEST",
            reward:1})
    //focusCallback(_sgs[sel].length-1)
    this.toggleFociModeCallback(sel,_sgs_sel.length-1)
    _sgs[sel] = _sgs_sel
    this.setState({selection_groups : _sgs})

  }

  removeCallback(sel,index){
    let selection_order = this.state.selection_order
    let _sgs = this.state.selection_groups
    let fi = this.state.focus_index
    let fs = this.state.focus_sel
    _sgs[sel].splice(index,1)
    if(_sgs[sel].length == 0){
      delete _sgs[sel]
      selection_order.splice(selection_order.indexOf(sel),1)
    }
    fi = fi >= index ? (fi - 1) : fi
    if(fi < 0){[fs,fi] = [selection_order[0],0]}
    this.setState({selection_groups : _sgs,
                   selection_order: selection_order,
                   focus_sel: fs,
                   focus_index: fi})
    this.toggleFociModeCallback(sel,null,true)
  }

  generate_callbacks(sel){
    let focusCallback = (index)=>
      this.focusCallback(sel,index)
    
    let stageCallback = (index)=>
      this.stageCallback(sel,index)  

    let toggleCallback= (nxt,index) =>
      this.toggleCallback(sel,nxt,index)        
    
    let toggleFociModeCallback = (index,force_false) =>
      this.toggleFociModeCallback(sel,index,force_false)
    
    let demonstrateCallback
    if(this.props.start_state_mode){
      demonstrateCallback = (action, input) => {
          let ss_sais = this.state.start_state_sais || {}
          ss_sais[sel] = {selection: sel, action:action, input: input }
          this.setState({start_state_sais: ss_sais})
        } 
    }else{
      demonstrateCallback = (action,input)=>
        this.demonstrateCallback(sel,action,input)
    }
    
    let removeCallback = (index)=>
      this.removeCallback(sel,index)

    return {focusCallback, stageCallback,toggleCallback,
            toggleFociModeCallback, demonstrateCallback,
            removeCallback}
  }

  render_foci_highlights(skill_app){
    if(skill_app && skill_app.foci_of_attention && 
       !this.state.foci_mode_sel){
      let highlights = []
      let bounding_boxes = this.state.offset_bounds
      let {where_colors} = this.props
      for (let k=0; k < skill_app.foci_of_attention.length; k++){
        let foa = skill_app.foci_of_attention[k]
        highlights.push(
          <SkillAppProposal bounds={bounding_boxes[foa]}
                            color = {where_colors[k+1]}
                            hasFocus={true}
                            key={'foa'+k.toString()}/>
        )
      }
      return highlights
    }else{
      return null
    }
  }  

  render_foci_boxes(){
    let bounding_boxes = this.state.offset_bounds
    let {where_colors, state} = this.props
    let {foci_mode_sel, foci_mode_index} = this.state
    let foci_boxes = []
    if(foci_mode_index != null){
      let [fs,fi] = [foci_mode_sel,foci_mode_index]
      let skill_app = this.state.selection_groups[fs][fi]
      let foci = skill_app.foci_of_attention || []
      let z = 10;


      for(let bn in bounding_boxes){
        if(!this.is_sel_fociable(bn)) continue;
        let fociCallback=()=>{
          
          let _sgs = this.state.selection_groups
          let skill_app = _sgs[fs][fi]
          let foci = skill_app.foci_of_attention || []
          let index = foci.indexOf(bn)
          console.log('fociCallback',index,bn)
          if(index == -1){
            foci.push(bn)
          }else{
            foci.splice(index,1)
          }
          _sgs[fs][fi] = {...skill_app,foci_of_attention:foci}
          this.setState({selection_groups:_sgs})
        }
        foci_boxes.push(<ElemHighlight 
                          bounds={bounding_boxes[bn]}
                          backgroundColor={'rgba(153, 50, 204,.1)'}
                          onPress={fociCallback}
                          color = {'darkorchid'}
                          hasFocus={foci.includes(bn)}
                          key={'foa'+bn.toString()}
                        />)
        z++
      }
    }
    return foci_boxes
  }

  // render_start_state_mode(){
  //   let bounding_boxes = this.state.offset_bounds
  //   let {where_colors, state} = this.props
  //   let fillables = []
  //   console.log("render_start_state_mode", bounding_boxes,state )
  //   for(let bn in bounding_boxes){
  //     let bounds = bounding_boxes[bn]
  //     let elm_obj = (state && state[bn]) || null
  //     if(elm_obj && (elm_obj.contentEditable || elm_obj.type == "Button")
  //        || !state){
  //       let sai = (this.state.start_state_sais || {})[bn] || null
  //       let demonstrateCallback = (action, input) => {
  //         let ss_sais = this.state.start_state_sais || {}
  //         ss_sais[bn] = {selection: bn, action:action, input: input }
  //         this.setState({start_state_sais: ss_sais})
  //       } 
  //       fillables.push(
  //         <SkillAppProposal
  //           key={bn}
  //           bounds={bounds}
  //           skill_app={sai}
  //           color = {'darkcyan'}
  //           textColor = {'darkcyan'}
  //           hasFocus={false}
  //           demonstrateCallback={demonstrateCallback}
  //           editable={true}
  //         />        
  //       )
  //     }
  //   }
  //   return( 
  //     <View 
  //       pointerEvents={'box-none'}
  //       style={styles.overlay}>
  //       {fillables}
  //       <Prompts 
  //         prompt={prompts.start_state_mode}
  //         submitCallback={()=>{this.send_transition("START_STATE_SET")}}
  //       />
  //     </View>
  //     )
  // }

  resolve_SA_and_focus(sel, staged_sel, staged_index){
    let {foci_mode_sel, foci_mode_index, 
         focus_sel, focus_index} = this.state
    let hasFocus = false
    let skill_app_index;
    if(sel === foci_mode_sel){
      skill_app_index = foci_mode_index
      hasFocus = true
    }else if(sel === focus_sel){
      skill_app_index = focus_index
      hasFocus = true
    }else if(staged_sel == sel){
      skill_app_index = staged_index
    }else{
      let sg = this.state.selection_groups[sel] || []
      skill_app_index = sg.findIndex(sa => sa.reward > 0) || 0; 
      if(skill_app_index == -1){skill_app_index = 0} 
    }
    return [skill_app_index,hasFocus]
  }

  is_sel_fociable(sel){
    if(this.props.state){
      return !!this.props.state[sel]
    }
    return true

  }
  is_sel_demonstratable(sel){
    if(this.props.state){
      let elm = this.props.state[sel]
      if(elm && (elm.type.includes("Text") || elm.type.includes("Button"))){
        if(elm.type.includes("Text")){
          return elm.contentEditable == false ? false : true
        }else{
          return true    
        }
      }
      return false
    }
    return true
  }

  render(){
    let bounding_boxes = this.state.offset_bounds
    let {where_colors, start_state_mode, tutor_handles_start_state} = this.props
    let {focus_index, only_show_focused_index, foci_mode_index,
         foci_mode_sel, demonstrate_sel, demonstrate_index} = this.state
    let [staged_sel, staged_index, using_default_staged] = this.resolveStaged()         
    let [skill_boxes,possibilities] = [[],[]]
    let [submit_callback,focused_skill_app] = [null,null]
    let prompt = prompts.feedback
    // let ss_mode = 

    console.log('\n\nrender overlay', bounding_boxes,'\n\n')

    // if(this.props.start_state_mode){
    //   if(!this.props.tutor_handles_start_state){
    //     return this.render_start_state_mode()
    //   }else{
    //     submit_callback=()=>{this.send_transition("START_STATE_SET")}
    //     return (<Prompts 
    //       prompt={prompts.start_state_mode}
    //       submitCallback={submit_callback}
    //     /> )
    //   }
    // }

    if(!start_state_mode){
      let j=0
      for (let sel of this.state.selection_order){
        if(this.state.only_show_focused_sel && 
           sel != this.state.focus_sel){
          continue;
        }
        let sg = this.state.selection_groups[sel]
        let bounds = bounding_boxes[sel]

        let [skill_app_index, hasFocus] =
           this.resolve_SA_and_focus(sel, staged_sel, staged_index);
        let skill_app = sg[skill_app_index]
        if(hasFocus) focused_skill_app = skill_app
        let [correct,incorrect] = [skill_app.reward > 0, skill_app.reward < 0]
        let is_demonstation = skill_app.stu_resp_type == "HINT_REQUEST"


        if(this.state.foci_mode_sel != null){
          prompt = prompts.select_foci 
          submit_callback = ()=> toggleFociModeCallback(null,true);
        }


        let { focusCallback, stageCallback, toggleCallback,
            toggleFociModeCallback, demonstrateCallback,
            removeCallback} = this.generate_callbacks(sel)

        possibilities.push(
          <SkillAppProposal
            key={sel}
            staged={staged_sel == sel && staged_index == skill_app_index}
            {...{bounds, skill_app, hasFocus, correct,
              incorrect, is_demonstation, demonstrateCallback}}
          />        
        )
        
        // console.log("BLEEP", staged_sel == sel ? staged_index : null)
        skill_boxes.push(
          <SkillAppBox
            key={sel} zIndex={j}
            initial_pos ={{x: bounds.x+bounds.width+10, y: bounds.y-70}}//{{x: 0, y: 0}}
            staged_index ={staged_sel == sel ? staged_index : null}
            skill_applications={sg}
            {...{using_default_staged, focus_index, hasFocus,
              focusCallback, toggleCallback, stageCallback, removeCallback,
              toggleFociModeCallback, only_show_focused_index, foci_mode_index
            }}
          />
        )
        j++
      }
    }

    let unfilled = []
    if(!foci_mode_sel && !(start_state_mode && tutor_handles_start_state)){
      for(let sel in bounding_boxes){
        if(!this.is_sel_demonstratable(sel)) continue;
        let {demonstrateCallback} = this.generate_callbacks(sel)
        unfilled.push(
          <SkillAppProposal key={sel} bounds={bounding_boxes[sel]}
            demonstrateCallback={demonstrateCallback} editable
            color={start_state_mode && 'darkcyan'}
            textColor={start_state_mode && 'darkcyan'}
          />
        )
      }
    }

    console.log("submit_callback",submit_callback)
    const out = (

      <Animated.View
        pointerEvents={'box-none'}
        style={[styles.overlay,
          {transform : [
              {translateX : this.state.offset.x},
              {translateY : this.state.offset.y}]
          }
        ]}
      >
        {foci_mode_index != null && this.render_foci_boxes()}
        {this.render_foci_highlights(focused_skill_app)}
        {unfilled}
        {possibilities}
        {skill_boxes}
        
      </Animated.View>
      
      )

    return out
  }
}

{/*<View
        style={styles.overlay}
      >
      <Prompts 
          prompt={prompt}
          submitCallback={submit_callback}
        />
      </View>
    */}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    // overflow: 'hidden',
    // width:10,
    // height:10,
    // backgroundColor:'red',
    width:"100%",
    height:"100%",
  },
  prompt: {
    position: "absolute",
    borderRadius:50,
    paddingRight: 20,
    paddingLeft: 20,
    paddingTop: 10,
    paddingBottom: 10,
    top: 20,
    backgroundColor:'rgba(64, 54, 74,.7)',
    alignItems:'center',
    justifyContent:'center',
    ...gen_shadow(10)
  },
  prompt_text: {
    color: 'white',
    fontSize : 20,
    fontFamily : "Geneva",
  },
  submit_button :{
    // color: 'white',
    position: "absolute",
    width:80,
    height:80,
    borderRadius:50,
    bottom: 20,
    backgroundColor:'rgba(64, 54, 74,.7)',
    alignItems:'center',
    justifyContent:'center',
    ...gen_shadow(10)
  },
  submit_button_image :{
    width:"90%",
    height:"90%",
    tintColor:'white'
  }
})

TrainingOverlay.defaultProps = {
  where_colors: [  "darkorchid",  "#ff884d",  "#52d0e0",
                   "#feb201",  "#e44161", "#ed3eea",
                   "#2f85ee",  "#562ac6", "#cc24cc"],
}


export default TrainingOverlay;
