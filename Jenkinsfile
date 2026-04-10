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

        stage('Trivy Scan') {
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

        stage('Build Python Package') {
            steps {
                echo 'Building Python package'
                sh '''
                    python3 --version

                    # Create virtual environment
                    python3 -m venv venv
                    . venv/bin/activate

                    # Upgrade build tools
                    pip install --upgrade pip setuptools wheel

                    # Build package
                    python setup.py sdist bdist_wheel

                    # Verify build output
                    ls -l dist
                '''
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
