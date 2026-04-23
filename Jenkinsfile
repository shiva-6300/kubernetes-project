pipeline {
    agent any

    environment {
        SONARQUBE_SERVER = 'SonarQube'
        SCANNER_HOME = tool 'SonarScanner'
        IMAGE_NAME = "shivavaddi/kubernetes-project:latest"
        FRONTEND_IMAGE = "shivavaddi/frontend:latest"
        AWS_DEFAULT_REGION = 'ap-northeast-2'
    }

    stages {

        stage('Git Clone') {
            steps {
                echo 'Checking out source code'
                git url: 'https://github.com/shiva-6300/kubernetes-project.git', branch: 'main'
            }
        }

        stage('Trivy FS Scan') {
            steps {
                echo 'Running filesystem security scan'
                sh 'trivy fs --severity HIGH,CRITICAL .'
            }
        }

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
repository: http://54.180.244.53:8081/repository/pypi-releases/
username: $NEXUS_USER
password: $NEXUS_PASS
EOF

                        twine upload -r nexus dist/*
                    '''
                }
            }
        }

        stage('Build Backend Docker Image') {
            steps {
                echo 'Building Backend Docker image'
                sh '''
                    cd backend
                    docker build -t $IMAGE_NAME .
                '''
            }
        }

        stage('Trivy Backend Image Scan') {
            steps {
                echo 'Scanning Backend Docker image'
                sh 'trivy image --severity HIGH,CRITICAL $IMAGE_NAME'
            }
        }

        stage('Build Frontend Docker Image') {
            steps {
                echo 'Building Frontend Docker image'
                sh '''
                    cd frontend
                    docker build -t $FRONTEND_IMAGE .
                '''
            }
        }

        stage('Trivy Frontend Scan') {
            steps {
                echo 'Scanning Frontend Docker image'
                sh 'trivy image --severity HIGH,CRITICAL $FRONTEND_IMAGE'
            }
        }

        stage('Push to DockerHub') {
            steps {
                echo 'Pushing images to DockerHub'
                withCredentials([usernamePassword(
                    credentialsId: 'docker-creds',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh '''
                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin

                        docker push $IMAGE_NAME
                        docker push $FRONTEND_IMAGE

                        docker logout
                    '''
                }
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
