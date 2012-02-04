if [ -d ../../templates ]
then
    node compile.js *.html ../../templates/*.html
else
    node compile.js *.html
fi
