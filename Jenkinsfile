pipeline {
  agent any

  environment {
    SONARQUBE_SERVER = 'SonarQube'   // match your config name
    SCANNER_HOME = tool 'SonarScanner'
  }

  stages {

    stage('Git Clone') {
      steps {
        echo 'Checking out source code'
        git url: 'https://github.com/shiva-6300/kubernetes-project.git', branch: 'main'
      }
    }

    stage('SonarQube Analysis') {
      steps {
        withSonarQubeEnv("${SONARQUBE_SERVER}") {
          sh """
            ${SCANNER_HOME}/bin/sonar-scanner \
            -Dsonar.projectKey=kubernetes-project \
            -Dsonar.sources=.
          """
        }
      }
    }
  }

  post {
    success {
      echo 'Pipeline completed successfully.'
    }
    failure {
      echo 'Pipeline failed.'
    }
  }
}
