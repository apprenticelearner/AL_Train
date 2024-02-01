// import React, { useState, useEffect } from 'react';
import React, { Component, createRef, useState, useEffect, useRef, Profiler, Suspense, memo } from 'react'
// import * as d3 from "d3"
// import "d3-selection-multi";
import "./graph.css"
import {graph_data} from "./graph_test_data1.js"
import {authorStore, useAuthorStore, useAuthorStoreChange} from "./author_store.js"
import { animate, motion, MotionValue, useSpring} from "framer-motion";
import { gen_shadow, arraysEqual } from "../utils";
import { colors, where_colors } from "./themes.js"
import ScrollableStage from "./stage.js"
import {Transform, identity as zoomIdentity} from "./zoom.js"
import {Oval} from "react-loader-spinner";
import RisingDiv from "./components/RisingDiv.js"
// import {LoadSpinner} from "./spinner.js"

const images = {
  next : require('../img/next.svg'),
  tap : require('../img/gesture-tap.svg'),
  scroll : require('../img/scroll.svg'),
  scroll2d : require('../img/scroll2d.svg'),
};

// const colors = {
//   "correct" : 'rgba(10,220,10)',
//   "incorrect" : 'rgba(255,0,0)',
//   "default" : 'rgba(129,125,144)',
// }


const nodeRadius = 26;
const nodeHeight = 60;
const nodeWidth = 50;
const minNodeVertMargin = 30;

const actionWidth = 60;
const actionHeight = 30;
const leftActionMargin = 60;
const rightActionMargin = 100;
const vertActionMargin = 20;
const vertActionSpacing = actionHeight + vertActionMargin*2

const depthSpacing = nodeWidth + leftActionMargin + actionWidth + rightActionMargin;
const minVertNodeSpacing = nodeWidth + minNodeVertMargin

const arrowOffset = 16;
const fontSize = 8;
const size = 600;
const margin = {top: 20, right: 90, bottom: 30, left: 90};
const endNodeColor = "magenta"
const startNodeColor = "darkTurquoise"
const markerBoxWidth = 12;
const markerBoxHeight = 10;


function gen_node_path(s) {
    // console.log("NODE!!", s)
    let hw = nodeWidth / 2
    let hh = nodeHeight / 2
    let path = `M ${hw*.8},${-hh}` +
               `Q ${hw*1},${-hh} ${hw*1.1},${-hh*.8} ` +
               `Q ${hw*1.5},0 ${hw*1.1},${hh*.8} ` +
               `Q ${hw*1},${hh} ${hw*.8},${hh} ` +

               `H ${-hw*.8}` +
               `Q ${-hw} ${hh} ${-hw} ${hh*.8}` +
               `V ${-hh*.8}` +
               `Q ${-hw},${-hh} ${-hw*.8},${-hh}` +
               `H ${hw*.8}`
    return path
}

function gen_double_chevron(s) {
    let hw = nodeWidth / 2
    let hh = nodeHeight / 2
    let path = `M ${-hw*.6},${-hh*.6}` +
               `L ${hw*.1},${0}` +
               `L ${hw*.8},${-hh*.6}` +
               `M ${-hw*.6},${0}` +
               `L ${hw*.1},${hh*.6}` +
               `L ${hw*.8},${0}` 
    return path
}


function gen_curve_path(a, states, relative=false) {
    let {state_uid, next_state_uid} = a
    let s = states[state_uid]
    let d = states?.[next_state_uid] ?? {x: a.x, y: a.x+actionWidth+rightActionMargin/2} ;

    // Adjust s_x, s_y so they emerge radially
    let n_out = s?.out_skill_app_uids?.length || 0 
    let out_arc_total = Math.min(Math.PI, n_out * (Math.PI/8))
    let out_arc_len = out_arc_total/n_out
    let out_angle = (a.out_index * out_arc_len) - out_arc_total / 2 + out_arc_len / 2
    let s_x = parseInt(s.x + .6*nodeWidth*Math.cos(out_angle))
    let s_y = parseInt(s.y + .45*nodeHeight*Math.sin(out_angle))
    // console.log("S", s.uid, ":", a.out_index, out_angle * (180/Math.PI))

    // Adjust d_x, d_y so they are arranged top to bottom
    let n_in = d?.in_skill_app_uids?.length || 0 
    let in_height_total = nodeHeight//Math.min(nodeHeight, n_in * (nodeHeight/6))
    let in_end_spacing = in_height_total/n_in
    let in_offsetY = ((a?.in_index || 0) * in_end_spacing) - in_height_total / 2 + in_end_spacing / 2
    let d_x = d.x
    let d_y = d.y + in_offsetY
    // console.log("S", s.uid, ":", a.out_index, out_angle * (180/Math.PI))

    let [a_x,a_y] = [a.x,a.y]
    let [e_x,e_y] = [a.x+actionWidth,a.y]
    if(relative){
        s_x -= s.x; s_y -= s.y
        d_x -= s.x; d_y -= s.y
        a_x -= s.x; a_y -= s.y
        e_x -= s.x; e_y -= s.y
    }

    let path = `M ${s_x} ${s_y} ` +
               `C ${parseInt((s_x*.5 + a_x*.5))} ${s_y} ` +
                 `${parseInt((s_x*.7 + a_x*.3))} ${a_y} ` +
                 `${a_x} ${a_y}` +
               `M ${e_x} ${e_y} ` +
               `C ${parseInt((e_x*.5 + d_x*.5))} ${e_y} ` +
                 `${parseInt((e_x*.7 + d_x*.3))} ${d_y} ` +
                 `${d_x - (nodeWidth / 2 + arrowOffset)} ${d_y}`
    // console.log("PATH", path)
    return path;
}

