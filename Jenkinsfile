pipeline {
    agent any

    environment {
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
                    # Update images dynamically
                    sed -i "s|image:.*|image: $IMAGE_NAME|g" Kubernetes/backend-deployment.yaml
                    sed -i "s|image:.*|image: $FRONTEND_IMAGE|g" Kubernetes/frontend-deployment.yaml

                    # Apply manifests
                    kubectl apply -f Kubernetes/backend-deployment.yaml --validate=false
                    kubectl apply -f Kubernetes/backend-service.yaml --validate=false
                    kubectl apply -f Kubernetes/frontend-deployment.yaml --validate=false
                    kubectl apply -f Kubernetes/frontend-service.yaml --validate=false
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

                        echo "❌ Rollout failed! Collecting debug info..."

                        sh '''
                            echo "===== POD STATUS ====="
                            kubectl get pods -o wide

                            echo "===== FRONTEND DETAILS ====="
                            kubectl describe deployment frontend

                            echo "===== FRONTEND LOGS ====="
                            kubectl logs -l app=frontend --tail=50 || true
                        '''

                        error("Deployment failed ❌")
                    }
                }
            }
        }

        stage('Get Application URLs') {
            steps {
                sh '''
                    echo "====================================="
                    echo "🌐 FRONTEND URL:"
                    kubectl get svc frontend-service -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
                    echo ""

                    echo "🔗 BACKEND URL:"
                    kubectl get svc backend-service -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
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
