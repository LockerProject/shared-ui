node compile.js *.html
if [ -d ../../templates ]
then
    node compile.js ../../templates/*.html
fi
