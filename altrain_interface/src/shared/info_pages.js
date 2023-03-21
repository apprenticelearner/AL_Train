import React, { useEffect } from "react";
import {useALTrainStoreChange} from '../altrain_store';
import {Oval} from "react-loader-spinner";

export function LoadingPage(){
  return (
    <div style={styles.info_page}>
      <div style={{flexDirection: "column", alignSelf: "center"}}>
      <Oval
          height={160} width={160} color="#4fa94d" secondaryColor="#4fa94d"
          strokeWidth={5} strokeWidthSecondary={5}
      />
      <p style={{textAlign:'center',
                 fontFamily:"Copperplate, Courier New",
                 fontSize:40}}>
        loading
      </p>
      </div>
    </div>
  )
}

export function ErrorPage({error:prop_error}){
  const [error] = useALTrainStoreChange(['@error'])
  return (
    <div style={{...styles.info_page, backgroundColor:"pink"}}>
      <p style={{textAlign:'center', fontSize:40}}> {prop_error || error}</p>
    </div>
  )
}

const styles = {
  info_page : {
      display:"flex",
      justifyContent:'center',
      alignSelf:'center',
      width:"100%",
      height:"100%",
  },
}
