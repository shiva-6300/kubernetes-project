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

        stage('Build Python Backend') {
            steps {
                echo 'Building Python backend package'
                sh '''
                    echo "Current directory:"
                    pwd
                    ls -l

                    cd backend

                    echo "Inside backend folder:"
                    pwd
                    ls -l

                    # Create virtual environment
                    python3 -m venv venv
                    . venv/bin/activate

                    # Install build tools
                    pip install --upgrade pip setuptools wheel

                    # Build package
                    python setup.py sdist bdist_wheel

                    # Show artifacts
                    ls -l dist
                '''
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully ✅'
        }
        failure {
            echo 'Pipeline failed ❌'
        }
    }
}
