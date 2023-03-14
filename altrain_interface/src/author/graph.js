import React, { useState, useEffect } from 'react';
import * as d3 from "d3"
import "./graph.css"
import {graph_data} from "./graph_test_data1.js"
import { animated, motion, useMotionValue, useSpring, useScroll } from "framer-motion";

const nodeSpacing = 20;
const levelSpacing = 70;
const nodeRadius = 26;
const arrowOffset = 4;
const fontSize = 8;
const size = 600;
const margin = {top: 20, right: 90, bottom: 30, left: 90};
const endNodeColor = "magenta"
const startNodeColor = "darkTurquoise"
const markerBoxWidth = 12;
const markerBoxHeight = 10;



const states = {
  "0" : {
    id: '0',
    actions : [
      {next_state_id : "1", "selection" : "A", "input" : "7"},
      {next_state_id : "2", "selection" : "B", "input" : "9"},
    ],
    is_start : true
  },
  "1" : {
    id: '1',
    actions : [
      {next_state_id : "3", "selection" : "B", "input" : "9"},
      {next_state_id : "11", "selection" : "Q", "input" : "8"},
      {next_state_id : "12", "selection" : "Q", "input" : "6"},
    ]
  },
  "11" : {
    id : "11"
  },
  "12" : {
    id : "12"
  },
  "2" : {
    id: '2',
    actions : [
      {next_state_id : "3", "selection" : "A", "input" : "7"},
    ]
  },
  "3" : {
    id: '3',
    actions : [
      {next_state_id : "4", "selection" : "C", "input" : "4"},
    ]
  },
  "4" : {
    id: '4',
    actions : [
      {next_state_id : "done", "selection" : "done", "input" : "-1"},
    ]
  }
}


let recurseFillNodesLinks = (state, states, nodes, links, visited, level=0)=>{
  console.log("<<", state)
  let out_degree = state.actions?.length ?? 0
  let node = {id: state.id, out_degree: out_degree, level:level}
  visited[node.id] = true
  nodes.push(node)
  let span = 0

  for(let action of (state.actions||[]) ){
    let next_state = states[action.next_state_id]
    if(next_state && !(action.next_state_id in visited)){
      let a_node = recurseFillNodesLinks(
        next_state, states, nodes, links, visited, level+1)
      span += a_node.span
      links.push({
        id: `${node.id}->${a_node.id}`,
        source:node,
        target:a_node,
      })  
    }
  }
  node.span = span || 1
  return node
}

let statesToNodesLinks = (states) =>{
  let start_state = Object.entries(states).filter(([k,v])=>v?.is_start)[0][1]
  
  let [nodes,links] = [[],[]]
  recurseFillNodesLinks(start_state, states, nodes, links, {})
  console.log(nodes,links)
}

console.log(statesToNodesLinks(states))

//things that need to do: 
//pan to the current node
//have a zoom out button 
//able to enlarge a node
//toggle the certain and uncertaim

