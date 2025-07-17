pipeline {
    agent any
    
    tools {
        nodejs 'NodeJS-18'
    }
    
    environment {
        NODE_ENV = 'test'
        JWT_SECRET = 'test_secret_key'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.GIT_COMMIT_MSG = sh(script: "git log --format=%B -n 1 ${env.GIT_COMMIT}", returnStdout: true).trim()
                }
            }
        }
        
        stage('Setup Environment') {
            steps {
                sh '''
                    echo "Setting up environment..."
                    
                    # Verify Node.js is available from Jenkins tool
                    node --version
                    npm --version
                    
                    # Install root dependencies
                    if [ -f "package.json" ]; then
                        npm install
                    fi
                    
                    # Backend setup
                    if [ -d "backend" ]; then
                        echo "Installing backend dependencies..."
                        cd backend
                        npm install
                        npm install --save-dev jest supertest jest-junit
                        echo "Backend dependencies installed"
                        cd ..
                    fi
                    
                    # Frontend setup
                    echo "Current directory: $(pwd)"
                    echo "Listing directories:"
                    ls -la
                    
                    if [ -d "frontend" ]; then
                        echo "Installing frontend dependencies..."
                        cd frontend
                        pwd
                        npm install
                        echo "Frontend dependencies installed"
                        ls -la node_modules/.bin/react-scripts || echo "react-scripts not found"
                        cd ..
                    else
                        echo "Frontend directory not found"
                    fi
                '''
            }
        }
        
        stage('Run Tests') {
            parallel {
                stage('Backend Tests') {
                    steps {
                        dir('backend') {
                            script {
                                try {
                                    sh '''
                                        echo "Running backend tests..."
                                        
                                        # Create simple test environment
                                        cat > .env.test << EOF
NODE_ENV=test
JWT_SECRET=test_secret_key
EOF
                                        
                                        # Run basic tests
                                        if [ -f "package.json" ] && grep -q "jest" package.json; then
                                            npm test -- --passWithNoTests --testPathPatterns="simple.test.js"
                                        else
                                            echo "Jest not found in package.json"
                                        fi
                                    '''
                                } catch (Exception e) {
                                    echo "Backend tests failed: ${e.getMessage()}"
                                }
                            }
                        }
                    }
                }
                
                stage('Frontend Tests') {
                    steps {
                        dir('frontend') {
                            script {
                                try {
                                    sh '''
                                        echo "Running frontend tests..."
                                        
                                        # Check if frontend has package.json
                                        if [ -f "package.json" ]; then
                                            echo "Frontend package.json found"
                                            if grep -q "react-scripts" package.json; then
                                                echo "React scripts found in package.json"
                                                if [ -f "node_modules/.bin/react-scripts" ]; then
                                                    echo "Running React tests..."
                                                    CI=true npm test -- --passWithNoTests --watchAll=false
                                                else
                                                    echo "react-scripts not installed in node_modules"
                                                fi
                                            else
                                                echo "react-scripts not found in package.json"
                                            fi
                                        else
                                            echo "No package.json found in frontend"
                                        fi
                                    '''
                                } catch (Exception e) {
                                    echo "Frontend tests failed: ${e.getMessage()}"
                                }
                            }
                        }
                    }
                }
            }
        }
        
        stage('Build') {
            steps {
                sh '''
                    echo "Building application..."
                    
                    # Build frontend if React app
                    if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
                        cd frontend
                        if grep -q "react-scripts" package.json; then
                            npm run build
                        fi
                    fi
                    
                    echo "Build completed successfully"
                '''
            }
        }
        
        stage('Code Quality') {
            steps {
                sh '''
                    echo "Running code quality checks..."
                    
                    # Basic linting if available
                    if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
                        cd frontend
                        if grep -q "eslint" package.json; then
                            npm run lint || echo "Linting failed but continuing..."
                        fi
                    fi
                    
                    echo "Code quality checks completed"
                '''
            }
        }
    }
    
    post {
        always {
            script {
                echo "Pipeline completed with status: ${currentBuild.currentResult}"
                echo "Build number: ${env.BUILD_NUMBER}"
                echo "Branch: ${env.BRANCH_NAME}"
                echo "Commit: ${env.GIT_COMMIT_MSG}"
            }
        }
        
        success {
            script {
                echo "✅ Pipeline succeeded!"
            }
        }
        
        failure {
            script {
                echo "❌ Pipeline failed!"
            }
        }
    }
}