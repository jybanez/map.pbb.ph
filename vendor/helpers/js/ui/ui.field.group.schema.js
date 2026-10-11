const SUPPORTED_FIELD_TYPES = new Set([
  "text",
  "textarea",
  "number",
  "number-stepper",
  "number_stepper",
  "select",
  "multiselect",
  "checkbox",
  "checkbox-group",
  "combobox",
  "suggest",
  "local-history",
  "notice",
  "message",
]);

const SUPPORTED_VALIDATION_TYPES = new Set([
  "required",
  "required_when",
  "empty",
  "empty_when",
  "forbidden_when",
  "lte",
  "max",
  "sum_lte",
  "sum_max",
  "sum_eq",
  "sum_equals",
  "min_lte_max",
]);

const FORBIDDEN_KEYS = new Set(["__proto__", "prototype", "constructor"]);
const RUNTIME_SCHEMA_KEYS = new Set(["createEntryKey", "entryKeyFactory", "onChange"]);
const DEFAULT_LIMITS = {
  maxDepth: 20,
  maxNodes: 5000,
  maxFields: 500,
  maxOptions: 1000,
  maxItemsLimit: 1000,
};

export const FIELD_GROUP_SUPPORTED_TYPES = Object.freeze([...SUPPORTED_FIELD_TYPES]);

export class FieldGroupSchemaError extends Error {
  constructor(message, issues = []) {
    super(message);
    this.name = "FieldGroupSchemaError";
    this.code = issues[0]?.code || "FIELD_GROUP_SCHEMA_INVALID";
    this.issues = issues.map(cloneIssue);
  }
}

export function validateFieldGroupSchema(schema, options = {}) {
  const limits = { ...DEFAULT_LIMITS, ...(options?.limits || {}) };
  const errors = [];
  const warnings = [];
  const state = { nodes: 0, limits, errors };

  inspectJsonValue(schema, "$", 0, state);
  if (!isPlainObject(schema)) {
    addIssue(errors, "FIELD_GROUP_SCHEMA_OBJECT_REQUIRED", "$", "Field Group schema must be an object.");
    return buildResult(errors, warnings);
  }

  validateCountBound(schema.minItems, "$.minItems", limits, errors);
  validateCountBound(schema.maxItems, "$.maxItems", limits, errors);
  if (
    isFiniteInteger(schema.minItems)
    && isFiniteInteger(schema.maxItems)
    && Number(schema.minItems) > Number(schema.maxItems)
  ) {
    addIssue(errors, "FIELD_GROUP_ITEM_BOUNDS_INVALID", "$.maxItems", "maxItems must be greater than or equal to minItems.");
  }
  if (schema.entryKey != null && (!String(schema.entryKey).trim() || FORBIDDEN_KEYS.has(String(schema.entryKey)))) {
    addIssue(errors, "FIELD_GROUP_ENTRY_KEY_INVALID", "$.entryKey", "entryKey must be a safe, nonempty property name.");
  }

  const fields = flattenFields(schema.fields);
  if (fields.length > limits.maxFields) {
    addIssue(errors, "FIELD_GROUP_SCHEMA_FIELD_LIMIT", "$.fields", `Field Group schemas may define at most ${limits.maxFields} fields.`);
  }
  const seenKeys = new Set();
  fields.forEach(({ field, path }) => {
    const key = getFieldKey(field);
    if (!key) {
      addIssue(errors, "FIELD_GROUP_FIELD_KEY_REQUIRED", path, "Every Field Group field must define a key.");
    } else if (seenKeys.has(key)) {
      addIssue(errors, "FIELD_GROUP_FIELD_KEY_DUPLICATE", `${path}.key`, `Field key "${key}" is duplicated.`);
    } else {
      seenKeys.add(key);
    }

    const type = getFieldType(field);
    if (!["input_type", "type", "input"].some((property) => Object.prototype.hasOwnProperty.call(field, property))) {
      addIssue(errors, "FIELD_GROUP_CONTROL_TYPE_REQUIRED", `${path}.type`, `Field "${key || "unknown"}" must define a control type.`);
    }
    if (!SUPPORTED_FIELD_TYPES.has(type)) {
      addIssue(errors, "FIELD_GROUP_CONTROL_UNSUPPORTED", `${path}.type`, `Unsupported Field Group control type "${type}".`);
    }
    validateFieldOptions(field, type, path, limits, errors, options);
    validateCondition(field.visibleWhen ?? field.visible_when, `${path}.visibleWhen`, errors);
    if (field.clearWhenHidden != null && typeof field.clearWhenHidden !== "boolean") {
      addIssue(errors, "FIELD_GROUP_SCHEMA_BOOLEAN_REQUIRED", `${path}.clearWhenHidden`, "clearWhenHidden must be a boolean.");
    }
    if (options?.allowPersistence === false && hasPersistenceConfig(field)) {
      addIssue(errors, "FIELD_GROUP_BROWSER_PERSISTENCE_FORBIDDEN", path, `Field "${key || "unknown"}" must not enable browser persistence.`);
    }
  });

  safeArray(schema.validations).forEach((rule, index) => {
    const path = `$.validations[${index}]`;
    if (!isPlainObject(rule)) {
      addIssue(errors, "FIELD_GROUP_VALIDATION_RULE_INVALID", path, "Validation rules must be objects.");
      return;
    }
    const type = String(rule.type || "").toLowerCase();
    if (!SUPPORTED_VALIDATION_TYPES.has(type)) {
      addIssue(errors, "FIELD_GROUP_VALIDATION_RULE_UNSUPPORTED", `${path}.type`, `Unsupported validation rule "${type || "unknown"}".`);
    }
    validateCondition(rule.when ?? rule.visibleWhen ?? rule.visible_when, `${path}.when`, errors);
  });

  return buildResult(errors, warnings);
}