export function organizeByDepth(states){
    let objs_by_depth = {}
    for(let [uid, obj] of Object.entries(states)){
        let depth_objs = objs_by_depth?.[obj.depth] ?? []
        depth_objs.push(obj)
        objs_by_depth[obj.depth] = depth_objs
    }

    // Do layout in ascending depth order
    let ascending_depth = Object.entries(objs_by_depth)
        .sort(([depth0,obj0],[depth1,obj1]) => depth0-depth1)
    return ascending_depth
}

function layoutNodesEdges(states, actions, tutor){    
    let objs_by_depth = organizeByDepth(states)

    // Establish the general layout of nodes and edges
    let prev_depthY_center = 0
    for(let [depth, depth_objs] of objs_by_depth){
        let depth_maxY = 0
        let prev_s_obj;

        // Sort state nodes by the average y of their upstream inputs.
        let sorted_objs = depth_objs.map((s_obj) =>{
            let avg_in_y = 0
            let n = 0

            // Also mark each state as is_connected iff it has a connected
            //  input action with non-negative reward
            let has_non_negative = (depth == 0)
            for(let in_uid of s_obj?.in_skill_app_uids ?? []){
                let a_obj = actions[in_uid]
                avg_in_y += a_obj.y
                n++
                if(a_obj.is_connected && (a_obj?.skill_app?.reward ?? 0) >= 0){
                    has_non_negative = true;  
                } 
            }
            s_obj.is_connected = has_non_negative

            avg_in_y /= Math.max(n,1) 
            return [avg_in_y, s_obj]
        }).sort(([avg0, obj0], [avg1,obj1]) => avg0-avg1)

        // Make an initial layout of nodes for this depth and it's immediate downstream actions
        for(let [avg_in_y, s_obj] of sorted_objs){
            // Ignore if not connected.
            // if(s_obj?.is_connected == false) continue;

            let edge_index = 0
            let out_skill_app_uids = s_obj?.out_skill_app_uids ?? []
            
            // Sort actions by the position of the interface element 
            //  they act on (i.e. top-down, left-right).
            let sorted_actions = []
            for(let out_uid of out_skill_app_uids){
                let a_obj = actions?.[out_uid];
                if(!a_obj) continue;

                let sel = a_obj?.skill_app?.selection
                if(sel){
                    let elm = tutor.getElement(sel) 
                    let rect = elm.getBoundingClientRect()   
                    sorted_actions.push([rect, out_uid])
                }else{
                    sorted_actions.push([[0,0], out_uid])
                }
            }
            sorted_actions = sorted_actions.sort(([ra, a], [rb, b])=>(ra.y-rb.y)+.05*(ra.x-rb.x))
            
            let a_obj;
            for(let [pos, out_uid] of sorted_actions){
                a_obj = actions?.[out_uid];
                if(!a_obj) continue;

                a_obj.x = Math.max(s_obj.depth, 0) * depthSpacing + (nodeWidth / 2) + leftActionMargin
                a_obj.y = depth_maxY + (edge_index * vertActionSpacing)
                a_obj.color = 'grey' //"hsl(" + Math.random() * 360 + ",100%,50%)"
                a_obj.edge_index = edge_index
                // console.log(a_obj.uid, a_obj.state_uid, "->", a_obj.next_state_uid, ":", a_obj.y)
                edge_index++
                // Actions are connected if their state is connected 
                a_obj.is_connected = s_obj.is_connected
            }

            let new_maxY = 0;
            new_maxY = edge_index > 0 ? a_obj.y : depth_maxY
            
            s_obj.x = parseInt(s_obj.depth * depthSpacing);
            s_obj.y = parseInt((depth_maxY+new_maxY)/2);
            // console.log("S", s_obj.uid, s_obj.y)

            let extra_padding = vertActionSpacing
            if(new_maxY-depth_maxY < minVertNodeSpacing){
                extra_padding = minVertNodeSpacing
            }

            depth_maxY = new_maxY+extra_padding
        }

        // Adjust the y values for this depth so that it is centered around the previous depth 
        //  Also calculate the bounds of the state node and it's outgoing edges
        let center_diffY = prev_depthY_center - (depth_maxY / 2) 
        
        for(let [avg_in_y, s_obj] of sorted_objs){
            s_obj.y += center_diffY

            let [minX, minY] = [s_obj.x-nodeWidth/2, s_obj.y-nodeHeight/2]
            let [maxX, maxY] = [s_obj.x+depthSpacing, s_obj.y+nodeHeight/2]

            let out_skill_app_uids = s_obj?.out_skill_app_uids ?? []
            for(let out_uid of out_skill_app_uids){
                let a_obj = actions?.[out_uid];
                if(!a_obj) continue;

                a_obj.y += center_diffY
                if(a_obj.y+actionHeight > maxY){
                    maxY = a_obj.y+actionHeight
                }
            }
            s_obj.minX = minX; s_obj.minY = minY
            s_obj.maxX = maxX; s_obj.maxY = maxY
        }
        prev_depthY_center = (depth_maxY / 2) + center_diffY
    }

    let graphBounds = {minX:0, minY:0, maxX:0, maxY:0}

    // Set in_index and out_index for each edge to minimize rendering
    //  overlap between edges.
    for(let [uid, s_obj] of Object.entries(states)){
        let srted;

        // Update graph X Bounds
        if(s_obj.x < graphBounds.minX){graphBounds.minX = s_obj.x}
        if(s_obj.x+nodeWidth > graphBounds.maxX){graphBounds.maxX = s_obj.x+nodeWidth}

        // Sort + Set Out Indices 
        srted = (s_obj?.out_skill_app_uids ?? [])
        .reduce((lst, a_uid)=>{let a = actions?.[a_uid]; if(a) lst.push(a); return lst},[])
        .sort((a0_obj, a1_obj) => a0_obj.y-a1_obj.y)

        for(let [index, a_obj] of srted.entries()){
            a_obj.out_index = index

            // Update graph Y bounds
            if(a_obj.y < graphBounds.minY){graphBounds.minY = a_obj.y}        
            if(a_obj.y > graphBounds.maxY){graphBounds.maxY = a_obj.y}        
        }

        // Sort + Set In Indices
        srted = (s_obj?.in_skill_app_uids ?? []).map((a_uid)=>actions[a_uid])
        .sort((a0_obj, a1_obj) => a0_obj.y-a1_obj.y)

        for(let [index, a_obj] of srted.entries()){
            a_obj.in_index = index
        }
    }
    return graphBounds  
}

