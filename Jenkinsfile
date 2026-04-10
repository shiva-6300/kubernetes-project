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

        stage('Filesystem Scan (Trivy)') {
            steps {
                echo 'Running filesystem security scan'
                sh '''
                    trivy fs --severity HIGH,CRITICAL .
                '''
            }
        }

        stage('SonarQube Analysis') {
            steps {
                echo 'Running SonarQube analysis'
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
