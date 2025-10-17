-- Migration 006: Enhanced RBAC with Role Hierarchy
-- Adds hierarchical role inheritance support to the RBAC system

-- Add parent_role_id to roles table for hierarchical inheritance
ALTER TABLE roles
ADD COLUMN parent_role_id UUID REFERENCES roles(id) ON DELETE SET NULL;

-- Add index for performance when querying role hierarchies
CREATE INDEX idx_roles_parent_role ON roles(parent_role_id);

-- Add comment to document the feature
COMMENT ON COLUMN roles.parent_role_id IS 'Parent role for hierarchical inheritance. Child roles inherit all parent permissions.';

-- Add CHECK constraint to prevent self-referencing roles
-- This will be enforced at application level via recursive CTE, but adding constraint for extra safety
ALTER TABLE roles
ADD CONSTRAINT chk_roles_no_self_reference CHECK (id != parent_role_id);

-- Create helper function to check for circular role hierarchy
-- This function returns true if adding parent_id to role_id would create a cycle
CREATE OR REPLACE FUNCTION check_role_hierarchy_cycle(
  role_id UUID,
  parent_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  current_parent UUID;
  max_depth INTEGER := 10; -- Prevent infinite loops
  depth INTEGER := 0;
BEGIN
  -- If parent_id is NULL, no cycle possible
  IF parent_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- If role_id equals parent_id, that's a direct self-reference
  IF role_id = parent_id THEN
    RETURN TRUE;
  END IF;

  -- Walk up the parent chain to check for cycles
  current_parent := parent_id;
  WHILE current_parent IS NOT NULL AND depth < max_depth LOOP
    -- Get the parent of current_parent
    SELECT parent_role_id INTO current_parent
    FROM roles
    WHERE id = current_parent;

    -- If we encounter role_id in the parent chain, we have a cycle
    IF current_parent = role_id THEN
      RETURN TRUE;
    END IF;

    depth := depth + 1;
  END LOOP;

  -- No cycle detected
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Add granted_by tracking to role_assignments for audit trail
ALTER TABLE role_assignments
ADD COLUMN granted_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX idx_role_assignments_granted_by ON role_assignments(granted_by);

-- Add granted_by tracking to object_permissions for audit trail
ALTER TABLE object_permissions
ADD COLUMN granted_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX idx_object_permissions_granted_by ON object_permissions(granted_by);

-- Add comments
COMMENT ON COLUMN role_assignments.granted_by IS 'User who granted this role assignment';
COMMENT ON COLUMN object_permissions.granted_by IS 'User who granted this object-level permission';

-- Create view to get role hierarchy with all inherited permissions
-- This view recursively traverses the role hierarchy and unions all permissions
CREATE OR REPLACE VIEW role_hierarchy_permissions AS
WITH RECURSIVE role_tree AS (
  -- Base case: Start with each role
  SELECT
    id as role_id,
    id as inherited_from_role_id,
    parent_role_id,
    role_name,
    0 as depth
  FROM roles

  UNION ALL

  -- Recursive case: Add parent roles
  SELECT
    rt.role_id,
    r.id as inherited_from_role_id,
    r.parent_role_id,
    r.role_name,
    rt.depth + 1
  FROM role_tree rt
  JOIN roles r ON rt.parent_role_id = r.id
  WHERE rt.depth < 10 -- Prevent infinite recursion
)
SELECT DISTINCT
  rt.role_id,
  rt.inherited_from_role_id,
  rt.depth,
  rt.role_name as inherited_from_role_name,
  p.id as permission_id,
  p.permission_name,
  p.object_type,
  p.action,
  (rt.depth = 0) as is_direct_permission
FROM role_tree rt
JOIN role_permissions rp ON rt.inherited_from_role_id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
ORDER BY rt.role_id, rt.depth, p.object_type, p.action;

COMMENT ON VIEW role_hierarchy_permissions IS 'Flattened view of all permissions including inherited permissions from parent roles. is_direct_permission indicates if permission is directly assigned (not inherited).';

-- Create indexes for common query patterns in existing tables
CREATE INDEX IF NOT EXISTS idx_permissions_object_type_action ON permissions(object_type, action);
CREATE INDEX IF NOT EXISTS idx_role_assignments_person_id ON role_assignments(person_id);
CREATE INDEX IF NOT EXISTS idx_role_assignments_group_id ON role_assignments(group_id);
CREATE INDEX IF NOT EXISTS idx_role_assignments_scope ON role_assignments(scope);
CREATE INDEX IF NOT EXISTS idx_object_permissions_object_type_id ON object_permissions(object_type, object_id);
CREATE INDEX IF NOT EXISTS idx_object_permissions_person_id ON object_permissions(person_id);
CREATE INDEX IF NOT EXISTS idx_object_permissions_group_id ON object_permissions(group_id);
