import React, { useState, useEffect } from 'react';
import * as d3 from "d3"
import "d3-selection-multi";
import "./graph.css"
import {graph_data} from "./graph_test_data1.js"
import { animated, motion, useMotionValue, useSpring, useScroll } from "framer-motion";


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


// let recurseFillNodesLinks = (state, states, nodes, links, visited, depth=0)=>{
//   console.log("<<", state)
//   let out_degree = state.actions?.length ?? 0
//   let node = {id: state.id, out_degree: out_degree, depth:depth}
//   visited[node.id] = true
//   nodes.push(node)
//   let span = 0

//   for(let action of (state.actions||[]) ){
//     let next_state = states[action.next_state_id]
//     if(next_state && !(action.next_state_id in visited)){
//       let a_node = recurseFillNodesLinks(
//         next_state, states, nodes, links, visited, depth+1)
//       span += a_node.span
//       links.push({
//         id: `${node.id}->${a_node.id}`,
//         source:node,
//         target:a_node,
//       })  
//     }
//   }
//   node.span = span || 1
//   return node
// }

// let statesToNodesLinks = (states) =>{
//   let start_state = Object.entries(states).filter(([k,v])=>v?.is_start)[0][1]
  
//   let [nodes,links] = [[],[]]
//   recurseFillNodesLinks(start_state, states, nodes, links, {})
//   console.log(nodes,links)
// }

// console.log(statesToNodesLinks(states))

