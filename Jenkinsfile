pipeline {
    agent any

    environment {
        SONARQUBE_SERVER = 'SonarQube'
        SCANNER_HOME = tool 'SonarScanner'
        IMAGE_NAME = "shivavaddi/kubernetes-project:${BUILD_NUMBER}"
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
repository: http://43.203.234.28:8081/repository/pypi-releases/
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
                sh '''
                    cd backend
                    docker build -t $IMAGE_NAME .
                '''
            }
        }

        stage('Trivy Image Scan') {
            steps {
                sh 'trivy image --severity HIGH,CRITICAL $IMAGE_NAME'
            }
        }

        stage('Push to DockerHub') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'docker-creds',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh '''
                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                        docker push $IMAGE_NAME
                        docker logout
                    '''
                }
            }
        }

        // 🔥 NEW STAGE (MOST IMPORTANT)
        stage('Configure EKS Access') {
            steps {
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding',
                    credentialsId: 'aws-creds'
                ]]) {
                    sh '''
                        echo "===== CONNECTING TO EKS ====="

                        aws eks update-kubeconfig \
                        --region ap-northeast-2 \
                        --name shiva-cluster

                        kubectl get nodes
                    '''
                }
            }
        }

        stage('Update K8s Manifest') {
            steps {
                sh '''
                    sed -i "s|image: .*|image: $IMAGE_NAME|g" Kubernetes/backend-deployment.yaml
                '''
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                sh '''
                    kubectl apply -f Kubernetes/backend-deployment.yaml --validate=false
                    kubectl apply -f Kubernetes/backend-service.yaml --validate=false
                '''
            }
        }

        stage('Verify Deployment') {
            steps {
                sh '''
                    kubectl rollout status deployment/backend
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