export function normalizeFieldGroupSchema(schema, options = {}) {
  const candidate = options?.omitRuntime ? deepCloneJson(schema, { omitRuntime: true }) : schema;
  const result = validateFieldGroupSchema(candidate, options);
  if (options?.strict !== false && !result.status) {
    throw new FieldGroupSchemaError(
      `Invalid Field Group schema: ${result.errors[0]?.message || "schema validation failed"}`,
      result.errors
    );
  }
  return deepCloneJson(candidate);
}

export function canonicalizeFieldGroupSchema(schema, options = {}) {
  const normalized = normalizeFieldGroupSchema(schema, {
    ...options,
    strict: options?.strict !== false,
    omitRuntime: true,
  });
  return JSON.stringify(sortJsonValue(normalized));
}

export async function digestFieldGroupSchema(schema, options = {}) {
  const canonical = canonicalizeFieldGroupSchema(schema, options);
  const subtle = globalThis.crypto?.subtle;
  if (!subtle || typeof subtle.digest !== "function") {
    throw new FieldGroupSchemaError("Web Crypto SHA-256 support is required to digest a Field Group schema.", [
      createIssue("FIELD_GROUP_SCHEMA_DIGEST_UNAVAILABLE", "$", "Web Crypto SHA-256 support is unavailable."),
    ]);
  }
  const bytes = new TextEncoder().encode(canonical);
  const digest = await subtle.digest("SHA-256", bytes);
  return `sha256:${Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, "0")).join("")}`;
}

export function assertFieldGroupSnapshotMatch(snapshot, expected = {}) {
  const expectedVersion = expected?.schema_version ?? expected?.schemaVersion;
  const expectedDigest = expected?.schema_digest ?? expected?.schemaDigest;
  if (expectedVersion != null && Number(expectedVersion) !== Number(snapshot?.schema_version)) {
    throw snapshotMismatch(`Expected schema version ${expectedVersion}, received ${snapshot?.schema_version}.`);
  }
  if (expectedDigest && String(expectedDigest) !== String(snapshot?.schema_digest || "")) {
    throw snapshotMismatch(`Expected schema digest ${expectedDigest}, received ${snapshot?.schema_digest || "none"}.`);
  }
  return snapshot;
}

function validateFieldOptions(field, type, path, limits, errors, validationOptions = {}) {
  if (!["select", "multiselect", "checkbox-group", "combobox", "suggest", "local-history"].includes(type)) {
    return;
  }
  const options = safeArray(field.options ?? field.suggestions);
  if (options.length > limits.maxOptions) {
    addIssue(errors, "FIELD_GROUP_OPTION_LIMIT", `${path}.options`, `A field may define at most ${limits.maxOptions} options.`);
  }
  const values = options.map(getOptionValue);
  const seen = new Set();
  values.forEach((value, index) => {
    if (!value) {
      addIssue(errors, "FIELD_GROUP_OPTION_VALUE_REQUIRED", `${path}.options[${index}]`, "Every option must define a nonempty value.");
    } else if (seen.has(value)) {
      addIssue(errors, "FIELD_GROUP_OPTION_VALUE_DUPLICATE", `${path}.options[${index}]`, `Option value "${value}" is duplicated.`);
    } else {
      seen.add(value);
    }
  });
  if (field.requiresOptions === true && !options.length && validationOptions?.allowUnconfiguredOptions !== true) {
    addIssue(errors, "FIELD_GROUP_OPTIONS_REQUIRED", `${path}.options`, `Field "${getFieldKey(field)}" requires caller-supplied options.`);
  }
}

