import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import SkillPanel from './components/skill_panel';
import * as serviceWorker from './serviceWorker';

function clicky_callback(evt){
	console.log("clicky", evt.target.innerHTML)
}

// function render(){
let sections = [
	              {title: 'D', data: ['Devin the long named fool']},
	              {title: 'J', data: ['Jackson', 'James', 'Jillian', 'Jimmy', 'Joel', 'John', 'Julie']},
	              {title: 'B', data: ['Backson', 'Bames', 'Billian', 'Bimmy', 'Boel', 'Bohn', 'Bulie']},
	            ];
ReactDOM.render(<SkillPanel sections={sections} clicky_callback={clicky_callback}/>, document.getElementById('skill_panel'));	
// }
// document.getElementById('render_button').addEventListener("click",render)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
