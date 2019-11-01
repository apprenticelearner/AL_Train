import React from 'react';
import WebView  from 'react-native-web-webview';
import {
  Icon,
  View,
  Text,
  StyleSheet,
  Platform//, 
  // WebView
} from 'react-native';

export default class CTAT_Tutor extends React.Component {
  constructor(props){
    super(props);
  }

  render() {
    return (
      <WebView
            style={{ height: 700, width: 400 }}
            originWhitelist={['*']}
            source={{ html: '<h1>Hello world</h1>' }}
      />
    );
  }
}
