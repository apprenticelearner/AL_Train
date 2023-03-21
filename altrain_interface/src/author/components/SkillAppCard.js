import React, { Component, createRef, useState, useEffect, useRef, Profiler } from 'react'
import { motion, useMotionValue, useSpring, useScroll } from "framer-motion";
// import * as Animatable from 'react-native-animatable';
// import autobind from "class-autobind";
import './scrollbar.css';
import './card.css';
import RisingDiv from "./RisingDiv.js"
import {CorrectnessToggler, SmallCorrectnessToggler} from "./CorrectnessToggler.js"
import {useAuthorStore, useAuthorStoreChange} from "../author_store.js"
import {shallowEqual} from "../utils.js"


const images = {
  double_chevron : require('../img/double_chevron_300x400.png')
};

const FeedbackCounters = ({sel, groupHasHover}) => {
  let [counts, isExternalHasOnly] = useAuthorStoreChange(
      [[(s)=>{
        let counts = {'undef' : 0, 'correct_only' : 0, 'correct' :0, 'incorrect':0}
        for(let id of s.sel_skill_app_ids?.[sel] ?? []){
          let sa = s.skill_apps[id]
          if(sa.reward == 0){
            counts.undef++
          }else if(sa.reward > 0){
            if(sa.only){
              counts.correct_only++
            }else{
              counts.correct++
            }
          }else{
            counts.incorrect++
          }
        }
        return counts
      },(o,n)=>{
        return shallowEqual(o,n)
      }
      ],"@only_count!=0"]
  )

  // If any are correct_only mark all undefined as incorrect 
  if(isExternalHasOnly){
    counts.incorrect += counts.undef  
    counts.undef = 0
  }
  


  return (
  <div style={{
    ...styles.feedback_counters,
    // ...(groupHasHover && {backgroundColor: 'rgba(120, 120, 120, .1)'})
    }}
    onClick={()=>{}}
  >  
    {counts.undef != 0 && 
    <div style={styles.counter_container}
      onClick={()=>{}}
    >
      <a style={{color: 'black'}}>━</a>
      {counts.undef}
    </div>
    }

    {counts.correct_only != 0 && 
    <div style={styles.counter_container}
      onClick={()=>{}}
    >
      <a style={{fontSize: 8, color: 'limegreen'}}>⦿</a>
      {counts.correct_only}
    </div>
    }

    {counts.correct != 0 && 
    <div style={styles.counter_container}
      onClick={()=>{}}
    >
      <a style={{color: 'limegreen'}}>✔</a>
      {counts.correct}
    </div>
    }

    {counts.incorrect != 0 && 
    <div style={styles.counter_container}
      onClick={()=>{}}
    >
      <a style={{color: 'red'}}>✖</a>
      {counts.incorrect}
    </div>
    }
    
  </div>
  )

}


