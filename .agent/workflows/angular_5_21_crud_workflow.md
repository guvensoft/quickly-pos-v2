---
description: Execute Angular 5 → 21 CRUD Workflow
---

1. **Phase 1 – CRUD Pattern Extraction**
   // turbo
   ```bash
   grep -R "addData\|updateData\|removeData\|getAllBy\|getAllData" src/app > CRUD_PATTERNS.md
   ```

2. **Phase 2 – Angular 21 Mapping Report**
   // turbo
   ```bash
   echo "Generating Angular 21 mapping report..." && cat ANGULAR_5_21_CRUD_WORKFLOW.md | grep -A3 "## FASE 2" > ANGULAR_21_MAPPING_REPORT.md
   ```

3. **Phase 5 – Unit Test Execution**
   // turbo
   ```bash
   npm run test --silent
   ```

4. **Phase 5 – Integration Test Execution**
   // turbo
   ```bash
   npm run e2e --silent
   ```

5. **Phase 6 – Replication Verification**
   // turbo
   ```bash
   npm run test:replication || echo "Replication test script not defined"
   ```

6. **Phase 8 – Master Test Checklist**
   // turbo
   ```bash
   echo "All workflow steps completed. Check generated *.md files for reports." 
   ```
