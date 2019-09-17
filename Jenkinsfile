pipeline {
  agent {
    label 'docker-nodejs-10.x-public-npm'
  }
  
  triggers {
    pollSCM 'H/15 * * * *'
  }

  stages {
    stage('Install Dependencies') {
      steps {
        sh 'scripts/pre-build.sh'
      }
    }
    
    stage('Build and Verify') {
      parallel {
        stage('Test') {
          steps {
            sh 'scripts/test.sh'
          }
        }
      }
    }
    stage('Sonar Code Analysis') {
      when { 
        anyOf { 
          branch 'master'; 
          branch 'develop' 
        } 
      }
      environment {
        scannerHome = tool 'default Sonar Runner'
      }
      
      steps {
        withSonarQubeEnv('NuSkin') {
          sh "${scannerHome}/bin/sonar-scanner"
          sh 'sleep 10'
        }
      }
    }
    stage("Quality Gate Check") {
      when { 
        anyOf { 
          branch 'master'; 
          branch 'develop' 
        } 
      }
      steps {
        timeout(time: 1, unit: 'MINUTES') {
          // Parameter indicates whether to set pipeline to UNSTABLE if Quality Gate fails
          // true = set pipeline to UNSTABLE, false = don't
          // Requires SonarQube Scanner for Jenkins 2.7+ I think maybe 2.8+
          waitForQualityGate abortPipeline: true
        }
      }
    }
    stage("Deploy Snapshot Artifact") {
      when {
        branch "develop"
      }
      steps {
        sh "yarn deploy-release"
      }
    }
  }
  post {
    failure {
      emailext (
          to: 'imharisa@nuskin.com',
          subject: "FAILED: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'",
          body: """<p>FAILED: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]':</p>
            <p>Check console output at &QUOT;<a href='${env.BUILD_URL}'>${env.JOB_NAME} [${env.BUILD_NUMBER}]</a>&QUOT;</p>""",
          recipientProviders: [[$class: 'DevelopersRecipientProvider']]
        )
    }
  }
}