
export let graph_data = {
    "certain": false,
    "start_uid": 0,
    "end_uid": -1,
    "current_uid": 8,
    "states": {
        0 : {
            "uid": 0,
            "name": "State 0",
            "depth": 1,
            "depth_index" : 0,
            "out_skill_app_uids" : ['A0', 'A7', 'A8', 'A9'],
        },
        1 : {
            "uid": 1,
            "name": "State 1",
            "depth": 2,
            "depth_index" : 0,
            "out_skill_app_uids" : ['A1', 'A19', 'A20'],
            "in_skill_app_uids" : ['A0'],
        },
        2 : {
            "uid": 2,
            "name": "State 2",
            "depth": 3,
            "depth_index" : 0,
            "out_skill_app_uids" : ['A2'],
            "in_skill_app_uids" : ['A1', 'A16', 'A18'],
        },
        3 : {
            "uid": 3,
            "name": "State 3",
            "depth": 4,
            "depth_index" : 0,
            "out_skill_app_uids" : ['A3'],
            "in_skill_app_uids" : ['A2'],
        },
        4 : {
            "uid": 4,
            "name": "State 4",
            "depth": 5,
            "depth_index" : 0,
            "out_skill_app_uids" : ['A4'],
            "in_skill_app_uids" : ['A3'],
        },
        5 : {
            "uid": 5,
            "name": "State 5",
            "depth": 6,
            "depth_index" : 0,
            "out_skill_app_uids" : ['A5'],
            "in_skill_app_uids" : ['A4'],
        },
        6 : {
            "uid": 6,
            "name": "State 6",
            "depth": 7,
            "depth_index" : 0,
            "out_skill_app_uids" : ['A6'],
            "in_skill_app_uids" : ['A5'],
        },
        7 : {
            "uid": 7,
            "name": "State 7",
            "depth": 8,
            "depth_index" : 0,
            "in_skill_app_uids" : ['A6'],
        },
        8 : {
            "uid": 8,
            "name": "State 8",
            "depth": 2,
            "depth_index" : 1,
            "out_skill_app_uids" : ['A10', 'A11', 'A12', 'A13', 'A18'],
            "in_skill_app_uids" : ['A7'],
        },
        9 : {
            "uid": 9,
            "name": "State 9",
            "depth": 2,
            "depth_index" : 2,
            "out_skill_app_uids" : ['A14', 'A15', 'A16', 'A17'],
            "in_skill_app_uids" : ['A8'],
        },
        10 : {
            "uid": 10,
            "name": "State 10",
            "depth": 2,
            "depth_index" : 3,
            "in_skill_app_uids" : ['A9'],
        },
        11 : {
            "uid": 11,
            "name": "State 11",
            "depth": 3,
            "depth_index" : 1,
            "in_skill_app_uids" : ['A10'],
        },
        12 : {
            "uid": 12,
            "name": "State 12",
            "depth": 3,
            "depth_index" : 2,
            "in_skill_app_uids" : ['A11'],
        },
        13 : {
            "uid": 13,
            "name": "State 13",
            "depth": 3,
            "depth_index" : 3,
            "in_skill_app_uids" : ['A12', 'A19'],
        },
        14 : {
            "uid": 14,
            "name": "State 14",
            "depth": 3,
            "depth_index" : 4,
            "in_skill_app_uids" : ['A13'],
        },
        15 : {
            "uid": 15,
            "name": "State 15",
            "depth": 3,
            "depth_index" : 5,
            "in_skill_app_uids" : ['A14'],
        },
        16 : {
            "uid": 16,
            "name": "State 16",
            "depth": 3,
            "depth_index" : 6,
            "in_skill_app_uids" : ['A15'],
        },
        17 : {
            "uid": 17,
            "name": "State 17",
            "depth": 3,
            "depth_index" : 7,
            "in_skill_app_uids" : ['A17'],
        },
        18 : {
            "uid": 18,
            "name": "State 18",
            "depth": 3,
            "depth_index" : 8,
            "in_skill_app_uids" : ['A20'],
        }
    },
    "actions": {
        A0 : {
            "uid": "A0",
            "state_uid": 0,
            "next_state_uid": 1,
            "skill": "",
            "correct": true,
            "skill_app" : { "selection" : "out1", "action_type" : "UpdateTextField", "inputs" : {"value" : "4"},
                            "reward" : 1, is_demo : true}
        },
        A1 : {
            "uid": "A1",
            "state_uid": 1,
            "next_state_uid": 2,
            "skill": "",
            "correct": true,
            "skill_app" : { "selection" : "carry1", "action_type" : "UpdateTextField", "inputs" : {"value" : "1"},
                            "reward" : -1}
        },
        A2 : {
            "uid": "A2",
            "state_uid": 2,
            "next_state_uid": 3,
            "skill": "",
            "correct": true,
            "skill_app" : { "selection" : "out2", "action_type" : "UpdateTextField", "inputs" : {"value" : "5"},
                            "reward" : 0}
        },
        A3 : {
            "uid": "A3",
            "state_uid": 3,
            "next_state_uid": 4,
            "skill": "",
            "correct": true,
            "skill_app" : { "selection" : "carry2", "action_type" : "UpdateTextField", "inputs" : {"value" : "1"},
                            "reward" : 0}
        },
        A4 : {
            "uid": "A4",
            "state_uid": 4,
            "next_state_uid": 5,
            "skill": "",
            "correct": true,
            "skill_app" : { "selection" : "out3", "action_type" : "UpdateTextField", "inputs" : {"value" : "5"},
                            "reward" : 0}
        },
        A5 : {
            "uid": "A5",
            "state_uid": 5,
            "next_state_uid": 6,
            "skill": "",
            "correct": true,
            "skill_app" : { "selection" : "carry3", "action_type" : "UpdateTextField", "inputs" : {"value" : "1"},
                            "reward" : 0}
        },
        A6 : {
            "uid": "A6",
            "state_uid": 6,
            "next_state_uid": 7,
            "skill": "",
            "correct": true,
            "skill_app" : { "selection" : "out4", "action_type" : "UpdateTextField", "inputs" : {"value" : "1"},
                            "reward" : 0}
        },
        A7 : {
            "uid": "A7",
            "state_uid": 0,
            "next_state_uid": 8,
            "skill": "",
            "correct": false,
            "skill_app" : { "selection" : "carry2", "action_type" : "UpdateTextField", "inputs" : {"value" : "1"},
                            "reward" : 1}
        },
        A8 : {
            "uid": "A8",
            "state_uid": 0,
            "next_state_uid": 9,
            "skill": "",
            "correct": false,
            "skill_app" : { "selection" : "carry1", "action_type" : "UpdateTextField", "inputs" : {"value" : "1"},
                            "reward" : 0}
        },
        A9 : {
            "uid": "A9",
            "state_uid": 0,
            "next_state_uid": 10,
            "skill": "",
            "correct": false,
            "skill_app" : { "selection" : "done", "action_type" : "UpdateTextField", "inputs" : {"value" : "-1"},
                            "reward" : 0}
        },
        A10 : {
            "uid": "A10",
            "state_uid": 8,
            "next_state_uid": 11,
            "skill": "",
            "correct": false,
            "skill_app" : { "selection" : "out3", "action_type" : "UpdateTextField", "inputs" : {"value" : "5"},
                            "reward" : 1}
        },
        A11 : {
            "uid": "A11",
            "state_uid": 8,
            "next_state_uid": 12,
            "skill": "",
            "correct": false,
            "skill_app" : { "selection" : "carry3", "action_type" : "UpdateTextField", "inputs" : {"value" : "1"},
                            "reward" : 0}
        },
        A12 : {
            "uid": "A12",
            "state_uid": 8,
            "next_state_uid": 13,
            "skill": "",
            "correct": false,
            "skill_app" : { "selection" : "out1", "action_type" : "UpdateTextField", "inputs" : {"value" : "4"},
                            "reward" : 0}
        },
        A13 : {
            "uid": "A13",
            "state_uid": 8,
            "next_state_uid": 14,
            "skill": "",
            "correct": false,
            "skill_app" : { "selection" : "done", "action_type" : "UpdateTextField", "inputs" : {"value" : "-1"},
                            "reward" : 0}
        },
        A14 : {
            "uid": "A14",
            "state_uid": 9,
            "next_state_uid": 15,
            "skill": "",
            "correct": false,
            "skill_app" : { "selection" : "out2", "action_type" : "UpdateTextField", "inputs" : {"value" : "5"},
                            "reward" : 0}
        },
        A15 : {
            "uid": "A15",
            "state_uid": 9,
            "next_state_uid": 16,
            "skill": "",
            "correct": false,
            "skill_app" : { "selection" : "carry2", "action_type" : "UpdateTextField", "inputs" : {"value" : "1"},
                            "reward" : 0}
        },
        A16 : {
            "uid": "A16",
            "state_uid": 9,
            "next_state_uid": 2,
            "skill": "",
            "correct": false,
            "skill_app" : { "selection" : "out1", "action_type" : "UpdateTextField", "inputs" : {"value" : "4"},
                            "reward" : 0}
        },
        A17 : {
            "uid": "A17",
            "state_uid": 9,
            "next_state_uid": 17,
            "skill": "",
            "correct": false,
            "skill_app" : { "selection" : "done", "action_type" : "UpdateTextField", "inputs" : {"value" : "-1"},
                            "reward" : 0}
        },
        A18 : {
            "uid": "A18",
            "state_uid": 8,
            "next_state_uid": 2,
            "skill": "",
            "correct": false,
            "skill_app" : { "selection" : "out1", "action_type" : "UpdateTextField", "inputs" : {"value" : "4"},
                            "reward" : 0}
        },
        A19 : {
            "uid": "A19",
            "state_uid": 8,
            "next_state_uid": 18,
            "skill": "",
            "correct": false,
            "skill_app" : { "selection" : "out1", "action_type" : "UpdateTextField", "inputs" : {"value" : "4"},
                            "reward" : 0}
        },
        A19 : {
            "uid": "A19",
            "state_uid": 1,
            "next_state_uid": 13,
            "skill": "",
            "correct": false,
            "skill_app" : { "selection" : "carry2", "action_type" : "UpdateTextField", "inputs" : {"value" : "1"},
                            "reward" : 0}
        },
        A20 : {
            "uid": "A20",
            "state_uid": 1,
            "next_state_uid": 18,
            "skill": "",
            "correct": false,
            "skill_app" : { "selection" : "done", "action_type" : "UpdateTextField", "inputs" : {"value" : "-1"},
                            "reward" : 0}
        }
    }
}

let {states, actions} = graph_data
console.log(states, actions)
let actions_by_state = {}
for(let action of Object.values(actions)){
    let lst = actions_by_state?.[action.state_uid] ?? []
    lst.push(action.uid)
    actions_by_state[action.state_uid] = lst
}

console.log(actions_by_state)

let actions_by_next_state = {}
for(let action of Object.values(actions)){
    let lst = actions_by_next_state?.[action.next_state_uid] ?? []
    lst.push(action.uid)
    actions_by_next_state[action.next_state_uid] = lst
}

console.log(actions_by_next_state)


// let nodes = [...graph_data.nodes].map((node) =>{
//   return {i: node.i, id: node.id, name: node.name, depth: node.depth}
// })
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
// console.log(nodes)
// alert("HI")


