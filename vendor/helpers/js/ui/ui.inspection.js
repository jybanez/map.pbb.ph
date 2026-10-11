import {
  FieldGroupSchemaError,
  assertFieldGroupSnapshotMatch,
  digestFieldGroupSchema,
  normalizeFieldGroupSchema,
  validateFieldGroupSchema,
} from "./ui.field.group.schema.js";

const INSPECTION_SCHEMA_VERSION = 1;
const REPEATABLE_DEFAULTS = Object.freeze({
  repeatable: true,
  entryKey: "_entry_key",
  preserveEntryKeys: true,
  minItems: 0,
  maxItems: 100,
  allowRemove: true,
  allowReorder: true,
  strictSchema: false,
});

const INSPECTION_RESULT = options([
  ["pass", "Pass"],
  ["fail", "Fail"],
  ["not_inspected", "Not inspected"],
  ["not_applicable", "Not applicable"],
]);
const CONDITION = options([
  ["good", "Good"],
  ["fair", "Fair"],
  ["poor", "Poor"],
  ["critical", "Critical"],
  ["unknown", "Unknown"],
]);
const SEVERITY = options([
  ["low", "Low"],
  ["medium", "Medium"],
  ["high", "High"],
  ["critical", "Critical"],
]);
const YES_NO_UNKNOWN = options([
  ["yes", "Yes"],
  ["no", "No"],
  ["unknown", "Unknown"],
]);
const OPERATIONAL_STATUS = options([
  ["operational", "Operational"],
  ["limited", "Limited"],
  ["not_operational", "Not operational"],
  ["not_tested", "Not tested"],
  ["unknown", "Unknown"],
]);
const SAFETY_DEVICE_STATUS = options([
  ["pass", "Pass"],
  ["fail", "Fail"],
  ["not_present", "Not present"],
  ["not_tested", "Not tested"],
  ["not_applicable", "Not applicable"],
]);
const SERVICEABILITY = options([
  ["serviceable", "Serviceable"],
  ["restricted", "Restricted"],
  ["unserviceable", "Unserviceable"],
  ["not_assessed", "Not assessed"],
]);
const ACCESS_RESTRICTION = options([
  ["none", "None"],
  ["partial", "Partial"],
  ["full", "Full"],
  ["unknown", "Unknown"],
]);
const ENVIRONMENT_STATUS = options([
  ["acceptable", "Acceptable"],
  ["attention_required", "Attention required"],
  ["hazard", "Hazard"],
  ["not_assessed", "Not assessed"],
  ["unknown", "Unknown"],
]);
const THRESHOLD_ASSESSMENT = options([
  ["within_range", "Within range"],
  ["outside_range", "Outside range"],
  ["no_threshold", "No threshold"],
  ["unknown", "Unknown"],
]);
const MEASUREMENT_ASSESSMENT = options([
  ["within_range", "Within range"],
  ["below_range", "Below range"],
  ["above_range", "Above range"],
  ["not_assessed", "Not assessed"],
]);

const FAILURE = condition("inspection_result", "in", ["fail"]);
const ADVERSE_EQUIPMENT = any(
  condition("operational_status", "in", ["limited", "not_operational"]),
  condition("safety_device_status", "in", ["fail"]),
  condition("maintenance_required", "in", ["yes"])
);
const ADVERSE_INFRASTRUCTURE = any(
  condition("condition", "in", ["poor", "critical"]),
  condition("serviceability", "in", ["restricted", "unserviceable"])
);
const ADVERSE_ENVIRONMENT = any(
  condition("status", "in", ["attention_required", "hazard"]),
  condition("threshold_assessment", "in", ["outside_range"])
);

