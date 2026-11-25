const assert = require('node:assert/strict');
const { pg_query: proto } = require('../proto');

describe('PostgreSQL protobuf codec', () => {
  it('round-trips PostgreSQL String and Boolean messages', () => {
    const string = proto.String.fromObject({ sval: 'PostgreSQL' });
    const bool = proto.Boolean.fromObject({ boolval: true });
    assert.equal(proto.String.decode(proto.String.encode(string).finish()).sval, 'PostgreSQL');
    assert.equal(proto.Boolean.decode(proto.Boolean.encode(bool).finish()).boolval, true);
  });
});
