echo "***********************************************************"
echo "*                        Pre-Build                        *"
echo "***********************************************************"
echo "-----------------------"
echo "|Install ESLint|"
echo "-----------------------"
yarn global add eslint
echo "-----------------------"
echo "|Install Jest|"
echo "-----------------------"
yarn global add jest
echo "--------------------------"
echo "|Install of sonar-scanner|"
echo "--------------------------"
yarn global add sonar-scanner
echo "--------------------------"
echo "|Install package dependencies|"
echo "--------------------------"
yarn install