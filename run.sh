#!/bin/sh
# AUTHOR: Danny Weitekamp
# EMAIL: weitekamp@cmu.edu

################### GRAB FROM net.conf ####################

while read line 
do
    if echo $line | grep -F = &>/dev/null
    then
        varname=$(echo "$line" | cut -d '=' -f 1) 
        eval $varname=$(echo "$line" | cut -d '=' -f 2-)
    fi
done < net.conf

###########################################################

################### HANDLE FLAGS ##########################

while test $# -gt 0; do
        case "$1" in
        	-h|--help)
                echo "options:"
                echo "-h, --help                show brief help"
                echo "-f, --force       		force kill processes that hold up ports we want to use"
                echo "-a, --al-port=XXXX        the port for the apprentice learner server"
                echo "-c, --ctat-port=XXXX      the port for the ctat webpage"
                echo "-d, --al-dir=XXXX      	the directory where the apprentice learner api lives"
                echo "-b, --browser=<browser>   the browser executable to run CTAT on."
				exit 0
				;;
        	-f|--force)
				FORCE_KILL_PORTS=true
				shift
				;;
			-a|--al-port)
				AL_PORT=$2
				shift 2
				;;
			-c|--ctat-port)
				CTAT_PORT=$2
				shift 2
				;;
			-d|--al-dir)
				AL_DIR=$2
				shift 2
				;;
			-b|--browser)
				BROWSER=$2
				shift 2
				;;
			*)
				TRAINING=$1
            	shift
				;;
		esac
done;

if [ -z "$TRAINING" ]; then
	echo "Must specify training .json file as first arguement." 
	exit
fi

###########################################################


if [ -z "$AL_PORT" ] || [ -z "$CTAT_PORT" ] || [ -z "$BROWSER" ] || [ -z "$AL_DIR" ] ; then
	echo Variables AL_PORT, CTAT_PORT ,BROWSER or AL_DIR not set in net.conf >&2;
	exit;
fi


echo "STARTING" $AL_PORT $CTAT_PORT $FORCE_KILL_PORTS

#Kills all those pesky servers this will start if this script recieves an interrupt, terminate or exit
trap "exit" INT TERM;
trap 'kill_servers' EXIT;

#http://fibrevillage.com/sysadmin/237-ways-to-kill-parent-and-child-processes-in-one-command
kill_servers() {
	echo KILL SERVERS $AL_SERVER_PID $CTAT_SERVER_PID
	kill -- -$(ps -o pgid= $AL_SERVER_PID | grep -o [0-9]*)
	kill -- -$(ps -o pgid= $CTAT_SERVER_PID | grep -o [0-9]*)
  	# kill -s INT $AL_SERVER_PID -parentid 2>/dev/null;
  	# kill -s INT $CTAT_SERVER_PID -parentid 2>/dev/null;
  	# kill -s INT $CTAT_SERVER_PID -parentid 2>/dev/null;
}

port_error(){
	echo Failed to start $1 >&2;
	echo Port $2 help up at pid $3 >&2.
	kill_servers
	exit
}


########################## RUN SERVERS ####################

#Check if another process is using this port
AL_CONFLICT=$(lsof -Pi :$AL_PORT -sTCP:LISTEN -t)
if [ $FORCE_KILL_PORTS ] && [ ! -z "$AL_CONFLICT" ]; then
	echo Force Killing $AL_CONFLICT
	kill -s TERM $AL_CONFLICT 2>/dev/null;
	AL_CONFLICT=$(lsof -Pi :$AL_PORT -sTCP:LISTEN -t);
fi

#If no conflicts start the Apprentice Learner server
if [ -z "$AL_CONFLICT" ]; then
	python3 $AL_DIR/manage.py runserver localhost:$AL_PORT & #> AL_server.log &
	AL_SERVER_PID=$! #Stash its PID so we can kill it
	echo Started AL process: $AL_SERVER_PID 
else
	port_error AL $AL_PORT $AL_CONFLICT
fi

#Check if another process is using this port
CTAT_CONFLICT=$(lsof -Pi :$CTAT_PORT -sTCP:LISTEN -t)
if [ $FORCE_KILL_PORTS ] && [ ! -z "$CTAT_CONFLICT" ]; then
	echo Force Killing $CTAT_CONFLICT
	kill -s TERM $CTAT_CONFLICT 2>/dev/null;
	CTAT_CONFLICT=$(lsof -Pi :$CTAT_PORT -sTCP:LISTEN -t)
fi

#If no conflicts start the CTAT server
if [ -z "$CTAT_CONFLICT" ]; then
	python3 -m http.server $CTAT_PORT  & #> CTAT_server.log &
	CTAT_SERVER_PID=$! #Stash its PID so we can kill it
	echo Started CTAT process: $CTAT_SERVER_PID
else
	port_error CTAT $CTAT_PORT $CTAT_CONFLICT
fi

##########################################################


# $BROWSER "http://0.0.0.0:$CTAT_PORT/indexAdd.html?training=blehh&al_url=http://0.0.0.0:$AL_PORT";
$BROWSER "http://localhost:$CTAT_PORT/?training=$TRAINING&al_url=http://localhost:$AL_PORT";


while true; do
sleep 1;
done
#Kill servers
kill_servers;