import CryptoJS, {WordArray} from "crypto-js"

let randArr = CryptoJS.lib.WordArray.random
let Base64url = CryptoJS.enc.Base64url
let randomID = () => Base64url.stringify(randArr(32));

function shallowEqual(object1, object2) {
  const keys1 = Object.keys(object1);
  const keys2 = Object.keys(object2);
  if (keys1.length !== keys2.length) {
    return false;
  }
  for (let key of keys1) {
    if (object1[key] !== object2[key]) {
      return false;
    }
  }
  return true;
}

export {randomID, shallowEqual};
