export function encodeCursor({ createdAt, id }) {
  if (!createdAt || id === undefined || id === null) {
    throw new Error('Invalid cursor components: createdAt and id are required');
  }
  const dateStr = createdAt instanceof Date ? createdAt.toISOString() : createdAt;
  const payload = JSON.stringify({ createdAt: dateStr, id: id.toString() });
  return Buffer.from(payload).toString('base64');
}

export function decodeCursor(cursorString) {
  if (!cursorString || typeof cursorString !== 'string') {
    throw new Error('Invalid cursor: must be a non-empty string');
  }
  try {
    const decodedPayload = Buffer.from(cursorString, 'base64').toString('utf8');
    const parsed = JSON.parse(decodedPayload);
    
    if (!parsed.createdAt || parsed.id === undefined || parsed.id === null) {
      throw new Error('Cursor payload is missing required fields');
    }

    return {
      createdAt: parsed.createdAt,
      id: parsed.id.toString(),
    };
  } catch (err) {
    throw new Error(`Malformed cursor: ${err.message}`);
  }
}
