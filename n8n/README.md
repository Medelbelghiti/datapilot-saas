# n8n Workflow Documentation — DataPilot AI

## Overview

DataPilot AI uses n8n as an optional automation and orchestration layer. Core authentication and billing logic remains in the backend.

## Workflow 1: Analysis Pipeline

```
Webhook (POST /webhook/analysis)
  → Authenticate request (verify JWT)
  → Retrieve analysis from Supabase
  → Check status (should be "processing")
  → Call backend analysis service
  → Store results in Supabase
  → Trigger AI insights (if eligible)
  → Generate PDF report (if requested)
  → Update analysis status to "completed"
  → Send email notification (optional)
  → Return success
```

### Setup
1. Create a webhook node listening on your n8n instance
2. Add an HTTP Request node to call the backend `/api/analyses` endpoint
3. Use Supabase nodes to read/write data
4. Add email node for notifications

## Workflow 2: Polar Webhook Forwarder

```
Polar Webhook → n8n Webhook
  → Verify event signature
  → Route by event type
  → Update Supabase subscription table
  → Update user plan
  → Log webhook event
  → Send notification (optional)
```

### Setup
1. Create a webhook in n8n
2. Point Polar webhook URL to your n8n webhook
3. Add Supabase nodes for database updates
4. Make workflow idempotent by checking event_id

## Workflow 3: Email Notifications

```
Trigger (on analysis completion)
  → Fetch user email from Supabase
  → Send email via SMTP/SendGrid
  → Subject: "Your DataPilot AI analysis is ready"
  → Body includes analysis summary (NOT raw data)
```

## Environment Variables

Set in n8n:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `BACKEND_URL`
- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`

## Security Notes

- Never hardcode secrets in workflow nodes
- Use n8n credentials for all external services
- Verify webhook signatures before processing
- Make all workflows idempotent