// ---------------------------------------
// : Edge Rendering

const getExternalHasOnly = (skill_app_uid) => [(s) =>{
    let a = s.graph_actions?.[skill_app_uid] ?? {}
    return s.only_count != 0 && a.state_uid == s.curr_state_uid
    },
    (o,n) => o == n]


const Edge = ({skill_app_uid}) =>{
    let uid = skill_app_uid;
    let {graph_states:states, graph_actions:actions, setHover, setFocus} = authorStore()


    let [a, hasFocus, hasHover, hasStaged, isExternalHasOnly] = useAuthorStoreChange(
      [`@graph_actions.${uid}`, `@focus_uid==${uid}`, `@hover_uid==${uid}`,
       `@staged_uid==${uid}`, getExternalHasOnly(skill_app_uid)]
    )
    let skill_app = a.skill_app
    let s = states[a.state_uid]

    // Let x, y be relative to the node group for this edge
    let [x,y] = [a.x-s.x, a.y-s.y]

    let reward = (skill_app?.reward ?? 0)
    let is_demo = skill_app.is_demo || false
    let confirmed = skill_app?.confirmed ?? false
    let undef = reward == 0 
    let correct = reward > 0 
    let incorrect = reward < 0 || (reward == 0 && isExternalHasOnly)
    let isImplicit = isExternalHasOnly && reward == 0;
    let hasOnly = skill_app.only
    let sel = skill_app.selection

    // Make the shadow slighly blue for better overlap visibility
    let shadow_colors = {red:0, green: 20, blue: 60}

    let shadow = (hasFocus && gen_shadow(14,'drop',shadow_colors)) ||
                 (hasHover && gen_shadow(12,'drop',shadow_colors)) ||
                 gen_shadow(8,'drop', shadow_colors)

    let stroke_color =  (is_demo && colors.demo) ||
                        (correct && colors.correct) || 
                        (incorrect && colors.incorrect) || 
                        colors.default

    let edge_stroke_width = (hasHover && hasFocus && 13) ||
                       (hasFocus && 12) || 
                       (hasHover && 10) || 
                       7;

    let box_scale = (hasFocus && hasHover && 1.25) ||
                    (hasFocus && 1.15) || 
                    (hasHover && 1.2) || 
                    1;

    let box_stroke_width = (hasFocus && 6)||
                            3;

    let markerEnd = (hasStaged && "url(#double_arrow)") ||
                    (incorrect && "url(#x)") ||
                    "url(#arrow)"

    let action_content;

    if(skill_app.action_type.toLowerCase().includes("button")){
      action_content = <image style={{x: 2, y:-14, width: 24, height : 24}} href={images.tap}/>
    }else{
        let text = skill_app?.input ?? skill_app?.inputs?.value ?? ""
        action_content =(
            <text
                className='edge-text'
                x={6}
                fontSize={24}
                alignmentBaseline={"central"}
            >
            {text}
            </text>
        )
    }
    

    

    // console.log("RERENDER EDGE", text, isExternalHasOnly, incorrect)

    return (
        <g className="edge"
            skill_app_uid={skill_app_uid}
            filter={shadow}
            onMouseEnter={()=>{setHover(skill_app_uid)}}
            onMouseLeave={()=>{setHover("")}}
            //Note: onMouseDown is handled at the graph level because d3.zoom consumes
            >

            {/* Edge Curve */}
            {(skill_app && <path 
                className="edge-curve"
                markerEnd={markerEnd}
                {...(!undef && !confirmed && {strokeDasharray:"30,3"})}
                d={gen_curve_path(a, states, true)}
                stroke={stroke_color}
                strokeWidth={edge_stroke_width}
                />)
            }

            {/* Edge Box */}
            <g  
                className='edge-box-container'
                transform={`translate(${x}, ${y}) scale(${box_scale})`}
                >
                {/* Invisible hit-box for expanding the click area */}
                <rect 
                    className='edge-hit-box'
                    y={-actionHeight/2-vertActionMargin}
                    x={-leftActionMargin/2}
                    width={actionWidth+leftActionMargin} height={actionHeight+vertActionMargin*2}
                />

                {/* Action card */}
                <rect 
                    className='edge-box'
                    y={-actionHeight/2}
                    width={actionWidth} height={actionHeight}
                    strokeWidth={box_stroke_width}
                    stroke={stroke_color}
                />

                {/* Text/Image in action card */}
                {action_content}
            </g>
        </g>)
}

