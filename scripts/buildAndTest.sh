echo "***********************************************************"
echo "*                        Build                            *"
echo "***********************************************************"
echo "-------"
echo "|Build|"
echo "-------"
yarn vue-cli-service build --mode test
echo "-----------------"
echo "|Starting ESLint|"
echo "-----------------"
eslint "**.*.js" -f json -c ./.eslintrc.js -o ./eslint/report.json
echo "---------------------"
echo "|Starting Jest Tests|"
echo "---------------------"
yarn vue-cli-service test:unit