export let Graph = ({style, graph}) => {
    // console.log("graph beign created right now")
    // console.log(graphInput);
    const svgRef = React.useRef(null);
    // let graph = graphInput.graph;
    // console.log(graph)
    // const [graph, setGraph] = useState(graphInput["graph"]);
    var startNodeID = graph["startingNodeID"];
    var endNodeID = graph["endingNodeID"];
    var currentNodeID = graph["currentNodeID"];
    var nodes = graph["nodes"];
    var links = graph["links"];
    var certain = graph["certain"];
    const [selectedEdge, setSelectedEdge] = useState("");

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

        let zoom = d3.zoom();
        let [zoom_x,zoom_y,zoom_scale] = [50,-40, .7]

        let svg = d3
        .select(svgRef.current)
        .call(zoom.transform, d3.zoomIdentity.translate(zoom_x, zoom_y).scale(zoom_scale))
        .call(zoom.on("zoom", function(event) {
            svg.attr("transform", event.transform);
        }))
        .append("svg")
        .attr("class", "right-tree-container")
        .append("g")
        .attr('transform', `translate(${zoom_x}, ${zoom_y})scale(${zoom_scale})`);
        //remove the texts on the nodes + the current/filters

        //Define filters and markers
        make_defs(svg)


        //set positions of nodes
        nodes.forEach(function(d, i) {
            
            // d.level = findLevelOfNode(d.id) + 1;
            d.i = i;
            d.x = d.level_index * (nodeRadius*2 + nodeSpacing);
            d.y = d.level * (nodeRadius*2 + levelSpacing);
            // console.log({...d}, i)
        });
        // console.log(nodes)

        // //fixing the back thing
        // nodes.forEach(function(d, i) {
        //     fixChildrenLevel(d, nodes);
        //     d.show = true;
        // });

       



        // //********************** NODE DRAWINGS ************************/
        var node = svg.selectAll("g.node")
            .data(nodes)
            
        var nodeEnter = node.enter()
            .append('g')
            .attr("class", "node")
            
            // .on("click", collapse);
    
        nodeEnter.append("circle")
            .attr("r", nodeRadius)
            .style("stroke", function(d) {
                let id = +d.id
                if (startNodeID == id) return startNodeColor;
                else if (endNodeID == id) return endNodeColor;
                else if (id == currentNodeID) return "purple";
                else return "black";
            })
        
        nodeEnter.style("filter", function(d) {
            if (d.id == currentNodeID) {
                return "url(#drop-shadow)";
            }
        });

        
        nodeEnter.append("text")
            .attr("text-anchor", "middle")
            .text((d)=>d.name)

        // Transition to the proper position for the node
        nodeEnter.transition()
        .attr("transform", function(d) { 
            return "translate(" + d.x + "," + d.y + ")";
            });

        //********************** LINK DRAWINGS ************************/
                 //set links as objects
        // var links = [];
        links.forEach(function(link) {
            link.source_obj = nodes[link.source]
            link.target_obj = nodes[link.target]
            link.id = link.source + " - " + link.target
        });

        var edge = svg
        .selectAll("edges")
        .attr('class', "edge-container")
        .append('g')
        .data(links)
        .enter()

        var link = svg.selectAll("path.link")
            .data(links);

        //set gen_curve + hover effecg
        var linkEnter = link.enter().insert('path', "g")
        .attr("class", "link")
        // .attr('display', function(d) {
        //     if (!d.target.show) {
        //         return "none";
        //     }
        //     return "block";
        // })
        .attr("marker-end", "url(#arrow)")
        
        // .attr("stroke-opacity", .2)
        .attr("stroke", "grey")
        
        .attr('d', function(d){
            // console.log("gen_curve", gen_curve(d.source_obj, d.target_obj, links))
            return gen_curve(d.source_obj, d.target_obj, links)
        })
        // .attr("stroke-width", "20px")
        // .on("mouseover", function(d, i) {
        //     setSelectedEdge("Source: " + i.source + ", Target: " + i.target + ", Edge label: " + i.new);
        // })
        // .on("mouseout", function (d, i) {
        //     setSelectedEdge("");
        // })

        //merge new links with old ones
        var linkUpdate = linkEnter.merge(link);

        linkUpdate.transition()
            .attr('d', function(d){ 
                return gen_curve(d.source_obj, d.target_obj, links) 

            })

        var text = edge.selectAll("text.text-link")
        .data(links, function(d) {
            return d.source + " - " + d.target;
        });

        text.enter().insert("text", "edge-container")
            .attr("class", "text-link")
            .attr("x", function(d) {
                var x = (d.source_obj.x + d.target_obj.x) / 2
                return x - 20
            })
            .attr("y", function(d) {
                var y = (d.source_obj.y + d.target_obj.y) / 2 + 10
                return y;
            })
            .text(function(d) {
                return d.new;
            })
            .attr("text-anchor", "start")
            .style("font-size", fontSize);

        


        // set simulation
        // var simulation = d3.forceSimulation(nodes)
        //     .force("link", d3.forceLink(links).id(d => d.id))
        //     .force("collide", d3.forceCollide(levelRadius))
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



    function gen_curve(s, d, links) {
        // console.log(s,d,links)
        var dx = d.x - s.x, 
            dy = d.y - s.y, 
            dr = Math.sqrt(dx * dx + dy * dy);
        
        let linksWithSameTarget = getLinksWithSameTarget(s.id, d.id, links);
        let sourceYOffset = d.x;

        let countOfLinksHigher = 0;
        for (let i = 0; i < linksWithSameTarget.length; i++) {
            let currentSource = getNodeFromID(linksWithSameTarget[i].source.id, nodes);
            if ((currentSource.x < s.x) || (currentSource.x == s.x && currentSource.y > s.y)) {
                countOfLinksHigher++;
            }
        }

        if (linksWithSameTarget != 0) {
            sourceYOffset += (countOfLinksHigher * 5 - 5);
        }
          
        let path = `M ${s.x} ${s.y}
                C  ${s.x} ${(s.y + d.y) / 2},
                   ${d.x} ${(s.y + d.y) / 2.2},
                   ${sourceYOffset} ${d.y - (nodeRadius + 3 * arrowOffset)}`
        
        return path;
    }

    function getNodeFromID(id, nodes) {
        for (let i = 0; i < nodes.length; i++) {
            if (nodes[i].id == id) {
                return nodes[i];
            }
        }
        return undefined;
    }
    
    
    function getLinksWithSameTarget(sourceID, targetID, links) {
        let result = [];
        let index = 0;
    
        while (index < links.length) {
            let l = links[index];
    
            if ((l.target.id != targetID || l.source.id != sourceID) && l.target.id == targetID) {
                result.push(l);
            }
            index++;
        }
        return result;
    }
    
    
    // //recursive function to fix the levels of the children
    // function fixChildrenLevel(node, nodes) {
    //     if (node != null) {
    //         var children = getChildrenID(node.id)
    //         for (let i = 0; i < nodes.length; i++) {
    //             var n = nodes[i];
    //             if (children.includes(n.id)) {
    //                 var child = n;
    
    //                 if (child.level <= node.level) {
    //                     child.level = node.level + 1;
    //                     child.dy = child.y = child.level * levelRadius * 2;
    //                     child.x = size / 2 - child.i * levelRadius;
    //                     fixChildrenLevel(child, nodes)
    //                 }
    //             }
    //         }
    //     }
    // }
    function getChildrenID(nodeID) {
      let children = [];
    
      for (let i = 0; i < graph["links"].length; i++) {
          let link = graph["links"][i];
          if (link.source == nodeID) {
              children.push(link.target);
          }
      }
      return children;
    }
    
    
    
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
    //finds the level of node (what if multiple paths)
    function findLevelOfNode(nodeID) {
      let level = 0;
      let currentSearch = nodeID;
    
      while (true) {
      if (isNodeATarget(currentSearch)) {
          level += 1;
          currentSearch = findParentID(currentSearch);
      } else {
          break;
      }
      }
    
      return level;
    }
    
    //finds if node is a target in a link
    function isNodeATarget(nodeID) {
      for (let i = 0; i < graph["links"].length; i++) {
        let link = graph["links"][i];
        if (link.target == nodeID) {
            return true;
        }
      }
      return false;
    }
    
    //finds the parent id/source of the target id in link (might need to rework)
    function findParentID(nodeID) {
      for (let i = 0; i < graph["links"].length; i++) {
        let link = graph["links"][i];
        if (link.target == nodeID) {
            return link.source;
        }
      }
      return -1;
    }
    
    function getNumberOfChildren(nodeID) {
      let total = 0;
      for (let i = 0; i < graph["links"].length; i++) {
        let link = graph["links"][i];
        if (link.source == nodeID) {
            total += 1;
        }
      }
      return total; 
    }

    console.log(svgRef)

    return <svg ref = {svgRef} style= {{...style,"border": "1px solid black"}}/>
}

Graph.defaultProps = {
    graph : graph_data
}

const clear_old = () => {
  d3.selectAll(".right-tree-container .node").remove();
  d3.selectAll(".right-tree-container .arrow").remove();

  //remove the earlier texts+earlier links
  d3.selectAll(".right-tree-container path.link").remove();
  d3.selectAll(".right-tree-container .text-link").remove();
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
//       cx = {data.level * 20}
//       cy = {data.level * 20}
//       r = {10}
//       color='red'
//     />
//   )
// }

// const Edge = ({from, to}) =>{

// }
