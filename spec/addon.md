# CRM Calendar Add-on POC Specification

## Objective

Build a Google Calendar Add-on that allows users to associate a Zoom meeting with a single CRM Lead or Deal.

The mapping will later be used by a Python microservice that listens to Zoom AI Companion webhooks and automatically pushes AI summaries into the mapped CRM record.

---

# Project Structure

```
CRM Calendar POC
│
├── Constants.gs
├── Calendar.gs
├── CRM.gs
├── Storage.gs
├── UI.gs
├── Code.gs
└── appsscript.json
```

Each file should have a single responsibility.

---

# Constants.gs

Contains only configuration and mock data.

## Constants

```javascript
const COMPANY_DOMAIN = "rtcamp.com";
```

## Mock CRM

Mock CRM data should contain:

```javascript
[
    {
        domain,
        company,
        leads: [],
        deals: []
    }
]
```

Each lead

```javascript
{
    id,
    title
}
```

Each deal

```javascript
{
    id,
    title
}
```

No UI or business logic should exist in this file.

---

# Calendar.gs

Responsible only for Google Calendar.

## Functions

### onCalendarEventOpen(e)

Trigger called by Calendar Add-on.

Should:

- Read current Calendar event
- Use Calendar.Events.get()
- Pass the event to UI.gs

Returns

```
buildMeetingCard(event)
```

---

### getMeetingHost(event)

Priority:

1. conferenceData.notes

Example

```
Meeting host: user@company.com
```

2. event.creator.email

Returns

```
host@email.com
```

---

### getCustomerDomains(event)

Collect every attendee email.

Ignore:

```
@rtcamp.com
```

Return unique domains.

Example

```
[
    "acme.com",
    "microsoft.com"
]
```

If meeting host belongs to an external domain, include it as well.

---

### getMeetingMetadata(event)

Returns

```javascript
{
    meetingId,
    meetingUuid,
    zoomCreatorId,
    calendarEventId,
    title,
    meetingHost,
    customerDomains
}
```

Meeting UUID and Creator ID should come from

```
conferenceData.parameters.addOnParameters.parameters
```

---

# CRM.gs

Acts as the CRM service layer.

UI must never directly access MOCK_CRM.

## Functions

### getSuggestedCRMRecords(domains)

Input

```javascript
[
    "acme.com",
    "microsoft.com"
]
```

Returns

```javascript
[
    {
        id,
        type,
        title,
        company
    }
]
```

Flatten Leads + Deals into one array.

---

### getCompanyName(domain)

Returns

```
Acme Corporation
```

or

```
null
```

---

Future implementation

Replace MOCK_CRM with CRM API.

No UI changes should be required.

---

# Storage.gs

Acts as repository layer.

Today

```
PropertiesService
```

Future

```
Python Microservice
```

Functions

## saveMeetingMapping(mapping)

Store by

```
meetingId
```

---

## getMeetingMapping(meetingId)

Returns mapping.

---

## deleteMeetingMapping(meetingId)

Deletes mapping.

---

## getAllMeetingMappings()

Returns every mapping.

Useful for debugging.

---

Stored object

```javascript
{
    meetingId,
    meetingUuid,
    calendarEventId,
    meetingHost,
    zoomCreatorId,

    crmRecord: {

        id,
        type,
        title,
        company

    },

    createdAt
}
```

---

# UI.gs

Contains ALL CardService code.

No Calendar logic.

No CRM logic.

No Storage logic.

Only rendering.

---

## buildMeetingCard(event)

Flow

```
metadata
        ↓
getSuggestedCRMRecords()
        ↓
Render UI
```

Sections

### Meeting Information

Display

- Meeting Title
- Meeting ID
- Meeting Host

---

### Detected Companies

For every detected domain

Display

```
Acme Corporation
acme.com
```

If unknown

```
Unknown Company
domain.com
```

---

### Associate Meeting

Dropdown.

One selection only.

Options

```
Lead • Website Revamp • Acme

Deal • Enterprise Upgrade • Acme

Deal • Azure Migration • Microsoft
```

If empty

Display

```
No CRM records found.
```

---

### Save Button

Button

```
Save Mapping
```

Calls

```
saveMapping()
```

Pass metadata as Action parameter.

---

## saveMapping(e)

Should

Read

```
metadata
```

Read

```
Selected CRM Record
```

Create

```javascript
{
    meetingId,
    meetingUuid,
    calendarEventId,
    meetingHost,
    zoomCreatorId,

    crmRecord,

    createdAt
}
```

Call

```
saveMeetingMapping()
```

Show notification

```
Meeting successfully mapped.
```

---

# Code.gs

Contains homepage only.

Functions

## onHomepage()

Returns

```
buildHomepage()
```

---

## buildHomepage()

Display

```
CRM Meeting Mapping

Open a Calendar meeting
to associate it with a CRM Lead or Deal.
```

---

# appsscript.json

Requirements

Advanced Calendar API enabled

Scopes

- calendar.addons.execute
- calendar.addons.current.event.read
- calendar.readonly
- script.storage
- userinfo.email

Calendar trigger

```
onCalendarEventOpen
```

Homepage trigger

```
onHomepage
```

---

# Expected Flow

```
User opens Calendar Event
                │
                ▼
Read Calendar Event
                │
                ▼
Extract Meeting Metadata
                │
                ▼
Detect External Domains
                │
                ▼
Lookup Suggested CRM Records
                │
                ▼
Render Dropdown
                │
                ▼
User selects Lead/Deal
                │
                ▼
Save Mapping
                │
                ▼
PropertiesService (POC)
```

---

# Future Architecture

```
Google Calendar
        │
        ▼
Calendar Add-on
        │
        ▼
Python Microservice
        │
        ▼
Meeting Mapping DB
        │
        ├───────────────┐
        ▼               │
Zoom Webhook            │
        │               │
Meeting ID              │
        ▼               │
Lookup Mapping ◄────────┘
        │
        ▼
Fetch AI Summary
        │
        ▼
Update CRM Notes
        │
        ▼
Upload Summary to Google Drive
```

---

# Design Principles

- One meeting maps to exactly one CRM Lead or Deal.
- UI layer must not contain business logic.
- Calendar layer must not access CRM directly.
- CRM layer should hide mock/API implementation.
- Storage layer should hide persistence implementation.
- Future migration from PropertiesService to Python microservice should require changes only in Storage.gs.
- Future migration from MOCK_CRM to CRM APIs should require changes only in CRM.gs.
- Maintain clear separation of responsibilities across all files.