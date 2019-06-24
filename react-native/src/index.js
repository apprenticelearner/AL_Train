import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import SkillPanel from './components/skill_panel';
import * as serviceWorker from './serviceWorker';



// function setSkillWindowState(evt){

// }

function setSkillWindowState(skill_set,select_callback,where_colors){
	ReactDOM.render(<SkillPanel skill_set={skill_set} select_callback={select_callback} where_colors={where_colors}/>, document.getElementById('skill_panel'));	
}
window.setSkillWindowState = setSkillWindowState

// function render(){
// let sections = [
// 	              {title: 'D', data: ['Devin the long named fool']},
// 	              {title: 'J', data: ['Jackson', 'James', 'Jillian', 'Jimmy', 'Joel', 'John', 'Julie']},
// 	              {title: 'B', data: ['Backson', 'Bames', 'Billian', 'Bimmy', 'Boel', 'Bohn', 'Bulie']},
// 	            ];


let test_skills = {"explanations": [
				
				{"name" : "E0 + E1",
				 "how": "E0 + E1",
				 "where": "WHERE PART",
				 "when": "WHEN PART",
				 "which": 7.0,
				 'mapping': {"?sel": 'A1', "?arg0": 'B1',"?arg1": 'C1'}
				},
				{"name" : "E0 + E1",
				 "how": "E0 + E1",
				 "where": "WHERE PART",
				 "when": "WHEN PART",
				 "which": 7.0,
				 'mapping': {"?sel": 'A2', "?arg0": 'B2',"?arg1": 'C2'}
				},
				{"name": "(E0 + E1) // 10",
				 "how": "(E0 + E1) // 10",
				 "where": "WHERE PART",
				 "when": "WHEN PART",
				 "which": 4.0,
				 'mapping': {"?sel": 'A1', "?arg0": 'B1',"?arg1": 'C1'}

				},
				{"name": "(E0 + E1) // 10",
				 "how": "(E0 + E1) // 10",
				 "where": "WHERE PART",
				 "when": "WHEN PART",
				 "which": 4.0,
				 'mapping': {"?sel": 'A2', "?arg0": 'B2',"?arg1": 'C2'}
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
setSkillWindowState(test_skills);

// }
// document.getElementById('render_button').addEventListener("click",render)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