function gen_node(s) {
    console.log("NODE!!", s)
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

function gen_curve(a, states, relative=false) {
    let {state_uid, next_state_uid} = a
    let s = states[state_uid]
    let d = states[next_state_uid]

    // Adjust s_x, s_y so they emerge radially
    let n_out = s?.out_skill_app_uids?.length || 0 
    let out_arc_total = Math.min(Math.PI, n_out * (Math.PI/8))
    let out_arc_len = out_arc_total/n_out
    let out_angle = (a.out_index * out_arc_len) - out_arc_total / 2 + out_arc_len / 2
    let s_x = parseInt(s.x + .6*nodeWidth*Math.cos(out_angle))
    let s_y = parseInt(s.y + .45*nodeHeight*Math.sin(out_angle))
    console.log("S", s.uid, ":", a.out_index, out_angle * (180/Math.PI))

    // Adjuct d_x, d_y so they are arranged top to bottom
    let n_in = d?.in_skill_app_uids?.length || 0 
    let in_height_total = nodeHeight//Math.min(nodeHeight, n_in * (nodeHeight/6))
    let in_end_spacing = in_height_total/n_in
    let in_offsetY = (a.in_index * in_end_spacing) - in_height_total / 2 + in_end_spacing / 2
    let d_x = d.x
    let d_y = d.y + in_offsetY
    console.log("S", s.uid, ":", a.out_index, out_angle * (180/Math.PI))

    let [a_x,a_y] = [a.x,a.y]
    let [e_x,e_y] = [a.x+actionWidth,a.y]
    if(relative){
        s_x -= s.x; s_y -= s.y
        d_x -= s.x; d_y -= s.y
        a_x -= s.x; a_y -= s.y
        e_x -= s.x; e_y -= s.y
    }




    // COMMENTED NOTE : Something about offsetting links in the same depth
    // var dx = d.x - s.x, 
    //     dy = d.y - s.y, 
    //     dr = Math.sqrt(dx * dx + dy * dy);
    

    // let linksWithSameTarget = getLinksWithSameTarget(s.id, d.id, links);
    // let sourceYOffset = d.x;

    // let countOfLinksHigher = 0;
    // for (let i = 0; i < linksWithSameTarget.length; i++) {
    //     let currentSource = getNodeFromID(linksWithSameTarget[i].source.id, nodes);
    //     if ((currentSource.x < s.x) || (currentSource.x == s.x && currentSource.y > s.y)) {
    //         countOfLinksHigher++;
    //     }
    // }

    // if (linksWithSameTarget != 0) {
    //     sourceYOffset += (countOfLinksHigher * 5 - 5);
    // }
    
    let path = `M ${s_x} ${s_y} ` +
               `C ${parseInt((s_x*.5 + a_x*.5))} ${s_y} ` +
                 `${parseInt((s_x*.7 + a_x*.3))} ${a_y} ` +
                 `${a_x} ${a_y}` +
               `M ${e_x} ${e_y} ` +
               `C ${parseInt((e_x*.5 + d_x*.5))} ${e_y} ` +
                 `${parseInt((e_x*.7 + d_x*.3))} ${d_y} ` +
                 `${d_x - (nodeWidth / 2 + arrowOffset)} ${d_y}`
    console.log("PATH", path)
    return path;
}

function layoutNodesEdges(states, actions){
    let objs_by_depth = {}
    for(let [uid, obj] of Object.entries(states)){
        let depth_objs = objs_by_depth?.[obj.depth] ?? []
        depth_objs.push(obj)
        objs_by_depth[obj.depth] = depth_objs
    }

    // Do layout in ascending depth order
    let ascending_depth = Object.entries(objs_by_depth)
        .sort(([depth0,obj0],[depth1,obj1]) => depth0-depth1)

    // Establish the general layout of nodes and edges
    let prev_depthY_center = 0
    for(let [depth, depth_objs] of ascending_depth){
        console.log(depth)
        let depth_maxY = 0
        let prev_s_obj;

        // Sort state nodes by the average y of their upstream inputs
        let sorted_objs = depth_objs.map((s_obj) =>{
            let avg_in_y = 0
            let n = 0
            for(let in_uid of s_obj?.in_skill_app_uids || []){
                let a_obj = actions[in_uid]
                avg_in_y += a_obj.y
                n++
            }
            avg_in_y /= Math.max(n,1) 
            return [avg_in_y, s_obj]
        }).sort(([avg0, obj0], [avg1,obj1]) => avg0-avg1)

        // Make an initial layout of nodes for this depth and it's immediate downstream actions
        for(let [avg_in_y, s_obj] of sorted_objs){
            let edge_index = 0
            let out_skill_app_uids = s_obj?.out_skill_app_uids ?? []
            let a_obj;
            
            for(let out_uid of out_skill_app_uids){
                a_obj = actions[out_uid]
                a_obj.x = Math.max(s_obj.depth, 0) * depthSpacing + (nodeWidth / 2) + leftActionMargin
                a_obj.y = depth_maxY + (edge_index * vertActionSpacing)
                a_obj.color = 'grey' //"hsl(" + Math.random() * 360 + ",100%,50%)"
                a_obj.edge_index = edge_index
                // console.log(a_obj.uid, a_obj.state_uid, "->", a_obj.next_state_uid, ":", a_obj.y)
                edge_index++
            }

            let new_maxY = 0;
            if(edge_index > 0){
                new_maxY = a_obj.y
            }else{
                new_maxY = depth_maxY //+ vertActionSpacing
            }
            
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

function zoom_to_bounds(svg, zoom, zoomTransRef, bounds, duration=600) {
    const width = 350;
    const height = 450;
    const [[x0, y0], [x1, y1]] = bounds

    
    let scale_div = Math.max((x1 - x0) / width, (y1 - y0) / height)
    console.log("ZOOOOM", [x0, y0], [x1, y1], scale_div)

    let transform = d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(Math.min(8, 0.8 / scale_div))
        .translate(-(x0 + x1) / 2, -(y0 + y1) / 2)

    zoomTransRef.current = transform
    console.log(transform)

    svg.transition()
        .duration(duration)
        .call(zoom.transform, transform)//d3.pointer(event, svg.node())
      
      
      
    // );
}

// function getNodeFromID(id, nodes) {
//     for (let i = 0; i < nodes.length; i++) {
//         if (nodes[i].id == id) {
//             return nodes[i];
//         }
//     }
//     return undefined;
// }


// function getLinksWithSameTarget(sourceID, targetID, links) {
//     let result = [];
//     let index = 0;

//     while (index < links.length) {
//         let l = links[index];

//         if ((l.target.id != targetID || l.source.id != sourceID) && l.target.id == targetID) {
//             result.push(l);
//         }
//         index++;
//     }
//     return result;
// }

//things that need to do: 
//pan to the current node
//have a zoom out button 
//able to enlarge a node
//toggle the certain and uncertaim

export let Graph = ({style, graph}) => {
    console.log(graph)
    // console.log("graph beign created right now")
    // console.log(graphInput);
    const svgRef = React.useRef(null);
    const zoomTransRef = React.useRef(d3.zoomIdentity.translate(40, 200).scale(.2));

    let {start_uid, end_uid, current_uid, states, actions} = graph

    console.log("::", states, actions)
    // let graph = graphInput.graph;
    // console.log(graph)
    // const [graph, setGraph] = useState(graphInput["graph"]);
    // var start_uid = graph["startingNodeID"];
    // var end_uid = graph["endingNodeID"];
    // var current_uid = graph["current_uid"];
    // var nodes = graph["nodes"];
    // var links = graph["links"];
    // var certain = graph["certain"];
    // const [selectedEdge, setSelectedEdge] = useState("");

    

    // console.log("<<", nodes)

    // const [dragging, setDragging] = useState(false);
    // let legend = d3.select(svgRef.current)
    // .attr("class", "legend")
    // .append("svg");

    // d3.selectAll(".legend .hover").remove();

    // legend.append("circle").attr("cx",10).attr("cy",20).attr("r", 6).style("fill", "blue")
    // legend.append("text").attr("x", 30).attr("y", 20).text("Number of Children").style("font-size", "15px").attr("alignment-baseline","middle")
    // legend.append("circle").attr("cx",10).attr("cy",40).attr("r", 6).style("fill", "black")
    // legend.append("text").attr("x", 30).attr("y", 40).text("State").style("font-size", "15px").attr("alignment-baseline","middle")
    // legend.append("circle").attr("cx",10).attr("cy",100).attr("r", 6).style("fill", startNodeColor)
    // legend.append("text").attr("x", 30).attr("y", 100).text("Starting node").style("font-size", "15px").attr("alignment-baseline","middle")
    // legend.append("circle").attr("cx",10).attr("cy",80).attr("r", 6).style("fill", "purple")
    // legend.append("text").attr("x", 30).attr("y", 80).text("Current node").style("font-size", "15px").attr("alignment-baseline","middle")
    // legend.append("circle").attr("cx",10).attr("cy",60).attr("r", 6).style("fill", endNodeColor)
    // legend.append("text").attr("x", 30).attr("y", 60).text("Ending node").style("font-size", "15px").attr("alignment-baseline","middle")
    // legend.append("text").attr("x", 10).attr("y", size+2*margin.top - 200)
    //     .text(function() {return certain == true ? "Certain" : "Uncertain"}).style("fill", "black").attr("alignment-baseline","middle");
    // legend.append("text").attr("x", 10).attr("y", size+2*margin.top - 220)
    //     .text(function() {return selectedEdge}).style("fill", "black").attr("alignment-baseline","middle").attr("class", "hover");

    useEffect(() => {
        // setGraph(graphInput["graph"]);

        // let nodes = graph["nodes"]
        clear_old()

        // Zoom stuff
        let zoom = d3.zoom()
        .scaleExtent([.15, 1.6])
        let {x:zoom_x,y:zoom_y,k:zoom_scale} = zoomTransRef.current

        console.log("INITIAL", zoomTransRef.current)
        // The main svg tag
        let svg = d3.select(svgRef.current)
        .call(zoom.transform, zoomTransRef.current)

        .call(zoom.on("zoom", function(event) {
            console.log(event.transform)
            svg_g.attr("transform", event.transform);
        }))
        .attr("class", "root-svg")

            
        // The group in the svg that is moved when change zoom
        let svg_g = svg.append("g")
            // .attr("transform", zoomTransRef.current)

        // Defines filters and markers
        make_defs(svg)

        // Modify states and actions with .x, .y to layout the nodes
        layoutNodesEdges(states, actions)

        let states_arr = Object.values(states)
        let actions_arr = Object.values(actions)


        // //********************** NODE DRAWINGS ************************/
        var node = svg_g.selectAll("g.node")
            .data(states_arr, d => d.uid)
            
        var nodeEnter = node.enter()
            .append('g')
            .attr("class", "node-container")
    
        nodeEnter
            .append('path')
            .attr('class', 'node')
            .attr('d', (d) => gen_node(d))
            .attr('fill', "lightgrey")//"#E79A16"
            .attr('stroke-width', 3)//"#E79A16"
            .attr("stroke", function(d) {
                return (start_uid == d.uid && startNodeColor) ||
                       (end_uid == d.uid && endNodeColor) ||
                       (current_uid == d.uid && 'purple') ||
                       'grey'
            })
        
        nodeEnter.style("filter", function(d) {
            if (d.uid == current_uid) {
                return "drop-shadow(2px 4px 2px rgb(15, 15, 35, 0.4))"
            }else{
                return "drop-shadow(1px 2px 1px rgb(30, 30, 70, 0.3))"
            }
        })
        //     function(d) {
        //     if (d.uid == current_uid) {
        //         return "url(#drop-shadow)";
        //     }
        // });

        
        nodeEnter.append("text")
            .attr("text-anchor", "middle")
            .text((d)=>d.uid)
            // .text((d)=>d.uid.slice(3,8))

        // Transition node to position
        nodeEnter.transition()
        .attr("transform", function(d) { 
            return "translate(" + d.x + "," + d.y + ")";
            });

        //********************** LINK DRAWINGS ************************/


        // links.forEach(function(link) {
        //     link.source_obj = nodes[link.source]
        //     link.target_obj = nodes[link.target]
        //     link.id = link.source + " - " + link.target
        // });

        var edge = nodeEnter.each(function(d){
            console.log("EACH", d, this)
            let out_actions = (d?.out_skill_app_uids??[]).map((uid)=>actions[uid])
                .reverse() // Reverse so that highest utility actions tend to be on top

            let edgeSelect = d3.select(this)
                .selectAll("edges")
                .data(out_actions, (a) => `${a.skill_app_uid}`)

            let edgeEnter = edgeSelect.enter()

            // Edge : Enter 
            let edge = edgeEnter.insert('path', '.node')
                .attr("class", "edge")
                .attr("marker-end", "url(#arrow)")
                .attr('d', (a) => gen_curve(a, states, true))

            // Edge : Merge 
            edge.merge(edgeSelect)
                .attr("stroke", (a)=>a.color)
                .attr('stroke-width', function(a) {
                    if (a.state_uid == current_uid) {
                        return 10
                    }else{
                        return 8
                    }
                })

            // Edge Box: Enter 
            let edge_box =edgeEnter.append('rect')
                .attr("class", "edge-box")
                .attr("x", (a)=>a.x-states[a.state_uid].x)
                .attr("y", (a)=>a.y-states[a.state_uid].y-actionHeight/2)
                
                .attr("width", actionWidth)
                .attr("height", actionHeight)

            // Edge Box: Merge
            edge_box.merge(edgeSelect)
                .attr("stroke", (a)=>a.color)


            // Edge Text: Enter
            let edge_text = edgeEnter.append('text')
                .attr("class", "edge-text")
                .text((d)=>d?.skill_app?.inputs?.value || "??")
                .attr("font-size", 24)
                .attr("x", (a)=>a.x-states[a.state_uid].x + 6)
                .attr("y", (a)=>a.y-states[a.state_uid].y )
                .attr("alignment-baseline", "central")

            if(d.uid == 8){
                // let grp = edgeEnter._parents[0]
                let {minX, minY, maxX, maxY} = d
                setTimeout(() =>{
                    zoom_to_bounds(svg, zoom, zoomTransRef, [[minX, minY], [maxX, maxY]])
                },100)
                
            }
            // if(d.uid == 2){
            //     let {minX, minY, maxX, maxY} = d
            //     setTimeout(() =>{
            //         zoom_to_bounds(svg,zoom,zoomTransRef,[[minX, minY], [maxX, maxY]])    
            //     },1500)
            // }
        })

        // setTimeout(() =>{
        //     zoom_to_bounds(svg,zoom,zoomTransRef,[[100,100],[300,300]])    
        // },100)

        // setTimeout(() =>{
        //     zoom_to_bounds(svg,zoom,zoomTransRef,[[-100,-100],[1000,1000]])    
        // },1500)
        
            
        
        // var edgeEnter = edge.enter()    
        //     .append('g')
        //     .attr('class', "edge-container")
        

        // nodeEnter.append('path')
        //     .attr("class", "edge")
        //     .attr("marker-end", "url(#arrow)")
        //     .attr("stroke", 'grey')
        //     // .attr("stroke", ()=>"hsl(" + Math.random() * 360 + ",100%,50%)")
        //     .attr('d', (d) => gen_curve(d, states))

            

        // .attr("stroke-width", "20px")
        // .on("mouseover", function(d, i) {
        //     setSelectedEdge("Source: " + i.source + ", Target: " + i.target + ", Edge label: " + i.new);
        // })
        // .on("mouseout", function (d, i) {
        //     setSelectedEdge("");
        // })

        //merge new links with old ones
        // edgeUpdate.merge
        // var linkUpdate = linkEnter.merge(link);

        // linkUpdate.transition()
        //     .attr('d', (d) => gen_curve(d, states) )

        // var text = edge.selectAll("text.text-link")
        // .data(actions_arr, (d) => d.state_uid + " - " + d.next_state_uid)
            
        // text.enter()
        //     .insert("text", "edge-container")
        //     .attr("class", "text-link")
        //     .attr("x", (d) => {
        //         let st = states[d.state_uid]
        //         let nxt = states[d.state_uid]
        //         var x = (st.x + nxt.x) / 2
        //         return x - 20
        //     })
        //     .attr("y", function(d) {
        //         let st = states[d.state_uid]
        //         let nxt = states[d.state_uid]
        //         var y = (st.y + nxt.y) / 2 + 10
        //         return y;
        //     })
        //     .text((d) => {
        //         return "???";
        //     })
        //     .attr("text-anchor", "start")
        //     .style("font-size", fontSize);

        


        // set simulation
        // var simulation = d3.forceSimulation(nodes)
        //     .force("link", d3.forceLink(links).id(d => d.id))
        //     .force("collide", d3.forceCollide(depthRadius))
            // .force("x", d3.forceX()
            //     .x(function(d) {
            //     return size / 2;
            //     })
            //     .strength(0.2)
            // )
            // .force("y", d3.forceY()
            //     .y(function(d) {
            //     return d.y;
            //     })
            //     .strength(5)
            // );
            
        // Run the simulation once, even before rendering anything
        // simulation.tick(100)
        // .stop();

      
        
    }, [graph]);

    return <svg ref = {svgRef} style= {{...style,"border": "1px solid black"}}/>
}



    
    
    
    // //recursive function to fix the depths of the children
    // function fixChildrendepth(node, nodes) {
    //     if (node != null) {
    //         var children = getChildrenID(node.id)
    //         for (let i = 0; i < nodes.length; i++) {
    //             var n = nodes[i];
    //             if (children.includes(n.id)) {
    //                 var child = n;
    
    //                 if (child.depth <= node.depth) {
    //                     child.depth = node.depth + 1;
    //                     child.dy = child.y = child.depth * depthRadius * 2;
    //                     child.x = size / 2 - child.i * depthRadius;
    //                     fixChildrendepth(child, nodes)
    //                 }
    //             }
    //         }
    //     }
    // }
    // function getChildrenID(nodeID) {
    //   let children = [];
    
    //   for (let i = 0; i < graph["links"].length; i++) {
    //       let link = graph["links"][i];
    //       if (link.source == nodeID) {
    //           children.push(link.target);
    //       }
    //   }
    //   return children;
    // }
    
    
    
    // //TODO:: collapse is working a bit weird
    // function collapse(event, node) {
    //   let childrenID = getChildrenID(node.id);
    //   let nodes = graph["nodes"];
    
    //   for (let i = 0; i < graph["nodes"].length; i++) {
    //       if (childrenID.includes(nodes[i].id)) {
    //           collapseHelper(nodes[i], nodes, graph["links"]);
    //       }
    //   }
    // }
    
    //recursive function that collapses
    // function collapseHelper(node, nodes, links) {
    //   for (let i = 0; i < graph["nodes"].length; i++) {
    //       if (nodes[i].id == node.id) {
    //           nodes[i].show = !nodes[i].show;
    //       }
    //   }
    
    //   //look through the links
    //   for (let i = 0; i < links.length; i++) {
    //       let l = links[i];
    //       if (l.target == node.id) {
    //           l.show = !l.show;
    //       }
    //   }
    
    //   //go through the children
    //   let childrenID = getChildrenID(node.id, nodes);
    //   for (let i = 0; i < nodes.length; i++) {
    //       if (childrenID.includes(nodes[i].id)) {
    //           collapseHelper(nodes[i]);
    //       }
    //   }
    // }
    
    
    
    
    //********************** HELPER FUNCTIONS *************************/
    //finds the depth of node (what if multiple paths)
    // function finddepthOfNode(nodeID) {
    //   let depth = 0;
    //   let currentSearch = nodeID;
    
    //   while (true) {
    //   if (isNodeATarget(currentSearch)) {
    //       depth += 1;
    //       currentSearch = findParentID(currentSearch);
    //   } else {
    //       break;
    //   }
    //   }
    
    //   return depth;
    // }
    
    // //finds if node is a target in a link
    // function isNodeATarget(nodeID) {
    //   for (let i = 0; i < graph["links"].length; i++) {
    //     let link = graph["links"][i];
    //     if (link.target == nodeID) {
    //         return true;
    //     }
    //   }
    //   return false;
    // }
    
    // //finds the parent id/source of the target id in link (might need to rework)
    // function findParentID(nodeID) {
    //   for (let i = 0; i < graph["links"].length; i++) {
    //     let link = graph["links"][i];
    //     if (link.target == nodeID) {
    //         return link.source;
    //     }
    //   }
    //   return -1;
    // }
    
    // function getNumberOfChildren(nodeID) {
    //   let total = 0;
    //   for (let i = 0; i < graph["links"].length; i++) {
    //     let link = graph["links"][i];
    //     if (link.source == nodeID) {
    //         total += 1;
    //     }
    //   }
    //   return total; 
    // }

    // console.log(svgRef)

    

Graph.defaultProps = {
    graph : graph_data
}

const clear_old = () => {
  d3.selectAll(".root-svg .node-container").remove();

  //remove the earlier texts+earlier links
  // d3.selectAll(".right-tree-container path.link").remove();
  // d3.selectAll(".right-tree-container .text-link").remove();
}

const make_defs = (svg) =>{
    //create the arrows
    let defs = svg.append('defs')
    
    defs.append('marker')
    .attr("class", "arrow")
    .attr('id', 'arrow')
    .attr('viewBox', [0, -5, markerBoxWidth, markerBoxHeight])
    .attr('refX', 0)
    .attr('refY', 0)
    .attr('markerUnits', "userSpaceOnUse")
    .attr('markerWidth', 16)
    .attr('markerHeight', 16)
    .attr('orient', 'auto')
    .append('path')
        .attr('stroke', 'black')
        .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
        // .attr('stroke-width', '2px');

    var filter = defs.append("filter")
    .attr("id", "drop-shadow")
    .attr("height", "130%")
    .attr("width", "130%")

    filter.append("feGaussianBlur")
    .attr("in", "SourceAlpha")
    .attr("stdDeviation", 2)
    .attr("result", "blur")

    filter.append("feOffset")
    .attr("in", "blur")
    .attr("dx", 2)
    .attr("dy", 5)
    .attr("result", "offsetBlur");

    var feMerge = filter.append("feMerge");
        feMerge.append("feMergeNode")
            .attr("in", "offsetBlur")
        feMerge.append("feMergeNode")
            .attr("in", "SourceGraphic");
}


// export default Graph;



// export let Graph2 = ({style, graph}) => {
//     let nodes = graph.nodes;
//     console.log(nodes)
//     return (
//         <svg >
//         {nodes.map((data) => (
//             <Node data={data}/>
//         ))}
//         </svg>
//     )
// }

// Graph2.defaultProps = {
//     graph : graph_data
// }





// const Node = ({data}) =>{
//   console.log(data)
//   let r = useSpring(10)
//   // r.set(10)
//   return(
//     <circle 
//       cx = {data.depth * 20}
//       cy = {data.depth * 20}
//       r = {10}
//       color='red'
//     />
//   )
// }

// const Edge = ({from, to}) =>{

// }
