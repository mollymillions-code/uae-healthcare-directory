pipeline {
  agent any

  options {
    disableConcurrentBuilds()
    timeout(time: 60, unit: 'MINUTES')
    timestamps()
    buildDiscarder(logRotator(numToKeepStr: '30'))
  }

  triggers {
    pollSCM('')
  }

  environment {
    NODE_ENV = 'production'
    NEXT_TELEMETRY_DISABLED = '1'
    NEXT_PRIVATE_BUILD_WORKER_COUNT = '1'
    DEPLOY_WEBHOOK_URL = credentials('zavis-deploy-webhook-url')
    DEPLOY_WEBHOOK_SECRET = credentials('zavis-deploy-webhook-secret')
  }

  stages {
    stage('Install') {
      steps {
        sh 'npm ci'
      }
    }

    stage('Lint') {
      steps {
        sh 'npm run lint'
      }
    }

    stage('Type Check') {
      steps {
        sh 'npx tsc --noEmit --pretty false'
      }
    }

    stage('Build') {
      steps {
        sh 'npm run build'
      }
    }

    stage('Deploy Gate') {
      when {
        branch 'live'
      }
      steps {
        sh '''
          set -euo pipefail
          payload=$(node -e '
            const payload = {
              ref: "refs/heads/live",
              after: process.env.GIT_COMMIT,
              repository: { full_name: "zavis-support/zavis-landing" },
              sender: { login: "jenkins" },
              head_commit: { message: "Jenkins deploy gate" }
            };
            process.stdout.write(JSON.stringify(payload));
          ')
          sig=$(printf "%s" "$payload" | openssl dgst -sha256 -hmac "$DEPLOY_WEBHOOK_SECRET" -binary | xxd -p -c 256)
          curl -fsS -X POST "$DEPLOY_WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -H "X-GitHub-Event: push" \
            -H "X-GitHub-Delivery: jenkins-${BUILD_TAG}" \
            -H "X-Hub-Signature-256: sha256=$sig" \
            --data "$payload"
        '''
      }
    }
  }
}
