function createSteps() {

CTAT.SAI = {

    /** {string} help message */
    help: "Enter steps.list() to see the list of steps;\n      steps.next() to do the next step;\n      steps.rest() to do the remaining steps;\n      steps.all() to do all\n      steps.send(n) to send the nth step\n",

    /** {number} in sessionStorage so far. */
    nStored: 0,

    /** {string}s in local cache. */
    msgs: [],
    
    /**
     * @param {string} msg UI-to-tracer message to save, as an XML string
     * @return {number} number stored
     */
    storeForReplay: function(msg) {
	if(msg && typeof(msg)=="string") {
	    try {
		if(sessionStorage && typeof(sessionStorage.setItem)=="function") {
		    sessionStorage.setItem("CTAT.SAI."+CTAT.SAI.nStored, msg);
		    sessionStorage.setItem("CTAT.SAI.length", String(++CTAT.SAI.nStored));
		}
	    } catch(e) {
		console.log("CTAT.SAI.storeForReplay() error ", e, "\n  msg", msg);
	    }
	    return CTAT.SAI.nStored;
	}
    },

    format: function(s) {
	let udb=useDebuggingBasic; useDebuggingBasic=false;
	let ud=useDebugging; useDebugging=false;
        let xml = new CTATXML().parseXML(s);
        let msg = new CTATMessage(xml);
	useDebuggingBasic=udb;
	useDebugging=ud;
	return sprintf("s: %-16s, a: %-16s, i: %s", msg.getSelection(), msg.getAction(), msg.getInput());
    },

    list: function() {
	let list="";
	for(let m=0; m<CTAT.SAI.msgs.length; ++m) {
	    let msg = CTAT.SAI.format(CTAT.SAI.msgs[m]);
	    list=sprintf("%s\n[%2d] %s", list, m, msg);
	}
	return "Number of steps: "+CTAT.SAI.msgs.length+list+"\n";
    },

    /**
     * @param {number} index in msgs[] of message to send
     */
    send: function(i) {
	if(i>=CTAT.SAI.msgs.length)
	    return "Already past last step "+i;
	CTATCommShell.commShell.getCommLibrary().sendXML(CTAT.SAI.msgs[i]);
	CTAT.SAI.storeForReplay(CTAT.SAI.msgs[i]);
    },

    /** {number} index of last step sent by next()*/
    last: -1,

    next: function() { return CTAT.SAI.send(++CTAT.SAI.last); },
    rest: function() { while(CTAT.SAI.last<CTAT.SAI.msgs.length-2) CTAT.SAI.next(); return CTAT.SAI.next(); },
    all: function() { CTAT.SAI.last=-1; return CTAT.SAI.rest(); }
}

try {
    let n=sessionStorage.getItem("CTAT.SAI.length");
    n=(n?Number(n):0);
    let j=0;
    for(; j<n; ++j) {
	let key="CTAT.SAI."+j;
	CTAT.SAI.msgs.push(sessionStorage.getItem(key));
	sessionStorage.removeItem(key);
    }
    sessionStorage.setItem("CTAT.SAI.length", String(n-j));
} catch(e) {
    console.log("CTAT.SAI load error ", e);
}

return CTAT.SAI;
};

var steps=null;
$(window).on('load', ()=>{steps=createSteps(); console.log("***To replay steps:","\n"+steps.help);
});
