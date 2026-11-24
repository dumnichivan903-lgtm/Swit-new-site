export default async (request) => {
  if (request.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'content-type': 'application/json' } });
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID || '8594680551';
  if (!token || !chatId) return new Response(JSON.stringify({ error: 'Бот ещё не настроен администратором.' }), { status: 503, headers: { 'content-type': 'application/json' } });
  try {
    const d = await request.json();
    const required = ['name','telegram','country','platform','link','quantity'];
    if (required.some(k => !String(d[k] || '').trim())) return new Response(JSON.stringify({ error: 'Заполни все обязательные поля.' }), { status: 400, headers: { 'content-type': 'application/json' } });
    const username = String(d.telegram).replace(/^@/, '');
    if (!/^[A-Za-z0-9_]{5,32}$/.test(username)) return new Response(JSON.stringify({ error: 'Проверь Telegram username.' }), { status: 400, headers: { 'content-type': 'application/json' } });
    let productUrl;
    try { productUrl = new URL(d.link); } catch { return new Response(JSON.stringify({ error: 'Ссылка на товар некорректна.' }), { status: 400, headers: { 'content-type': 'application/json' } }); }
    if (!['http:', 'https:'].includes(productUrl.protocol)) return new Response(JSON.stringify({ error: 'Нужна ссылка http или https.' }), { status: 400, headers: { 'content-type': 'application/json' } });
    const safe = v => String(v || '—').slice(0, 700);
    const message = [
      '🔴 НОВАЯ ЗАЯВКА SWIT',
      `Имя: ${safe(d.name)}`,
      `Telegram покупателя: @${username}`,
      `Страна доставки: ${safe(d.country)}`,
      `Площадка: ${safe(d.platform)}`,
      `Ссылка на товар: ${productUrl.href}`,
      `Количество: ${safe(d.quantity)}`,
      `Размер / цвет: ${safe(d.sizeColor)}`,
      `Примерный вес: ${safe(d.weight)}${d.weight ? ' кг' : ''}`,
      `Комментарий: ${safe(d.extra)}`
    ].join('\n');
    const tg = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message, disable_web_page_preview: true })
    });
    const result = await tg.json();
    if (!tg.ok || !result.ok) throw new Error('Telegram API error');
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Не удалось отправить заявку. Попробуй ещё раз.' }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
};
