#!/bin/bash
action=$1
appname="to do"
script="server.sh"
if [$action == "start"];then
    forever start -l -a forever.log -o log/out.log -e log/err.log $script
elif [ $action == "stop" ];then
    forever stop appname
elif [ $action == "restart" ];then
    forever restart appname
else
    echo 'err params...'
fi