const PRESET_DEFINITIONS = {
  inspectionObservation: {
    label: "Inspection Observation",
    ...REPEATABLE_DEFAULTS,
    fields: [
      [text("component_code", "Component code"), requiredText("component_name", "Component name")],
      [select("inspection_result", "Inspection result", INSPECTION_RESULT, true), select("condition", "Condition", CONDITION)],
      [select("severity", "Severity", SEVERITY, false, FAILURE), configuredChoices("finding_category", "Finding category", "checkbox-group", FAILURE)],
      textarea("observation", "Observation", any(
        condition("inspection_result", "in", ["fail", "not_inspected"])
      )),
      select("corrective_action_required", "Corrective action required", YES_NO_UNKNOWN, false, FAILURE),
      textarea("corrective_action_note", "Corrective action note", condition("corrective_action_required", "eq", "yes")),
    ],
    validations: [
      requiredWhen("severity", FAILURE),
      requiredWhen("observation", any(condition("inspection_result", "in", ["fail", "not_inspected"]))),
      requiredWhen("corrective_action_note", condition("corrective_action_required", "eq", "yes")),
    ],
  },
  equipmentInspection: {
    label: "Equipment Inspection",
    ...REPEATABLE_DEFAULTS,
    fields: [
      [text("equipment_code", "Equipment code"), requiredText("equipment_name", "Equipment name")],
      text("component_name", "Component name"),
      [select("operational_status", "Operational status", OPERATIONAL_STATUS), select("physical_condition", "Physical condition", CONDITION)],
      [select("safety_device_status", "Safety-device status", SAFETY_DEVICE_STATUS), select("maintenance_required", "Maintenance required", YES_NO_UNKNOWN)],
      select("severity", "Severity", SEVERITY, false, ADVERSE_EQUIPMENT),
      textarea("finding", "Finding", ADVERSE_EQUIPMENT),
      textarea("recommended_action", "Recommended action", ADVERSE_EQUIPMENT),
    ],
    validations: [
      requiredWhen("severity", ADVERSE_EQUIPMENT),
      requiredWhen("finding", ADVERSE_EQUIPMENT),
    ],
  },
  infrastructureInspection: {
    label: "Infrastructure Inspection",
    ...REPEATABLE_DEFAULTS,
    fields: [
      [text("asset_code", "Asset code"), requiredText("asset_name", "Asset name")],
      requiredText("component_name", "Component name"),
      [select("condition", "Condition", CONDITION), select("serviceability", "Serviceability", SERVICEABILITY)],
      configuredChoices("defect_types", "Defect types", "checkbox-group", ADVERSE_INFRASTRUCTURE),
      [select("severity", "Severity", SEVERITY, false, ADVERSE_INFRASTRUCTURE), select("access_restriction", "Access restriction", ACCESS_RESTRICTION)],
      textarea("finding", "Finding", ADVERSE_INFRASTRUCTURE),
      textarea("recommended_action", "Recommended action", ADVERSE_INFRASTRUCTURE),
    ],
    validations: [
      requiredWhen("severity", ADVERSE_INFRASTRUCTURE),
      requiredWhen("finding", ADVERSE_INFRASTRUCTURE),
    ],
  },
  environmentInspection: {
    label: "Environment Inspection",
    ...REPEATABLE_DEFAULTS,
    fields: [
      [text("area_code", "Area code"), requiredText("area_name", "Area name")],
      configuredChoices("observation_type", "Observation type", "select"),
      [select("status", "Status", ENVIRONMENT_STATUS), select("severity", "Severity", SEVERITY, false, condition("status", "in", ["attention_required", "hazard"]))],
      [numberStepper("measured_value", "Measured value", { decimals: 3 }), configuredChoices("measurement_unit", "Measurement unit", "select", condition("measured_value", "notEmpty", true))],
      [select("threshold_assessment", "Threshold assessment", THRESHOLD_ASSESSMENT), select("mitigation_required", "Mitigation required", YES_NO_UNKNOWN, false, ADVERSE_ENVIRONMENT)],
      textarea("observation", "Observation", any(
        ADVERSE_ENVIRONMENT,
        condition("status", "in", ["not_assessed"])
      )),
      textarea("recommended_action", "Recommended action", condition("mitigation_required", "eq", "yes")),
    ],
    validations: [
      requiredWhen("severity", condition("status", "in", ["attention_required", "hazard"])),
      requiredWhen("measurement_unit", condition("measured_value", "notEmpty", true)),
      requiredWhen("mitigation_required", ADVERSE_ENVIRONMENT),
      requiredWhen("observation", any(ADVERSE_ENVIRONMENT, condition("status", "in", ["not_assessed"]))),
    ],
  },
  inspectionMeasurement: {
    label: "Inspection Measurement",
    ...REPEATABLE_DEFAULTS,
    fields: [
      [text("measurement_code", "Measurement code"), requiredText("measurement_name", "Measurement name")],
      [numberStepper("value", "Value", { required: true, decimals: 3 }), configuredChoices("unit", "Unit", "select")],
      [numberStepper("expected_min", "Expected minimum", { decimals: 3 }), numberStepper("expected_max", "Expected maximum", { decimals: 3 })],
      select("assessment", "Assessment", MEASUREMENT_ASSESSMENT),
      textarea("note", "Note"),
    ],
    validations: [
      requiredWhen("unit", condition("value", "notEmpty", true)),
      {
        type: "min_lte_max",
        minField: "expected_min",
        maxField: "expected_max",
        severity: "error",
        message: "Expected maximum must be greater than or equal to expected minimum.",
      },
    ],
  },
};

