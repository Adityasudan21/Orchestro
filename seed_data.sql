-- Orchestro Dummy Seed Data
-- Run AFTER the backend has started once (so DataInitializer creates the admin user).
-- Prerequisites: admin user must exist (created automatically on first startup).
-- Extra users password: "password123"
-- BCrypt hash below was generated with cost 10.
-- To regenerate: new BCryptPasswordEncoder().encode("password123")

-- ─── 1. EXTRA USERS ──────────────────────────────────────────────────────────

INSERT INTO users (username, email, password, role, created_at)
VALUES
  ('alice',   'alice@orchestro.com',   '$2a$10$TwNeUnMqlul.lMjwHzQQiusMVNRuq0RPd7gEluDSQJxNxJwzVdMCe', 'MANAGER',   NOW()),
  ('bob',     'bob@orchestro.com',     '$2a$10$TwNeUnMqlul.lMjwHzQQiusMVNRuq0RPd7gEluDSQJxNxJwzVdMCe', 'DEVELOPER', NOW()),
  ('carol',   'carol@orchestro.com',   '$2a$10$TwNeUnMqlul.lMjwHzQQiusMVNRuq0RPd7gEluDSQJxNxJwzVdMCe', 'DEVELOPER', NOW()),
  ('dave',    'dave@orchestro.com',    '$2a$10$TwNeUnMqlul.lMjwHzQQiusMVNRuq0RPd7gEluDSQJxNxJwzVdMCe', 'DEVELOPER', NOW()),
  ('eva',     'eva@orchestro.com',     '$2a$10$TwNeUnMqlul.lMjwHzQQiusMVNRuq0RPd7gEluDSQJxNxJwzVdMCe', 'MANAGER',   NOW())
ON CONFLICT (username) DO NOTHING;

-- ─── 2. PROJECTS (20) ────────────────────────────────────────────────────────

INSERT INTO projects (name, description, created_by_id, assignee_id, reporter_id, created_at)
SELECT
  p.name,
  p.description,
  (SELECT id FROM users WHERE username = 'admin'),
  (SELECT id FROM users WHERE username = p.assignee),
  (SELECT id FROM users WHERE username = 'alice'),
  NOW() - (p.offset_days || ' days')::interval
FROM (VALUES
  ('E-Commerce Platform',      'Full-featured online store with cart, checkout, and inventory management.',          'alice',  0),
  ('Mobile Banking App',       'Secure iOS and Android app for retail banking customers.',                          'bob',    3),
  ('Data Pipeline V2',         'Kafka-based real-time ingestion pipeline replacing the legacy batch jobs.',         'carol',  6),
  ('HR Self-Service Portal',   'Internal portal for leave, payslips, and performance reviews.',                    'alice',  9),
  ('API Gateway Migration',    'Move all microservices behind a unified API gateway with rate limiting.',          'dave',  12),
  ('Search & Discovery',       'Elasticsearch-powered search across all product catalogues.',                      'bob',   15),
  ('Notification Service',     'Multi-channel (email, SMS, push) notification microservice.',                      'carol', 18),
  ('Analytics Dashboard',      'Real-time executive dashboard powered by ClickHouse.',                             'eva',   21),
  ('Auth Modernisation',       'Replace session-based auth with OAuth 2.0 + PKCE across all services.',           'alice', 24),
  ('CI/CD Overhaul',           'Migrate Jenkins pipelines to GitHub Actions with parallelised test stages.',       'dave',  27),
  ('Customer Onboarding',      'Guided multi-step onboarding flow for new B2B customers.',                        'bob',   30),
  ('Payment Gateway',          'Stripe and PayPal integration with retry logic and reconciliation reports.',       'carol', 33),
  ('Infrastructure as Code',   'Terraform modules for AWS ECS, RDS, and S3 across three environments.',           'eva',   36),
  ('Order Management System',  'End-to-end order lifecycle from placement through fulfilment to returns.',        'alice', 39),
  ('Content CMS',              'Headless CMS with multi-language support and media asset management.',            'bob',   42),
  ('Risk & Compliance',        'Automated KYC checks and AML monitoring for financial transactions.',              'dave',  45),
  ('Inventory Sync Service',   'Near-real-time inventory synchronisation across warehouses and storefronts.',     'carol', 48),
  ('Loyalty Programme',        'Points engine, tier management, and rewards catalogue for retention.',            'eva',   51),
  ('Developer Portal',         'Self-service documentation, API playground, and SDK downloads for partners.',     'alice', 54),
  ('Monitoring & Alerting',    'Unified observability stack: Prometheus, Grafana, and PagerDuty integration.',   'bob',   57)
) AS p(name, description, assignee, offset_days);

