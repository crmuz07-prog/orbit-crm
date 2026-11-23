#!/bin/sh
# Renders Orbit's configuration over the package defaults, then runs Asterisk in the foreground.
set -eu
: "${HOST_IP:?HOST_IP is required (LAN IP of the machine running Docker)}"
: "${SIP_PASSWORD_101:?}" "${SIP_PASSWORD_102:?}" "${AMI_SECRET:?}"

SRC=/etc/asterisk/orbit
for file in extensions.conf rtp.conf modules.conf logger.conf; do cp "$SRC/$file" "/etc/asterisk/$file"; done
envsubst '${HOST_IP} ${SIP_PASSWORD_101} ${SIP_PASSWORD_102}' < "$SRC/pjsip.conf.tmpl" > /etc/asterisk/pjsip.conf
envsubst '${AMI_SECRET}' < "$SRC/manager.conf.tmpl" > /etc/asterisk/manager.conf

mkdir -p /var/spool/asterisk/monitor/orbit /var/spool/asterisk/outgoing
exec asterisk -f -vvv
