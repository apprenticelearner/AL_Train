import React, { useState, useEffect } from 'react';
import * as d3 from "d3"
import "./graph.css"
import {graph_data} from "./graph_test_data1.js"

const levelRadius = 70;
const radius = 30;
const strokeWidth = 3;
const size = 600;
const margin = {top: 20, right: 90, bottom: 30, left: 90};
const endNodeColor = "magenta"
const startNodeColor = "darkTurquoise"
const markerBoxWidth = 10;
const markerBoxHeight = 10;




//things that need to do: 
//pan to the current node
//have a zoom out button 
//able to enlarge a node
//toggle the certain and uncertaim

export let Graph = ({startNodeID, endNodeID, currentNodeID,
                nodes, links, certain}) => {
    console.log("graph beign created right now")
    // console.log(graphInput);
    const svgRef = React.useRef(null);
    // let graph = graphInput.graph;
    console.log(nodes,links)
    // const [graph, setGraph] = useState(graphInput["graph"]);
    // var startNodeID = graph["startingNodeID"];
    // var endNodeID = graph["endingNodeID"];
    // var currentNodeID = graph["currentNodeID"];
    // var nodes = graph["nodes"];
    // var certain = graph["certain"];
    const [selectedEdge, setSelectedEdge] = useState("");

    // const [dragging, setDragging] = useState(false);
    let legend = d3.select(svgRef.current)
    .attr("class", "legend")
    .append("svg");

    d3.selectAll(".legend .hover").remove();

    legend.append("circle").attr("cx",10).attr("cy",20).attr("r", 6).style("fill", "blue")
    legend.append("text").attr("x", 30).attr("y", 20).text("Number of Children").style("font-size", "15px").attr("alignment-baseline","middle")
    legend.append("circle").attr("cx",10).attr("cy",40).attr("r", 6).style("fill", "black")
    legend.append("text").attr("x", 30).attr("y", 40).text("State").style("font-size", "15px").attr("alignment-baseline","middle")
    legend.append("circle").attr("cx",10).attr("cy",100).attr("r", 6).style("fill", startNodeColor)
    legend.append("text").attr("x", 30).attr("y", 100).text("Starting node").style("font-size", "15px").attr("alignment-baseline","middle")
    legend.append("circle").attr("cx",10).attr("cy",80).attr("r", 6).style("fill", "purple")
    legend.append("text").attr("x", 30).attr("y", 80).text("Current node").style("font-size", "15px").attr("alignment-baseline","middle")
    legend.append("circle").attr("cx",10).attr("cy",60).attr("r", 6).style("fill", endNodeColor)
    legend.append("text").attr("x", 30).attr("y", 60).text("Ending node").style("font-size", "15px").attr("alignment-baseline","middle")
    legend.append("text").attr("x", 10).attr("y", size+2*margin.top - 200)
        .text(function() {return certain == true ? "Certain" : "Uncertain"}).style("fill", "black").attr("alignment-baseline","middle");
    legend.append("text").attr("x", 10).attr("y", size+2*margin.top - 220)
        .text(function() {return selectedEdge}).style("fill", "black").attr("alignment-baseline","middle").attr("class", "hover");

    useEffect(() => {
        // setGraph(graphInput["graph"]);

        let svg = d3
        .select(svgRef.current)
        .call(d3.zoom().on("zoom", function(event) {
            svg.attr("transform", event.transform);
        }))
        .append("svg")
        .attr("class", "right-tree-container")
        .attr("width", size + 2 * margin.right)
        .attr("height", size + 2 * margin.top - 90)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        //remove the texts on the nodes + the current/filters
        d3.selectAll(".right-tree-container .node").remove();
        d3.selectAll(".right-tree-container .arrow").remove();
        //remove the earlier texts+earlier links
        d3.selectAll(".right-tree-container path.link").remove();
        d3.selectAll(".right-tree-container .text-link").remove();
        //remove the legend
        d3.selectAll(".right-tree-container .legend").remove();

        // nodes = graph.nodes;
        // startNodeID = graph.startingNodeID;
        // endNodeID = graph.endingNodeID;
        // currentNodeID = graph.currentNodeID;

        //set positions of nodes
        nodes.forEach(function(d, i) {
            d.level = findLevelOfNode(d.id) + 1;
            d.i = i;
            d.dy = d.y = d.level * levelRadius * 2;
            d.x = size / 2 - i * levelRadius;
        });

        //fixing the back thing
        nodes.forEach(function(d, i) {
            fixChildrenLevel(d, nodes);
            d.show = true;
        });

        //set links as objects
        var links = [];
        links.forEach(function(link) {
            links.push({
                id: link.source + " - " + link.target,
                source: link.source,
                target: link.target,
                skill: link.skill,
                new: link.new,
                show: true,
                correct: link.correct
            });
        });

        //set simulation
        var simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.id))
            .force("collide", d3.forceCollide(levelRadius))
            .force("x", d3.forceX()
                .x(function(d) {
                return size / 2;
                })
                .strength(0.2)
            )
            .force("y", d3.forceY()
                .y(function(d) {
                return d.dy;
                })
                .strength(5)
            );


        //create the arrows
        svg.append('defs')
            .append('marker')
            .attr("class", "arrow")
            .attr('id', 'arrow')
            .attr('viewBox', [0, -5, markerBoxWidth, markerBoxHeight])
            .attr('refX', 0)
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto-start-reverse')
            .append('path')
                .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
                .attr('stroke', 'black');

        // Run the simulation once, even before rendering anything
        simulation.tick(100)
        .stop();

        //********************** LINK DRAWINGS ************************/
        var edge = svg
        .selectAll("edges")
        .attr('class', "edge-container")
        .append('g')
        .data(links)
        .enter()

        var link = svg.selectAll("path.link")
            .data(links);

        //set diagonal + hover effecg
        var linkEnter = link.enter().insert('path', "g")
        .attr("class", "link")
        .attr('display', function(d) {
            if (!d.target.show) {
                return "none";
            }
            return "block";
        })
        .attr("marker-end", "url(#arrow)")
        .attr("stroke", function(d) {
            if (certain) {
                return "black";
            } else {
                if (d.correct) {
                    return "green";
                } else {
                    return "grey";
                }
            }
        })
        .attr('d', function(d){
            return diagonal(d.source, d.target, links)
        })
        .on("mouseover", function(d, i) {
            setSelectedEdge("Source: " + i.source.id + ", Target: " + i.target.id + ", Edge label: " + i.new);
        })
        .on("mouseout", function (d, i) {
            setSelectedEdge("");
        })

        var text = edge.selectAll("text.text-link")
        .data(links, function(d) {
            return d.source + " - " + d.target;
        });

        text.enter().insert("text", "edge-container")
            .attr("class", "text-link")
            .attr("x", function(d) {
                var x = (d.source.y + d.target.y) / 2
                return parseInt(x - 20);
            })
            .attr("y", function(d) {
                var y = (d.source.x + d.target.x) / 2 + 10
                return y;
            })
            .text(function(d) {
                return d.new;
            })
            .attr("text-anchor", "start")
            .style("font-size", "12px");


        //merge new links with old ones
        var linkUpdate = linkEnter.merge(link);

        linkUpdate.transition()
            .attr('d', function(d){ 
                return diagonal(d.source, d.target, links) 
        });




      
        // //********************** NODE DRAWINGS ************************/
        var node = svg.selectAll("g.node")
            .data(nodes, function(d) {
                return d.id;
            });
            
        var nodeEnter = node.enter()
            .append('g')
            .attr("class", "node")
            .attr("transform", function(d) {
                // Use d.dy to snap the node to the level that we want it at
                return "translate(" + [d.dy, d.x] + ")";
            })
            .attr("translate", function(d) {
                let currentNode = getNodeFromID(currentNodeID, nodes);
                return "translate(" + [currentNode.y, currentNode.x] + ")";
            })
            .on("click", collapse);
    
        nodeEnter.append("circle")
            .attr("r", radius)
            .style("stroke", function(d) {
                let id = +d.id
                if (startNodeID == id) return startNodeColor;
                else if (endNodeID == id) return endNodeColor;
                else if (id == currentNodeID) return "purple";
                else return "black";
            })
            .style("display", function(d) {
                if (d.show) {
                    return "block";
                }
                return "none";
            });

        function isInList(list, element) {
            for (let i = 0; i < list.length; i++) {
                if (list[i] == element) {
                    return true;
                }
            }
            return false
        }

        //drop shadow
        var defs = svg.append("defs");

        var filter = defs.append("filter")
            .attr("id", "drop-shadow")
            .attr("height", "130%");
        filter.append("feGaussianBlur")
            .attr("in", "SourceAlpha")
            .attr("stdDeviation", 5)
            .attr("result", "blur");
        filter.append("feOffset")
            .attr("in", "blur")
            .attr("dx", 5)
            .attr("dy", 5)
            .attr("result", "offsetBlur");

        var feMerge = filter.append("feMerge");
        feMerge.append("feMergeNode")
            .attr("in", "offsetBlur")
        feMerge.append("feMergeNode")
            .attr("in", "SourceGraphic");

        nodeEnter.style("filter", function(d) {
            if (d.id == currentNodeID && d.show) {
                return "url(#drop-shadow)";
            }
        });

        
        nodeEnter.append("text")
            .attr("text-anchor", "middle")
            .text(function(d) {if (d.show) {return d.name}})


        nodeEnter.append("text")
            .attr("text-anchor", "middle")
            .attr("dy", 15)
            .attr("stroke", "blue")
            .text(function(d) {if (d.show) {return getNumberOfChildren(d.id)}});
        
        nodeEnter.append("text")
            .attr("dominant-baseline", "middle")
            .attr("dx", radius + strokeWidth)
            .text(function(d) {return d.child;});

        var nodeUpdate = nodeEnter.merge(node);

        // Transition to the proper position for the node
        nodeUpdate.transition()
        .attr("transform", function(d) { 
            return "translate(" + d.y + "," + d.x + ")";
            });

        // Store the old positions for transition.
        nodes.forEach(function(d){
            d.x0 = d.x;
            d.y0 = d.y;
        });
    }, [nodes, links]);



    function diagonal(s, d, links) {
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
          
        let path = `M ${s.y} ${s.x}
                C ${(s.y + d.y) / 2} ${s.x},
                    ${(s.y + d.y) / 2.5} ${d.x},
                    ${d.y - (radius + 3 * strokeWidth)} ${sourceYOffset}`
        
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
    
    
    //recursive function to fix the levels of the children
    function fixChildrenLevel(node, nodes) {
        if (node != null) {
            var children = getChildrenID(node.id)
            for (let i = 0; i < nodes.length; i++) {
                var n = nodes[i];
                if (children.includes(n.id)) {
                    var child = n;
    
                    if (child.level <= node.level) {
                        child.level = node.level + 1;
                        child.dy = child.y = child.level * levelRadius * 2;
                        child.x = size / 2 - child.i * levelRadius;
                        fixChildrenLevel(child, nodes)
                    }
                }
            }
        }
    }
    function getChildrenID(nodeID) {
      let children = [];
    
      for (let i = 0; i < links.length; i++) {
          let link = links[i];
          if (link.source == nodeID) {
              children.push(link.target);
          }
      }
      return children;
    }
    
    
    
    //TODO:: collapse is working a bit weird
    function collapse(event, node) {
      let childrenID = getChildrenID(node.id);
      let nodes = nodes;
    
      for (let i = 0; i < nodes.length; i++) {
          if (childrenID.includes(nodes[i].id)) {
              collapseHelper(nodes[i], nodes, links);
          }
      }
    }
    
    //recursive function that collapses
    function collapseHelper(node, nodes, links) {
      for (let i = 0; i < nodes.length; i++) {
          if (nodes[i].id == node.id) {
              nodes[i].show = !nodes[i].show;
          }
      }
    
      //look through the links
      for (let i = 0; i < links.length; i++) {
          let l = links[i];
          if (l.target == node.id) {
              l.show = !l.show;
          }
      }
    
      //go through the children
      let childrenID = getChildrenID(node.id, nodes);
      for (let i = 0; i < nodes.length; i++) {
          if (childrenID.includes(nodes[i].id)) {
              collapseHelper(nodes[i]);
          }
      }
    }
    
    
    
    
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
      for (let i = 0; i < links.length; i++) {
        let link = links[i];
        if (link.target == nodeID) {
            return true;
        }
      }
      return false;
    }
    
    //finds the parent id/source of the target id in link (might need to rework)
    function findParentID(nodeID) {
      for (let i = 0; i < links.length; i++) {
        let link = links[i];
        if (link.target == nodeID) {
            return link.source;
        }
      }
      return -1;
    }
    
    function getNumberOfChildren(nodeID) {
      let total = 0;
      for (let i = 0; i < links.length; i++) {
        let link = links[i];
        if (link.source == nodeID) {
            total += 1;
        }
      }
      return total; 
    }

    return <svg ref = {svgRef} width={(size + 2 * margin.right + 200)} height={size + 2 * margin.top - 190} style= {{"border": "1px solid black"}}/>
}

Graph.defaultProps = {
    ...graph_data
}

// export default Graph;
