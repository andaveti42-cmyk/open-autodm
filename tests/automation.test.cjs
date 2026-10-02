const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

// Compile the actual source, with only external boundaries replaced. No live
// database, credentials, network or timers are used by these regression tests.
function sourceLoader(stubs = {}, globals = {}) {
  const cache = new Map();
  function load(name) {
    if (Object.hasOwn(stubs, name)) return stubs[name];
    if (!name.startsWith('@/')) throw new Error(`Unexpected dependency: ${name}`);
    if (cache.has(name)) return cache.get(name).exports;
    const filename = path.join(__dirname, '../src', name.slice(2) + '.ts');
    const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
      fileName: filename,
    }).outputText;
    const module = { exports: {} };
    cache.set(name, module);
    vm.runInNewContext(output, {
      module, exports: module.exports, require: load, console,
      setTimeout: (fn) => { fn(); return 0; }, ...globals,
    }, { filename });
    return module.exports;
  }
  return load;
}

function memoryDb(tables = {}, failure = () => null) {
  const operations = [];
  return {
    tables, operations,
    rpc: async () => ({ data: [{ allowed: true, current_count: 1 }], error: null }),
    from(table) {
      tables[table] ??= [];
      let action = 'select', values, single = false;
      const filters = [];
      const query = {
        select() { return query; },
        eq(key, value) { filters.push([key, value]); return query; },
        insert(input) { action = 'insert'; values = input; return query; },
        upsert(input) { action = 'upsert'; values = input; return query; },
        update(input) { action = 'update'; values = input; return query; },
        delete() { action = 'delete'; return query; },
        single() { single = true; return query; },
        maybeSingle() { single = true; return query; },
        then(resolve, reject) {
          return Promise.resolve().then(() => {
            operations.push({ table, action, values, filters });
            const error = failure(table, action);
            if (error) return { data: null, error };
            let rows = tables[table].filter(row => filters.every(([k, v]) => row[k] === v));
            if (action === 'insert' || action === 'upsert') {
              rows = (Array.isArray(values) ? values : [values]).map(row => ({ id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', ...row }));
              tables[table].push(...rows);
            } else if (action === 'update') rows.forEach(row => Object.assign(row, values));
            else if (action === 'delete') tables[table] = tables[table].filter(row => !rows.includes(row));
            return { data: single ? rows[0] ?? null : rows, error: null };
          }).then(resolve, reject);
        },
      };
      return query;
    },
  };
}

function fixture(options = {}) {
  const payload = {
    automationId: 'automation', instagramAccountId: 'account', igAccountIgsid: 'business',
    triggerType: 'comment', triggerUserId: 'audience', triggerUsername: 'alice',
    triggerEventId: 'comment', triggerTimestamp: Date.now(), postId: 'post',
    commentText: 'link', messageText: null,
    ...(options.follow ? { sessionId: 'session', sessionStep: 1, triggerType: 'dm_reply_followup' } : {}),
    ...options.payload,
  };
  const automation = {
    id: 'automation', type: 'comment_dm', is_active: true, instagram_account_id: 'account',
    comment_reply_options: [], dm_opening_message_enabled: true,
    dm_opening_message: 'Hey {{username}}!', dm_opening_message_button_title: 'Send me the link',
    dm_opening_message_button_link: null, ask_to_follow_enabled: false,
    dm_responses: [{ id: 'response', type: 'text', content: 'Your link', buttonLink: 'https://example.com' }],
    ...options.automation,
  };
  const session = {
    id: 'session', automation_id: 'automation', instagram_account_id: 'account',
    audience_ig_user_id: 'audience', current_step: 1, completed: false,
    expires_at: new Date(Date.now() + 86400000).toISOString(), ...options.session,
  };
  const db = memoryDb({
    automations: [automation],
    instagram_accounts: [{ id: 'account', instagram_user_id: 'business', is_active: true }],
    automation_sessions: options.follow ? [session] : [],
  }, options.failure);
  const sends = [], events = [];
  let load;
  const api = {};
  for (const name of ['sendInstagramDm', 'sendInstagramLinkButtonDm', 'sendInstagramCardDm', 'sendAskToFollowDm']) {
    api[name] = async (...args) => {
      sends.push({ name, args });
      const code = options.sendError?.(name, sends.length);
      if (code) throw load('@/lib/instagram/errors').classifyMetaError('Simulated Meta failure', code, undefined);
      return 'message';
    };
  }
  api.replyToComment = async () => {};
  api.getAudienceProfile = async () => ({ username: 'alice', followsBusiness: options.follows ?? true });
  load = sourceLoader({
    '@/lib/supabase/service': { createServiceClient: () => db },
    '@/lib/env': { getEnv: () => ({}) },
    '@/lib/crypto': { decrypt: () => '' },
    '@/lib/logger': { createLogger: () => ({ info() {}, warn() {}, error() {}, debug() {} }) },
    '@/lib/debugLog': { debugLog: (...args) => events.push(args) },
    '@/lib/automation/contacts': { updateContactProfile() {}, recordContactInteraction() {} },
    '@/lib/instagram/api': api,
  });
  return { payload, db, sends, events, load, session };
}

test('all username spellings, repeated calls, missing handles and ordinary whitespace', () => {
  const { renderTemplate } = sourceLoader()('@/lib/automation/personalize');
  for (const placeholder of ['{username}', '{{username}}', '{@username}', '{{@username}}', '{{ @ USERNAME }}']) {
    assert.equal(renderTemplate(`Hey ${placeholder}!`, ' @alice '), 'Hey @alice!');
    assert.equal(renderTemplate(`Hey ${placeholder}!`, null), 'Hey!');
  }
  assert.equal(renderTemplate('  Keep  spacing  ', null), '  Keep  spacing  ');
});

for (const code of [1, 2]) {
  test(`opening Meta ${code}: one send, preserved session, no resend on repeat job`, async () => {
    const f = fixture({ sendError: () => code });
    const worker = f.load('@/lib/automation/processJob');
    await worker.processAutoDmJob(f.payload, 1);
    await worker.processAutoDmJob(f.payload, 2);
    assert.equal(f.sends.length, 1);
    assert.equal(f.sends[0].args[2], 'Hey @alice!');
    assert.equal(f.db.tables.automation_sessions.length, 1);
    assert.equal(f.db.tables.dm_sent_log.length, 1);
    assert.equal(f.db.operations.some(op => op.action === 'delete'), false);
  });
  test(`follow-up Meta ${code}: no inline resend; session completes`, async () => {
    const f = fixture({ follow: true, sendError: () => code });
    await f.load('@/lib/automation/processJob').processFollowUpDmJob(f.payload);
    assert.equal(f.sends.length, 1);
    assert.equal(f.session.completed, true);
  });
  test(`ask-to-follow Meta ${code}: keep step 2 so delivered confirmation button works`, async () => {
    const f = fixture({ follow: true, follows: false, automation: { ask_to_follow_enabled: true }, sendError: () => code });
    await f.load('@/lib/automation/processJob').processFollowUpDmJob(f.payload);
    assert.equal(f.sends.length, 1);
    assert.equal(f.session.current_step, 2);
    assert.equal(f.session.completed, false);
  });
}

test('definitive opening failure cleans orphan session and propagates', async () => {
  const f = fixture({ sendError: () => 190 });
  await assert.rejects(f.load('@/lib/automation/processJob').processAutoDmJob(f.payload, 1));
  assert.equal(f.db.tables.automation_sessions.length, 0);
  assert.equal(f.db.tables.dm_sent_log.length, 0);
});

test('session creation error never degrades into an opening DM without a working button', async () => {
  const f = fixture({ failure: (table, action) => table === 'automation_sessions' && action === 'insert' ? { code: 'XX000', message: 'unavailable' } : null });
  await assert.rejects(f.load('@/lib/automation/processJob').processAutoDmJob(f.payload, 1), /Session creation failed/);
  assert.equal(f.sends.length, 0);
});

for (const follow of [false, true]) {
  test(`link-only response is delivered (${follow ? 'button tap' : 'opening disabled'})`, async () => {
    const f = fixture({ follow, automation: { dm_opening_message_enabled: false, dm_responses: [{ id: 'link', type: 'text', content: '', buttonLink: 'https://example.com/guide' }] } });
    const worker = f.load('@/lib/automation/processJob');
    if (follow) await worker.processFollowUpDmJob(f.payload);
    else await worker.processAutoDmJob(f.payload, 1);
    assert.equal(f.sends.length, 1);
    assert.equal(f.sends[0].name, 'sendInstagramLinkButtonDm');
    assert.equal(f.sends[0].args[4], 'https://example.com/guide');
    assert.equal(f.sends[0].args[2], 'Open link');
  });
}

test('legacy opening link is delivered when no follow-up responses exist', async () => {
  const f = fixture({ follow: true, automation: { dm_responses: [], dm_opening_message_button_link: 'https://example.com/legacy' } });
  await f.load('@/lib/automation/processJob').processFollowUpDmJob(f.payload);
  assert.equal(f.sends.length, 1);
  assert.equal(f.sends[0].args[2], 'https://example.com/legacy');
});

for (const code of [4, 17, 32, 613, 190, 10, 200, 368]) {
  test(`Meta ${code} never triggers inline fallback`, async () => {
    const f = fixture({ follow: true, sendError: () => code });
    await assert.rejects(f.load('@/lib/automation/processJob').processFollowUpDmJob(f.payload));
    assert.equal(f.sends.length, 1);
    assert.equal(f.session.completed, false);
  });
}

test('code 100 template rejection uses exactly one inline fallback', async () => {
  const f = fixture({ follow: true, sendError: name => name === 'sendInstagramLinkButtonDm' ? 100 : null });
  await f.load('@/lib/automation/processJob').processFollowUpDmJob(f.payload);
  assert.equal(f.sends.length, 2);
  assert.equal(f.sends[1].name, 'sendInstagramDm');
  assert.match(f.sends[1].args[2], /https:\/\/example.com/);
});

for (const session of [{ audience_ig_user_id: 'other' }, { instagram_account_id: 'other' }, { automation_id: 'other' }]) {
  test(`session ownership mismatch is rejected: ${Object.keys(session)[0]}`, async () => {
    const f = fixture({ follow: true, session });
    await f.load('@/lib/automation/processJob').processFollowUpDmJob(f.payload);
    assert.equal(f.sends.length, 0);
  });
}

test('session read error is retried rather than marked done as a missing session', async () => {
  const f = fixture({ follow: true, failure: (table, action) => table === 'automation_sessions' && action === 'select' ? { message: 'unavailable' } : null });
  await assert.rejects(f.load('@/lib/automation/processJob').processFollowUpDmJob(f.payload), /Session lookup failed/);
  assert.equal(f.sends.length, 0);
});

test('temporary automation read error preserves the session and retries the requested link', async () => {
  const f = fixture({ follow: true, failure: (table, action) => table === 'automations' && action === 'select' ? { message: 'temporary database error' } : null });
  await assert.rejects(f.load('@/lib/automation/processJob').processFollowUpDmJob(f.payload), /Follow-up automation lookup failed/);
  assert.equal(f.sends.length, 0);
  assert.equal(f.session.completed, false);
});

test('null comment fields do not crash the webhook batch', async () => {
  const f = fixture();
  const base = { id: 'comment', from: { id: 'audience' }, media: { id: 'post' }, text: null };
  await f.load('@/lib/automation/processWebhook').processWebhookPayload({ object: 'instagram', entry: [{
    id: 'business', time: Math.floor(Date.now() / 1000), changes: [
      { field: 'comments', value: base },
      { field: 'comments', value: { ...base, from: null } },
      { field: 'comments', value: { ...base, media: null } },
    ],
  }] });
  assert.equal(f.events.filter(event => event[2] === 'comment_event' && event[3] === 'skipped').length, 2);
});

test('webhook will not enqueue another audience member\'s session button', async () => {
  const f = fixture({ follow: true });
  f.session.id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const count = await f.load('@/lib/automation/processWebhook').processWebhookPayload({ object: 'instagram', entry: [{
    id: 'business', time: Math.floor(Date.now() / 1000), messaging: [{
      sender: { id: 'other' }, recipient: { id: 'business' }, timestamp: Date.now(),
      postback: { payload: 'SESSION_aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa_STEP_1', title: 'Send me link' },
    }],
  }] });
  assert.equal(count, 0);
  assert.equal(f.db.tables.job_queue?.length ?? 0, 0);
});

test('comment -> ambiguous opening -> button tap -> link-only follow-up routes end to end', async () => {
  const f = fixture({
    automation: { dm_responses: [{ id: 'link', type: 'text', content: '', buttonLink: 'https://example.com/guide' }] },
    sendError: (_name, count) => count === 1 ? 1 : null,
  });
  const webhook = f.load('@/lib/automation/processWebhook');
  const worker = f.load('@/lib/automation/processJob');
  const count = await webhook.processWebhookPayload({ object: 'instagram', entry: [{
    id: 'business', time: Math.floor(Date.now() / 1000), changes: [{ field: 'comments', value: {
      id: 'comment', from: { id: 'audience', username: 'alice' }, media: { id: 'post' }, text: 'link',
    } }],
  }] });
  assert.equal(count, 1);
  await worker.processAutoDmJob(f.db.tables.job_queue[0].payload, 1);
  const session = f.db.tables.automation_sessions[0];
  assert.ok(session);
  const taps = await webhook.processWebhookPayload({ object: 'instagram', entry: [{
    id: 'business', time: Math.floor(Date.now() / 1000), messaging: [{
      sender: { id: 'audience' }, recipient: { id: 'business' }, timestamp: Date.now(),
      postback: { payload: f.sends[0].args[4].payload, title: 'Send me the link' },
    }],
  }] });
  assert.equal(taps, 1);
  await worker.processFollowUpDmJob(f.db.tables.job_queue[1].payload);
  assert.equal(f.sends.length, 2);
  assert.equal(f.sends[1].args[4], 'https://example.com/guide');
  assert.equal(session.completed, true);
});

test('queue drains claim one at a time and leave remaining jobs unclaimed at the time budget', async () => {
  let now = 0, claimed = 0;
  const load = sourceLoader({
    '@/lib/logger': { createLogger: () => ({ info() {} }) },
    '@/lib/debugLog': { debugLog() {} },
    '@/lib/automation/queue': {
      claimDueJobs: async limit => { assert.equal(limit, 1); claimed++; return [{ id: String(claimed), job_type: 'auto_dm', payload: {}, attempts: 0 }]; },
      markJobDone: async () => {},
    },
    '@/lib/automation/processJob': { processAutoDmJob: async () => { now += 21000; } },
  }, { Date: { now: () => now } });
  const result = await load('@/lib/automation/engine').processDueJobs(25);
  assert.equal(result.claimed, 2);
  assert.equal(result.done, 2);
});
