
export let graph_data = {
    "certain": false,
    "nextID": 19,
    "startNodeID": 0,
    "endNodeID": -1,
    "currentNodeID": 1,
    "nodes": [
    {
        "i": 0,
        "id": 0,
        "name": "State 0",
        "level": 1,
        "level_index" : 0,
    },
    {
        "i": 1,
        "id": 1,
        "name": "State 1",
        "level": 2,
        "level_index" : 0,
    },
    {
        "i": 2,
        "id": 2,
        "name": "State 2",
        "level": 3,
        "level_index" : 0,
    },
    {
        "i": 3,
        "id": 3,
        "name": "State 3",
        "level": 4,
        "level_index" : 0,
    },
    {
        "i": 4,
        "id": 4,
        "name": "State 4",
        "level": 5,
        "level_index" : 0,
    },
    {
        "i": 5,
        "id": 5,
        "name": "State 5",
        "level": 6,
        "level_index" : 0,
    },
    {
        "i": 6,
        "id": 6,
        "name": "State 6",
        "level": 7,
        "level_index" : 0,
    },
    {
        "i": 7,
        "id": 7,
        "name": "State 7",
        "level": 8,
        "level_index" : 0,
    },
    {
        "i": 8,
        "id": 8,
        "name": "State 8",
        "level": 2,
        "level_index" : 1,
    },
    {
        "i": 9,
        "id": 9,
        "name": "State 9",
        "level": 2,
        "level_index" : 2,
    },
    {
        "i": 10,
        "id": 10,
        "name": "State 10",
        "level": 2,
        "level_index" : 3,
    },
    {
        "i": 11,
        "id": 11,
        "name": "State 11",
        "level": 3,
        "level_index" : 1,
    },
    {
        "i": 12,
        "id": 12,
        "name": "State 12",
        "level": 3,
        "level_index" : 2,
    },
    {
        "i": 13,
        "id": 13,
        "name": "State 13",
        "level": 3,
        "level_index" : 3,
    },
    {
        "i": 14,
        "id": 14,
        "name": "State 14",
        "level": 3,
        "level_index" : 4,
    },
    {
        "i": 15,
        "id": 15,
        "name": "State 15",
        "level": 3,
        "level_index" : 5,
    },
    {
        "i": 16,
        "id": 16,
        "name": "State 16",
        "level": 3,
        "level_index" : 6,
    },
    {
        "i": 17,
        "id": 17,
        "name": "State 17",
        "level": 3,
        "level_index" : 7,
    },
    {
        "i": 18,
        "id": 18,
        "name": "State 18",
        "level": 3,
        "level_index" : 8,
    }
],
    "links": [
        {
            "source": 0,
            "target": 1,
            "skill": "",
            "correct": true,
            "new": "out1: 4"
        },
        {
            "source": 1,
            "target": 2,
            "skill": "",
            "correct": true,
            "new": "carry1: 1"
        },
        {
            "source": 2,
            "target": 3,
            "skill": "",
            "correct": true,
            "new": "out2: 5"
        },
        {
            "source": 3,
            "target": 4,
            "skill": "",
            "correct": true,
            "new": "carry2: 1"
        },
        {
            "source": 4,
            "target": 5,
            "skill": "",
            "correct": true,
            "new": "out3: 5"
        },
        {
            "source": 5,
            "target": 6,
            "skill": "",
            "correct": true,
            "new": "carry3: 1"
        },
        {
            "source": 6,
            "target": 7,
            "skill": "",
            "correct": true,
            "new": "out4: 1"
        },
        {
            "source": 0,
            "target": 8,
            "skill": "",
            "correct": false,
            "new": "carry2: 1"
        },
        {
            "source": 0,
            "target": 9,
            "skill": "",
            "correct": false,
            "new": "carry1: 1"
        },
        {
            "source": 0,
            "target": 10,
            "skill": "",
            "correct": false,
            "new": "done: -1"
        },
        {
            "source": 8,
            "target": 11,
            "skill": "",
            "correct": false,
            "new": "out3: 5"
        },
        {
            "source": 8,
            "target": 12,
            "skill": "",
            "correct": false,
            "new": "carry3: 1"
        },
        {
            "source": 8,
            "target": 13,
            "skill": "",
            "correct": false,
            "new": "out1: 4"
        },
        {
            "source": 8,
            "target": 14,
            "skill": "",
            "correct": false,
            "new": "done: -1"
        },
        {
            "source": 9,
            "target": 15,
            "skill": "",
            "correct": false,
            "new": "out2: 5"
        },
        {
            "source": 9,
            "target": 16,
            "skill": "",
            "correct": false,
            "new": "carry2: 1"
        },
        {
            "source": 9,
            "target": 2,
            "skill": "",
            "correct": false,
            "new": "out1: 4"
        },
        {
            "source": 9,
            "target": 17,
            "skill": "",
            "correct": false,
            "new": "done: -1"
        },
        {
            "source": 8,
            "target": 2,
            "skill": "",
            "correct": false,
            "new": "out1: 4"
        },
        {
            "source": 8,
            "target": 18,
            "skill": "",
            "correct": false,
            "new": "out1: 4"
        },
        {
            "source": 1,
            "target": 13,
            "skill": "",
            "correct": false,
            "new": "carry2: 1"
        },
        {
            "source": 1,
            "target": 18,
            "skill": "",
            "correct": false,
            "new": "done: -1"
        }
    ]
}


let nodes = [...graph_data.nodes].map((node) =>{
  return {i: node.i, id: node.id, name: node.name, level: node.level}
})
// for(let node of nodes){
//   delete node.data;
//   delete node.dy;
//   delete node.dx;
//   delete node.index;
//   delete node.show;
//   delete node.vx;
//   delete node.vy;
//   delete node.x;
//   delete node.y;
//   delete node.x0;
//   delete node.y0;
// }
console.log(nodes)
// alert("HI")


