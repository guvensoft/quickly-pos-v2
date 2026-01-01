#!/bin/bash

# ============================================
# Angular 5→21: Comprehensive Audit Scripts
# ============================================

PROJECT_DIR="/home/user/quickly-pos-v2"
AUDIT_OUTPUT="/tmp/audit-results"
mkdir -p $AUDIT_OUTPUT

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
MASTER_REPORT="$AUDIT_OUTPUT/MASTER_AUDIT_$TIMESTAMP.md"

cat > $MASTER_REPORT << 'EOF'
# Angular 5→21 Comprehensive Code Audit
Generated: $(date)

---

EOF

# ============================================
# 1. ZONE.RUN() WRAPPER AUDIT
# ============================================

echo "Running Zone.run() Wrapper Audit..."

cat >> $MASTER_REPORT << 'EOF'

## 1. ZONE.RUN() WRAPPER AUDIT

### Scan Results

EOF

# Find all mainService CRUD calls
cat >> $MASTER_REPORT << 'EOF'

#### Promise .then() without zone.run()

EOF

grep -rn "\.then(" $PROJECT_DIR/src/app/components --include="*.ts" -A 3 | \
  grep -B 3 "\.set(" | grep -v "zone.run" | head -50 >> $MASTER_REPORT 2>&1

ZONE_ISSUE_COUNT=$(grep -r "\.then(" $PROJECT_DIR/src/app/components --include="*.ts" -A 3 | \
  grep -B 3 "\.set(" | grep -v "zone.run" | wc -l)

if [ "$ZONE_ISSUE_COUNT" -gt 0 ]; then
  echo "❌ **Zone.run() Issues Found:** $ZONE_ISSUE_COUNT" >> $MASTER_REPORT
else
  echo "✅ **No Zone.run() Issues Found**" >> $MASTER_REPORT
fi

echo "" >> $MASTER_REPORT

# ============================================
# 2. SIGNAL IMMUTABILITY AUDIT
# ============================================

echo "Running Signal Immutability Audit..."

cat >> $MASTER_REPORT << 'EOF'

## 2. SIGNAL IMMUTABILITY AUDIT

### Array Mutation Issues

EOF

# Find .push() on signals
PUSH_COUNT=$(grep -rn "\.push(" $PROJECT_DIR/src/app/components --include="*.ts" | \
  grep -E "checks|products|orders|tables" | wc -l)

if [ "$PUSH_COUNT" -gt 0 ]; then
  echo "❌ **Found .push() mutations on signals:**" >> $MASTER_REPORT
  grep -rn "\.push(" $PROJECT_DIR/src/app/components --include="*.ts" | \
    grep -E "checks|products|orders|tables" >> $MASTER_REPORT 2>&1
else
  echo "✅ **No .push() mutations found**" >> $MASTER_REPORT
fi

echo "" >> $MASTER_REPORT

# Check spread operator usage
SPREAD_COUNT=$(grep -rn "\[...this\." $PROJECT_DIR/src/app/components --include="*.ts" | \
  grep "\.set(" | wc -l)

echo "✅ **Spread operator usages: $SPREAD_COUNT**" >> $MASTER_REPORT

echo "" >> $MASTER_REPORT

# ============================================
# 3. COMPONENT LIFECYCLE AUDIT
# ============================================

echo "Running Component Lifecycle Audit..."

cat >> $MASTER_REPORT << 'EOF'

## 3. COMPONENT LIFECYCLE AUDIT

### Effect Placement Issues

EOF

# Find effects in ngOnInit
EFFECT_INIT=$(grep -rn "ngOnInit()" $PROJECT_DIR/src/app/components --include="*.ts" -A 15 | \
  grep -c "effect(")

if [ "$EFFECT_INIT" -gt 0 ]; then
  echo "❌ **Effects found in ngOnInit():**" >> $MASTER_REPORT
  grep -rn "ngOnInit()" $PROJECT_DIR/src/app/components --include="*.ts" -A 15 | \
    grep -B 5 "effect(" >> $MASTER_REPORT 2>&1
else
  echo "✅ **No effects in ngOnInit()**" >> $MASTER_REPORT
fi

echo "" >> $MASTER_REPORT

