<template>
  <div class="login-container">
    <!-- Background with Rounded Kitchen Image -->
    <div class="background-wrapper">
      <div class="background-image-container">
        <img 
          src="https://images.unsplash.com/photo-1556911220-bff5a1a6f1b4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" 
          alt="Modern kitchen"
          class="rounded-background-image"
        />
      </div>
    </div>

    <div class="login-card">
      <!-- Logo/Icon -->
      <div class="login-icon">
        <span class="material-symbols-outlined">analytics</span>
      </div>

      <h1 class="login-title">Welcome Back</h1>
      <p class="login-subtitle">Sign in to Hirsch's Conversion Intelligence</p>
      
      <!-- Error Message -->
      <Transition name="fade">
        <div v-if="errorMessage" class="error-message">
          <span class="material-symbols-outlined">error</span>
          {{ errorMessage }}
        </div>
      </Transition>

      <!-- Login Form -->
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="username">
            <span class="material-symbols-outlined">person</span>
            Username
          </label>
          <input
            id="username"
            v-model="credentials.username"
            type="text"
            required
            placeholder="Enter your username"
            :disabled="loading"
          />
        </div>

        <div class="form-group">
          <label for="password">
            <span class="material-symbols-outlined">lock</span>
            Password
          </label>
          <input
            id="password"
            v-model="credentials.password"
            type="password"
            required
            placeholder="Enter your password"
            :disabled="loading"
          />
        </div>

        <button 
          type="submit" 
          class="login-button"
          :disabled="loading"
        >
          <span v-if="loading" class="spinner"></span>
          <span v-else class="material-symbols-outlined">login</span>
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>

      <!-- Demo Credentials -->
      <!-- <div class="demo-credentials">
        <p class="demo-title">Demo Access</p>
        <div class="credential-item">
          <span class="credential-badge">admin</span>
          <span class="credential-separator">/</span>
          <span class="credential-badge">secret123</span>
        </div>
        <div class="credential-item">
          <span class="credential-badge">reportUser</span>
          <span class="credential-separator">/</span>
          <span class="credential-badge">analytics456</span>
        </div>
      </div> -->

      <!-- Footer -->
      <p class="login-footer">
        © 2026 Hirsch's Conversion Intelligence
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)
const errorMessage = ref('')

const credentials = reactive({
  username: '',
  password: ''
})

// Handle login form submission
const handleLogin = async () => {
  errorMessage.value = ''
  loading.value = true

  try {
    const response = await fetch('https://ga-hirsch-frontend-1.onrender.com/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials)
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Login failed')
    }

    localStorage.setItem('isAuthenticated', 'true')
    localStorage.setItem('username', credentials.username)
    localStorage.setItem('password', credentials.password)
    
    window.dispatchEvent(new Event('login-state-changed'))
    emit('login-success', credentials.username)
    router.push('/dashboard')
    
  } catch (error) {
    errorMessage.value = error.message || 'Invalid username or password'
  } finally {
    loading.value = false
  }
}

const emit = defineEmits(['login-success'])
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0,1');

:root {
  --hirsch-blue: rgb(30, 57, 141);
  --hirsch-blue-light: rgb(50, 87, 191);
  --hirsch-blue-dark: rgb(20, 40, 100);
}

.login-container {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  font-family: 'Inter', sans-serif;
}

/* Background image */
.background-wrapper {
  position: absolute;
  inset: 0;
  z-index: -1;
}

.background-image-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.rounded-background-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: brightness(0.6) blur(2px); /* fade + soften */
}

/* Glass morphism card */
.login-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 2rem;
  width: 100%;
  max-width: 400px;
  color: #fff;
  box-shadow: 0 8px 32px rgba(0,0,0,0.25);
  text-align: center;
}

/* Titles */
.login-title {
  font-size: 1.8rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--hirsch-blue);
}

.login-subtitle {
  font-size: 0.95rem;
  margin-bottom: 1.5rem;
  opacity: 0.85;
  color: var(--hirsch-blue);
}

/* Form styling */
.login-form .form-group {
  margin-bottom: 1rem;
  text-align: left;
}

.login-form label {
  display: flex;
  align-items: center;
  font-size: 0.85rem;
  margin-bottom: 0.25rem;
  color: var(--hirsch-blue);
  font-weight: 500;
}

.login-form label .material-symbols-outlined {
  color: var(--hirsch-blue);
  font-size: 1.1rem;
  margin-right: 0.25rem;
}

.login-form input {
  width: 100%;
  padding: 0.75rem;
  border-radius: 10px;
  border: 1px solid rgba(30, 57, 141, 0.3);
  outline: none;
  background: rgba(255,255,255,0.9);
  color: #333;
  font-size: 0.95rem;
}

.login-form input:focus {
  border-color: var(--hirsch-blue);
  box-shadow: 0 0 0 2px rgba(30, 57, 141, 0.2);
}

.login-form input::placeholder {
  color: rgba(30, 57, 141, 0.5);
}

.login-form input:disabled {
  background: rgba(255,255,255,0.5);
  cursor: not-allowed;
}

/* Button */
.login-button {
  width: 100%;
  padding: 0.75rem;
  border-radius: 12px;
  border: none;
  background: var(--hirsch-blue);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, background-color 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.login-button .material-symbols-outlined {
  color: white;
  font-size: 1.2rem;
}

.login-button:hover:not(:disabled) {
  background: var(--hirsch-blue-light);
  transform: translateY(-2px);
}

.login-button:active:not(:disabled) {
  background: var(--hirsch-blue-dark);
  transform: translateY(0);
}

.login-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Error message */
.error-message {
  background: rgba(220, 38, 38, 0.2);
  border-radius: 10px;
  padding: 0.75rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #dc2626;
  border: 1px solid rgba(220, 38, 38, 0.3);
}

.error-message .material-symbols-outlined {
  color: #dc2626;
}

/* Demo credentials */
.demo-credentials {
  margin-top: 1.5rem;
  font-size: 0.85rem;
}

.demo-title {
  color: var(--hirsch-blue);
  font-weight: 600;
  margin-bottom: 0.5rem;
  opacity: 1;
}

.credential-item {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.credential-badge {
  background: rgba(30, 57, 141, 0.15);
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  color: var(--hirsch-blue);
  font-weight: 500;
  border: 1px solid rgba(30, 57, 141, 0.3);
}

.credential-separator {
  color: var(--hirsch-blue);
  opacity: 0.5;
}

/* Footer */
.login-footer {
  margin-top: 1.5rem;
  font-size: 0.75rem;
  opacity: 0.7;
  color: var(--hirsch-blue);
}

/* Spinner */
.spinner {
  width: 1.2rem;
  height: 1.2rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>