<!-- LoginForm.vue -->
<template>
  <div class="login-container">
    <h2 class="login-title">Login</h2>
    <form class="login-form" @submit.prevent="handleSubmit">
      <div class="form-group">
        <label class="form-label" for="email">Email</label>
        <input 
          type="email" 
          id="email" 
          v-model="formData.email"
          :class="['form-input', { error: errors.email }]"
          placeholder="Enter your email"
          required
        />
        <div v-if="errors.email" class="error-message">{{ errors.email }}</div>
      </div>
      
      <div class="form-group">
        <label class="form-label" for="password">Password</label>
        <input 
          type="password" 
          id="password" 
          v-model="formData.password"
          :class="['form-input', { error: errors.password }]"
          placeholder="Enter your password"
          required
        />
        <div v-if="errors.password" class="error-message">{{ errors.password }}</div>
      </div>
      
      <button 
        type="submit" 
        class="submit-button"
        :disabled="isLoading"
      >
        {{ isLoading ? 'Signing In...' : 'Sign In' }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { trpc } from '@/utils/trpc' // Your tRPC client

// Types
interface FormData {
  email: string
  password: string
}

interface FormErrors {
  email?: string
  password?: string
}

// Props
interface Props {
  onSuccess?: (user: any) => void
  onError?: (error: string) => void
}

const props = withDefaults(defineProps<Props>(), {
  onSuccess: () => {},
  onError: () => {}
})

// Reactive state
const formData = reactive<FormData>({
  email: '',
  password: ''
})

const errors = reactive<FormErrors>({})
const isLoading = ref(false)

// Validation
const validateForm = (): boolean => {
  // Clear previous errors
  Object.keys(errors).forEach(key => delete errors[key as keyof FormErrors])
  
  let isValid = true
  
  if (!formData.email) {
    errors.email = 'Email is required'
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = 'Please enter a valid email'
    isValid = false
  }
  
  if (!formData.password) {
    errors.password = 'Password is required'
    isValid = false
  } else if (formData.password.length < 6) {
    errors.password = 'Password must be at least 6 characters'
    isValid = false
  }
  
  return isValid
}

// Submit handler with tRPC
const handleSubmit = async () => {
  if (!validateForm()) return
  
  isLoading.value = true
  
  try {
    const result = await trpc.auth.login.mutate({
      email: formData.email,
      password: formData.password
    })
    
    props.onSuccess(result.user)
    
    // Reset form
    formData.email = ''
    formData.password = ''
    
  } catch (error: any) {
    const errorMessage = error.message || 'Login failed. Please try again.'
    props.onError(errorMessage)
    
    // You might want to show specific field errors
    if (error.code === 'INVALID_CREDENTIALS') {
      errors.email = 'Invalid email or password'
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.login-container {
  max-width: 400px;
  margin: 2rem auto;
  padding: 2rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
}

.form-input {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.form-input.error {
  border-color: #dc3545;
}

.error-message {
  color: #dc3545;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

.submit-button {
  padding: 0.75rem 1.5rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.submit-button:hover {
  background: #0056b3;
}

.submit-button:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.login-title {
  text-align: center;
  margin-bottom: 1.5rem;
  color: #333;
  font-size: 1.5rem;
}
</style>
