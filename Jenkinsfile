pipeline {
    agent any

    environment {
        SONARQUBE_SERVER = 'SonarQube'
        SCANNER_HOME = tool 'SonarScanner'
        IMAGE_NAME = "shivavaddi/kubernetes-project:${BUILD_NUMBER}"
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

        /*
        stage('SonarQube Analysis') {
            steps {
                echo 'Running SonarQube analysis'
                withSonarQubeEnv("${SONARQUBE_SERVER}") {
                    sh """
                        ${SCANNER_HOME}/bin/sonar-scanner \
                        -Dsonar.projectKey=kubernetes-project \
                        -Dsonar.sources=. \
                        -Dsonar.exclusions=**/venv/**,**/__pycache__/**,**/*.pyc
                    """
                }
            }
        }

        stage('Build Python Backend') {
            steps {
                echo 'Building Python backend package'
                sh '''
                    cd backend

                    python3 -m venv venv
                    . venv/bin/activate

                    pip install --upgrade pip setuptools wheel

                    python setup.py sdist bdist_wheel

                    ls -l dist
                '''
            }
        }

        stage('Upload to Nexus') {
            steps {
                echo 'Uploading Python package to Nexus'

                withCredentials([usernamePassword(
                    credentialsId: 'nexus-creds',
                    usernameVariable: 'NEXUS_USER',
                    passwordVariable: 'NEXUS_PASS'
                )]) {

                    sh '''
                        cd backend
                        . venv/bin/activate

                        pip install twine

                        cat > ~/.pypirc <<EOF
[distutils]
index-servers =
    nexus

[nexus]
repository: http://43.202.62.54:8081/repository/pypi-releases/
username: $NEXUS_USER
password: $NEXUS_PASS
EOF

                        twine upload -r nexus dist/*
                    '''
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                echo 'Building Docker image'
                sh '''
                    cd backend
                    docker build -t $IMAGE_NAME .
                '''
            }
        }

        stage('Push to Docker Hub') {
            steps {
                echo 'Pushing Docker image to Docker Hub'

                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-creds',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {

                    sh '''
                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin

                        docker push $IMAGE_NAME

                        docker tag $IMAGE_NAME shivavaddi/kubernetes-project:latest
                        docker push shivavaddi/kubernetes-project:latest

                        docker logout
                    '''
                }
            }
        }
        */
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