// ---------------------------------------
// : Edge Clickig Helpers

// Since d3's zoom library prevents propogation of certain mouse events we need 
//  to handle them at the graph level before they are blocked. 
// getTargetEdgeUID() retrieves the skill_app_uid of a clicked edge from it's DOM attributes.

const getTargetEdgeUID = (e) => {
    let target = e?.target
    if(target.classList?.[0]?.includes("edge")){
        do{
            let class_name = target.classList?.[0]
            if(!class_name?.includes("edge")){
                break
            }
            let skill_app_uid = target.getAttribute("skill_app_uid")

            if(class_name == "edge" && skill_app_uid){
                return skill_app_uid 
            }else if(target.parentElement){  
                target = target.parentElement
            }else{
                break
            }
        } while(true);
    }
    return null
}

const getTargetNodeUID = (e) => {
    let target = e.target
    if(target.classList?.[0]?.includes("node")){
        do{
            let class_name = target.classList?.[0]
            if(!class_name?.includes("node")){
                break
            }
            let state_uid = target.getAttribute("state_uid")

            if(class_name == "node" && state_uid){
                return state_uid 
            }else if(target.parentElement){  
                target = target.parentElement
            }else{
                break
            }
        } while(true);
    }
    return null
}


// ---------------------------------------
// : Node Rendering

const nodeHasStaged = (state_uid) => [
    (s) => {
        let staged_action = s?.graph_actions[s?.staged_uid]
        return staged_action?.next_state_uid == state_uid
    },
    (o,n) => o == n
]


const Node = ({state_uid}) =>{
    let {graph_states:states, setHoverTutorState} = authorStore()
    let [hasFocus, hasHover, hasStaged] =  useAuthorStoreChange([
        `@curr_state_uid==${state_uid}`, `@hover_state_uid==${state_uid}`, nodeHasStaged(state_uid)
    ])
    let s = states[state_uid]

    // Make the shadow slighly blue for better overlap visibility
    let shadow_colors = {red:0, green: 20, blue: 60}

    let shadow = (hasFocus && gen_shadow(14,'drop',shadow_colors)) ||
                 (hasHover && gen_shadow(12,'drop',shadow_colors)) ||
                 gen_shadow(8,'drop', shadow_colors)

    let scale =  ((hasFocus || hasHover) && 1.05) || 
                  1;

    let stroke_width = (hasFocus && 6) || 
                        3;

    return (
        <g
        onMouseEnter={()=>{setHoverTutorState({uid:state_uid});}}
        onMouseLeave={()=>{setHoverTutorState({uid:""});}}
        className="node"
        state_uid={state_uid}
        >
            <path 
                className="node-path"
                d={gen_node_path(s)}
                fill={'lightgrey'}
                strokeWidth={stroke_width}
                stroke={colors.default}
                filter={shadow}
                transform={`scale(${scale})`}
            />
            {hasStaged && 
                <image 
                    className="node-next-icon"
                    href={images.next}
                    width={nodeWidth*.8}
                    height={nodeWidth*.8}
                    x={-nodeWidth*.4}
                    y={-nodeWidth*.4}
                    opacity={.3}
                    transform={`scale(${scale})`}
                    />
            }
            <text 
                className="node-text"
                textAnchor={"middle"}
                y={8}
                x={2}
            >
                {s.uid.slice(2,5)}
            </text>
        </g>
        )
}