export const inspectionFieldGroupPresets = Object.freeze(
  Object.keys(PRESET_DEFINITIONS).reduce((registry, presetId) => {
    registry[presetId] = (overrides = {}) => buildPreset(PRESET_DEFINITIONS[presetId], overrides);
    return registry;
  }, {})
);

export const inspectionPresets = inspectionFieldGroupPresets;

export function createInspectionObservationFieldGroupPreset(overrides = {}) {
  return inspectionFieldGroupPresets.inspectionObservation(overrides);
}

export function createEquipmentInspectionFieldGroupPreset(overrides = {}) {
  return inspectionFieldGroupPresets.equipmentInspection(overrides);
}

export function createInfrastructureInspectionFieldGroupPreset(overrides = {}) {
  return inspectionFieldGroupPresets.infrastructureInspection(overrides);
}

export function createEnvironmentInspectionFieldGroupPreset(overrides = {}) {
  return inspectionFieldGroupPresets.environmentInspection(overrides);
}

export function createInspectionMeasurementFieldGroupPreset(overrides = {}) {
  return inspectionFieldGroupPresets.inspectionMeasurement(overrides);
}

export async function resolveInspectionPresetSnapshot(presetId, overrides = {}, expected = {}) {
  const id = String(presetId || "").trim();
  const factory = inspectionFieldGroupPresets[id];
  if (typeof factory !== "function") {
    throw new FieldGroupSchemaError(`Unknown inspection preset "${id}".`, [{
      code: "FIELD_GROUP_PRESET_UNKNOWN",
      path: "$.preset_id",
      field_key: "$.preset_id",
      severity: "error",
      message: `Unknown inspection preset "${id}".`,
      error: `Unknown inspection preset "${id}".`,
    }]);
  }
  const expanded = factory(overrides);
  const schema = normalizeFieldGroupSchema(expanded, {
    strict: true,
    omitRuntime: true,
    allowPersistence: false,
    allowUnconfiguredOptions: expected?.allowUnconfiguredOptions !== false,
  });
  const snapshot = {
    preset_id: id,
    schema_version: INSPECTION_SCHEMA_VERSION,
    schema_digest: await digestFieldGroupSchema(schema, {
      allowPersistence: false,
      allowUnconfiguredOptions: expected?.allowUnconfiguredOptions !== false,
    }),
    schema,
  };
  return assertFieldGroupSnapshotMatch(snapshot, expected);
}

