#!/bin/sh
# global variables
cr="\033[0m"; ci="\033[1m"; cm="\033[2m"; ce="\033[31m"
cookie_dir="$HOME/.config/nodef/way2sms"
cookie_file="$cookie_dir/cookie.ini"
command=""; message=""; q=""
mobileno="$WAY2SMS_MOBILENO"
password="$WAY2SMS_PASSWORD"
cookie="$WAY2SMS_COOKIE"
tomobile="$WAY2SMS_TOMOBILE"
trap 'printf "${cr}\n"; exit' SIGINT


# present script directory
psd() {
  z="${BASH_SOURCE[0]}"
  if [ -h "$z" ]; then z="$(readlink "$z")"; fi
  cd "$(dirname "$0")" && cd "$(dirname "$z")" && pwd
}
dp0="$(psd)/"

# get cookie
cookieGet() {
  if [[ "$cookie" != "" ]]; then exit; fi
  if [ -f "$cookie_file" ]; then cookie=$(cat "$cookie_file"); return; fi
  printf "${ci}"
  if [[ "$mobileno" == "" ]]; then read -p "Mobile no.: " mobileno; fi
  if [[ "$password" == "" ]]; then read -s -p "Password: " password; fi
  printf "${cr}\n"
  cookie=$(node "${dp0}index" reLogin "$mobileno" "$password")
  if [[ "$?" != "0" ]]; then >&2 printf "${ce}Way2SMS re-login failed!${cr}\n"; exit; fi
}

# logout command
logout() {
  if [ ! -f "$cookie_file" ]; then exit; fi
  rm -f "$cookie_file"
  if [ -z "$q" ]; then printf "${cm}Way2SMS cookie removed.${cr}\n"; fi
};

# relogin command
reLogin() {
  cookieGet; mkdir -p "$cookie_dir"; echo "$cookie" > "$cookie_file"
  if [ -z "$q" ]; then printf "${cm}Way2SMS cookie saved.${cr}\n"; fi
}

# smstoss command
smstoss() {
  cookieGet
  printf "${ci}"
  if [[ "$tomobile" == "" ]]; then read -p "To mobile: " tomobile; fi
  if [[ "$message" == "" ]]; then read -p "Message: " message; fi
  printf "${cr}"
  status=$(node "${dp0}index" smstoss "$cookie" "$tomobile" "$message" 2>&1)
  if [[ "$status" != "" ]]; then >&2 printf "${ce}Way2SMS smstoss failed. $status${cr}\n"; exit; fi
  if [ -z "$q" ]; then printf "${cm}Way2SMS message sent.${cr}\n"; fi
}


# read arguments
command="$1"; shift
while [[ "$#" != "0" ]]; do
  if [[ "$1" == "--help" ]]; then command=""; break
  elif [[ "$1" == "-#" ]] || [[ "$1" == "--quiet" ]]; then q="1"
  elif [[ "$1" == "-m" ]] || [[ "$1" == "--mobileno" ]]; then mobileno="$2"; shift
  elif [[ "$1" == "-u" ]] || [[ "$1" == "--username" ]]; then mobileno="$2"; shift
  elif [[ "$1" == "-p" ]] || [[ "$1" == "--password" ]]; then password="$2"; shift
  elif [[ "$1" == "-c" ]] || [[ "$1" == "--cookie" ]]; then cookie="$2"; shift
  elif [[ "$1" == "-t" ]] || [[ "$1" == "--to"* ]]; then tomobile="$2"; shift
  else message="$1"
  fi
  shift
done

# run command
if [[ "$command" == *"logout" ]]; then logout
elif [[ "$command" == *"login" ]]; then reLogin
elif [[ "$command" == "s"* ]]; then smstoss
else
  if [ -z "$q" ]; then less "${dp0}README.md"
  else >&2 printf "${ce}Bad command ${command}!${cr}\n"; fi
fi