const NodeGroup = ({state_uid}) =>{
    let {graph_states:states, graph_actions:actions, current_state_uid=1} = authorStore()
    let [hasFocus, hasHover] =  useAuthorStoreChange([`@curr_state_uid==${state_uid}`, `@hover_state_uid==${state_uid}`])

    let s = states[state_uid]
    // console.log("S", s, state_uid)
    let out_actions = (s?.out_skill_app_uids??[]).map((uid)=>actions[uid])
    
    let out_edges = []
    for(let action of out_actions){
        // console.log("action", action)
        out_edges.push(<Edge
            skill_app_uid={action.uid}
            key={action.uid}
        />)
    }

    let opacity= (hasFocus && 1.0) || .5

    return (<g className="node-group"
               transform={`translate(${s.x}, ${s.y})`}
               opacity={opacity}
               state_uid={state_uid}
               key={"NG_"+state_uid}
            >
                {out_edges}
                <Node 
                    state_uid={state_uid}
                    key={"N_"+state_uid}
                />
                
            </g>)
}


// ---------------------------------------
// : Graph Rendering

const Defs = (svg) =>{
    return (
    <defs>
        <marker
            className="arrow" id="arrow"
            viewBox={[0, -5, markerBoxWidth, markerBoxHeight]}
            refX={0} refY={0}
            markerUnits={'userSpaceOnUse'}
            markerWidth={16} markerHeight={16}
            orient={'auto'}
        >
            <path stroke='black' fill='black' d={'M 0,-5 L 10 ,0 L 0,5'}/>
        </marker>
        <marker
            className="x" id="x"
            viewBox={[-13, -13, 26, 26]}
            refX={0} refY={0}
            markerUnits={'userSpaceOnUse'}
            markerWidth={20} markerHeight={20}
            orient={'auto'}
        >
            <path stroke='black' fill='transparent' strokeWidth={6} 
                d={'M -10,-10 L 10,10 M -10,10 L 10,-10'}
            />
        </marker>
        <marker
            className="double_arrow" id="double_arrow"
            viewBox={[-13, -5, 26, markerBoxHeight]}
            refX={-4} refY={0}
            markerUnits={'userSpaceOnUse'}
            markerWidth={25} markerHeight={22}
            orient={'auto'}
        >
            <path stroke='black' fill='transparent' strokeWidth={4} 
                d={'M 0,-8 L 10 ,0 L 0,8'+
                   'M -10,-8 L 0 ,0 L -10,8'}
            />
        </marker>

    </defs>
    )
}

const GraphContent = ({contentRef, stageRef, svgRef, anims, setGraphBounds}) =>{
    let [update_time, is_start_mode, [state_uids, actions_uids, actions_are_neg]] = useAuthorStoreChange([
        '@graph_prev_update_time', "@mode=='start_state'",
        [(s) => {
          let s_uids = Object.keys(s.graph_states).sort()
          let a_uids = Object.keys(s.graph_actions).sort()
          let a_negs = Object.values(s.graph_actions).map(
                        (x)=>(x?.skill_app?.reward ?? 0) < 0
                       )
          // console.log("NEGS", a_negs)
          return [s_uids, a_uids, a_negs]
        },
        (o,n) => {
          // console.log("ATTEMPT UPDATE GRAPH", arraysEqual(o[0], n[0]) && arraysEqual(o[1], n[1]))
          // console.log(o,n)
          return arraysEqual(o[0], n[0]) && arraysEqual(o[1], n[1]) && arraysEqual(o[2], n[2])
        }] 
    ])

    // console.log("GRAPH IS START", is_start_mode)
    if(is_start_mode){
        return (<g ref={contentRef} transform='translate(100,200) scale(1)'>
                    <text stle={{userSelect: 'none'}}>
                        {"Setting Start State"}
                    </text>
                </g>)
    }else{
        let {graph_states:states, graph_actions:actions, tutor} = authorStore()

        // console.log("UPDATE_GRAPH", states, actions)
        let graphBounds = layoutNodesEdges(states, actions, tutor);
        setGraphBounds(graphBounds)

        let node_containers = []
        for(let [state_uid, s_obj] of Object.entries(states)) {
            // console.log("<<", state_uid.slice(3,6), s_obj.is_connected)
            if(s_obj?.is_connected != false){
                node_containers.push(
                    <NodeGroup state_uid={state_uid}
                        key={state_uid}
                    />
                )    
            }
        }
        return (<motion.g 
            style={{translateX: anims.x, translateY: anims.y, scale: anims.scale}}
            ref={contentRef}
            >
            {node_containers}
            {/*<circle x={0} y={0} id="circle-indicator" r="10" fill="green"/>*/}
            </motion.g>)
    }
}

