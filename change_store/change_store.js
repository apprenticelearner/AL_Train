/*Implements makeChangeStore which builds a useChangedStore hook from a zustand useStore hook. 
   Takes a list of accessors strings like for example "@object.child.id"
   where presence of "@" indicates that the accessed value should be checked 
   for a change before rerendering. In the absence of an "@" decorated accessor,
   no checks are made. Optionally a custom check like (old,new) =>{whatever}
   can be provided [["object.child.id", (old,new) =>{whatever}],...]
*/
const comparators = {
  // eslint-disable-next-line eqeqeq
  "==" : (a, b) => (a == b),
  "===" : (a, b) => (a === b),
  // eslint-disable-next-line eqeqeq
  "!=" : (a, b) => (a != b),
  "!==" : (a, b) => (a !== b),
  "<=" : (a, b) => (a <= b),
  ">=" : (a, b) => (a >= b),
  "<" : (a, b) => (a < b),
  ">" : (a, b) => (a > b),
  "=" : (a,b) => {throw Error("ChangeStore accessor with operator '=', did you mean '==' or '==='?")},
} 

export const makeChangeStore = (useStoreHook) =>{
  let useChangedStore = (args, do_update=true) =>{
    args = args.map((x)=>Array.isArray(x) ? x : [x])
    let accessors = args.map(([accessor,...[cmp]])=>{
      if(!(accessor instanceof Function)){
        if(accessor[0]==="@"){ accessor = accessor.slice(1)}
        for (let [cmpr_str, cmpr] of Object.entries(comparators)){
          if(accessor.includes(cmpr_str)){
              let [a,val] = accessor.split(cmpr_str)
              // Treat val string as the native value it represents
              val = Number(val) ||
                    (val=="true" ? true : null) ||
                    (val=="false" ? true : null)||
                    (val=="null" ? null : val.replace(/['"]+/g, ''))
              a = a.split(".")
              return (s) => (cmpr( a.reduce((o,p) => o?.[p], s) , val))
          }
        }
        return accessor.split(".")
      }else{
        return accessor
      }
      
    })
    let f = (s) =>{
      let out = []
      for(let accessor of accessors){
        if(accessor instanceof Function){

          out.push(accessor(s))
        }else{
          out.push(accessor.reduce((o,p) => o ? o[p] : null, s))
        }
      }
      return out
    }
    let c
    if(do_update){
      let cmps = args.map(([accessor,...[cmp]])=>cmp || accessor[0]==="@")
      c = (old,nw) =>{
        let not_change = true
        let are_checks = false
        let i = 0
        for(let cmp of cmps){
          if(cmp instanceof Function){
            not_change &= cmp(old[i], nw[i])
            are_checks = true
          }else if(cmp){
            not_change &= old[i] == nw[i]
            are_checks = true
            // console.log(args[i][0], old[i], nw[i], old[i] === nw[i], not_change)
          }

          i++;
        }
        // console.log("NO CHANGE", not_change)
        return not_change
      }
    }else{
      c = () => true
    }  
    return useStoreHook(f,c)
  }
  return useChangedStore

}
