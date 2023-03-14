import React, { Component, createRef, useState, useEffect, useRef, Profiler } from 'react'
import { motion, useMotionValue, useSpring, useScroll } from "framer-motion";
// import * as Animatable from 'react-native-animatable';
import autobind from "class-autobind";
import './App.css';
// import {useChangedStore} from './globalstate.js';
import './components/scrollbar.css';
import create from "zustand";


const useStore = create((set) => ({
  boop1: {"A": 0, "B" :1},
  boop2: {"A": 3, "B" :4},
  lst: [{"A": 0, "B" :1}],
    
  incBoop1A: (A) =>
   set((state) => ({
     boop1: {...state.boop1, A : state.boop1.A+1}
   })),
  setBoop1A: (A) =>
   set((state) => ({
     boop1: {...state.boop1, A : A}
   })),
  setBoop1B: (B) =>
   set((state) => ({
     boop1: {...state.boop1, B : B}
   })),

   setBoop2B: (B) =>
   set((state) => ({
     boop2: {...state.boop1, B : B}
   })),
}));

export let useChangedStore = makeChangeStore(useStore)


let MyZustandTest = () => {
  // let {boop1A, boop2B, setBoop1A, setBoop1B, setBoop2B} = useStore(
  //   (s) => ({boop1A : s.boop1.A, boop2B :s.boop2.B, setBoop1A : s.setBoop1A, setBoop1B : s.setBoop1B, setBoop2B: s.setBoop2B}),
  //   (o,n) => {return (o.boop1A==n.boop1A && o.boop2B==n.boop2B)}
  // )
  // let [isFour, boop1A, boop2B, setBoop1A, setBoop1B, setBoop2B] = useChangedStore(
  //   [ [(s)=>(s.boop1.A==4),true], ['@boop1.A',(old,nw)=>!(nw < 7)], '@boop2.B', 'setBoop1A', 'setBoop1B', 'setBoop2B']
  // )
  let [isFour, boop1A, boop2B, incBoop1A, setBoop1B, setBoop2B] = useChangedStore(
    // [ [(s)=>(s.boop1.A==4),true], "boop1.A", 'boop2.B', 'incBoop1A', 'setBoop1B', 'setBoop2B']
    [ "@boop1.A==4", "boop1.A", 'boop2.B', 'incBoop1A', 'setBoop1B', 'setBoop2B']
  )
   
  console.log("RRR", boop1A, boop2B)
  return (
    <div>
      {`${boop1A} , ${boop2B}`}
      <div 
        style={{width:100, height:30, backgroundColor: (isFour && 'blue') || 'red'}}
        onClick={() =>{incBoop1A()}}
      >
      {"click"}
      </div>
    </div>    
  )
}

export default MyZustandTest