function GraphLoadSpinner({...prop}){
  let [awaiting] = useAuthorStoreChange(["@awaiting_rollout"])
  return (
    <div style={styles.load_spinner_container}>
      {awaiting && 
        <Oval {...styles.load_spinner_props}/>
      }
    </div>
  )
}

function DoneStatePopup({...prop}){
  let [is_open] = useAuthorStoreChange(["@done_popup_open"])
  let {beginSetStartState, closeDoneStatePopup, goToStartState} = authorStore()
  return (is_open && 
    <div style={{width: 200, height: 80, position: "absolute", bottom: 10, right: 10,
                borderRadius: 10,  display: "flex", fontFamily: 'Arial',
                flexDirection: "column", alignItems : "center", justifyContent: "space-between",
                padding: 6, textAlign: 'center', userSelect: "none", paddingTop: 16,
                backgroundColor: 'rgba(200, 200, 200, 0.3)',}}>
        <div style={{fontSize: 14}}>
            {"You've entered the done state." //+
             //"Begin authoring a new problem?"}
            }
        </div>
        <RisingDiv style={{borderRadius: 20, fontSize: 16, padding : 4,
                            width: 160, height: 18, backgroundColor: 'teal'}}
            onClick={()=>{closeDoneStatePopup(); beginSetStartState();}}
            >
            {"Author new problem"}
        </RisingDiv>
        <RisingDiv style={{borderRadius: 20, fontSize: 16, padding : 4,
                            width: 160, height: 18, backgroundColor: 'rgb(150, 150, 160)'}}
            onClick={()=>{closeDoneStatePopup(); goToStartState();}}
            >
            {"⬅ Back to the start"}
        </RisingDiv>
        <RisingDiv style={{position: 'absolute', top: 4, right: 4, borderRadius: 20,
                            backgroundColor: 'rgba(200, 200, 200, 0.0)', fontSize: 14,
                            width: 16, height: 16,}}
            onClick={()=>{closeDoneStatePopup()}}
            >
            {"✕"}

        </RisingDiv>
    </div>
  )
}

// A class component that wraps the main GraphContent allowing d3 zoom() events to be used.
export class Graph extends React.Component {
    constructor(){
        super();
        this.stageRef = React.createRef();
        this.svgRef = React.createRef();
        this.svgGRef = React.createRef();
        this.zoomOrigin = zoomIdentity.translate(40,260);
        this.zoomTransform = this.zoomOrigin.scale(1);
        this.scaleExtent = [.15, 1.4]
        this.didZoom = false
        this.is_dragging = false
        this.prev_drag_pos = [0,0]
        this.viewWidth = 650
        this.viewHeight = 440
        
        this.x_anim = new MotionValue(0)
        this.y_anim = new MotionValue(0)
        this.scale_anim = new MotionValue(1)
        // const [scollX_anim, scrollY_anim] = [useMotionValue(0), useMotionValue(0)]

        //
        window.addEventListener('mouseup', (e)=>{
            this.is_dragging=false
            if(this.svgGRef.current){
                this.svgRef.current.style.cursor = "auto"
            }
        })
        window.addEventListener('mousemove', (e)=>{
            // console.log(e)
            if(!this.svgRef.current || !this.is_dragging) return;
            
            let [dx, dy] = [e.clientX-this.prev_drag_pos[0], e.clientY-this.prev_drag_pos[1]]

            this.prev_drag_pos = [e.clientX, e.clientY]

            this.zoomTransform.x += dx*1.7 // scroll fast
            this.zoomTransform.y += dy*1.7 // scroll fast

            this.applyZoomTransform()
        })
    }

