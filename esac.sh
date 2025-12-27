#!/bin/bash

setsid chromium-browser --use-gl=desktop --profile-directory='Default' "http://localhost:8000/" > /dev/null 2>&1 < /dev/null &
setsid  firefox -p 'devfox'  > /dev/null 2>&1  < /dev/null &

