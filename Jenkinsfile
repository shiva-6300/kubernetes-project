pipeline {
    agent any

    environment {
        SONARQUBE_SERVER = 'SonarQube'
        SCANNER_HOME = tool 'SonarScanner'

        IMAGE_NAME = "shivavaddi/kubernetes-project:${BUILD_NUMBER}"
        FRONTEND_IMAGE = "shivavaddi/frontend:${BUILD_NUMBER}"

        AWS_DEFAULT_REGION = 'ap-northeast-2'
    }

    stages {

        stage('Git Clone') {
            steps {
                echo 'Cloning repository'
                git url: 'https://github.com/shiva-6300/kubernetes-project.git', branch: 'main'
            }
        }

        stage('Trivy FS Scan') {
            steps {
                sh 'trivy fs --severity HIGH,CRITICAL .'
            }
        }

        stage('SonarQube Analysis') {
            steps {
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
                sh '''
                    cd backend
                    python3 -m venv venv
                    . venv/bin/activate
                    pip install --upgrade pip setuptools wheel
                    python setup.py sdist bdist_wheel
                '''
            }
        }

        stage('Upload to Nexus') {
            steps {
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

        stage('Build Docker Images') {
            steps {
                sh '''
                    cd backend
                    docker build -t $IMAGE_NAME .

                    cd ../frontend
                    docker build -t $FRONTEND_IMAGE .
                '''
            }
        }

        stage('Trivy Image Scan') {
            steps {
                sh '''
                    trivy image --severity HIGH,CRITICAL $IMAGE_NAME
                    trivy image --severity HIGH,CRITICAL $FRONTEND_IMAGE
                '''
            }
        }

        stage('Push Docker Images') {
            steps {
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

        stage('Deploy to Kubernetes') {
            steps {
                sh '''
                    sed -i "s|image:.*|image: $IMAGE_NAME|g" Kubernetes/backend-deployment.yaml
                    sed -i "s|image:.*|image: $FRONTEND_IMAGE|g" Kubernetes/frontend-deployment.yaml

                    kubectl apply -f Kubernetes/backend-deployment.yaml
                    kubectl apply -f Kubernetes/backend-service.yaml

                    kubectl apply -f Kubernetes/frontend-deployment.yaml
                    kubectl apply -f Kubernetes/frontend-service.yaml
                '''
            }
        }

        // ✅ NEW STAGE (IMPORTANT)
        stage('Verify Deployment Rollout') {
            steps {
                echo 'Checking rollout status...'

                sh '''
                    echo "Checking backend rollout..."
                    kubectl rollout status deployment/backend --timeout=120s

                    echo "Checking frontend rollout..."
                    kubectl rollout status deployment/frontend --timeout=120s
                '''
            }
        }

        stage('Post Deployment Check') {
            steps {
                sh '''
                    kubectl get pods
                    kubectl get svc
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
