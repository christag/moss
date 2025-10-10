'use client'

import {
  Button,
  Input,
  Select,
  Textarea,
  Badge,
  Card,
  CardHeader,
  CardContent,
  Checkbox,
} from '@/components/ui'

export default function Home() {
  return (
    <main className="container">
      <div className="p-3xl">
        <h1 className="text-4xl font-bold text-blue mb-lg">M.O.S.S.</h1>
        <p className="text-lg mb-md">Material Organization & Storage System</p>
        <p className="text-md mb-2xl">IT Asset Management Platform</p>

        <div className="grid grid-2 mb-3xl">
          <Card>
            <CardHeader>Design System Demo</CardHeader>
            <CardContent>
              <p className="mb-lg">
                Welcome to M.O.S.S.! The application foundation has been successfully set up with:
              </p>
              <ul className="mb-lg pl-lg">
                <li>✓ Next.js 15 with TypeScript</li>
                <li>✓ Custom design system with Inter font</li>
                <li>✓ ESLint + Prettier configuration</li>
                <li>✓ Git hooks with Husky</li>
                <li>✓ Jest testing framework</li>
                <li>✓ Core UI component library</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>Component Library</CardHeader>
            <CardContent>
              <div className="mb-md">
                <h6 className="mb-sm">Badges</h6>
                <div className="flex gap-sm mb-md">
                  <Badge variant="success">Active</Badge>
                  <Badge variant="warning">Warning</Badge>
                  <Badge variant="error">Error</Badge>
                  <Badge variant="info">Info</Badge>
                </div>
              </div>

              <div className="mb-md">
                <h6 className="mb-sm">Buttons</h6>
                <div className="flex gap-sm mb-md">
                  <Button variant="primary" size="sm">
                    Primary
                  </Button>
                  <Button variant="secondary" size="sm">
                    Secondary
                  </Button>
                  <Button variant="outline" size="sm">
                    Outline
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-3xl">
          <Card>
            <CardHeader>Form Components</CardHeader>
            <CardContent>
              <div className="grid grid-2">
                <Input label="Text Input" placeholder="Enter text..." />
                <Select
                  label="Select Option"
                  options={[
                    { value: 'option1', label: 'Option 1' },
                    { value: 'option2', label: 'Option 2' },
                  ]}
                  placeholder="Choose an option"
                />
              </div>
              <Textarea label="Textarea" placeholder="Enter description..." />
              <Checkbox label="I agree to the terms and conditions" />
              <Button variant="primary" className="mt-md">
                Submit
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-2xl">
          <p className="text-sm text-black opacity-60">
            Phase 0 Setup Complete ✓ | Next: Database Setup & API Foundation
          </p>
        </div>
      </div>
    </main>
  )
}
