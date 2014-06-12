if [[ "$OSTYPE" == "linux-gnu" ]]; then
  args="-v"
elif [[ "$OSTYPE" == "darwin"* ]]; then
  args="-l"
fi

files=("ln" "bunyan" "log4js" "winston")

for i in "${files[@]}"
do
  echo $i
  rm -rf "$i.log"
  /usr/bin/time $args node "$i.js" $1 $2
  echo "========================="
done
