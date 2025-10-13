-- Migration 021: MCP Audit Log
-- Tracks all MCP tool invocations, resource accesses, and prompt retrievals

CREATE TABLE IF NOT EXISTS mcp_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES oauth_clients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL for client_credentials flow
  operation_type VARCHAR(50) NOT NULL, -- 'tool_call', 'resource_read', 'prompt_get'
  operation_name VARCHAR(255) NOT NULL, -- Tool/resource/prompt name (e.g., 'search_devices', 'resource://moss/schemas/device')
  input_params JSONB, -- Input parameters for the operation
  output_data JSONB, -- Output data (may be truncated for large responses)
  success BOOLEAN NOT NULL,
  error_message TEXT, -- Error message if success = false
  execution_time_ms INTEGER, -- How long the operation took
  ip_address INET, -- Client IP address
  user_agent TEXT, -- Client user agent string
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_mcp_audit_log_client_id ON mcp_audit_log(client_id);
CREATE INDEX idx_mcp_audit_log_user_id ON mcp_audit_log(user_id);
CREATE INDEX idx_mcp_audit_log_operation_type ON mcp_audit_log(operation_type);
CREATE INDEX idx_mcp_audit_log_operation_name ON mcp_audit_log(operation_name);
CREATE INDEX idx_mcp_audit_log_created_at ON mcp_audit_log(created_at DESC);
CREATE INDEX idx_mcp_audit_log_success ON mcp_audit_log(success);

-- Function to get MCP usage statistics for a client
CREATE OR REPLACE FUNCTION get_mcp_client_stats(
  p_client_id UUID,
  p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
  operation_type VARCHAR,
  operation_name VARCHAR,
  total_calls BIGINT,
  success_calls BIGINT,
  error_calls BIGINT,
  avg_execution_time_ms NUMERIC,
  last_called_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    mal.operation_type,
    mal.operation_name,
    COUNT(*) as total_calls,
    COUNT(*) FILTER (WHERE mal.success = true) as success_calls,
    COUNT(*) FILTER (WHERE mal.success = false) as error_calls,
    ROUND(AVG(mal.execution_time_ms)::numeric, 2) as avg_execution_time_ms,
    MAX(mal.created_at) as last_called_at
  FROM mcp_audit_log mal
  WHERE mal.client_id = p_client_id
    AND mal.created_at BETWEEN p_start_date AND p_end_date
  GROUP BY mal.operation_type, mal.operation_name
  ORDER BY total_calls DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old audit logs (keep last 90 days by default)
CREATE OR REPLACE FUNCTION cleanup_old_mcp_audit_logs(p_days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  rows_deleted INTEGER;
BEGIN
  DELETE FROM mcp_audit_log
  WHERE created_at < NOW() - (p_days_to_keep || ' days')::INTERVAL;

  GET DIAGNOSTICS rows_deleted = ROW_COUNT;
  RETURN rows_deleted;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE mcp_audit_log IS 'Audit log for all MCP server operations (tools, resources, prompts)';
COMMENT ON FUNCTION get_mcp_client_stats IS 'Get usage statistics for an MCP client over a time period';
COMMENT ON FUNCTION cleanup_old_mcp_audit_logs IS 'Delete audit logs older than specified number of days';