function validateCondition(condition, path, errors, depth = 0, state = { nodes: 0 }) {
  if (condition == null) {
    return;
  }
  state.nodes += 1;
  if (depth > 10 || state.nodes > 200) {
    addIssue(errors, "FIELD_GROUP_CONDITION_LIMIT", path, "Condition expression exceeds the supported depth or node count.");
    return;
  }
  if (!isPlainObject(condition)) {
    addIssue(errors, "FIELD_GROUP_CONDITION_INVALID", path, "Conditions must be JSON objects.");
    return;
  }
  if (Object.prototype.hasOwnProperty.call(condition, "all") || Object.prototype.hasOwnProperty.call(condition, "any")) {
    const unexpected = Object.keys(condition).filter((key) => !["all", "any"].includes(key));
    if (unexpected.length) {
      addIssue(errors, "FIELD_GROUP_CONDITION_OPERATOR_INVALID", path, `Condition contains unsupported keys: ${unexpected.join(", ")}.`);
    }
    ["all", "any"].forEach((operator) => {
      if (!Object.prototype.hasOwnProperty.call(condition, operator)) {
        return;
      }
      if (!Array.isArray(condition[operator]) || !condition[operator].length) {
        addIssue(errors, "FIELD_GROUP_CONDITION_INVALID", `${path}.${operator}`, `${operator} must contain at least one condition.`);
        return;
      }
      condition[operator].forEach((child, index) => validateCondition(child, `${path}.${operator}[${index}]`, errors, depth + 1, state));
    });
    return;
  }
  if (Object.prototype.hasOwnProperty.call(condition, "not") && Object.keys(condition).length === 1) {
    validateCondition(condition.not, `${path}.not`, errors, depth + 1, state);
    return;
  }
  if (Object.prototype.hasOwnProperty.call(condition, "field")) {
    if (!String(condition.field || "").trim()) {
      addIssue(errors, "FIELD_GROUP_CONDITION_FIELD_REQUIRED", `${path}.field`, "Condition field is required.");
    }
    const operators = ["eq", "in", "notIn", "present", "notEmpty"].filter((key) => Object.prototype.hasOwnProperty.call(condition, key));
    if (operators.length !== 1) {
      addIssue(errors, "FIELD_GROUP_CONDITION_OPERATOR_INVALID", path, "A field condition must define exactly one supported operator.");
    }
    if ((Object.prototype.hasOwnProperty.call(condition, "in") && !Array.isArray(condition.in)) || (Object.prototype.hasOwnProperty.call(condition, "notIn") && !Array.isArray(condition.notIn))) {
      addIssue(errors, "FIELD_GROUP_CONDITION_OPERAND_INVALID", path, "in and notIn condition operands must be arrays.");
    }
    if ((Object.prototype.hasOwnProperty.call(condition, "present") && typeof condition.present !== "boolean") || (Object.prototype.hasOwnProperty.call(condition, "notEmpty") && typeof condition.notEmpty !== "boolean")) {
      addIssue(errors, "FIELD_GROUP_CONDITION_OPERAND_INVALID", path, "present and notEmpty condition operands must be booleans.");
    }
    const unexpected = Object.keys(condition).filter((key) => !["field", "eq", "in", "notIn", "present", "notEmpty"].includes(key));
    if (unexpected.length) {
      addIssue(errors, "FIELD_GROUP_CONDITION_OPERATOR_INVALID", path, `Condition contains unsupported keys: ${unexpected.join(", ")}.`);
    }
    return;
  }
  Object.keys(condition).forEach((key) => {
    const expected = condition[key];
    if (!isPlainObject(expected)) {
      return;
    }
    const operators = Object.keys(expected);
    if (operators.length !== 1 || !["in", "not"].includes(operators[0])) {
      addIssue(errors, "FIELD_GROUP_CONDITION_OPERATOR_INVALID", `${path}.${key}`, "Legacy field conditions support only in or not operators.");
    }
    if (operators[0] === "in" && !Array.isArray(expected.in)) {
      addIssue(errors, "FIELD_GROUP_CONDITION_OPERAND_INVALID", `${path}.${key}.in`, "Legacy in operands must be arrays.");
    }
  });
}

function validateCountBound(value, path, limits, errors) {
  if (value == null) {
    return;
  }
  if (!isFiniteInteger(value) || Number(value) < 0 || Number(value) > limits.maxItemsLimit) {
    addIssue(errors, "FIELD_GROUP_ITEM_BOUND_INVALID", path, `Item bounds must be integers between 0 and ${limits.maxItemsLimit}.`);
  }
}