export function validateInspectionPresetForPublication(presetId, overrides = {}) {
  const id = String(presetId || "").trim();
  const factory = inspectionFieldGroupPresets[id];
  if (typeof factory !== "function") {
    return {
      status: false,
      errors: [{ code: "FIELD_GROUP_PRESET_UNKNOWN", path: "$.preset_id", field_key: "$.preset_id", severity: "error", message: `Unknown inspection preset "${id}".`, error: `Unknown inspection preset "${id}".` }],
      warnings: [],
    };
  }
  return validateFieldGroupSchema(factory(overrides), {
    allowPersistence: false,
    allowUnconfiguredOptions: false,
  });
}

function buildPreset(base, overrides) {
  const source = isPlainObject(overrides) ? overrides : {};
  const keyedOverrides = isPlainObject(source.fields) ? source.fields : {};
  const fields = Array.isArray(source.fields)
    ? clone(source.fields)
    : applyFieldOverrides(clone(base.fields), keyedOverrides);
  const extraFields = Array.isArray(source.extraFields) ? clone(source.extraFields) : [];
  const output = deepMerge(clone(base), omit(source, ["fields", "extraFields"]));
  output.fields = [...fields, ...extraFields];
  return output;
}

function applyFieldOverrides(fields, overrides) {
  return safeArray(fields).map((entry) => {
    if (Array.isArray(entry)) {
      return applyFieldOverrides(entry, overrides);
    }
    if (!isPlainObject(entry)) {
      return entry;
    }
    const key = String(entry.key || entry.field_key || "");
    const merged = deepMerge(entry, isPlainObject(overrides[key]) ? overrides[key] : {});
    if (isPlainObject(merged.breakdown)) {
      merged.breakdown.fields = applyFieldOverrides(merged.breakdown.fields, overrides);
    }
    return merged;
  });
}

function text(key, label) {
  return { key, label, type: "text" };
}

function requiredText(key, label) {
  return { ...text(key, label), required: true };
}

function textarea(key, label, visibleWhen = null) {
  return { key, label, type: "textarea", ...(visibleWhen ? { visibleWhen } : {}) };
}

function select(key, label, fieldOptions, required = false, visibleWhen = null) {
  return {
    key,
    label,
    type: "select",
    options: clone(fieldOptions),
    ...(required ? { required: true } : {}),
    ...(visibleWhen ? { visibleWhen } : {}),
  };
}

function numberStepper(key, label, fieldOptions = {}) {
  const decimals = fieldOptions?.decimals;
  return {
    key,
    label,
    type: "number-stepper",
    allowEmpty: true,
    ...(decimals != null && fieldOptions?.step == null ? { step: 10 ** -Number(decimals) } : {}),
    ...fieldOptions,
  };
}

function configuredChoices(key, label, type, visibleWhen = null) {
  return {
    key,
    label,
    type,
    options: [],
    requiresOptions: true,
    unconfiguredLabel: `${label} choices must be configured by the application.`,
    ...(visibleWhen ? { visibleWhen } : {}),
  };
}

function requiredWhen(field, when) {
  return { type: "required_when", field, when, severity: "error" };
}

function condition(field, operator, value) {
  return { field, [operator]: value };
}

function any(...conditions) {
  return { any: conditions };
}

function options(entries) {
  return entries.map(([value, label]) => ({ value, label }));
}

function omit(source, keys) {
  const denied = new Set(keys);
  return Object.keys(source || {}).reduce((output, key) => {
    if (!denied.has(key)) {
      output[key] = clone(source[key]);
    }
    return output;
  }, {});
}

function deepMerge(base, overrides) {
  const output = clone(base);
  Object.keys(overrides || {}).forEach((key) => {
    const next = overrides[key];
    output[key] = isPlainObject(output[key]) && isPlainObject(next)
      ? deepMerge(output[key], next)
      : clone(next);
  });
  return output;
}

function clone(value) {
  if (Array.isArray(value)) {
    return value.map(clone);
  }
  if (isPlainObject(value)) {
    return Object.keys(value).reduce((output, key) => {
      output[key] = clone(value[key]);
      return output;
    }, {});
  }
  return value;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}
