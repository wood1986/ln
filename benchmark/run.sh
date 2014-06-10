files=("ln" "bunyan" "log4js" "winston")

for i in "${files[@]}"
do
  echo $i
  rm -rf "$i.log"
  /usr/bin/time -l node "$i.js" $1 $2
  echo "========================="
done
