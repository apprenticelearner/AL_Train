import React, { Component, createRef, useState, useEffect, useRef, Profiler } from 'react'
import { motion, useMotionValue, useSpring, useScroll } from "framer-motion";
// import * as Animatable from 'react-native-animatable';
// import autobind from "class-autobind";
import './scrollbar.css';
import './card.css';
import RisingDiv from "./RisingDiv.js"
import {CorrectnessToggler, SmallCorrectnessToggler} from "./CorrectnessToggler.js"
import {authorStore, useAuthorStore, useAuthorStoreChange} from "../author_store.js"
import {FeedbackCounters} from "./icons.js"
import {shallowEqual} from "../../utils.js"


const images = {
  // double_chevron : require('../img/double_chevron_300x400.png'),
  double_chevron : require('../../img/double_chevron_300x400.svg'),
  // pencil : require('../../img/pencil.png')
};


// export const Icon = ({size, kind}) => {
//   let is_demo = kind.includes('demo') 
//   let is_only = kind.includes('only') //&& key != 'only'
//   let is_correct = !kind.includes('incorrect')
//   let color = (is_demo && 'dodgerblue') ||
//               (kind.includes('incorrect') && 'red') ||
//               (kind.includes('correct') && 'limegreen') ||
//               'black'
//   let icon = (kind.includes('incorrect') && '✖') ||
//               // (key=='only' && '⦿') ||
//               (kind.includes('correct') && '✔') ||            
//               '━'

//   let inner_size = (is_only && size * .7) || size * .8
//   return (
//     <div
//       style={{
//         display : 'flex',
//         width : size, height: size *.8,
//         justifyContent : 'center',
//         alignItems : 'center',
//         ...(is_only && {border : `1px solid ${color}`, borderRadius : 50}),
//       }}
//     > 
//       {(is_demo && 
//         <img
//           src={images.pencil}
//           style={{width : inner_size, height: inner_size, 
//             filter: is_correct ? dodger_blue_filter : crimson_filter
//           }}
//         />) ||
//         <a style={{color: color, fontSize: size}}>{icon}</a>
//       }
//     </div> 
//   )
// }

// export const FeedbackCounter = ({style, kind, count, clickHandler, count_text_style}) => {
//   style = {...styles.counter_container,...style}
//   let icon_size = (style.fontSize || 10) 
//   // let inner_size = (is_only && icon_size * .7) || icon_size * .8
//   return (
//     <div style={style}
//         onClick={clickHandler}
//       > 
//         <Icon {...{size: icon_size, kind, count}} />
//         <a style={{...styles.count_text_style, ...count_text_style}}>{count}</a>
//     </div>
//   )
// }

// export const FeedbackCounters = ({sel, groupHasHover, style, counter_style, count_text_style}) => {
//   let {getFeedbackCounts} = authorStore()
//   let [counts,                                isExternalHasOnly] = useAuthorStoreChange(
//       [[getFeedbackCounts(sel),shallowEqual] ,"@only_count!=0"]
//   )

//   // If any are correct_only mark all undefined as incorrect 
//   if(isExternalHasOnly){
//     counts.incorrect += counts.undef  
//     counts.undef = 0
//   }

//   let counters = Object.entries(counts).map( ([key, count]) => {
//     let clickHandler = () => {}
//     return (count != 0 && <FeedbackCounter {
//               ...{style: counter_style, count_text_style, kind:key, count, clickHandler}
//               }
//               key={key}
//             />
//           )
//   })
  

//   return (
//   <div style={{
//     ...styles.feedback_counters,
//     ...style
//     // ...(groupHasHover && {backgroundColor: 'rgba(120, 120, 120, .1)'})
//     }}
//     onClick={()=>{}}
//   >  
//     {counters}    
//   </div>
//   )
// }

/*
{counts.undef != 0 && 
    <div style={{...styles.counter_container,...counter_style}}
      onClick={()=>{}}
    >
      <a style={{color: 'black'}}>━</a>
      <a style={count_text_style}>{counts.undef}</a>
    </div>
    }

    {counts.correct_only != 0 && 
    <div style={{...styles.counter_container,...counter_style}}
      onClick={()=>{}}
    >
      <a style={{color: 'limegreen'}}>⦿</a>
      <a style={count_text_style}>{counts.correct_only}</a>
    </div>
    }

    {counts.correct != 0 && 
    <div style={{...styles.counter_container,...counter_style}}
      onClick={()=>{}}
    >
      <a style={{color: 'limegreen'}}>✔</a>
      <a style={count_text_style}>{counts.correct}</a>
    </div>
    }

    {counts.incorrect != 0 && 
    <div style={{...styles.counter_container,...counter_style}}
      onClick={()=>{}}
    >
      <a style={{color: 'red'}}>✖</a>
      <a style={count_text_style}>{counts.incorrect}</a>
    </div>
    }
  */


