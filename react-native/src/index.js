import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import SkillPanel from './components/skill_panel';
import * as serviceWorker from './serviceWorker';

function clicky_callback(evt){
	console.log("clicky", evt.target.innerHTML)
}

function setSkillWindowState(skill_set){
	ReactDOM.render(<SkillPanel skill_set={skill_set} clicky_callback={clicky_callback}/>, document.getElementById('skill_panel'));	
}

// function render(){
let sections = [
	              {title: 'D', data: ['Devin the long named fool']},
	              {title: 'J', data: ['Jackson', 'James', 'Jillian', 'Jimmy', 'Joel', 'John', 'Julie']},
	              {title: 'B', data: ['Backson', 'Bames', 'Billian', 'Bimmy', 'Boel', 'Bohn', 'Bulie']},
	            ];


let skill_set = {"explanations": [
				
				{"name" : "E0 + E1",
				 "matches":
					[
					["A1","B1","C1"],
					["A2","B2","C2"],
					],
				 "how": "E0 + E1",
				 "where": "WHERE PART",
				 "when": "WHEN PART",
				 "which": 7.0,
				},
				{"name": "(E0 + E1) // 10",
				 "matches":
					[
					["A1","B1","C1"],
					["A2","B2","C2"],
					],
				 "how": "(E0 + E1) // 10",
				 "where": "WHERE PART",
				 "when": "WHEN PART",
				 "which": 4.0,
				}
			 ],
			 "other skills": [
		 		{"name": "(E0 + E1) // 10",
				 "how": "E0 + E1 + E2",
				 "where": "WHERE PART (E0 + E1 + E2)",
				 "when": "WHEN PART (E0 + E1 + E2)",
				 "which": 3.0,
				
				},
				{"name": "(E0 + E1 + E2) // 10",
				 "how": "E0 + E1",
				 "where": "WHERE PART ((E0 + E1 + E2) // 10)",
				 "when": "WHEN PART ((E0 + E1 + E2) // 10)",
				 "which": 8.0,
				},
			 ]


			};
setSkillWindowState(skill_set);

// }
// document.getElementById('render_button').addEventListener("click",render)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
