pipeline {
    agent any

    environment {
        SONARQUBE_SERVER = 'SonarQube'
        SCANNER_HOME = tool 'SonarScanner'

        IMAGE_NAME = "shivavaddi/kubernetes-project:${BUILD_NUMBER}"
        FRONTEND_IMAGE = "shivavaddi/frontend:${BUILD_NUMBER}"
    }

    stages {

        stage('Clone Code') {
            steps {
                git url: 'https://github.com/shiva-6300/kubernetes-project.git', branch: 'main'
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

        stage('Push Images') {
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
                    # Update images dynamically
                    sed -i "s|image:.*|image: $IMAGE_NAME|g" Kubernetes/backend-deployment.yaml
                    sed -i "s|image:.*|image: $FRONTEND_IMAGE|g" Kubernetes/frontend-deployment.yaml

                    # Apply manifests
                    kubectl apply -f Kubernetes/backend-deployment.yaml
                    kubectl apply -f Kubernetes/backend-service.yaml
                    kubectl apply -f Kubernetes/frontend-deployment.yaml
                    kubectl apply -f Kubernetes/frontend-service.yaml
                '''
            }
        }

        stage('Verify Rollout') {
            steps {
                script {
                    try {
                        sh '''
                            echo "Checking backend rollout..."
                            kubectl rollout status deployment/backend --timeout=180s

                            echo "Checking frontend rollout..."
                            kubectl rollout status deployment/frontend --timeout=180s
                        '''
                    } catch (Exception e) {
                        echo "❌ Rollout failed! Debugging..."

                        sh '''
                            kubectl get pods -o wide
                            kubectl describe deployment frontend
                            kubectl logs -l app=frontend --tail=50 || true
                        '''

                        error("Deployment failed")
                    }
                }
            }
        }

        stage('Get LoadBalancer URL') {
            steps {
                echo 'Fetching External URL...'

                sh '''
                    echo "Waiting for External IP..."
                    sleep 20

                    kubectl get svc frontend-service

                    echo "====================================="
                    echo "🌐 APPLICATION URL:"
                    kubectl get svc frontend-service -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
                    echo ""
                    echo "====================================="
                '''
            }
        }
    }

    post {
        success {
            echo '✅ Pipeline completed successfully'
        }
        failure {
            echo '❌ Pipeline failed'
        }
    }
}
