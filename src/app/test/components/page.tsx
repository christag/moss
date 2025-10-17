'use client'

import React, { useState } from 'react'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { Pagination } from '@/components/ui/Pagination'
import { Footer } from '@/components/Footer'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/Checkbox'
import { Select } from '@/components/ui/Select'

export default function ComponentShowcasePage() {
  const [currentPage, setCurrentPage] = useState(1)

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{ flex: 1, padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}
      >
        {/* Page Header */}
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Component Showcase</h1>
        <p style={{ color: '#6B7885', marginBottom: '2rem' }}>
          Testing all updated components with Figma design specs
        </p>

        {/* Breadcrumb */}
        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Breadcrumb</h2>
          <Breadcrumb
            items={[
              { label: 'Home', href: '/' },
              { label: 'Test', href: '/test' },
              { label: 'Components' },
            ]}
          />
        </section>

        <hr />

        {/* Buttons */}
        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Buttons</h2>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <Button variant="primary">Primary Button</Button>
            <Button variant="secondary">Secondary Button</Button>
            <Button variant="outline">Outline Button</Button>
            <Button variant="destructive">Destructive Button</Button>
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Button variant="primary" disabled>
              Disabled Primary
            </Button>
            <Button variant="secondary" disabled>
              Disabled Secondary
            </Button>
          </div>
        </section>

        <hr />

        {/* Form Components */}
        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Form Components</h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.5rem',
            }}
          >
            <Input
              label="Text Input"
              placeholder="Enter your name"
              helperText="This is a helper text"
            />

            <Input
              label="Email Input"
              type="email"
              placeholder="email@example.com"
              error="Invalid email address"
            />

            <Select
              label="Select Dropdown"
              options={[
                { value: 'option1', label: 'Option 1' },
                { value: 'option2', label: 'Option 2' },
                { value: 'option3', label: 'Option 3' },
              ]}
              helperText="Choose an option"
            />

            <Select
              label="Select with Error"
              options={[
                { value: 'option1', label: 'Option 1' },
                { value: 'option2', label: 'Option 2' },
              ]}
              error="This field is required"
            />
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <Checkbox label="Standard Checkbox" />
            <Checkbox label="Checkbox with Helper Text" helperText="Additional information here" />
            <Checkbox label="Checkbox with Error" error="Please check this box" />
            <Checkbox label="Required Checkbox" required />
          </div>
        </section>

        <hr />

        {/* Pagination */}
        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Pagination</h2>
          <p style={{ color: '#6B7885', marginBottom: '1rem' }}>
            Current page: {currentPage} of 10
          </p>
          <Pagination currentPage={currentPage} totalPages={10} onPageChange={setCurrentPage} />
        </section>

        <hr />

        {/* Horizontal Rules */}
        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Horizontal Rules</h2>
          <p>Standard horizontal rule above (default 1px, #C4C4C4)</p>
          <hr className="hr-thick" />
          <p>Thick horizontal rule above (2px)</p>
        </section>

        <hr />

        {/* Typography */}
        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Typography</h2>
          <h1>Heading 1 - Display</h1>
          <h2>Heading 2 - H1</h2>
          <h3>Heading 3 - H2</h3>
          <h4>Heading 4 - H3</h4>
          <p>Body text - 18px base size with 1.5 line height.</p>
          <p className="text-sm">Small text - 14px for helper text and labels.</p>
        </section>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}
