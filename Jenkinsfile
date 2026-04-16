pipeline {
    agent any

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
