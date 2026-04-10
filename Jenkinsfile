pipeline {
  agent any

  environment {
    SONARQUBE_SERVER = 'SonarQube'
    SCANNER_HOME = tool 'SonarScanner'
  }

  stages {

    stage('Git Clone') {
      steps {
        echo 'Checking out source code'
        git url: 'https://github.com/shiva-6300/kubernetes-project.git', branch: 'main'
      }
    }

    stage('Install Dependencies') {
      steps {
        echo 'Installing Python dependencies'
        sh '''
          python3 -m venv venv
          . venv/bin/activate
          pip install --upgrade pip
          pip install pytest
          if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
        '''
      }
    }

    stage('Run Pytest') {
      steps {
        echo 'Running unit tests using pytest'
        sh '''
          . venv/bin/activate
          pytest --maxfail=1 --disable-warnings -v
        '''
      }
    }

    stage('Filesystem Scan (Trivy)') {
      steps {
        echo 'Running filesystem security scan'
        sh '''
          trivy fs --exit-code 1 --severity HIGH,CRITICAL .
        '''
      }
    }

    stage('SonarQube Analysis') {
      steps {
        withSonarQubeEnv("${SONARQUBE_SERVER}") {
          sh """
            ${SCANNER_HOME}/bin/sonar-scanner \
            -Dsonar.projectKey=kubernetes-project \
            -Dsonar.sources=. \
            -Dsonar.python.coverage.reportPaths=coverage.xml
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
