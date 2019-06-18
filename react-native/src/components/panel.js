import React, { Component } from 'react'
import {StyleSheet,Text,View,Image,TouchableHighlight,Animated} from 'react-native'; //Step 1

class Panel extends Component{
    constructor(props){
        super(props);

        this.icons = {     //Step 2
            'up'    : require('./images/Arrowhead-01-128.png'),
            'down'  : require('./images/Arrowhead-Down-01-128.png')
        };

        this.state = {       //Step 3
            title       : props.title,
            expanded    : false,
            expandable  : true,
            animation   : new Animated.Value(props.collapsedHeight)
        };
    }

    _setMaxHeight(event){
        // console.log("maxheight",event.nativeEvent.layout.height)
        this.setState({
            maxHeight   : event.nativeEvent.layout.height,
            expandable  : event.nativeEvent.layout.height > this.props.collapsedHeight
        });

    }

    _setMinHeight(event){
        
        // console.log("minheight",minHeight,this.props.collapsedHeight)
        this.setState({
            minHeight   : event.nativeEvent.layout.height
        });
    }

    toggle(){
        //Step 1
        // let initialValue, finalValue

        let expandedHeight = Math.max(this.state.maxHeight + this.state.minHeight,this.props.collapsedHeight);
        let collapsedHeight = Math.max(this.state.minHeight,this.props.collapsedHeight);
        
        let initialValue    = this.state.expanded? expandedHeight:collapsedHeight,
            finalValue      = this.state.expanded? collapsedHeight:expandedHeight;
        // console.log(finalValue)
        this.setState({
            expanded : !this.state.expanded  //Step 2
        });

        this.state.animation.setValue(initialValue);  //Step 3
        Animated.timing(     //Step 4
            this.state.animation,
            {
                toValue: finalValue,
                duration: 50
            }
        ).start();  //Step 5
    }


    render(){
        let icon = this.icons['down'];

        if(this.state.expanded){
            icon = this.icons['up'];   //Step 4
        }

        //Step 5
        return ( 
            <Animated.View
                style={[styles.container,{height: this.state.animation}]}>
                <TouchableHighlight 
                    underlayColor="#f1f1f1"
                    onLayout={this._setMinHeight.bind(this)}
                    onPress={this.state.expandable && this.toggle.bind(this)}> 
                    <View style={styles.titleContainer}>
                        
                        <Text style={styles.title}> {this.props.title} </Text> 

                    { this.state.expandable &&
                        <Image
                            style={styles.buttonImage}
                            source={icon}
                        ></Image>
                    }
                        
                    </View>
                </TouchableHighlight>
                
                <View style={styles.body} onLayout={this._setMaxHeight.bind(this)}> 
                    {this.props.children}
                </View>

            </Animated.View>
        );
    }
}


var styles = StyleSheet.create({
    container   : {
        backgroundColor: '#fff',
        margin:2,
        overflow:'hidden'
    },
    titleContainer : {
        flexDirection: 'row'
    },
    title       : {
        flex    : 1,
        padding : 2,
        color   :'#2a2f43',
        fontWeight:'bold'
    },
    button      : {

    },
    buttonImage : {
        width   : 30,
        height  : 25
    },
    body        : {
        padding     : 5,
        paddingTop  : 0,
        paddingBottom  : 20,

    }
});

export default Panel;