export function SkillAppGroup({x, y, parentRef, sel, style,...props}) {
  let [hasFocus, skill_app_ids, hasHover, focus_id, 
        setFocus, setHover] = useAuthorStoreChange(
      [[`@focus_sel==${sel}`, (x)=>x!=null], `@sel_skill_app_ids.${sel}`, `@hover_sel==${sel}`, `focus_id`, 
       "setFocus", "setHover"]
  )

  // const [is_hover, setIsHover] = useState(false)

  const ref = useRef(null);
  const x_anim = useMotionValue(0)
  const y_anim = useMotionValue(0)

  const groupIsDragging = useRef(false);

  //Ensure that there are refs for all cards
  const cardsRef = useRef([]);
  useEffect(() => {
       cardsRef.current = cardsRef.current.slice(0, skill_app_ids.length);

  }, [skill_app_ids]);

  // Effect for focus_index change
  useEffect(() => {    
    // if(hasFocus){ref.current.focus()}
    let card = cardsRef.current[skill_app_ids.indexOf(focus_id)]
    console.log("HAS FOCUS",focus_id)
    card?.scrollIntoView({behavior:"smooth", "block" : "nearest"})
  }, [focus_id]);


  // const keyDownHandler = (e) => {
  //   if(e.keyCode >= 49 && e.keyCode <= 58){
  //     let index = Math.min(parseInt(e.key)-1, skill_app_ids.length-1)
      
  //     focusCallback({sel: skill_apps[0].selection, index:index})
  //     console.log("KEY", e.key, index)  
  //   }
  // };

  
  // const hasFocus = focus_index >= 0

  let skill_app_cards = []
  let card_refs = []
  for(let j=0; j < skill_app_ids.length; j++){
    // console.log(skill_app_ids)
    // if(only_show_focused_index && j != focus_index) continue;
    let id = skill_app_ids[j]
  // for (let skill_app of (skill_apps || [])){

    // let correct = skill_app.reward > 0 || false
    // let incorrect = skill_app.reward < 0 || false
    // let is_demo = skill_app.stu_resp_type == "HINT_REQUEST"
    // let staged = skill_app.is_staged || false
    // let how_text = skill_app.how
    // const card_ref = useRef(null);
    
    skill_app_cards.push(
      <SkillAppCard 
       // correct={correct}
       // incorrect={incorrect}
       // is_demo={is_demo}
       // staged={staged_index==j}
       // using_default_staged={using_default_staged}
       // hasFocus={focus_index==j}
       // showAuxilary={hasFocus || is_hover}
       id={id}
       // how_text={how_text}
       // text={skill_app.input}
       // focusCallback={focusCallback}
       // sel={skill_app.selection}
       groupHasHover={hasHover}
       index={j}
       groupIsDragging={groupIsDragging}
       // toggleCallback={toggleCallback}
       // stageCallback={stageCallback}
       // removeCallback={removeCallback}
       // foci_mode={foci_mode_index==j}
       // toggleFociModeCallback={toggleFociModeCallback}
       key={id}
       innerRef={el => cardsRef.current[j] = el} 
       {...props}

      />
    )
  }

  // (correct && "✔") || 
  //            (incorrect && "✖") ||
  //            "━"


  return (
        <RisingDiv 
          innerRef={ref}
          id='keyboard'
          tabIndex="0"
          // onKeyDown={keyDownHandler}
          drag
          // dragMomentum={false}
          dragConstraints={parentRef}
          //
          dragTransition={{ timeConstant: 60, power: .15}}
          onDragStart = {(e) => groupIsDragging.current = true}
          onDragEnd = {(e) => setTimeout(()=>groupIsDragging.current = false,100)}
          onMouseEnter={()=>setHover({sel : sel})}
          onMouseLeave={()=>setHover({sel : ""})}
          onMouseMove={(e)=>{if(!groupIsDragging.current){e.stopPropagation()}}}

          style={{
            ...styles.skill_app_group,
            left: x, top: y,
            x : x_anim, y : y_anim,
            zIndex : groupIsDragging.current && 100 || 1
          }}
          {...props}
        >

          <div style={{position: 'relative', display: 'flex', flexDirection:"row", alignItems:'center'}}>
            {/*<div style = {styles.handle}>
              <div> style={{transform: 'rotate(90deg)'}}>
              {String.fromCharCode(10303)} 
              </div>
            </div>*/}

             
            <FeedbackCounters sel={sel} groupHasHover={hasHover}/>
            <div style={{fontSize:10, padding:4, opacity:.6, paddingBottom:0}}>
              {"⠿"} 
            </div>

          </div>

          {((hasFocus || hasHover || groupIsDragging.current) &&
          
          <div className={"scrollable scrollable_skill_group" + (hasFocus && " scrollable_focused" || "")}
                style={styles.skill_app_scroll_container}
          > 
            <motion.div 
              style={styles.skill_app_card_area}>
              {skill_app_cards}
            </motion.div>
          </div>
          )}
          
        </RisingDiv>
    )
}

export function DownChevron({style, sep="-23%"}){
  return (
    <div style={style}>
      <div style={{position: "absolute", left: 0, top: sep}}>{"⌄"}</div>
      <div style={{position: "absolute", left: 0, top: 0}}>{"⌄"}</div>
    </div>
  )
}


const gen_recolor = (color) =>{
  return {filter:`opacity(.2) drop-shadow(0 0 0 ${color}) drop-shadow(0 0 0 ${color}) drop-shadow(0 0 0 ${color})`}
}


