/**
 * Assign Role Modal Component
 * Multi-step form for assigning roles to people or groups with scoping
 */

'use client'

import { useState, useEffect } from 'react'
import { Button, Input } from '@/components/ui'
import type { Role, Person, Group, Location } from '@/types'

interface AssignRoleModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

type AssigneeType = 'person' | 'group'
type ScopeType = 'global' | 'location' | 'specific_objects'

interface FormData {
  assignee_type: AssigneeType
  person_id: string | null
  group_id: string | null
  role_id: string
  scope: ScopeType
  location_ids: string[]
  notes: string
}

export default function AssignRoleModal({ isOpen, onClose, onSuccess }: AssignRoleModalProps) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    assignee_type: 'person',
    person_id: null,
    group_id: null,
    role_id: '',
    scope: 'global',
    location_ids: [],
    notes: '',
  })

  // Search states
  const [personSearch, setPersonSearch] = useState('')
  const [groupSearch, setGroupSearch] = useState('')
  const [people, setPeople] = useState<Person[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [locations, setLocations] = useState<Location[]>([])

  // Loading states
  const [loading, setLoading] = useState(false)
  const [searchingPeople, setSearchingPeople] = useState(false)
  const [searchingGroups, setSearchingGroups] = useState(false)

  // Selected entities for display
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)

  // Fetch roles and locations on mount
  useEffect(() => {
    if (isOpen) {
      fetchRoles()
      fetchLocations()
    }
  }, [isOpen])

  // Search people when search term changes
  useEffect(() => {
    if (personSearch.length >= 2) {
      searchPeople(personSearch)
    } else {
      setPeople([])
    }
  }, [personSearch])

  // Search groups when search term changes
  useEffect(() => {
    if (groupSearch.length >= 2) {
      searchGroups(groupSearch)
    } else {
      setGroups([])
    }
  }, [groupSearch])

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/roles')
      const data = await response.json()
      if (data.success) {
        setRoles(data.data)
      }
    } catch (err) {
      console.error('Error fetching roles:', err)
    }
  }

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/locations')
      const data = await response.json()
      if (data.success) {
        setLocations(data.data)
      }
    } catch (err) {
      console.error('Error fetching locations:', err)
    }
  }

  const searchPeople = async (query: string) => {
    setSearchingPeople(true)
    try {
      const response = await fetch(`/api/people?search=${encodeURIComponent(query)}&limit=10`)
      const data = await response.json()
      if (data.success) {
        setPeople(data.data)
      }
    } catch (err) {
      console.error('Error searching people:', err)
    } finally {
      setSearchingPeople(false)
    }
  }

  const searchGroups = async (query: string) => {
    setSearchingGroups(true)
    try {
      const response = await fetch(`/api/groups?search=${encodeURIComponent(query)}&limit=10`)
      const data = await response.json()
      if (data.success) {
        setGroups(data.data)
      }
    } catch (err) {
      console.error('Error searching groups:', err)
    } finally {
      setSearchingGroups(false)
    }
  }

  const handlePersonSelect = (person: Person) => {
    setSelectedPerson(person)
    setFormData({ ...formData, person_id: person.id, group_id: null })
    setPeople([])
    setPersonSearch('')
  }

  const handleGroupSelect = (group: Group) => {
    setSelectedGroup(group)
    setFormData({ ...formData, group_id: group.id, person_id: null })
    setGroups([])
    setGroupSearch('')
  }

  const handleRoleSelect = (roleId: string) => {
    const role = roles.find((r) => r.id === roleId)
    setSelectedRole(role || null)
    setFormData({ ...formData, role_id: roleId })
  }

  const handleLocationToggle = (locationId: string) => {
    const newLocationIds = formData.location_ids.includes(locationId)
      ? formData.location_ids.filter((id) => id !== locationId)
      : [...formData.location_ids, locationId]
    setFormData({ ...formData, location_ids: newLocationIds })
  }

  const canProceedFromStep = (currentStep: number): boolean => {
    switch (currentStep) {
      case 1:
        return !!(formData.person_id || formData.group_id)
      case 2:
        return !!formData.role_id
      case 3:
        return formData.scope !== 'location' || formData.location_ids.length > 0
      default:
        return true
    }
  }

  const handleNext = () => {
    if (canProceedFromStep(step)) {
      // Skip location selection if scope is not 'location'
      if (step === 3 && formData.scope !== 'location') {
        setStep(5)
      } else {
        setStep(step + 1)
      }
    }
  }

  const handleBack = () => {
    // Skip location selection if scope is not 'location'
    if (step === 5 && formData.scope !== 'location') {
      setStep(3)
    } else {
      setStep(step - 1)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const payload = {
        person_id: formData.person_id,
        group_id: formData.group_id,
        role_id: formData.role_id,
        scope: formData.scope,
        location_ids: formData.scope === 'location' ? formData.location_ids : undefined,
        notes: formData.notes || undefined,
      }

      const response = await fetch('/api/role-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (data.success) {
        alert('Role assigned successfully')
        handleClose()
        onSuccess()
      } else {
        alert(data.message || 'Failed to assign role')
      }
    } catch (err) {
      alert('An error occurred while assigning role')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setStep(1)
    setFormData({
      assignee_type: 'person',
      person_id: null,
      group_id: null,
      role_id: '',
      scope: 'global',
      location_ids: [],
      notes: '',
    })
    setSelectedPerson(null)
    setSelectedGroup(null)
    setSelectedRole(null)
    setPersonSearch('')
    setGroupSearch('')
    setPeople([])
    setGroups([])
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
        }}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'var(--color-off-white)',
          borderRadius: '8px',
          padding: 'var(--spacing-xl)',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
          zIndex: 1001,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ marginBottom: 'var(--spacing-xl)' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: 'var(--spacing-xs)' }}>
            Assign Role
          </h2>
          <p style={{ color: 'var(--color-brew-black-60)', fontSize: '0.875rem' }}>
            Step {step} of 5
          </p>
        </div>

        {/* Progress Indicator */}
        <div
          style={{
            display: 'flex',
            gap: 'var(--spacing-xs)',
            marginBottom: 'var(--spacing-xl)',
          }}
        >
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: '4px',
                backgroundColor:
                  i <= step ? 'var(--color-morning-blue)' : 'var(--color-brew-black-20)',
                borderRadius: '2px',
              }}
            />
          ))}
        </div>

        {/* Step 1: Select Assignee */}
        {step === 1 && (
          <div>
            <h3
              style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: 'var(--spacing-lg)' }}
            >
              Who should receive this role?
            </h3>

            {/* Assignee Type Toggle */}
            <div
              style={{
                display: 'flex',
                gap: 'var(--spacing-md)',
                marginBottom: 'var(--spacing-lg)',
              }}
            >
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, assignee_type: 'person', group_id: null })
                }
                style={{
                  flex: 1,
                  padding: 'var(--spacing-md)',
                  border: `2px solid ${formData.assignee_type === 'person' ? 'var(--color-morning-blue)' : 'var(--color-brew-black-20)'}`,
                  borderRadius: '6px',
                  backgroundColor:
                    formData.assignee_type === 'person' ? 'var(--color-light-blue)' : 'transparent',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                Person
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, assignee_type: 'group', person_id: null })
                }
                style={{
                  flex: 1,
                  padding: 'var(--spacing-md)',
                  border: `2px solid ${formData.assignee_type === 'group' ? 'var(--color-morning-blue)' : 'var(--color-brew-black-20)'}`,
                  borderRadius: '6px',
                  backgroundColor:
                    formData.assignee_type === 'group' ? 'var(--color-light-blue)' : 'transparent',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                Group
              </button>
            </div>

            {/* Person Search */}
            {formData.assignee_type === 'person' && (
              <div>
                <label
                  htmlFor="person_search"
                  style={{
                    display: 'block',
                    fontWeight: '600',
                    marginBottom: 'var(--spacing-sm)',
                  }}
                >
                  Search for a person
                </label>
                <Input
                  id="person_search"
                  type="text"
                  value={personSearch}
                  onChange={(e) => setPersonSearch(e.target.value)}
                  placeholder="Type name or email..."
                  disabled={!!selectedPerson}
                />
                {searchingPeople && (
                  <p
                    style={{ marginTop: 'var(--spacing-sm)', color: 'var(--color-brew-black-60)' }}
                  >
                    Searching...
                  </p>
                )}
                {people.length > 0 && (
                  <div
                    style={{
                      marginTop: 'var(--spacing-sm)',
                      border: '1px solid var(--color-brew-black-20)',
                      borderRadius: '6px',
                      overflow: 'hidden',
                    }}
                  >
                    {people.map((person) => (
                      <button
                        key={person.id}
                        type="button"
                        onClick={() => handlePersonSelect(person)}
                        style={{
                          width: '100%',
                          padding: 'var(--spacing-md)',
                          textAlign: 'left',
                          border: 'none',
                          borderBottom: '1px solid var(--color-brew-black-20)',
                          backgroundColor: 'transparent',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ fontWeight: '600' }}>{person.full_name}</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--color-brew-black-60)' }}>
                          {person.email}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {selectedPerson && (
                  <div
                    style={{
                      marginTop: 'var(--spacing-md)',
                      padding: 'var(--spacing-md)',
                      backgroundColor: 'var(--color-light-blue)',
                      borderRadius: '6px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '600' }}>{selectedPerson.full_name}</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--color-brew-black-60)' }}>
                        {selectedPerson.email}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPerson(null)
                        setFormData({ ...formData, person_id: null })
                      }}
                      style={{
                        padding: 'var(--spacing-sm)',
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: 'var(--color-orange)',
                        cursor: 'pointer',
                        fontWeight: '600',
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Group Search */}
            {formData.assignee_type === 'group' && (
              <div>
                <label
                  htmlFor="group_search"
                  style={{
                    display: 'block',
                    fontWeight: '600',
                    marginBottom: 'var(--spacing-sm)',
                  }}
                >
                  Search for a group
                </label>
                <Input
                  id="group_search"
                  type="text"
                  value={groupSearch}
                  onChange={(e) => setGroupSearch(e.target.value)}
                  placeholder="Type group name..."
                  disabled={!!selectedGroup}
                />
                {searchingGroups && (
                  <p
                    style={{ marginTop: 'var(--spacing-sm)', color: 'var(--color-brew-black-60)' }}
                  >
                    Searching...
                  </p>
                )}
                {groups.length > 0 && (
                  <div
                    style={{
                      marginTop: 'var(--spacing-sm)',
                      border: '1px solid var(--color-brew-black-20)',
                      borderRadius: '6px',
                      overflow: 'hidden',
                    }}
                  >
                    {groups.map((group) => (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => handleGroupSelect(group)}
                        style={{
                          width: '100%',
                          padding: 'var(--spacing-md)',
                          textAlign: 'left',
                          border: 'none',
                          borderBottom: '1px solid var(--color-brew-black-20)',
                          backgroundColor: 'transparent',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ fontWeight: '600' }}>{group.group_name}</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--color-brew-black-60)' }}>
                          {group.group_type}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {selectedGroup && (
                  <div
                    style={{
                      marginTop: 'var(--spacing-md)',
                      padding: 'var(--spacing-md)',
                      backgroundColor: 'var(--color-light-blue)',
                      borderRadius: '6px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '600' }}>{selectedGroup.group_name}</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--color-brew-black-60)' }}>
                        {selectedGroup.group_type}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedGroup(null)
                        setFormData({ ...formData, group_id: null })
                      }}
                      style={{
                        padding: 'var(--spacing-sm)',
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: 'var(--color-orange)',
                        cursor: 'pointer',
                        fontWeight: '600',
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Select Role */}
        {step === 2 && (
          <div>
            <h3
              style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: 'var(--spacing-lg)' }}
            >
              Select a role to assign
            </h3>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-sm)',
              }}
            >
              {roles.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => handleRoleSelect(role.id)}
                  style={{
                    padding: 'var(--spacing-md)',
                    textAlign: 'left',
                    border: `2px solid ${formData.role_id === role.id ? 'var(--color-morning-blue)' : 'var(--color-brew-black-20)'}`,
                    borderRadius: '6px',
                    backgroundColor:
                      formData.role_id === role.id ? 'var(--color-light-blue)' : 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontWeight: '600' }}>
                    {role.role_name}
                    {role.is_system_role && (
                      <span
                        style={{
                          marginLeft: 'var(--spacing-sm)',
                          fontSize: '0.75rem',
                          padding: '2px 6px',
                          backgroundColor: 'var(--color-brew-black-20)',
                          borderRadius: '4px',
                        }}
                      >
                        System
                      </span>
                    )}
                  </div>
                  {role.description && (
                    <div
                      style={{
                        fontSize: '0.875rem',
                        color: 'var(--color-brew-black-60)',
                        marginTop: 'var(--spacing-xs)',
                      }}
                    >
                      {role.description}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Select Scope */}
        {step === 3 && (
          <div>
            <h3
              style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: 'var(--spacing-lg)' }}
            >
              What scope should this role have?
            </h3>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-md)',
              }}
            >
              <button
                type="button"
                onClick={() => setFormData({ ...formData, scope: 'global', location_ids: [] })}
                style={{
                  padding: 'var(--spacing-md)',
                  textAlign: 'left',
                  border: `2px solid ${formData.scope === 'global' ? 'var(--color-morning-blue)' : 'var(--color-brew-black-20)'}`,
                  borderRadius: '6px',
                  backgroundColor:
                    formData.scope === 'global' ? 'var(--color-light-blue)' : 'transparent',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontWeight: '600' }}>Global</div>
                <div
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--color-brew-black-60)',
                    marginTop: 'var(--spacing-xs)',
                  }}
                >
                  Access to all objects across the entire system
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, scope: 'location' })}
                style={{
                  padding: 'var(--spacing-md)',
                  textAlign: 'left',
                  border: `2px solid ${formData.scope === 'location' ? 'var(--color-morning-blue)' : 'var(--color-brew-black-20)'}`,
                  borderRadius: '6px',
                  backgroundColor:
                    formData.scope === 'location' ? 'var(--color-light-blue)' : 'transparent',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontWeight: '600' }}>Location-based</div>
                <div
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--color-brew-black-60)',
                    marginTop: 'var(--spacing-xs)',
                  }}
                >
                  Access limited to specific locations and their assets
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, scope: 'specific_objects', location_ids: [] })
                }
                style={{
                  padding: 'var(--spacing-md)',
                  textAlign: 'left',
                  border: `2px solid ${formData.scope === 'specific_objects' ? 'var(--color-morning-blue)' : 'var(--color-brew-black-20)'}`,
                  borderRadius: '6px',
                  backgroundColor:
                    formData.scope === 'specific_objects'
                      ? 'var(--color-light-blue)'
                      : 'transparent',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontWeight: '600' }}>Specific Objects</div>
                <div
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--color-brew-black-60)',
                    marginTop: 'var(--spacing-xs)',
                  }}
                >
                  Access only to individually assigned objects (configured later)
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Select Locations (only if scope is location) */}
        {step === 4 && formData.scope === 'location' && (
          <div>
            <h3
              style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: 'var(--spacing-lg)' }}
            >
              Select locations for this assignment
            </h3>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-sm)',
                maxHeight: '400px',
                overflow: 'auto',
              }}
            >
              {locations.map((location) => (
                <label
                  key={location.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-md)',
                    padding: 'var(--spacing-md)',
                    border: '1px solid var(--color-brew-black-20)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    backgroundColor: formData.location_ids.includes(location.id)
                      ? 'var(--color-light-blue)'
                      : 'transparent',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.location_ids.includes(location.id)}
                    onChange={() => handleLocationToggle(location.id)}
                    style={{ width: '20px', height: '20px' }}
                  />
                  <div>
                    <div style={{ fontWeight: '600' }}>{location.location_name}</div>
                    {location.address_line1 && (
                      <div style={{ fontSize: '0.875rem', color: 'var(--color-brew-black-60)' }}>
                        {location.address_line1}
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
            <p
              style={{
                marginTop: 'var(--spacing-md)',
                fontSize: '0.875rem',
                color: 'var(--color-brew-black-60)',
              }}
            >
              Selected: {formData.location_ids.length} location
              {formData.location_ids.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Step 5: Add Notes (optional) */}
        {step === 5 && (
          <div>
            <h3
              style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: 'var(--spacing-lg)' }}
            >
              Add notes (optional)
            </h3>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any notes about this role assignment..."
              rows={4}
              style={{
                width: '100%',
                padding: 'var(--spacing-md)',
                border: '1px solid var(--color-brew-black-20)',
                borderRadius: '6px',
                fontSize: '1rem',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />

            {/* Summary */}
            <div
              style={{
                marginTop: 'var(--spacing-xl)',
                padding: 'var(--spacing-lg)',
                backgroundColor: 'var(--color-light-blue)',
                borderRadius: '6px',
              }}
            >
              <h4 style={{ fontWeight: '600', marginBottom: 'var(--spacing-md)' }}>
                Assignment Summary
              </h4>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--spacing-sm)',
                  fontSize: '0.875rem',
                }}
              >
                <div>
                  <strong>Assignee:</strong>{' '}
                  {selectedPerson?.full_name || selectedGroup?.group_name || 'None'}
                </div>
                <div>
                  <strong>Role:</strong> {selectedRole?.role_name || 'None'}
                </div>
                <div>
                  <strong>Scope:</strong> {formData.scope}
                </div>
                {formData.scope === 'location' && (
                  <div>
                    <strong>Locations:</strong> {formData.location_ids.length} selected
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            gap: 'var(--spacing-md)',
            justifyContent: 'space-between',
            marginTop: 'var(--spacing-xl)',
          }}
        >
          <div>
            {step > 1 && (
              <Button type="button" variant="secondary" onClick={handleBack}>
                Back
              </Button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
            <Button type="button" variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            {step < 5 ? (
              <Button
                type="button"
                variant="primary"
                onClick={handleNext}
                disabled={!canProceedFromStep(step)}
              >
                Next
              </Button>
            ) : (
              <Button type="button" variant="primary" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Assigning...' : 'Assign Role'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