-- project_members join table — add the creator and a couple of devs to each project
INSERT INTO project_members (project_id, user_id)
SELECT p.id, u.id
FROM projects p
CROSS JOIN users u
WHERE u.username IN ('admin', 'alice', 'bob', 'carol')
ON CONFLICT DO NOTHING;

-- ─── 3. STORIES (20) ─────────────────────────────────────────────────────────
-- Spread across the first 10 projects (2 stories each).

INSERT INTO stories (project_id, title, description, status, assignee_id, reporter_id, created_at)
SELECT
  (SELECT id FROM projects ORDER BY created_at LIMIT 1 OFFSET s.project_offset),
  s.title,
  s.description,
  s.status,
  (SELECT id FROM users WHERE username = s.assignee),
  (SELECT id FROM users WHERE username = 'alice'),
  NOW() - (s.offset_days || ' days')::interval
FROM (VALUES
  (0, 'Product catalogue browsing',        'Users can browse, filter, and paginate the product listing.',                                          'IN_PROGRESS', 'bob',   1),
  (0, 'Shopping cart & checkout flow',     'Add-to-cart, quantity changes, promo codes, and Stripe payment.',                                     'TODO',        'carol', 2),
  (1, 'Biometric login support',           'Face ID and fingerprint authentication on iOS 16+ and Android 12+.',                                  'IN_REVIEW',   'dave',  3),
  (1, 'Transaction history view',          'Paginated list of past transactions with search and CSV export.',                                     'TODO',        'bob',   4),
  (2, 'Schema registry integration',       'Register Avro schemas with Confluent Schema Registry on producer and consumer startup.',             'DONE',        'carol', 5),
  (2, 'Dead-letter queue handling',        'Route unprocessable messages to a DLQ topic with alerting and replay tooling.',                      'IN_PROGRESS', 'dave',  6),
  (3, 'Leave request workflow',            'Submit, approve/reject, and track annual leave requests with manager notifications.',                 'TODO',        'bob',   7),
  (3, 'Payslip PDF generation',            'Generate and email monthly payslips as password-protected PDFs.',                                     'IN_REVIEW',   'carol', 8),
  (4, 'Rate-limit policy engine',          'Per-client and per-route rate limiting with Redis-backed counters.',                                  'IN_PROGRESS', 'eva',   9),
  (4, 'JWT passthrough configuration',     'Validate and forward upstream JWT claims to downstream services without re-issuance.',               'TODO',        'alice', 10),
  (5, 'Full-text product search',          'Elasticsearch query with typo tolerance and synonym expansion.',                                      'IN_REVIEW',   'bob',   11),
  (5, 'Faceted filter sidebar',            'Real-time filter aggregations for category, price range, brand, and rating.',                        'TODO',        'dave',  12),
  (6, 'Email template engine',             'Handlebars-based templating for transactional emails with per-tenant branding.',                     'DONE',        'carol', 13),
  (6, 'Push notification delivery',        'Firebase FCM integration with delivery receipts and retry backoff.',                                  'IN_PROGRESS', 'eva',   14),
  (7, 'Revenue KPI widgets',               'Daily/weekly/monthly revenue, orders, and conversion rate cards on the executive dashboard.',       'TODO',        'alice', 15),
  (7, 'Cohort retention chart',            'User cohort retention heatmap powered by ClickHouse window functions.',                              'BLOCKED',     'bob',   16),
  (8, 'PKCE authorisation code flow',      'Replace implicit grant with PKCE across the web app and all mobile clients.',                        'IN_PROGRESS', 'carol', 17),
  (8, 'Token refresh and revocation',      'Silent refresh via rotating refresh tokens; revocation endpoint for logout.',                       'TODO',        'dave',  18),
  (9, 'GitHub Actions pipeline template',  'Reusable workflow templates for build, test, and deploy stages across all repos.',                  'IN_REVIEW',   'eva',   19),
  (9, 'Docker image caching strategy',     'Layer-aware caching in Actions to reduce average build time below 4 minutes.',                      'TODO',        'alice', 20)
) AS s(project_offset, title, description, status, assignee, offset_days);

