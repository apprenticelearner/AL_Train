// import Accordion from 'react-native-collapsible/Accordion';
// import { CollapsingToolbar }  from 'react-native-collapsingtoolbar';
// import CollapsibleList from './collapsible_list.js'
import SkillPanel from './components/skill_panel.js'


// 
import React from 'react';
// import logo from './logo.svg';
// import './App.css';

import { TouchableHighlight,ScrollView,View, Text, Platform, StyleSheet,SectionList,AppRegistry } from "react-native";


const instructions = Platform.select({
  ios: "Press Cmd+R to reload,\n" + "Cmd+D or shake for dev menu",
  android:
    "Double tap R on your keyboard to reload,\n" +
    "Shake or press menu button for dev menu",
  web: "Your browser will automatically refresh as soon as you save the file."
});

const HomeScreen = () => {
  return (
    
      <SkillPanel></SkillPanel>
  );
};

export default HomeScreen;