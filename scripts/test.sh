echo "***********************************************************"
echo "*                          Test                           *"
echo "***********************************************************"
echo "-----------------"
echo "|Starting ESLint|"
echo "-----------------"
eslint "**.*.js" -f json -c ./.eslintrc.js -o ./eslint/report.json
echo "---------------------"
echo "|Starting Jest Tests|"
echo "---------------------"
yarn test