# Check [key] input on settings components
KEY_INPUT=$(grep -l "readonly key = input" \
  $PROJECT_DIR/src/app/components/settings/**/*.ts 2>/dev/null | wc -l)

echo "Settings components with [key] input: **$KEY_INPUT/8**" >> $MASTER_REPORT

echo "" >> $MASTER_REPORT

# ============================================
# 4. FORM VALIDATOR TYPE SAFETY AUDIT
# ============================================

echo "Running Form Validator Type Safety Audit..."

cat >> $MASTER_REPORT << 'EOF'

## 4. FORM VALIDATOR TYPE SAFETY AUDIT

### .trim() Without Type Guard

EOF

# Find .trim() calls without typeof check
TRIM_UNSAFE=$(grep -rn "\.trim()" $PROJECT_DIR/src/app/components --include="*.ts" -B 1 | \
  grep -v "typeof" | grep -c "trim()")

if [ "$TRIM_UNSAFE" -gt 0 ]; then
  echo "❌ **Unsafe .trim() calls found:**" >> $MASTER_REPORT
  grep -rn "\.trim()" $PROJECT_DIR/src/app/components --include="*.ts" -B 2 | \
    grep -v "typeof" >> $MASTER_REPORT 2>&1
else
  echo "✅ **All .trim() calls type-guarded**" >> $MASTER_REPORT
fi

echo "" >> $MASTER_REPORT

# ============================================
# 5. DATABASE OPERATION AUDIT
# ============================================

echo "Running Database Operation Audit..."

cat >> $MASTER_REPORT << 'EOF'

## 5. DATABASE OPERATION AUDIT

### Promise Error Handling

EOF

# Find .then() without .catch()
UNHANDLED_PROMISE=$(grep -rn "\.then(" $PROJECT_DIR/src/app/components --include="*.ts" | \
  grep -v "\.catch(" | wc -l)

echo "Promise .then() calls without .catch(): **$UNHANDLED_PROMISE**" >> $MASTER_REPORT

# Find getAllBy calls
GETALLBY_COUNT=$(grep -rn "getAllBy(" $PROJECT_DIR/src/app/components --include="*.ts" | wc -l)

echo "getAllBy() calls: **$GETALLBY_COUNT**" >> $MASTER_REPORT

echo "" >> $MASTER_REPORT

# ============================================
# 6. MODAL & DOM MANIPULATION AUDIT
# ============================================

echo "Running Modal & DOM Manipulation Audit..."

cat >> $MASTER_REPORT << 'EOF'

## 6. MODAL & DOM MANIPULATION AUDIT

### jQuery Modal Usage

EOF

# Find jQuery modal calls
MODAL_CALLS=$(grep -rn "\.modal(" $PROJECT_DIR/src/app/components --include="*.ts" | wc -l)

echo "jQuery .modal() calls: **$MODAL_CALLS**" >> $MASTER_REPORT

# Find modal calls with zone.run()
MODAL_ZONE=$(grep -rn "\.modal(" $PROJECT_DIR/src/app/components --include="*.ts" -B 3 | \
  grep -c "zone.run")

echo "Modal calls with zone.run(): **$MODAL_ZONE/$MODAL_CALLS**" >> $MASTER_REPORT

# Find backdrop cleanup
BACKDROP_CLEANUP=$(grep -rn "modal-backdrop" $PROJECT_DIR/src/app/components --include="*.ts" | wc -l)

echo "Backdrop cleanup patterns: **$BACKDROP_CLEANUP**" >> $MASTER_REPORT

echo "" >> $MASTER_REPORT

# ============================================
# 7. OBSERVABLE & SUBJECT AUDIT
# ============================================

echo "Running Observable & Subject Audit..."

cat >> $MASTER_REPORT << 'EOF'

## 7. OBSERVABLE & SUBJECT AUDIT

### Subject Types in SettingsService

EOF

# Check Subject vs ReplaySubject
SUBJECT_COUNT=$(grep -c "Subject<" $PROJECT_DIR/src/app/core/services/settings.service.ts)
REPLAYSUBJECT_COUNT=$(grep -c "ReplaySubject<" $PROJECT_DIR/src/app/core/services/settings.service.ts)

