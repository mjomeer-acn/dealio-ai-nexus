# DATABASE DESIGN

Core Entities

User
Role
Dealer
Vehicle
Lead
LeadStatus
Commission
ReferralCode
Contract
Conversation
KnowledgeDocument
Notification
AuditLog

Requirements

All entities must:

- UUID primary key
- CreatedAt
- UpdatedAt
- Soft Delete

Audit logs mandatory.

No hard deletes.