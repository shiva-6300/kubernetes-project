pipeline {
    agent any

    environment {
        SONARQUBE_SERVER = 'SonarQube'
        SCANNER_HOME = tool 'SonarScanner'

        BACKEND_IMAGE = "shivavaddi/kubernetes-project:${BUILD_NUMBER}"
        FRONTEND_IMAGE = "shivavaddi/frontend:${BUILD_NUMBER}"

        AWS_DEFAULT_REGION = 'ap-northeast-2'
    }

    stages {

        stage('Git Clone') {
            steps {
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
                        -Dsonar.exclusions=**/venv/**,**/__pycache__/**,**/*.pyc,**/node_modules/**
                    """
                }
            }
        }

        // ================= COMBINED BUILD =================
        stage('Build Frontend & Backend') {
            steps {
                sh '''
                    echo "===== FRONTEND BUILD ====="
                    cd frontend
                    npm install
                    npm run build
                    cd ..

                    echo "===== BACKEND BUILD ====="
                    cd backend
                    python3 -m venv venv
                    . venv/bin/activate
                    pip install --upgrade pip setuptools wheel
                    python setup.py sdist bdist_wheel
                    cd ..
                '''
            }
        }

        // ================= COMBINED DOCKER =================
        stage('Build Docker Images') {
            steps {
                sh '''
                    echo "===== BUILD FRONTEND IMAGE ====="
                    cd frontend
                    docker build -t $FRONTEND_IMAGE .
                    cd ..

                    echo "===== BUILD BACKEND IMAGE ====="
                    cd backend
                    docker build -t $BACKEND_IMAGE .
                    cd ..
                '''
            }
        }

        stage('Upload Backend to Nexus') {
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
repository: http://43.203.234.28:8081/repository/pypi-releases/
username: $NEXUS_USER
password: $NEXUS_PASS
EOF

                        twine upload -r nexus dist/*
                    '''
                }
            }
        }

        stage('Trivy Image Scan') {
            steps {
                sh '''
                    trivy image --severity HIGH,CRITICAL $BACKEND_IMAGE
                    trivy image --severity HIGH,CRITICAL $FRONTEND_IMAGE
                '''
            }
        }

        // ================= COMBINED PUSH =================
        stage('Push Images') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'docker-creds',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh '''
                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin

                        docker push $BACKEND_IMAGE
                        docker push $FRONTEND_IMAGE

                        docker logout
                    '''
                }
            }
        }

        // ================= UPDATE YAML =================
        stage('Update Kubernetes Manifests') {
            steps {
                sh '''
                    sed -i "s|BACKEND_IMAGE|$BACKEND_IMAGE|g" Kubernetes/backend-deployment.yaml
                    sed -i "s|FRONTEND_IMAGE|$FRONTEND_IMAGE|g" Kubernetes/frontend-deployment.yaml
                '''
            }
        }

        // ================= DEPLOY =================
        stage('Deploy to Kubernetes') {
            steps {
                sh '''
                    kubectl apply -f Kubernetes/backend-deployment.yaml
                    kubectl apply -f Kubernetes/backend-service.yaml

                    kubectl apply -f Kubernetes/frontend-deployment.yaml
                    kubectl apply -f Kubernetes/frontend-service.yaml
                '''
            }
        }

        stage('Verify Deployment') {
            steps {
                sh '''
                    kubectl rollout status deployment/backend
                    kubectl rollout status deployment/frontend
                    kubectl get pods -o wide
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
