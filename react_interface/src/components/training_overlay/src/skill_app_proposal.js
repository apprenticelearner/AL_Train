import React, { Component, createRef } from 'react'
import { TouchableHighlight, TouchableWithoutFeedback,ScrollView,View, Text, Image,StyleSheet,
         Animated, PanResponder,useRef,Platform,TextInput } from "react-native";
import autobind from "class-autobind";

const images = {
  tap: require('./img/gesture-tap.png'),
  left_arrow: require('./img/arrow-left-bold.png'),
};


import {simple_animate, gen_shadow} from "./vis_utils.js"

class SkillAppProposal extends Component {
  constructor(props){
    super(props);
    autobind(this);
    let elevation = (props.hasFocus && props.focused_elevation)
                    ||  props.default_elevation
    if(Platform.OS != 'web'){
      elevation = new Animated.Value(elevation);  
    }

    const scale_anim = new Animated.Value(1,
      {useNativeDriver: true});

    this.text_input = React.createRef();
    this.state = {elevation,scale_anim,demonstrate_text:null};
  }
  _update_scale_elevation(){
    this._animate_scale_elevation(
      // (this.is_grabbed && this.props.grabbed_scale) ||
      (this.props.hasFocus && this.props.focused_scale) || 
       this.props.default_scale,

      // (this.is_grabbed && this.props.grabbed_elevation) || 
      (this.props.hasFocus && this.props.focused_elevation) || 
      this.props.default_elevation
      );
  }
  _animate_scale_elevation(next_scale,next_elevation,config={useNativeDriver:true,speed: 40}){
    Animated.spring(
    this.state.scale_anim, // Auto-multiplexed
    { toValue: next_scale,...config,...{useNativeDriver:true} }
    ).start();
    // simple_animate(this,'elevation',next_size,config)
    if(Platform.OS == 'web'){
      simple_animate(this,'elevation',next_elevation,{...config,speed:40})
    }else{
      Animated.spring(
      this.state.elevation, // Auto-multiplexed
      { toValue: next_elevation,...config,...{useNativeDriver:true} }
      ).start();
    }

  }
  // shouldComponentUpdate(nextProps, nextState){
  //   let props = this.props
  //   let state = this.state
  //   let skill_app = props.skill_app
  //   // console.log('check proposal',((skill_app && skill_app.input) || ""))
  //   if(state.elevation != nextState.elevation ||
  //      nextProps.hasFocus != props.hasFocus ||
  //      nextProps.correct != props.correct ||
  //      nextProps.incorrect != props.incorrect ||
  //      nextProps.staged != props.staged ||
  //      nextProps.color != props.color ||
  //      (nextProps.skill_app && 
  //      (nextProps.skill_app.input != props.skill_app.input ||
  //      nextProps.skill_app.action != props.skill_app.action))
  //     ){
  //     return true
  //   }
  //   return false
  // }