export function SkillAppCard({
        id, groupIsDragging, groupHasHover, 
        // skill_app, correct, incorrect, hasFocus, showAuxilary, staged, 
        // foci_mode, stageCallback, focusCallback, toggleFociModeCallback,
        // text, sel, index, is_demo, groupIsDragging, style,
        ...props}) {
  // let id = skill_app_id
  let [skill_app,            hasFocus,           hasStaged,    isExternalHasOnly,         
      setFocus,   setHover, setReward, setStaged, undoStaged, setOnly, removeSkillApp, setCurrentTab] = useAuthorStoreChange(
      [`@skill_apps.${id}`, `@focus_id==${id}`, `@staged_id==${id}`, `@only_count!=0`, 
      "setFocus", "setHover", 'setReward', 'setStaged', 'undoStaged', 'setOnly', 'removeSkillApp', 'setCurrentTab']
  )
  // console.log("RERENDER CARD", skill_app.input)
  let text = skill_app.input || ""
  let is_demo = skill_app.is_demo || false
  let correct = skill_app.reward > 0 
  let incorrect = skill_app?.reward < 0 || isExternalHasOnly
  let isImplicit = isExternalHasOnly && skill_app?.reward == 0;
  let hasOnly = skill_app.only
  let sel = skill_app.selection

  let minHeight = (hasFocus && 60) || 20
  let maxHeight = (!hasFocus && 20)
  let minWidth = 60//(hasFocus && 60) || 20
  let maxWidth = 140//(hasFocus && 140) || 40

  let bounds_color =  (is_demo && 'dodgerblue') ||
                        (correct && colors.c_bounds) || 
                        (incorrect && colors.i_bounds) || 
                        colors.u_bounds


  let border_style = ((hasFocus && {
                       borderStyle : 'solid',
                       padding: 0, borderWidth:4,
                       borderColor:bounds_color
                     }) ||{padding: 2, borderWidth:2}
                     )

  let right_border_color = (is_demo && 'dodgerblue') ||
                           (correct && colors.c_knob) || 
                           (incorrect && colors.i_knob) || 
                           colors.u_knob
  let right_border_style = (!hasFocus && {
                            borderStyle: "hidden solid hidden hidden",
                            borderRightColor:right_border_color,
                            borderRightWidth:4})

  const toggleReward = (force_corr, force_incorr) =>{
    if(force_corr){
      setReward(skill_app, 1)
      return
    }
    if(force_incorr){
      setReward(skill_app, -1)
      return
    }
    console.log("TOGGLE reward")
    if(skill_app.reward == 0){
      setReward(skill_app, 1)
    }else if(skill_app.reward > 0){
      setReward(skill_app, -1)
    }else{
      setReward(skill_app, 1)
    }
  }
  return (
        <RisingDiv 
          onClick={(e)=>{
            // console.log("<<", e)
            if(!groupIsDragging.current){
              setFocus(skill_app)
            }
            if(skill_app.is_demo){
              setCurrentTab('demonstrate')
            }else{
              setCurrentTab('other')
            }
            e.stopPropagation()
          }}
          hoverCallback={(e)=>setHover({sel : sel, id: id})}
          unhoverCallback={(e)=>setHover({id: ""})}
          style={{
            ...styles.skill_app_card,
            ...border_style,
            ...right_border_style,
            // whiteSpace: "nowrap",
            minWidth:minWidth,
            maxWidth:maxWidth,
            minHeight:minHeight,
            maxHeight:maxHeight,
            }}
            {...props}
          >
          {/*Card Text*/}
          <div style={{
            ...styles.card_text,
            minWidth:minWidth,
            maxWidth:maxWidth,
          }}>
            <div>
            {text}
            </div>
          </div>

          {/*Skill Label + How*/}
          {hasFocus && 
          <div style={styles.extra_text}>
            <div style={styles.label_text}>
            {skill_app.skill_label || 'no label'}
            </div>
            <div style={styles.how_text}>
            {skill_app.how}
            </div>
          </div>
          }
            
          {/*Close Button*/}
          {is_demo && 
            <RisingDiv 
              style={styles.close_button}
              onClick={()=>{removeSkillApp?.(skill_app)}}
            >{"✕"}</RisingDiv>
          }

          {/*Toggler*/}
     {/*     {(hasFocus &&
            <CorrectnessToggler 
              style={styles.toggler}
              correct={correct}
              incorrect={incorrect}
              onPress={toggleReward}
            />) ||*/}
          {
          ((hasFocus || groupHasHover) &&
            <div style={{
              position: "absolute",
              left: hasFocus ? -25 : -22,
              width: 20,
              height: "100%",
              // backgroundColor: 'red',
              // flex : 1,
              display : "flex",
              flexDirection : "column",
              alignItems : "center",
              // justifyContent : "center",
              
            }}
            >
              <SmallCorrectnessToggler 
                style={{
                  ...styles.toggler_small,
                  color: 'blue',
                  width: 20,
                  height: 20,
                  // backgroundColor:'purple',
                  // paddingBottom:4
                }}
                text_color={(isImplicit && 'white') || 'black'}
                correct={correct}
                incorrect={incorrect}
                onPress={toggleReward}
              />
              {/*Only Button*/}
              {(correct && hasFocus && 
              <div className={'translucentHoverable'} 
                onClick={()=>setOnly(skill_app, !skill_app.only)}
                style={{...styles.left_item,  
                  ...(hasOnly && {opacity: 1})
                }}>
                <div >{"⦿"}</div>
                <div style={styles.left_item_text}>only</div>
              </div>
              )}

              {/*Stage Button*/}
              {(correct && hasFocus && 
              <div className={'translucentHoverable'} 
                onClick={()=>hasStaged ? undoStaged() : setStaged(skill_app)}
                style={{...styles.left_item, paddingBottom:2, color: "grey",
                  ...(hasStaged && {opacity: 1})
                }}>
                <img style={{maxWidth:"75%", maxHeight:"75%", }} src={images.double_chevron}/>
                <div style={styles.left_item_text}>stage</div>
              </div>
              )}
            </div>
          )}

          {/*Stage Icon*/}
          {(hasStaged && correct && 
              <div style={{
                ...styles.stage_icon,
                right: styles.stage_icon.right + (is_demo && 12)
              }}>
              <img style={{maxWidth:"75%", maxHeight:"75%", }} src={images.double_chevron}/>
              </div>
          )}
          {/*Only Icon*/}
          {(hasOnly &&
              <div style={{
                ...styles.only_icon,
                right: styles.only_icon.right + (is_demo && 12)
              }}>
              <div >{"⦿"}</div>
              </div>
          )}
        </RisingDiv>
    )
}

