import { assertProviderPayloadSafe } from "../knowledge/model-facing.mjs";

export function validateDesignResponse({ response, request, snapshot, retrievedIds, validators }) {
  const errors = [...validators.response(response)];
  const allowedIds = new Set(retrievedIds);

  if (response?.request_id !== request.request_id) {
    errors.push("/request_id does not match the server-generated request ID");
  }
  if (response?.knowledge_snapshot_id !== snapshot.manifest.snapshot_id) {
    errors.push("/knowledge_snapshot_id does not match the active snapshot");
  }
  if (response?.design_directions?.length !== request.requested_direction_count) {
    errors.push(
      `/design_directions must contain exactly ${request.requested_direction_count} directions`,
    );
  }

  for (const [directionIndex, direction] of (response?.design_directions ?? []).entries()) {
    const seen = new Set();
    for (const support of direction.knowledge_support ?? []) {
      if (!allowedIds.has(support.knowledge_id)) {
        errors.push(
          `/design_directions/${directionIndex}/knowledge_support cites non-retrieved ID ${support.knowledge_id}`,
        );
      }
      if (seen.has(support.knowledge_id)) {
        errors.push(
          `/design_directions/${directionIndex}/knowledge_support repeats ID ${support.knowledge_id}`,
        );
      }
      seen.add(support.knowledge_id);
    }

    for (const [dimensionName, dimension] of Object.entries(direction.design_dimensions ?? {})) {
      const basis = dimension?.basis ?? [];
      if (new Set(basis).size !== basis.length) {
        errors.push(
          `/design_directions/${directionIndex}/design_dimensions/${dimensionName}/basis contains duplicates`,
        );
      }
    }
  }

  try {
    assertProviderPayloadSafe(response);
  } catch (error) {
    errors.push(error.message);
  }

  return errors;
}
