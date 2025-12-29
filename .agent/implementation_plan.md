# e‑Adisyon Integration Plan

## Goal Description
Migrate the Quickly POS application to fully support the e‑Adisyon workflow defined in the Turkish GİB technical guide. The integration will generate a UBL CreditNote XML, apply XAdES digital signature, embed a UUID/ETTN, submit the document to the GİB endpoint, and persist the result in the local PouchDB database with live replication.

## Proposed Changes
### Core Components
- **src/app/services/e-adisyon.service.ts** – New service handling XML building, XAdES signing, UUID embedding, and HTTP submission.
- **src/app/components/e-adisyon-preview/e-adisyon-preview.component.ts & .html** – UI component to preview generated XML and trigger submission.
- **src/app/core/services/main.service.ts** – Extend CRUD helpers to include `eAdisyonUuid`, `ettn`, and conflict‑resolution for e‑Adisyon docs.
- **src/app/components/store/selling-screen/selling-screen.component.ts** – Inject `EAdisyonService` and add a “Generate e‑Adisyon” button that creates the XML after a check is closed.
- **src/app/core/models/e-adisyon.model.ts** – Type definitions for the e‑Adisyon document structure.

### Tests
- **src/app/services/e-adisyon.service.spec.ts** – Unit tests for XML generation, XAdES signing (mocked), and UUID embedding.
- **src/app/components/e-adisyon-preview/e-adisyon-preview.component.spec.ts** – Component rendering and submission flow.
- **src/app/integration/e-adisyon.integration.spec.ts** – End‑to‑end test using a mocked GİB HTTP server (via `msw` or `nock`).

### Build & Config
- Add `xmlbuilder2` and `xadesjs` dependencies to `package.json`.
- Update `tsconfig.app.json` to include the new `e-adisyon.model.ts`.
- Ensure `polyfills.ts` includes `global` for XAdES library.

## Verification Plan
### Automated Tests
- **Unit**: `npm run test -- e-adisyon.service` – validates XML structure against the XSD (using `libxmljs2`).
- **Component**: `npm run test -- e-adisyon-preview.component` – ensures preview renders correctly and submission button calls the service.
- **Integration**: `npm run test:e2e` – runs a Playwright scenario:
  1. Open selling screen, create a check, close it.
  2. Click “Generate e‑Adisyon”.
  3. Verify that a signed XML file appears, UUID is displayed, and a mock GİB response returns an ETTN.
  4. Check that the `checks` signal contains `uuid` and `ettn` fields.

### Manual Verification
1. Launch the app (`npm start`).
2. Perform a normal sale, close the check.
3. In the UI, click **Generate e‑Adisyon**.
4. Confirm the preview shows a well‑formed XML (copy‑paste into an XML validator).
5. Verify the GİB mock server logs the POST request and returns a JSON with `ettn`.
6. Open the developer console and ensure the `checks` signal updates with the new `uuid` and `ettn`.
7. Restart the app and confirm the document persists via PouchDB replication.

## Mermaid Diagram
```mermaid
flowchart TD
    A[User closes Check] --> B[SellingScreen Component]
    B --> C[EAdisyonService.generateXML]
    C --> D[XMLBuilder (xmlbuilder2)]
    D --> E[XAdES Signing (xadesjs)]
    E --> F[UUID/ETTN embed]
    F --> G[HTTP POST to GIB endpoint]
    G --> H{Response OK?}
    H -->|Yes| I[Store UUID & ETTN in PouchDB]
    H -->|No| J[Show error to user]
    I --> K[Live replication to allData]
    K --> L[Remote CouchDB / GIB archive]
    style A fill:#f9f,stroke:#333,stroke-width:2px
    style L fill:#bbf,stroke:#333,stroke-width:2px
```

---
*All steps are reversible and have corresponding unit/integration tests.*
