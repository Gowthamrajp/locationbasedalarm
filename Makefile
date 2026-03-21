# ============================================================
# Vigilant Path - Development Commands
# ============================================================
# Usage: make <command>
# ============================================================

.PHONY: help build test install run clean deploy check

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Development
run: ## Start Expo dev server
	npx expo start

run-android: ## Run on Android device (debug)
	npx expo run:android

run-release: ## Run on Android device (release)
	npx expo run:android --variant release

# Building
build: ## Build release APK
	cd android && chmod +x gradlew && ./gradlew app:assembleRelease -x lint -x test
	@echo "\n✅ APK: android/app/build/outputs/apk/release/app-release.apk"

build-aab: ## Build release AAB for Play Store
	cd android && chmod +x gradlew && ./gradlew app:bundleRelease -x lint -x test
	@echo "\n✅ AAB: android/app/build/outputs/bundle/release/app-release.aab"

build-all: build build-aab ## Build both APK and AAB

# Testing
test: ## Run local build + test (full pipeline)
	chmod +x scripts/local-build-test.sh && ./scripts/local-build-test.sh

test-only: ## Run Appium tests only (APK must exist)
	APK_PATH=$$(pwd)/android/app/build/outputs/apk/release/app-release.apk npx wdio tests/appium/wdio.conf.js

# Installation
install: build ## Build and install APK on connected device
	$$ANDROID_HOME/platform-tools/adb install -r android/app/build/outputs/apk/release/app-release.apk

# Deployment
deploy: ## Create a release tag and push (triggers CI/CD)
	@read -p "Version (e.g., 1.0.9): " version; \
	git tag v$$version && git push origin main --tags && \
	echo "\n✅ Tagged v$$version and pushed. CI/CD will build, test, and deploy."

# Git
check: ## Build, test, commit and push
	./scripts/local-build-test.sh
	@echo "\n🔄 Ready to push. Run: git add -A && git commit -m 'message' && git push"

pr: ## Create a pull request
	gh pr create --fill

# Cleanup
clean: ## Clean build artifacts
	cd android && ./gradlew clean
	@echo "✅ Build artifacts cleaned"
