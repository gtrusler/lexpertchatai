#!/bin/bash

# Extract Supabase URL and convert to Postgres connection string
SUPABASE_URL="https://xjennkhbfetektomwzhy.supabase.co"
SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqZW5ua2hiZmV0ZWt0b213emh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDQxMTYzNCwiZXhwIjoyMDU1OTg3NjM0fQ.1DL1AG0dMpvbbsz5s3liw9wMHRdXkmYBqGEOjK3dNlA"

# Extract the host from the URL
HOST=$(echo $SUPABASE_URL | sed -e 's|^https://||' -e 's|\.supabase\.co$||')

# Construct the PSQL connection string
PGPASSWORD=$SUPABASE_SERVICE_KEY psql -h db.$HOST.supabase.co -U postgres -f templates_documents_migration.sql

echo "SQL migration executed for templates and document connections."