  componentDidUpdate(prevProps) {
    console.log(prevProps)
    if (prevProps.hasFocus !== this.props.hasFocus) {
      this._update_scale_elevation()
      // this.updateAndNotify();
    }
  }
  submit_demonstrate(){
    if(this.state.demonstrate_text){
      this.props.demonstrateCallback("UpdateTextField", this.state.demonstrate_text)
    }
    this.setState({demonstrate_text:null})
    this.text_input.current.blur()
    this.text_input.current.clear()
  }
  render(){
    let {skill_app, bounds, hasFocus, staged,
         correct, incorrect, is_demonstation, color} = this.props
    
    let shadow_props = gen_shadow(this.state.elevation);


    color = color ||
            //(is_demonstation && 'dodgerblue') ||
            (correct && this.props.correct_color) ||
            (incorrect && this.props.incorrect_color) ||
            (this.props.default_color)

    let text = this.state.demonstrate_text || ((skill_app && skill_app.input) || "")//.value || ""
    let fontSize = (Math.max(bounds.width,100)/((Math.min(text.length||1,8)-1)*.5 + 1))
    console.log('fontSize',fontSize)
    

    let innerContent;
    if(skill_app){
      if(skill_app.action.toLowerCase().includes('press')){
        innerContent = <View style ={{position:'absolute',
                                      width:fontSize,
                                      height:fontSize,
                                    //  alignItems:'left'
                                    }}>
                        <Image 
                        style ={{ flex:1,
                                  alignSelf : (Platform.OS == 'android' && 'center') || 'auto',
                                  tintColor:color,
                                  opacity : .7,
                                  transform:[
                                    {scale: .65}
                                  ],
                              }}
                        source={images.tap} />
                      </View>
      }else{
          innerContent = (
                        <TextInput style = {{
                            textAlign:"center",
                            alignSelf: "center",
                            color:'dodgerblue',
                            fontSize : fontSize*.9,
                            width:bounds.width,
                            height:bounds.height,
                            overflow:'hidden'
                        }}
                          ref={this.text_input}
                          placeholderTextColor={color}
                          value={this.state.demonstrate_text||""}
                          placeholder={(this.state.demonstrate_text == null && text) || null}
                          onFocus={(e) => {
                            this.setState({demonstrate_text: ""})
                          }} 
                          onBlur={(e) => {
                            e.target.placeholder = this.state.demonstrate_text
                            this.submit_demonstrate()
                          }}
                          multiline={Platform.OS == 'web'}
                          scrollEnabled={false}
                          editable={true}
                          onChangeText={(t)=>{
                            console.log('change')
                            this.setState({demonstrate_text:t})}
                          }
                          onKeyPress={(evt)=>{
                            if(evt.charCode==13 && !evt.shiftKey){
                              console.log("ENTER PRESSED",this.state.demonstrate_text)  
                              this.text_input.current.blur()
                              // this.submit_demonstrate()
                            }
                          }}
                        />
                        
                        )
        // }else{
        //   innerContent = <Text style = {{
        //                     alignSelf: "center",
        //                     color : color,//(hasFocus && "rgba(143,40,180, .7)") || "gray",
        //                     fontSize : fontSize,
        //                 }}>
        //                   {text}
        //                 </Text>
        // }
      }
    }


    return (
      
        <Animated.View  style= {[{
                      position : "absolute",
                      left: -6,
                      top: -6,
                       
                      borderWidth: (hasFocus && 8) || 4,
                      borderRadius: 10,
                      borderColor: (!is_demonstation && color) || 'dodgerblue',//(hasFocus && "rgba(143,40,180, .7)") || "gray",
                      width:bounds.width+12,
                      height:bounds.height+12,
                      justifyContent: "center",
                      alignItems: "center",

                      // opacity : .8,
                      transform: [
                        {translateX : bounds.x},
                        {translateY : bounds.y},
                        ]
                    }
                    ,shadow_props
                  ]
        }>
          {false &&
            <View style= {{
              position : "absolute",
              borderWidth: (hasFocus && 3) || 2,
              borderColor: 'dodgerblue',
              opacity : .5,
              borderRadius: 2,
              width : "100%",
              height : "100%"
            }}/>
          }
          {staged &&
            <View style ={{
              position:'absolute',
              width:bounds.width,
              height:bounds.height,
              zIndex:-1,
            }}>
              <Image
                style ={{ 
                  flex:1,
                  tintColor: 'rgb(120,120,150)',
                  opacity : .1,
                }}
                source={images.left_arrow} 
              />
            </View>
          }
          {innerContent}
        </Animated.View>
      
      )
  }
}

// const styles = StyleSheet.create({
//   "inner_text": {

//   }
// })

SkillAppProposal.defaultProps = {
  hasFocus : false,
  correct : false,
  incorrect : false,

  focused_scale : 1.025,
  default_scale : 1,
  
  focused_elevation : 14,
  default_elevation : 2,

  correct_color : 'rgba(50,205,50,.7)',//'limegreen',
  incorrect_color : 'rgba(255,0,0,.7)',//'red',
  default_color : 'rgba(128,128,128,.7)',//'gray',
  focus_color : 'rgba(153,50,204,.7)',//'darkorchid',

}

export default SkillAppProposal