    applyZoomTransform = (duration=0) =>{
        let svg_g = this.svgGRef.current
        if(!svg_g) return;

        // Ensure that the transform adheres to bounds
        let {x, y, k} = this.zoomTransform        
        const [viewWidth, viewHeight] = [this.viewWidth, this.viewHeight]
        let gb = this.graphBounds
        let hang = 100 //Amount that graph shows when all the way off edge
        let [mx,my] = [-gb.maxX*k+hang, -gb.maxY*k+hang]
        let [Mx,My] = [viewWidth-gb.minX*k-hang, viewHeight-gb.minY*k-hang]
        if(x < mx) x = mx; if(y < my) y = my;
        if(x > Mx) x = Mx; if(y > My) y = My;        
        this.zoomTransform.x = x
        this.zoomTransform.y = y

        if(duration == 0){
            this.x_anim.set(this.zoomTransform.x)
            this.y_anim.set(this.zoomTransform.y)
            this.scale_anim.set(this.zoomTransform.k)    
        }else{
            let dx = Math.abs(this.x_anim.get() - this.zoomTransform.x)
            let anim_config = {ease: "easeInOut", bounce: .2, duration: dx > 10 ? duration : duration / 2}

            animate(this.x_anim, [this.x_anim.get(), this.zoomTransform.x], anim_config)
            animate(this.y_anim, [this.y_anim.get(), this.zoomTransform.y], anim_config)
            
            let scale_frames = [this.scale_anim.get(), 
                 this.zoomTransform.k-(dx > 10 ? .08 : .0),  //Extra keyframe where zoom out a little
                 this.zoomTransform.k]
            animate(this.scale_anim, scale_frames, anim_config)
        }
    }

    handleMouseDown = (e) => {
        console.log("MOUSE DOWN", e)
        this.didZoom = false
        this.is_dragging = true
        this.prev_drag_pos = [e.clientX, e.clientY]
        if(this.svgRef.current){
            this.svgRef.current.style.cursor = "move"    
        }
        
        // e.stopPropagation()
        e.preventDefault()
    }
    // handleMouseLeave = (e) =>{
    //     this.is_dragging = false
    // }
    handleMouseUp = (e) => {
        console.log("MOUSE UP")
        this.is_dragging = false
        // If the click target is not the background then ignore d3
        if(!this.didZoom && 
           !(e.target == this.svgRef.current || e.target == this.svgGRef.current)){

            // If target is part of edge which has been annotated by a skill_app_uid
            //  then focus on the associated skill_app
            let edge_uid = getTargetEdgeUID(e)
            if(edge_uid){
                let {setFocus} = authorStore()
                setFocus(edge_uid, true)
            }

            // If the target is part of a node...
            let node_uid = getTargetNodeUID(e)
            // console.log("CLICK NODE", node_uid)
            if(node_uid){
                let {setTutorState} = authorStore()
                setTutorState(node_uid, true)
            }
            // ...


            // Prevent any zoom events 
            // e.stopImmediatePropagation()
        }
        

    }
    

    
    handleWheel = (e) => {
        let dx,dy;
        let gb = this.graphBounds
        let [gWidth, gHeight] = [(gb.maxX-gb.minX), (gb.maxY-gb.minY)]

        const [viewWidth, viewHeight] = [this.viewWidth, this.viewHeight]
        // Zoom Case
        if(e.shiftKey){
            let {k:o_k, x:o_x, y:o_y} = this.zoomTransform
            let [kMin, kMax] = this.scaleExtent
            kMin = (viewWidth-50)/Math.max(Math.max(viewWidth*1.5,gWidth), Math.max(viewHeight*1.5, gHeight))
            let k = Math.max(kMin, Math.min(kMax, o_k * Math.pow(2, -e.deltaY*.008)))

            let [mx, my] = this.clientToGraphCoords([e.clientX, e.clientY])
            
            dx = mx*o_k-mx*k
            dy = my*o_k-my*k

            this.zoomTransform.k = k    
        }else{
            dx = -e.deltaX*.8
            dy = -e.deltaY*.8
        }
        
        this.zoomTransform.x += dx 
        this.zoomTransform.y += dy

        this.applyZoomTransform()
    }
    // handleMouseMove = (e) =>{
        

    //     // console.log(e)
    //     // const xVal = e.pageX - stage_view_ref.current.offsetLeft;
    //     // const diffX = (xVal - startX.current);
    //     // stage_view_ref.current.scrollLeft = scrollLeft.current-diffX*2 //scroll-fast

    //     // const yVal = e.pageY - stage_view_ref.current.offsetTop;
    //     // const diffY = (yVal - startY.current); 
    //     // stage_view_ref.current.scrollTop = scrollTop.current-diffY*2 //scroll-fast   
    // }

