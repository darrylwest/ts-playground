// LoginForm.stories.ts
import type { Meta, StoryObj } from '@storybook/vue3'
import LoginForm from './LoginForm.vue'

const meta: Meta<typeof LoginForm> = {
  title: 'Components/LoginForm',
  component: LoginForm,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A responsive login form component with email and password fields.'
      }
    }
  },
  argTypes: {
    onSuccess: { action: 'success' },
    onError: { action: 'error' }
  }
}

export default meta
type Story = StoryObj<typeof meta>

// Default story
export const Default: Story = {
  args: {
    onSuccess: (user) => console.log('Login successful:', user),
    onError: (error) => console.error('Login failed:', error)
  }
}

// Story with loading state
export const Loading: Story = {
  args: {
    ...Default.args
  },
  play: async ({ canvasElement }) => {
    // Simulate loading state by filling form and submitting
    const canvas = canvasElement
    const emailInput = canvas.querySelector('input[type="email"]') as HTMLInputElement
    const passwordInput = canvas.querySelector('input[type="password"]') as HTMLInputElement
    const submitButton = canvas.querySelector('button[type="submit"]') as HTMLButtonElement
    
    if (emailInput && passwordInput && submitButton) {
      emailInput.value = 'user@example.com'
      passwordInput.value = 'password123'
      emailInput.dispatchEvent(new Event('input'))
      passwordInput.dispatchEvent(new Event('input'))
      
      // Note: In real Storybook, you'd mock the tRPC call to show loading state
      // submitButton.click()
    }
  }
}

// Story with validation errors
export const WithErrors: Story = {
  args: {
    ...Default.args
  },
  play: async ({ canvasElement }) => {
    const canvas = canvasElement
    const submitButton = canvas.querySelector('button[type="submit"]') as HTMLButtonElement
    
    if (submitButton) {
      submitButton.click()
    }
  }
}

// Story for mobile view
export const Mobile: Story = {
  args: {
    ...Default.args
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    }
  }
}

// Story showing different states for design review
export const DesignReview: Story = {
  render: () => ({
    components: { LoginForm },
    template: `
      <div style="display: flex; gap: 2rem; flex-wrap: wrap;">
        <div>
          <h3>Default State</h3>
          <LoginForm />
        </div>
        <div>
          <h3>With Content</h3>
          <LoginForm />
        </div>
      </div>
    `
  })
}
