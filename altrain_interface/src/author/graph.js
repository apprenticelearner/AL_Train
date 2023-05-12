// import React, { useState, useEffect } from 'react';
import React, { Component, createRef, useState, useEffect, useRef, Profiler, Suspense, memo } from 'react'
import * as d3 from "d3"
import "d3-selection-multi";
import "./graph.css"
import {graph_data} from "./graph_test_data1.js"
import {authorStore, useAuthorStore, useAuthorStoreChange} from "./author_store.js"
import { animated, motion, useMotionValue, useSpring, useScroll } from "framer-motion";
import { gen_shadow, arraysEqual } from "../utils";


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
               //`Q ${hw*.93},${-hh} ${hw},${-hh*.7} ` +
               // Half Circle Part
                //`A ${hw*2},${hh*2} 0 0,1 ${hw*.93},${hh} ` +
               // `Q ${hw*.7},${hh} ${hw},${hh*.7} ` +
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
    let in_offsetY = (a.in_index * in_end_spacing) - in_height_total / 2 + in_end_spacing / 2
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

function layoutNodesEdges(states, actions){
    console.log(states, actions)
    
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

            // Also mark each state's is_connected to true iff it has 
            //  am input action that is connected with non-negative reward
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
            let a_obj;
            
            for(let out_uid of out_skill_app_uids){
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
                let a_obj = actions[out_uid]
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

    // Set in_index and out_index for each edge to minimize rendering
    //  overlap between edges.
    for(let [uid, s_obj] of Object.entries(states)){
        let srted;
        srted = (s_obj?.out_skill_app_uids ?? []).map((a_uid)=>actions[a_uid])
        .sort((a0_obj, a1_obj) => a0_obj.y-a1_obj.y)
            // states[a0_obj.next_state_uid].y-states[a1_obj.next_state_uid].y

        for(let [index, a_obj] of srted.entries()){
            a_obj.out_index = index
        }

        srted = (s_obj?.in_skill_app_uids ?? []).map((a_uid)=>actions[a_uid])
        .sort((a0_obj, a1_obj) => a0_obj.y-a1_obj.y)
            // states[a0_obj.state_uid].y-states[a1_obj.state_uid].y

        for(let [index, a_obj] of srted.entries()){
            a_obj.in_index = index
        }
    }  
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

    

    let text = skill_app?.input ?? skill_app?.inputs?.value ?? ""

    let reward = (skill_app?.reward ?? 0)
    let is_demo = skill_app.is_demo || false
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

    let stroke_color =  (is_demo && 'dodgerblue') ||
                        (correct && colors.c_bounds) || 
                        (incorrect && colors.i_bounds) || 
                        colors.u_bounds

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

    console.log("RERENDER EDGE", text, isExternalHasOnly, incorrect)

    return (
        <g className="edge"
            skill_app_uid={skill_app_uid}
            filter={shadow}
            onMouseEnter={()=>{setHover(skill_app_uid); console.log("HI")}}
            onMouseLeave={()=>{setHover(""); console.log("BYE")}}
            //Note: onMouseDown is handled at the graph level because d3.zoom consumes
            >

            {/* Edge Curve */}
            {(skill_app && <path 
                className="edge-curve"
                markerEnd={markerEnd}
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

                {/* Text in action card */}
                <text
                    className='edge-text'
                    x={6}
                    fontSize={24}
                    alignmentBaseline={"central"}
                >
                    {text}
                </text>
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
    let {graph_states:states, setHoverState} = authorStore()
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

    // if (state_uid == current_uid) {
    //     shadow = "drop-shadow(2px 4px 2px rgb(15, 15, 35, 0.4))"
    // }else{
    //     shadow = "drop-shadow(1px 2px 1px rgb(30, 30, 70, 0.3))"
    // }
    return (
        <g
        onMouseEnter={()=>{setHoverState({uid:state_uid});}}
        onMouseLeave={()=>{setHoverState({uid:""});}}
        className="node"
        state_uid={state_uid}
        >
            <path 
                className="node-path"
                d={gen_node_path(s)}
                fill={'lightgrey'}
                strokeWidth={stroke_width}
                stroke={"grey"}
                filter={shadow}
                transform={`scale(${scale})`}
            />
            {hasStaged && 
                <path 
                    className="node-double-chevron"
                    d={gen_double_chevron(s)}
                    fill={'transparent'}
                    strokeWidth={6}
                    stroke={"gray"}
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

const GraphContent = ({contentRef}) =>{
    let [update_time,[state_uids, actions_uids, actions_are_neg]] = useAuthorStoreChange([
        '@graph_prev_update_time',
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
    let {graph_states:states, graph_actions:actions} = authorStore()

    console.log("UPDATE_GRAPH", states, actions)
    layoutNodesEdges(states, actions)
    
    let node_containers = []
    for(let [state_uid, s_obj] of Object.entries(states)) {
        console.log("<<", state_uid.slice(3,6), s_obj.is_connected)
        if(s_obj?.is_connected != false){
            node_containers.push(
                <NodeGroup state_uid={state_uid}
                    key={state_uid}
                />
            )    
        }
        
    }
    return (<g ref={contentRef}>{node_containers}</g>)
}

// A class component that wraps the main GraphContent allowing d3 zoom() events to be used.
export class Graph extends React.Component {
    constructor(){
        super();
        this.svgRef = React.createRef();
        this.svgGRef = React.createRef();
        this.didZoom = false
    }

    handleMouseDown = (e) => {
        this.didZoom = false
        // e.stopImmediatePropagation()
    }
    handleClick = (e) => {
        console.log("MOUSE UP")
        // If the click target is not the background then ignore d3
        if(!this.didZoom && 
           !(e.target == this.svgRef.current || e.target == this.svgGRef.current)){

            // If target is part of edge which has been annotated by a skill_app_uid
            //  then focus on the associated skill_app
            let edge_uid = getTargetEdgeUID(e)
            if(edge_uid){
                let {setFocus} = authorStore()
                setFocus(edge_uid)
            }

            // If the target is part of a node...
            let node_uid = getTargetNodeUID(e)
            console.log("CLICK NODE", node_uid)
            if(node_uid){
                let {setTutorState} = authorStore()
                setTutorState(node_uid)
            }
            // ...


            // Prevent any zoom events 
            e.stopImmediatePropagation()
        }

    }

    componentDidMount = () => {
        this.zoomTransRef = React.createRef();
        this.zoomTransRef.current = d3.zoomIdentity.translate(40, 200).scale(.7)

        let zoom = d3.zoom()
            .scaleExtent([.15, 1.6])


        let {x:zoom_x,y:zoom_y,k:zoom_scale} = this.zoomTransRef.current

        // The group in the svg that is moved when change zoom    
        let svg_g = d3.select(this.svgGRef.current)        
        // The main svg
        let svg = d3.select(this.svgRef.current)
            .on("mousedown", this.handleMouseDown)
            // Note: d3.zoom consumes mouseup so using click instead
            .on("click", this.handleClick)
            .call(zoom.transform, this.zoomTransRef.current)
            .call(zoom.on("zoom", function(event) {
                // console.log(event.transform)
                svg_g.attr("transform", event.transform);
            }))


        this.svg = svg
        this.svg_g = svg_g
        this.zoom = zoom

        let {setGraph} = authorStore()
        setGraph(this)


        // setTimeout(() =>{
        //     this.zoom_to([[400, -200], [600, 400]])
        // },100)

        // setTimeout(() =>{
        //     this.zoom_to('1')
        // },500)
    }

    zoom_to = (dest, duration=600) => {
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

        const width = 350;
        const height = 450;
        const [[x0, y0], [x1, y1]] = bounds

        let scale_div = Math.max((x1 - x0) / width, (y1 - y0) / height)

        let transform = d3.zoomIdentity
            .translate(width / 2, height / 2)
            .scale(Math.min(8, 0.8 / scale_div))
            .translate(-(x0 + x1) / 2, -(y0 + y1) / 2)

        this.svg.transition()
            .duration(duration)
            .call(this.zoom.transform, transform)//d3.pointer(event, svg.node())
    }

    render = () => {
        let {style} = this.props
        return (<svg className={"root-svg"} ref = {this.svgRef}
            style= {{...style,"border": "1px solid black"}}>
            <Defs/>
            <GraphContent contentRef={this.svgGRef}/>
        </svg>)
    }
}

    