export function SkillAppGroup({x, y, parentRef, sel, style,...props}) {
  let [hasFocus, skill_app_uids, hasHover, focus_uid, 
        setFocus, setHover] = useAuthorStoreChange(
      [[`@focus_sel==${sel}`, (x)=>x!=null], `@sel_skill_app_uids.${sel}`, `@hover_sel==${sel}`, `focus_uid`, 
       "setFocus", "setHover"]
  )


  // const [is_hover, setIsHover] = useState(false)

  const ref = useRef(null);
  const x_anim = useMotionValue(0)
  const y_anim = useMotionValue(0)

  const groupIsDragging = useRef(false);

  // console.log("RERENDER GROUP", hasFocus, hasHover, groupIsDragging.current)

  //Ensure that there are refs for all cards
  const cardsRef = useRef([]);
  useEffect(() => {
       cardsRef.current = cardsRef.current.slice(0, skill_app_uids.length);

  }, [skill_app_uids]);

  // Effect for focus_index change
  useEffect(() => {    
    // if(hasFocus){ref.current.focus()}
    let card = cardsRef.current[skill_app_uids.indexOf(focus_uid)]
    console.log("HAS FOCUS",focus_uid)
    card?.scrollIntoView({behavior:"smooth", "block" : "nearest"})
  }, [focus_uid]);


  let skill_app_cards = []
  let card_refs = []
  for(let j=0; j < skill_app_uids.length; j++){
    let uid = skill_app_uids[j]
    skill_app_cards.push(
      <SkillAppCard 
       uid={uid}
       groupHasHover={hasHover}
       index={j}
       groupIsDragging={groupIsDragging}
       key={uid}
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
        uid, groupIsDragging, groupHasHover,
        ...props}) {
  let {setFocus,   setHover, toggleReward, setStaged, undoStaged, setOnly, removeSkillApp} = authorStore()
  let [skill_app, hasFocus, hasStaged, isExternalHasOnly] = useAuthorStoreChange(
      [`@skill_apps.${uid}`, `@focus_uid==${uid}`, `@staged_uid==${uid}`, `@only_count!=0`])

  let [buttonAreaHover, setButtonAreaHover] = useState(false)
  
  let text = skill_app?.input ?? skill_app?.inputs?.value ?? ""
  // console.log("RERENDER CARD", text)
  let reward = (skill_app?.reward ?? 0)
  let is_demo = skill_app.is_demo || false
  let correct = reward > 0 
  let incorrect = reward < 0 || isExternalHasOnly
  let isImplicit = isExternalHasOnly && reward == 0;
  let hasOnly = skill_app.only
  let sel = skill_app.selection

  let minHeight = (hasFocus && 60) || 34
  let maxHeight = (!hasFocus && 40)
  let minWidth = 100//(hasFocus && 60) || 20
  let maxWidth = 160//(hasFocus && 140) || 40

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

  return (
        <RisingDiv 
          onClick={(e)=>{
            if(!groupIsDragging.current){
              setFocus(skill_app)
            }
            e.stopPropagation()
          }}
          hoverCallback={(e)=>setHover({sel : sel, uid: uid})}
          unhoverCallback={(e)=>setHover({uid: ""})}
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
          
          <div 
            style={styles.card_button_area}
            onMouseEnter={()=>setButtonAreaHover(true)}
            onMouseLeave={()=>setButtonAreaHover(false)}
          >
            {/*Close Button*/}
            {is_demo && hasFocus && 
              <RisingDiv 
                style={{...styles.card_button, ...styles.remove_button}}
                onMouseDown={(e)=>{
                  // console.log("CLOSE")
                  e.stopPropagation()
                  removeSkillApp?.(skill_app);
                  }}
              >{"✕"}
              {buttonAreaHover && 
                <div style={styles.card_button_text}>remove</div>
              }
              </RisingDiv>
            }

            {/*Stage Button*/}
            {correct && 
              <RisingDiv 
                style={{...styles.card_button, ...styles.stage_button,
                  ...(hasStaged && styles.card_button_selected)
                }}
                onMouseDown={(e)=>{
                  console.log("Stage")
                  e.stopPropagation(); 
                  hasStaged ? undoStaged() : setStaged(skill_app)
                  }}
              >
                <img style={{width:"100%", height:"100%"}} src={images.double_chevron}/>
                {buttonAreaHover && 
                  <div style={styles.card_button_text}>stage</div>
                }
              </RisingDiv>
            }

            {/*Only Button*/}
            {correct && 
              <RisingDiv 
                style={{...styles.card_button, ...styles.only_button,
                  ...(skill_app?.only && styles.card_button_selected)
                }}
                onClick={(e)=>{
                  console.log("ONLY")
                  e.stopPropagation(); 
                  setOnly(skill_app, !skill_app.only)
                }}
              >
                <div >{"⦿"}</div>
                {buttonAreaHover && 
                  <div style={styles.card_button_text}>only</div>
                }
              </RisingDiv>
            }
          </div>

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
                }}
                text_color={(isImplicit && 'white') || 'black'}
                correct={correct}
                incorrect={incorrect}
                onPress={() => toggleReward(skill_app)}
              />
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
      for (let [k,v] of Object.entries(s.sel_skill_app_uids) ){
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
          x={elem.x+elem.width+10} y={elem.y-20}
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
  "c_bounds" : 'rgba(10,220,10)',
  "i_bounds" : 'rgba(255,0,0)',
  "u_bounds" : 'rgba(120,120,120)',
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
    // paddingLeft : 29, 
    // left : -25,
    // marginRight : -31,
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

  card_button_area: {
    position : 'absolute',
    right : 0,
    paddingLeft: 4,
    height : "100%",
    
    // backgroundColor : "red",
    display : "flex",
    flexDirection : "column",
  },

  card_button: {
    display : "flex",
    alignItems : 'center',
    justifyContent : 'center',
    position : 'relative',
    // right:2,
    // top:2,
    padding : "2px 2px 2px 2px",
    margin : 2,
    opacity : .2,
    // border : "solid 1px rgb(230,230,230)",
    border : "solid 1px black",
    // backgroundColor : 'rgb(240,256,240)',
    color : "black",
    backgroundColor : 'white',
    width: 9,
    height: 9,
    fontSize : 8,
    fontWeight : 'bold',
    borderRadius: 20,
    textAlign:'center',
  },

  card_button_hover : {
    opacity : .4,
  },

  card_button_selected: {
    // backgroundColor : 'rgb(200,200,200)',
    // border : "solid 2px rgb(160,160,160)",

    border : "solid 2px black",
    borderRadius : 4,
    padding : "1px 1px 1px 1px",
    opacity : .7,
  },

  remove_button : {
    fontSize : 10,
  },

  stage_button : {
    marginTop : "auto",

  },

  only_button : {
    bottom : 0,
    marginBottom : 5,
    padding : "2px 2px 3px 2px",
  },

  card_button_text: {
    display : "flex",
    position:'absolute',
    backgroundColor : "white",
    border : "solid 1px lightgray",
    color : "black",
    padding : 1,
    paddingRight : 2,
    paddingLeft : 2,
    borderRadius : 6,
    top: 0,
    right: 16,
    fontSize: 8,
    
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
    overflowY: "hidden",
    overflowX: "visible",
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

  // stage_button : {
  //   display : "flex",
  //   position: 'absolute',
  //   flex: 1,
  //   width : 10,
  //   height: 13,
  //   alignContent: "center",
  //   justifyContent: "center",
  //   fontSize : 12,
  //   borderRadius: 40,
  //   padding: 0,
  //   backgroundColor: 'rgba(190,190,190,.8)',
  //   left : -6,
  //   bottom : -6,
  //   // fontWeight: 'bold',
  // },

  // only_icon : {
  //   display : "flex",
  //   position : "absolute",
  //   width : 7,
  //   height : 8,
  //   alignContent: "center",
  //   justifyContent: "center",
  //   // left: 0,
  //   right: 10,
  //   top:0,
  //   opacity:.6,
  //   fontSize: 6
  // },

  // stage_icon : {
  //   display : "flex",
  //   position : "absolute",
  //   width : 7,
  //   height : 8,
  //   alignContent: "center",
  //   justifyContent: "center",
  //   // left: -.5,
  //   // bottom: -1.5,
  //   right: 2,
  //   opacity:.6,
  // },

  

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