function inspectJsonValue(value, path, depth, state) {
  state.nodes += 1;
  if (state.nodes > state.limits.maxNodes) {
    if (!state.errors.some((issue) => issue.code === "FIELD_GROUP_SCHEMA_NODE_LIMIT")) {
      addIssue(state.errors, "FIELD_GROUP_SCHEMA_NODE_LIMIT", path, `Schema exceeds ${state.limits.maxNodes} JSON nodes.`);
    }
    return;
  }
  if (depth > state.limits.maxDepth) {
    addIssue(state.errors, "FIELD_GROUP_SCHEMA_DEPTH_LIMIT", path, `Schema exceeds depth ${state.limits.maxDepth}.`);
    return;
  }
  if (["function", "symbol", "bigint", "undefined"].includes(typeof value)) {
    addIssue(state.errors, "FIELD_GROUP_SCHEMA_EXECUTABLE_FORBIDDEN", path, "Schema values must be JSON-compatible and non-executable.");
    return;
  }
  if (value == null || ["string", "boolean"].includes(typeof value)) {
    return;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      addIssue(state.errors, "FIELD_GROUP_SCHEMA_NUMBER_INVALID", path, "Schema numbers must be finite.");
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((child, index) => inspectJsonValue(child, `${path}[${index}]`, depth + 1, state));
    return;
  }
  if (!isPlainObject(value)) {
    addIssue(state.errors, "FIELD_GROUP_SCHEMA_OBJECT_UNSAFE", path, "Schema objects must use a plain JSON object prototype.");
    return;
  }
  Object.keys(value).forEach((key) => {
    if (FORBIDDEN_KEYS.has(key)) {
      addIssue(state.errors, "FIELD_GROUP_SCHEMA_KEY_FORBIDDEN", `${path}.${key}`, `Schema key "${key}" is forbidden.`);
      return;
    }
    inspectJsonValue(value[key], `${path}.${key}`, depth + 1, state);
  });
}

function flattenFields(fields, path = "$.fields", result = []) {
  safeArray(fields).forEach((field, index) => {
    const fieldPath = `${path}[${index}]`;
    if (Array.isArray(field)) {
      flattenFields(field, fieldPath, result);
      return;
    }
    if (!isPlainObject(field)) {
      return;
    }
    result.push({ field, path: fieldPath });
    if (isPlainObject(field.breakdown)) {
      flattenFields(field.breakdown.fields, `${fieldPath}.breakdown.fields`, result);
    }
  });
  return result;
}

function deepCloneJson(value, options = {}, seen = new WeakSet()) {
  if (value == null || typeof value !== "object") {
    return value;
  }
  if (seen.has(value)) {
    throw new FieldGroupSchemaError("Field Group schema must not contain cycles.", [
      createIssue("FIELD_GROUP_SCHEMA_CYCLE", "$", "Schema must not contain cycles."),
    ]);
  }
  seen.add(value);
  const clone = Array.isArray(value)
    ? value.map((child) => deepCloneJson(child, options, seen))
    : Object.keys(value).reduce((output, key) => {
      if (!FORBIDDEN_KEYS.has(key) && !(options.omitRuntime && RUNTIME_SCHEMA_KEYS.has(key))) {
        output[key] = deepCloneJson(value[key], options, seen);
      }
      return output;
    }, {});
  seen.delete(value);
  return clone;
}

function sortJsonValue(value) {
  if (Array.isArray(value)) {
    return value.map(sortJsonValue);
  }
  if (!isPlainObject(value)) {
    return value;
  }
  return Object.keys(value).sort().reduce((output, key) => {
    output[key] = sortJsonValue(value[key]);
    return output;
  }, {});
}

function hasPersistenceConfig(field) {
  return ["storageKey", "historyStorageKey", "history_storage_key"].some((key) => Boolean(field?.[key]));
}

function getFieldKey(field) {
  return String(field?.field_key ?? field?.key ?? field?.name ?? "").trim();
}

function getFieldType(field) {
  return String(field?.input_type ?? field?.type ?? field?.input ?? "text").toLowerCase();
}

function getOptionValue(option) {
  return String(isPlainObject(option) ? option.value ?? option.id ?? option.label ?? "" : option ?? "").trim();
}

function isPlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isFiniteInteger(value) {
  return Number.isFinite(Number(value)) && Number.isInteger(Number(value));
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function addIssue(list, code, path, message, severity = "error") {
  list.push(createIssue(code, path, message, severity));
}

function createIssue(code, path, message, severity = "error") {
  return { code, path, field_key: path, severity, message, ...(severity === "error" ? { error: message } : {}) };
}

function cloneIssue(issue) {
  return { ...(issue || {}) };
}

function buildResult(errors, warnings) {
  return {
    status: errors.length === 0,
    errors: errors.map(cloneIssue),
    warnings: warnings.map(cloneIssue),
  };
}

function snapshotMismatch(message) {
  return new FieldGroupSchemaError(message, [
    createIssue("FIELD_GROUP_PRESET_SNAPSHOT_MISMATCH", "$", message),
  ]);
}
