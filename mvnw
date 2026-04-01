#!/bin/sh
# Maven Wrapper Unix/Mac script
# See https://maven.apache.org/wrapper/

set -e

if [ -z "$JAVA_HOME" ]; then
  JAVA_CMD="java"
else
  JAVA_CMD="$JAVA_HOME/bin/java"
fi

BASEDIR="$(dirname "$(readlink -f "$0" 2>/dev/null || realpath "$0" 2>/dev/null || echo "$0")")"
WRAPPER_JAR="$BASEDIR/.mvn/wrapper/maven-wrapper.jar"
WRAPPER_LAUNCHER=org.apache.maven.wrapper.MavenWrapperMain
DOWNLOAD_URL="https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.2.0/maven-wrapper-3.2.0.jar"

if [ ! -e "$WRAPPER_JAR" ]; then
  if command -v wget > /dev/null; then
    wget -q -O "$WRAPPER_JAR" "$DOWNLOAD_URL"
  elif command -v curl > /dev/null; then
    curl -o "$WRAPPER_JAR" "$DOWNLOAD_URL" -s
  else
    echo "Error: Neither wget nor curl is available." >&2
    exit 1
  fi
fi

exec "$JAVA_CMD" \
  -classpath "$WRAPPER_JAR" \
  "-Dmaven.multiModuleProjectDirectory=$BASEDIR" \
  $JAVA_OPTS \
  $WRAPPER_LAUNCHER "$@"
