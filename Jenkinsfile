pipeline {
    agent any

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-creds')
        BACKEND_IMAGE = "shivavaddi/cost-backend:${BUILD_NUMBER}"
        FRONTEND_IMAGE = "shivavaddi/cost-frontend:${BUILD_NUMBER}"
        AWS_REGION = "ap-northeast-2"
        CLUSTER_NAME = "shiva-cluster"
    }

    stages {

        stage('Checkout Code') {
            steps {
                echo "Cloning GitHub Repository"
                git url: 'https://github.com/shiva-6300/cost-monitoring-app.git', branch: 'main'
            }
        }

        stage('Build Backend Image') {
            steps {
                sh """
                docker build -t $BACKEND_IMAGE ./backend
                """
            }
        }

        stage('Build Frontend Image') {
            steps {
                sh """
                docker build -t $FRONTEND_IMAGE ./frontend
                """
            }
        }

        stage('Docker Login') {
            steps {
                sh """
                echo $DOCKERHUB_CREDENTIALS_PSW | docker login -u $DOCKERHUB_CREDENTIALS_USR --password-stdin
                """
            }
        }

        stage('Push Images') {
            steps {
                sh """
                docker push $BACKEND_IMAGE
                docker push $FRONTEND_IMAGE
                """
            }
        }

        stage('Configure Kubeconfig (EKS FIX)') {
            steps {
                sh """
                aws eks update-kubeconfig \
                    --region $AWS_REGION \
                    --name $CLUSTER_NAME

                kubectl get nodes
                """
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                sh """
                sed -i 's|image:.*|image: '"$BACKEND_IMAGE"'|g' Kubernetes/backend-deployment.yaml
                sed -i 's|image:.*|image: '"$FRONTEND_IMAGE"'|g' Kubernetes/frontend-deployment.yaml

                kubectl apply -f Kubernetes/backend-deployment.yaml
                kubectl apply -f Kubernetes/frontend-deployment.yaml
                """
            }
        }

        stage('Verify Deployment') {
            steps {
                sh """
                kubectl get pods
                kubectl get svc
                kubectl rollout status deployment/backend
                kubectl rollout status deployment/frontend
                """
            }
        }
    }

    post {
        success {
            echo "🚀 Deployment Successful!"
        }
        failure {
            echo "❌ Deployment Failed!"
        }
    }
}
