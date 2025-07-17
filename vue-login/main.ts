// .storybook/main.ts
import type { StorybookConfig } from '@storybook/vue3-vite'

const config: StorybookConfig = {
  stories: [
    '../src/**/*.stories.@(js|jsx|ts|tsx|mdx)',
    '../src/**/*.story.@(js|jsx|ts|tsx)'
  ],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
    '@storybook/addon-controls',
    '@storybook/addon-viewport'
  ],
  framework: {
    name: '@storybook/vue3-vite',
    options: {}
  },
  typescript: {
    check: false,
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true)
    }
  },
  docs: {
    autodocs: 'tag'
  }
}

export default config

// .storybook/preview.ts
import type { Preview } from '@storybook/vue3'
import { app } from '@storybook/vue3'

// Mock tRPC for Storybook
const mockTrpc = {
  auth: {
    login: {
      mutate: async (data: any) => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Mock successful response
        if (data.email === 'user@example.com' && data.password === 'password123') {
          return {
            user: { id: 1, email: data.email, name: 'John Doe' }
          }
        }
        
        // Mock error response
        throw new Error('Invalid credentials')
      }
    }
  }
}

// Make mock tRPC available globally in Storybook
app.provide('trpc', mockTrpc)

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/
      }
    },
    docs: {
      toc: true
    }
  },
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        icon: 'paintbrush',
        items: ['light', 'dark'],
        showName: true
      }
    }
  }
}

export default preview