export function SkillAppCardLayer({parentRef, state, style}){
  // Get subset of elements modified by skill apps
  let [selectionsWithSkillApps] = useAuthorStoreChange(
    [[(s) => {
      let used = []
      for (let [k,v] of Object.entries(s.sel_skill_app_ids) ){
        if(v?.length > 0){used.push(k)}
      }
      used.sort();
      return used
    },
    (o,n) => {
      return shallowEqual(o, n)
    }
    ]] 
  )
  let [train_mode, tutor_state] = useAuthorStoreChange(["@mode=='train'", "@tutor_state"])
  state = state || tutor_state

  console.log("RERENDER LAYER", train_mode)

  // Make skill application groups
  let skill_app_groups = []  
  if(train_mode){
    for (let sel of selectionsWithSkillApps){
      let elem = state[sel]
      skill_app_groups.push(
        <SkillAppGroup
          sel={sel} 
          parentRef={parentRef} 
          x={elem.x+elem.width*.9} y={elem.y-20}
          key={sel+"_skill_app_group"}
      />)
    }  
  }
  

  return (
    <div style={{...style}} >
      {skill_app_groups}
    </div>
  )


}
//"✎"
//"↡"
//"↧"
//"⍖"


SkillAppCard.defaultProps = {
  // button_scale_elevation : {
  grabbed_scale : 1.035,
  focused_scale : 1.025,
  hover_scale : 1.03,
  default_scale : 1,
  hover_elevation : 4,
  default_elevation : 2
}

