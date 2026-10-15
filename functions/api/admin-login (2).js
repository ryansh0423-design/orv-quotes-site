export async function onRequestPost({ request, env }) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  };
  const reply = (status, data) => new Response(JSON.stringify(data), { status, headers });

  try {
    const body = await request.json().catch(() => ({}));
    const supplied = typeof body.password === 'string' ? body.password : '';
    if (!env.ADMIN_LOGIN_PASSWORD || supplied !== env.ADMIN_LOGIN_PASSWORD) {
      return reply(401, { error: '비밀번호가 맞지 않아요.' });
    }

    const url = env.SUPABASE_URL;
    const key = env.SUPABASE_ANON_KEY;
    const email = env.SUPABASE_ADMIN_EMAIL;
    const authPassword = env.SUPABASE_ADMIN_AUTH_PASSWORD;
    if (!url || !key || !email || !authPassword) {
      return reply(500, { error: 'Cloudflare 환경 변수 설정이 부족해요.' });
    }

    const response = await fetch(`${url.replace(/\/$/, '')}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: key },
      body: JSON.stringify({ email, password: authPassword })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.access_token || !data.refresh_token) {
      return reply(401, { error: '관리자 Supabase 계정 로그인을 확인해 주세요.' });
    }
    return reply(200, { access_token: data.access_token, refresh_token: data.refresh_token });
  } catch {
    return reply(400, { error: '로그인 요청을 처리하지 못했어요.' });
  }
}
