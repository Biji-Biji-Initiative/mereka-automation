pipeline {
    agent any
    
    triggers {
        // Run daily at 9 AM
        cron('0 9 * * *')
    }
    
    parameters {
        choice(
            name: 'TEST_ENV',
            choices: ['dev', 'staging', 'prod'],
            description: 'Environment to run tests against'
        )
        choice(
            name: 'BROWSER',
            choices: ['chromium', 'firefox', 'webkit', 'all'],
            description: 'Browser to run tests on'
        )
    }
    
    environment {
        NODE_VERSION = '18'
        PLAYWRIGHT_BROWSERS_PATH = '0'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }
        
        stage('Install Playwright') {
            steps {
                sh 'npx playwright install --with-deps'
            }
        }
        
        stage('Run Tests') {
            steps {
                script {
                    def browserOption = params.BROWSER == 'all' ? '' : "--project=${params.BROWSER}"
                    sh "npx playwright test ${browserOption} --headed=false --workers=5"
                }
            }
        }
        
        stage('Generate Report') {
            steps {
                publishHTML([
                    allowMissing: false,
                    alwaysLinkToLastBuild: true,
                    keepAll: true,
                    reportDir: 'playwright-report',
                    reportFiles: 'index.html',
                    reportName: 'Playwright Test Report'
                ])
            }
        }
    }
    
    post {
        always {
            archiveArtifacts artifacts: 'playwright-report/**, test-results/**', allowEmptyArchive: true
        }
        failure {
            emailext (
                subject: "Playwright Tests Failed - ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: "Tests failed. Check the report at: ${env.BUILD_URL}",
                to: "${env.QA_TEAM_EMAIL}"
            )
        }
    }
} 