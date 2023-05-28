import React, { Component, createRef, useState, useEffect, useRef, Profiler } from 'react'
import {authorStore, useAuthorStore, useAuthorStoreChange} from "../author_store.js"
import {shallowEqual} from "../../utils.js"
import {colors, where_colors} from "../themes.js"

const dodger_blue_filter = "invert(46%) sepia(41%) saturate(3631%) hue-rotate(191deg) brightness(100%) contrast(102%)"
const crimson_filter = "invert(17%) sepia(40%) saturate(6641%) hue-rotate(336deg) brightness(103%) contrast(102%)"


const images = {
  pencil : require('../../img/pencil.png')
};


export const Icon = ({style, size, kind}) => {
  let is_demo = kind.includes('demo') 
  let is_only = kind.includes('only') //&& key != 'only'
  let is_correct = !kind.includes('incorrect')
  let color = (is_demo && 'dodgerblue') ||
              (kind.includes('incorrect') && colors.incorrect) ||
              (kind.includes('correct') && colors.correct) ||
              'black'
  let icon = (kind.includes('incorrect') && '✖') ||
              // (key=='only' && '⦿') ||
              (kind.includes('correct') && '✔') ||
              "•"
            
              //'━'
  size = size || style.fontSize || 12
  let inner_size = (is_only && size * .7) || size * .8
  let icon_size = size
  if(icon == "•"){
    icon_size *= 1.5
  }
  return (
    <div
      style={{
        display : 'flex',
        width : size, height: size *.8,
        justifyContent : 'center',
        alignItems : 'center',
        ...(is_only && {border : `1px solid ${color}`, borderRadius : 50}),
        ...style
      }}
    > 
      {(is_demo && 
        <img
          src={images.pencil}
          style={{width : inner_size, height: inner_size, 
            filter: is_correct ? dodger_blue_filter : crimson_filter
          }}
        />) ||
        <a style={{color: color, fontSize: icon_size}}>{icon}</a>
      }
    </div> 
  )
}

export const FeedbackCounter = ({style, kind, count, clickHandler, count_text_style}) => {
  style = {...styles.counter_container,...style}
  let icon_size = (style.fontSize || 10) 
  // let inner_size = (is_only && icon_size * .7) || icon_size * .8
  let inner = [];
  if(count <= 2){
    for (let i=0; i < count; i++){
      inner.push(<Icon 
        key={`${kind}_icon_${i}`}
        style={{fontSize:icon_size}}
        {...{kind, count}} 
      />,)
    }
  }else{
    inner = [<Icon key={`${kind}_icon`}
                  style={{fontSize:icon_size}}
              {...{kind, count}} />,
             <a key={`${kind}_count`}
              style={{fontSize: ".9em", ...styles.count_text_style, ...count_text_style}}>{`x${count}`}</a>
            ]
  }

  return (
    <div style={style}
        onClick={clickHandler}
      > 
        {inner}
    </div>
  )
}

export const FeedbackCounters = ({sel, style, counter_style, count_text_style}) => {
  let {getFeedbackCounts} = authorStore()
  let [counts,                                isExternalHasOnly] = useAuthorStoreChange(
      [[getFeedbackCounts(sel),shallowEqual] ,"@only_count!=0"]
  )

  // If any are correct_only mark all undefined as incorrect 
  if(isExternalHasOnly){
    counts.incorrect += counts.undef  
    counts.undef = 0
  }

  let counters = Object.entries(counts).map( ([key, count]) => {
    let clickHandler = () => {}
    return (count != 0 && <FeedbackCounter {
              ...{style: counter_style, count_text_style, kind:key, count, clickHandler}
              }
              key={key}
            />
          )
  })
  

  return (
  <div style={{
    ...styles.feedback_counters,
    ...style
    }}
    onClick={()=>{}}
  >  
    {counters}    
  </div>
  )
}


const styles = {
  feedback_counters: {
    display: "flex",
    flexDirection: "row",
    fontSize: 10,
    flex: 1,
    padding: 3,
    borderRadius : 10
  },

  counter_container: {
    display:"flex",
    flexDirection:"row",
    alignItems:"center",
    justifyItems:"center",
    height: 12,
    fontSize : 12,
    //backgroundColor:'rgba(235,235,235,1)',
    //border : 'solid 1px lightgray',
    borderRadius: 10,
    paddingRight: 3,
    paddingLeft: 3,
    marginLeft: 1.5,
    marginRight: 1.5,
  },

  count_text_style :{
    marginLeft: 'auto',
    textAlign: 'right',
    minWidth: 11
  },
}