echo "Subject (cold observable): **$SUBJECT_COUNT**" >> $MASTER_REPORT
echo "ReplaySubject(1) (hot observable): **$REPLAYSUBJECT_COUNT**" >> $MASTER_REPORT

if [ "$SUBJECT_COUNT" -gt 0 ]; then
  echo "❌ **Warning: Found Subject instead of ReplaySubject**" >> $MASTER_REPORT
  grep -n "Subject<" $PROJECT_DIR/src/app/core/services/settings.service.ts | \
    grep -v "ReplaySubject" >> $MASTER_REPORT 2>&1
else
  echo "✅ **All subjects are ReplaySubject**" >> $MASTER_REPORT
fi

echo "" >> $MASTER_REPORT

# ============================================
# 8. ERROR HANDLING AUDIT
# ============================================

echo "Running Error Handling Audit..."

cat >> $MASTER_REPORT << 'EOF'

## 8. ERROR HANDLING AUDIT

### Console.error Calls

EOF

CONSOLE_ERROR=$(grep -rn "console.error" $PROJECT_DIR/src/app/components --include="*.ts" | wc -l)

echo "console.error calls: **$CONSOLE_ERROR**" >> $MASTER_REPORT

# Find silent failures
SILENT_FAIL=$(grep -rn "\.catch(" $PROJECT_DIR/src/app/components --include="*.ts" | \
  grep -c "=> {}")

echo "Silent catch handlers: **$SILENT_FAIL**" >> $MASTER_REPORT

echo "" >> $MASTER_REPORT

# ============================================
# 9. COMPATIBILITY AUDIT
# ============================================

echo "Running Compatibility Audit..."

cat >> $MASTER_REPORT << 'EOF'

## 9. COMPATIBILITY AUDIT

### Chart.js Configuration

EOF

# Find old Chart.js syntax (xAxes/yAxes)
CHARTJS_OLD=$(grep -rn "xAxes\|yAxes" $PROJECT_DIR/src/app/components --include="*.ts" | wc -l)

if [ "$CHARTJS_OLD" -gt 0 ]; then
  echo "❌ **Old Chart.js v2 syntax found (xAxes/yAxes):**" >> $MASTER_REPORT
  grep -rn "xAxes\|yAxes" $PROJECT_DIR/src/app/components --include="*.ts" | \
    head -10 >> $MASTER_REPORT 2>&1
else
  echo "✅ **Using Chart.js v3 syntax**" >> $MASTER_REPORT
fi

echo "" >> $MASTER_REPORT

# ============================================
# SUMMARY
# ============================================

cat >> $MASTER_REPORT << 'EOF'

---

## SUMMARY

EOF

# Calculate total issues
TOTAL_ISSUES=$((ZONE_ISSUE_COUNT + PUSH_COUNT + EFFECT_INIT + TRIM_UNSAFE + UNHANDLED_PROMISE + CHARTJS_OLD))

cat >> $MASTER_REPORT << EOF

- **Total Issues Found:** $TOTAL_ISSUES
- **Critical Issues:** $EFFECT_INIT + $CHARTJS_OLD
- **High Priority:** $ZONE_ISSUE_COUNT + $PUSH_COUNT + $TRIM_UNSAFE
- **Medium Priority:** $UNHANDLED_PROMISE

Generated: $(date)

EOF

echo ""
echo "╔════════════════════════════════════════════════════╗"
echo "║           AUDIT COMPLETED SUCCESSFULLY             ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""
echo "Report location: $MASTER_REPORT"
echo ""
echo "Summary:"
echo "  Zone.run() issues: $ZONE_ISSUE_COUNT"
echo "  Signal mutations: $PUSH_COUNT"
echo "  Lifecycle issues: $EFFECT_INIT"
echo "  Type safety issues: $TRIM_UNSAFE"
echo "  Unhandled promises: $UNHANDLED_PROMISE"
echo "  Chart.js issues: $CHARTJS_OLD"
echo ""
echo "Total Issues: $TOTAL_ISSUES"
echo ""
echo "Opening report..."
cat $MASTER_REPORT

echo ""
echo "View full report with: cat $MASTER_REPORT"
