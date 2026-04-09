pipeline {
  agent any

  environment {
    // Replace these credentials IDs with your Jenkins configured secrets
    SONARQUBE_SERVER = 'SonarQube Server'
    SONAR_AUTH_TOKEN = credentials('sonar-auth-token')
  }

  stages {
    stage('Git Clone') {
      steps {
        echo 'Checking out source code'
        checkout scm
      }
    }

    stage('SonarQube') {
      steps {
        echo 'Running SonarQube analysis'
        withSonarQubeEnv(SONARQUBE_SERVER) {
          sh "sonar-scanner -Dsonar.projectKey=blog-app -Dsonar.sources=. -Dsonar.host.url=$SONAR_HOST_URL -Dsonar.login=$SONAR_AUTH_TOKEN"
        }
      }
    }
  }

  post {
    success {
      echo 'Pipeline completed successfully.'
    }
    failure {
      echo 'Pipeline failed. Please review build logs.'
    }
  }
}
