#!/bin/bash
set -e

REMOTE="itmo"
REMOTE_CONF="/home/studs/s502873/httpd-root/conf/httpd.conf"
REMOTE_FCGI_DIR="/home/studs/s502873/httpd-root/fcgi-bin"
HTTPD_BIN="/usr/local/sbin/httpd"

LOCAL_PORT="8080"
SERVER_PORT="24216"
FCGI_PORT="24217"

ssh ${REMOTE} "
  set -e
  ${HTTPD_BIN} -f ${REMOTE_CONF} -t
  ${HTTPD_BIN} -f ${REMOTE_CONF} -k stop || true
  sleep 1
  ${HTTPD_BIN} -f ${REMOTE_CONF} -k start
  sleep 1
  sockstat -4 -l | grep ${SERVER_PORT} || exit 1

  pkill -f hello-world.jar || true
  sleep 1
  cd ${REMOTE_FCGI_DIR}
  nohup java -Xmx256m -DFCGI_PORT=${FCGI_PORT} -jar hello-world.jar > app.log 2>&1 &
  disown
  sleep 1
  sockstat -4 -l | grep ${FCGI_PORT} || exit 1

  curl -sf 'http://localhost:${SERVER_PORT}/fcgi-bin/hello-world.jar?x=1&y=1&r=3' > /dev/null || exit 1
"

pkill -f "ssh.*-L ${LOCAL_PORT}:localhost:${SERVER_PORT}" 2>/dev/null || true
sleep 1
ssh -f -N -L ${LOCAL_PORT}:localhost:${SERVER_PORT} ${REMOTE}
sleep 1
open "http://localhost:${LOCAL_PORT}/index.html"