SkillAppGroup.defaultProps = {
  // button_scale_elevation : {
  grabbed_scale : 1.135,
  focused_scale : 1.125,
  hover_scale : 1.03,
  default_scale : 1,
  grabbed_elevation : 16,
  focused_elevation : 12,
  hover_elevation : 6,
  default_elevation : 2
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
  

  
  skill_app_group : {
    position : "absolute",
    display: "flex",
    flexDirection : 'column',
    backgroundColor: 'rgba(80,80,120,.1)',
    userSelect: "none",
    borderRadius : 5,
  },

  handle: {
    // alignSelf: "end",
    fontSize : 12,
    color: 'rgba(0,0,0,.5)',
    height : 8,
    textAlign : 'center',
    pointerEvents:'none',
    userSelect: "none",
    // marginTop: -3,
    // marginBottom: 3,
  },

  skill_app_background : {
    position : 'absolute',
    backgroundColor: 'rgba(80,80,120,.1)',
    borderRadius : 10,
  },

  skill_app_scroll_container : {
    position : "relative",
    display: "flex",
    flexDirection : 'column',
    maxHeight:125,
    overflowY: "scroll",
    overflowX: "clip",

    ///GOOD 
    paddingLeft : 29, 
    left : -25,
    marginRight : -31,
    //

    paddingLeft : 29, 
    left : -25,
    marginRight : -34
  },

  skill_app_card_area : {
    position : "relative",
    display: "flex",
    flex : 1,
    flexDirection : 'column',
    // alignItems: "flex-start",
    marginTop : -2,
    marginBottom : 4,
    marginRight :3,
    
    // maxHeight:100,
  },

  skill_app_card :{
    position: "relative",
    display: "flex",
    flex : 1,
    flexDirection: "column",
    marginTop:3,
    backgroundColor: "#fff",
    borderRadius : 3,
  },

  close_button: {
    position : 'absolute',
    right:2,
    top:2,
    backgroundColor : 'rgba(0,0,120,.05)',
    width: 12,
    height: 12,
    fontSize : 10,
    borderRadius: 20,
    textAlign:'center',
  },

  card_text: {
    position: "relative",
    width : "max-content",
    float : 'left',
    fontSize : 18,
    padding: 2,
    paddingLeft: 4,
    fontFamily : "Geneva",
    fontWeight: 'bold',
    overflow: "hidden",
  },

  extra_text : {
    display: 'flex',
    position : "relative",
    flex : 1,
    flexDirection : 'column',
    fontSize : 10,
    marginTop: "auto"
  },
  label_text: {
    position : "relative",
    display:'flex',
    alignSelf : 'flex-end',
    color : "gray",
    // backgroundColor : 'red',    
    fontFamily : "Geneva",
    margin:2,
    marginTop: "auto",
    textDecoration: "underline",
  },
  how_text: {
    position : "relative",
    display:'flex',
    alignSelf : 'flex-end',
    // backgroundColor : 'blue',
    fontFamily : "Geneva",
    margin:2,
    marginTop:0,
  },

  left_item : {
    width:20,
    height:20,
    fontSize: 13,
    marginTop : 0,
    marginBottom : 2,
    position:'relative',
    display:"flex",
    justifyContent : "center",
    alignItems : "center",
    flexDirection : "column"
    // backgroundColor : 'grey',
  },
  left_item_text : {
    position:'absolute',
    top:16,
    color: "#333",
    fontSize:6
  },

  // toggler: {
  //   position : "absolute",
  //   left : -24,
  // },

  toggler_small: {
    width:20,
    height:20,
    position:'relative',
    display:"flex",
    justifyContent : "center",
    alignItems : "center",
    // left : -22,
  },

  stage_button : {
    display : "flex",
    position: 'absolute',
    flex: 1,
    width : 10,
    height: 13,
    alignContent: "center",
    justifyContent: "center",
    fontSize : 12,
    borderRadius: 40,
    padding: 0,
    backgroundColor: 'rgba(190,190,190,.8)',
    left : -6,
    bottom : -6,
    // fontWeight: 'bold',
  },

  only_icon : {
    display : "flex",
    position : "absolute",
    width : 7,
    height : 8,
    alignContent: "center",
    justifyContent: "center",
    // left: 0,
    right: 10,
    top:0,
    opacity:.6,
    fontSize: 6
  },

  stage_icon : {
    display : "flex",
    position : "absolute",
    width : 7,
    height : 8,
    alignContent: "center",
    justifyContent: "center",
    // left: -.5,
    // bottom: -1.5,
    right: 2,
    opacity:.6,
  },

  feedback_counters: {
    display: "flex",
    flexDirection: "row",
    fontSize: 10,
    flex: 1,
    padding: 3,
    borderRadius : 10
  },

  counter_container: {
    height: 10,
    backgroundColor:'rgba(235,235,235,1)',
    marginLeft: 1.5,
    marginRight: 1.5,
    borderRadius : 5,
    display:"flex",
    flexDirection:"row",
    alignItems:"center",
    justifyItems:"center",
    filter: 'drop-shadow(0px .7px .7px rgba(60,60,60,.7))',
    paddingLeft: 3, paddingRight: 3
  },


  foci_button: {
    position: 'absolute',
    bottom : 4,
    left : 4,
    flex: 1,
    width :20,
    height :20,
    borderRadius: 20,
    backgroundColor: 'rgba(120,120,120,.2)'
  },

  
  staged_selected:{
    backgroundColor: colors.c_bounds,//"limegreen",
  },

  
}
