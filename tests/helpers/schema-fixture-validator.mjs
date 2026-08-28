import { isDeepStrictEqual } from "node:util";

function resolveLocalReference(rootSchema, reference) {
  if (!reference.startsWith("#/")) {
    throw new Error(`Only local schema references are supported in tests: ${reference}`);
  }

  return reference
    .slice(2)
    .split("/")
    .map((part) => part.replaceAll("~1", "/").replaceAll("~0", "~"))
    .reduce((current, part) => current?.[part], rootSchema);
}

function matchesType(value, type) {
  switch (type) {
    case "null":
      return value === null;
    case "array":
      return Array.isArray(value);
    case "object":
      return value !== null && typeof value === "object" && !Array.isArray(value);
    case "integer":
      return Number.isInteger(value);
    case "number":
      return typeof value === "number" && Number.isFinite(value);
    case "string":
      return typeof value === "string";
    case "boolean":
      return typeof value === "boolean";
    default:
      throw new Error(`Unsupported schema type in test validator: ${type}`);
  }
}

export function validateFixture(schema, value) {
  const errors = [];

  function visit(node, current, path) {
    if (node.$ref) {
      const target = resolveLocalReference(schema, node.$ref);
      if (!target) {
        errors.push(`${path}: unresolved reference ${node.$ref}`);
        return;
      }
      visit(target, current, path);
      return;
    }

    if (Object.hasOwn(node, "const") && !isDeepStrictEqual(current, node.const)) {
      errors.push(`${path}: expected constant ${JSON.stringify(node.const)}`);
    }

    if (node.enum && !node.enum.some((candidate) => isDeepStrictEqual(candidate, current))) {
      errors.push(`${path}: value is not in enum`);
    }

    const types = node.type ? (Array.isArray(node.type) ? node.type : [node.type]) : [];
    if (types.length > 0 && !types.some((type) => matchesType(current, type))) {
      errors.push(`${path}: expected type ${types.join("|")}`);
      return;
    }

    if (typeof current === "string") {
      if (node.minLength !== undefined && current.length < node.minLength) {
        errors.push(`${path}: shorter than minLength ${node.minLength}`);
      }
      if (node.pattern && !new RegExp(node.pattern).test(current)) {
        errors.push(`${path}: does not match ${node.pattern}`);
      }
    }

    if (typeof current === "number") {
      if (node.minimum !== undefined && current < node.minimum) {
        errors.push(`${path}: smaller than minimum ${node.minimum}`);
      }
      if (node.maximum !== undefined && current > node.maximum) {
        errors.push(`${path}: larger than maximum ${node.maximum}`);
      }
    }

    if (Array.isArray(current)) {
      if (node.minItems !== undefined && current.length < node.minItems) {
        errors.push(`${path}: fewer than ${node.minItems} items`);
      }
      if (node.uniqueItems) {
        const serialized = current.map((item) => JSON.stringify(item));
        if (new Set(serialized).size !== serialized.length) {
          errors.push(`${path}: contains duplicate items`);
        }
      }
      if (node.items) {
        current.forEach((item, index) => visit(node.items, item, `${path}[${index}]`));
      }
    }

    if (current !== null && typeof current === "object" && !Array.isArray(current)) {
      for (const required of node.required ?? []) {
        if (!Object.hasOwn(current, required)) {
          errors.push(`${path}: missing required property ${required}`);
        }
      }

      for (const [key, child] of Object.entries(current)) {
        if (node.properties?.[key]) {
          visit(node.properties[key], child, `${path}.${key}`);
        } else if (node.additionalProperties === false) {
          errors.push(`${path}: unexpected property ${key}`);
        }
      }
    }
  }

  visit(schema, value, "$");
  return errors;
}