    componentDidMount = () => {
        // this.zoomTransRef = React.createRef();
        // this.zoomTransRef.current = d3.zoomIdentity.translate(40, 200).scale(.7)

        // let zoom = d3.zoom()
        //     .scaleExtent([.15, 1.6])


        // let {x:zoom_x,y:zoom_y,k:zoom_scale} = this.zoomTransRef.current

        // // The group in the svg that is moved when change zoom    
        // let svg_g = d3.select(this.svgGRef.current)        
        // // The main svg
        // let svg = d3.select(this.svgRef.current)
        //     .on("mousedown", this.handleMouseDown)
        //     // Note: d3.zoom consumes mouseup so using click instead
        //     .on("click", this.handleClick)
        //     .call(zoom.transform, this.zoomTransRef.current)
        //     .call(zoom.on("zoom", function(event) {
        //         // console.log(event.transform)
        //         let {mode} = authorStore()
        //         if(mode != 'start_state'){
        //             svg_g.attr("transform", event.transform);    
        //         }
        //     }))

        // Set the graph in the zustand store
        let {setGraph} = authorStore()
        setGraph(this)        

        // Gets point in graph's main container space
        let svg = this.svgRef.current
        let svg_g = this.svgGRef.current
        this.svg = svg
        this.svg_g = svg_g
        let pt = svg.createSVGPoint();
        this.clientToGraphCoords = (p) => {
            pt.x = p[0]; pt.y = p[1];
            // Translate to svg space
            pt = pt.matrixTransform(svg.getScreenCTM().inverse());
            // Then translate into space of outer-most <g> container
            return this.zoomTransform.invert([pt.x,pt.y])
        }
        this.applyZoomTransform()
    }

    zoom_to = (dest, duration=.45) => {
        let bounds;
        if(typeof(dest) == "string"){
            let state_uid = dest
            let {graph_states:states} = authorStore()
            let s = states[state_uid]
            if(!s){
                console.warn(`Failed to zoom to state_uid=${state_uid}.`)
                return
            }
            bounds = [[s.minX,s.minY],[s.maxX,s.maxY]]
        }else{
            bounds = dest
        }
        this.didZoom = true

        const width = this.viewWidth;
        const height = this.viewHeight;
        const [[x0, y0], [x1, y1]] = bounds
        console.log("Coords:", `${x0} ${x1}, ${y0} ${y1}`)

        let scale_div = Math.max((x1 - x0) / width, (y1 - y0) / height)
        let k = Math.min(1.5, 0.4 / scale_div);
        console.log("ZOOM K", k)
        let transform = zoomIdentity
            .translate(width / 2, height / 2) // center
            .scale(k) // scale
            .translate(-(x0 + x1) / 2, -(y0 + y1) / 2) // zoom to point
            .translate(-80, 30) // tweak so more is showing

        this.zoomTransform = transform
        this.applyZoomTransform(duration)
        console.log("ZOOM TO", this.zoomTransform)
    }

    render = () => {
        let {style} = this.props

        this.viewWidth = style.width || 450

        

        console.log("STYLE", style)
        return (
            <div style={{...styles.graph_container,
                         ...style, "border": "1px solid black"}}>
                <svg 
                    style={{width: "100%", height: "100%", }}
                    className={"root-svg"} ref = {this.svgRef}
                    onWheel={this.handleWheel}
                    onMouseDown={this.handleMouseDown}
                    onMouseUp={this.handleMouseUp}
                    onMouseMove={this.handleMouseMove}
                >
                    <Defs/>
                    <GraphContent anims={{x:this.x_anim, y:this.y_anim, scale:this.scale_anim}}
                        setGraphBounds={(bg)=>{this.graphBounds=bg}}
                        contentRef={this.svgGRef} svgRef={this.svgRef} stageRef={this.svgRef}
                    />
                </svg>
                <div style={styles.instr_container}>
                    <div style={styles.instr_row}>
                        <img src={images.scroll2d} 
                            style={{width:16,height:20, marginRight:2,
                                    filter : "invert(.4)"
                        }}/> 
                        <div>{"Pan : Scroll/Drag"}</div> 
                    </div>
                    <div style={styles.instr_row}>
                        <img src={images.scroll} style={{
                            width:16,height:20, marginRight:2,
                            filter : "invert(.4)"
                        }} /> 
                        <div>{"Zoom : Shift+Scroll "}</div> 
                    </div>  
                </div>
                <GraphLoadSpinner/>
                <DoneStatePopup/>
            </div>
        )
    }
}


const styles = {
    graph_container : {
        position: "relative"
    },
    instr_container : {
        position : "absolute",
        display: "flex",
        flexDirection: "column",
        bottom : 0,
        left : 0,
        margin: 2,
        userSelect : "none",
        pointerEvents : "none",
    },
    instr_row : {
        color : "grey",
        fontSize : 10,
        display: "flex",
        flexDirection: "row",
        marginBottom: 2,
        alignItems: "center",
    },
    // Note spinner styles are props not css styles
    load_spinner_container : {
        position : "absolute",
        display: "flex",
        bottom : 0,
        right : 0,
        width: 30,
        height: 30,
        margin : 5,
    },
    load_spinner_props : {
        height : 20,
        width : 20, 
        color : "#4fa94d",
        secondaryColor : "#4fa94d",
        strokeWidth : 5,
        strokeWidthSecondary : 5
    }
}
