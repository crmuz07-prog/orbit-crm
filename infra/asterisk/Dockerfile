FROM ubuntu:24.04
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update \
 && apt-get install -y --no-install-recommends asterisk asterisk-core-sounds-en-gsm gettext-base \
 && rm -rf /var/lib/apt/lists/*
COPY config/ /etc/asterisk/orbit/
COPY bin/orbit-callback /usr/local/bin/orbit-callback
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh /usr/local/bin/orbit-callback
EXPOSE 5060/udp 10000-10050/udp
ENTRYPOINT ["/entrypoint.sh"]