-- ─── 4. TASKS (20) ───────────────────────────────────────────────────────────
-- Two tasks per story (stories 1–10).

INSERT INTO tasks (story_id, title, description, type, status, assignee_id, reporter_id, created_at)
SELECT
  (SELECT id FROM stories ORDER BY created_at LIMIT 1 OFFSET t.story_offset),
  t.title,
  t.description,
  t.type,
  t.status,
  (SELECT id FROM users WHERE username = t.assignee),
  (SELECT id FROM users WHERE username = 'alice'),
  NOW() - (t.offset_days || ' hours')::interval
FROM (VALUES
  (0,  'Implement product list API endpoint',    'GET /api/products with pagination, sort, and filter query params.',                             'DEV', 'DONE',        'bob',   48),
  (0,  'Write product listing UI component',     'React component with skeleton loading, empty state, and error boundary.',                     'DEV', 'IN_PROGRESS', 'carol', 24),
  (1,  'Cart persistence in localStorage',       'Persist cart items across page reloads; merge with server cart on login.',                    'DEV', 'TODO',        'dave',  36),
  (1,  'Stripe payment intent creation',         'Backend: create PaymentIntent, handle webhooks for succeeded/failed events.',                 'DEV', 'TODO',        'bob',   20),
  (2,  'iOS Face ID integration',                'Integrate LocalAuthentication framework; fallback to PIN on failure.',                        'DEV', 'IN_REVIEW',   'carol', 60),
  (2,  'Biometric feature flag documentation',   'Update README and release notes explaining the biometric opt-in flow.',                      'DOC', 'TODO',        'eva',   12),
  (3,  'Transaction list REST endpoint',         'GET /api/transactions with cursor pagination and ISO date range filter.',                     'DEV', 'DONE',        'dave',  72),
  (3,  'CSV export button',                      'Client-side CSV export of the current filtered transaction list.',                           'DEV', 'IN_PROGRESS', 'bob',   18),
  (4,  'Avro schema definitions',                'Define Avro schemas for OrderCreated, OrderUpdated, and OrderCancelled events.',             'DOC', 'DONE',        'carol', 96),
  (4,  'Producer schema registration on startup','Auto-register schemas in Schema Registry via Spring Kafka configuration.',                   'DEV', 'DONE',        'dave',  80),
  (5,  'DLQ consumer implementation',            'Consume from DLQ, log to structured JSON, and expose replay endpoint.',                      'DEV', 'IN_PROGRESS', 'eva',   40),
  (5,  'DLQ alerting runbook',                   'Document PagerDuty alert thresholds and manual replay procedure.',                          'DOC', 'TODO',        'alice', 10),
  (6,  'Leave request form',                     'Multi-step React form: date picker, type selector, and manager approval chain preview.',    'DEV', 'TODO',        'bob',   30),
  (6,  'Leave balance calculation service',      'Business logic for accruals, carry-over caps, and public holiday adjustments.',             'DEV', 'TODO',        'carol', 15),
  (7,  'Payslip PDF template design',            'Figma template converted to HTML/CSS for headless Chrome PDF generation.',                  'DOC', 'IN_REVIEW',   'dave',  55),
  (7,  'PDF generation Lambda',                  'AWS Lambda (Node.js): receive payslip data JSON, return PDF buffer via S3 presigned URL.', 'DEV', 'IN_REVIEW',   'eva',   45),
  (8,  'Redis rate-limit middleware',             'Express/Spring middleware reading and writing per-key counters in Redis with TTL.',         'DEV', 'IN_PROGRESS', 'alice', 35),
  (8,  'Rate limit exceeded error response',     'Standardise 429 response body and add Retry-After header across all gateway routes.',      'BUG', 'TODO',        'bob',   8),
  (9,  'JWT signature verification filter',      'Spring Security filter to validate RS256 JWT and extract claims into SecurityContext.',     'DEV', 'TODO',        'carol', 22),
  (9,  'JWT claims forwarding spec',             'Document which claims are forwarded, stripped, or transformed per downstream service.',    'DOC', 'TODO',        'dave',  5)
) AS t(story_offset, title, description, type, status, assignee, offset_days);
