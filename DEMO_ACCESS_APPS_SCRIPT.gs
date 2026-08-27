/**
 * EAMAR DEMO ACCESS — Apps Script
 * طبقة جاهزة لإصدار روابط تجريبية محددة المدة لكل نسخة Demo.
 *
 * الاستخدام المهني:
 * 1) الصق هذا الملف داخل مشروع Apps Script الخاص بنسخة DEMO فقط، وليس نسخة العملاء.
 * 2) في أول doGet(e) الحالي استدعِ DEMO_validateAccess_(e).
 * 3) إذا لم تكن النتيجة ok=true أرجع صفحة الرفض بدل واجهة النظام.
 * 4) أنشئ الرابط من حساب الإدارة فقط بواسطة DEMO_createAccessLink(hours).
 *
 * مثال داخل doGet الحالي:
 * const gate = DEMO_validateAccess_(e);
 * if (!gate.ok) return DEMO_accessDeniedPage_(gate.reason);
 * // ثم أكمل كود doGet الحالي كما هو.
 */

const DEMO_PREFIX_ = 'EAMAR_DEMO_';

function DEMO_createAccessLink(hours) {
  hours = Number(hours || 24);
  if (![24, 72, 168].includes(hours)) {
    throw new Error('المدة المسموحة: 24 أو 72 أو 168 ساعة.');
  }

  const baseUrl = ScriptApp.getService().getUrl();
  if (!baseUrl) throw new Error('يجب نشر المشروع كتطبيق ويب أولًا.');

  const rawToken = DEMO_generateToken_();
  const tokenHash = DEMO_hash_(rawToken);
  const now = Date.now();
  const expiresAt = now + hours * 60 * 60 * 1000;

  const record = {
    createdAt: now,
    expiresAt: expiresAt,
    active: true
  };

  PropertiesService.getScriptProperties()
    .setProperty(DEMO_PREFIX_ + tokenHash, JSON.stringify(record));

  return baseUrl + '?demo=' + encodeURIComponent(rawToken);
}

function DEMO_validateAccess_(e) {
  const rawToken = String(e && e.parameter && e.parameter.demo || '').trim();
  if (!rawToken) return { ok: false, reason: 'missing' };

  const tokenHash = DEMO_hash_(rawToken);
  const props = PropertiesService.getScriptProperties();
  const key = DEMO_PREFIX_ + tokenHash;
  const saved = props.getProperty(key);
  if (!saved) return { ok: false, reason: 'invalid' };

  let record;
  try { record = JSON.parse(saved); }
  catch (_) { return { ok: false, reason: 'invalid' }; }

  if (!record.active) return { ok: false, reason: 'revoked' };
  if (!record.expiresAt || Date.now() >= Number(record.expiresAt)) {
    props.deleteProperty(key);
    return { ok: false, reason: 'expired' };
  }

  return {
    ok: true,
    expiresAt: Number(record.expiresAt)
  };
}

function DEMO_revokeAccess(rawToken) {
  rawToken = String(rawToken || '').trim();
  if (!rawToken) throw new Error('أدخل رمز الرابط.');
  const key = DEMO_PREFIX_ + DEMO_hash_(rawToken);
  PropertiesService.getScriptProperties().deleteProperty(key);
  return true;
}

function DEMO_cleanupExpired() {
  const props = PropertiesService.getScriptProperties();
  const all = props.getProperties();
  const now = Date.now();
  let deleted = 0;

  Object.keys(all).forEach((key) => {
    if (!key.startsWith(DEMO_PREFIX_)) return;
    try {
      const record = JSON.parse(all[key]);
      if (!record.expiresAt || now >= Number(record.expiresAt)) {
        props.deleteProperty(key);
        deleted++;
      }
    } catch (_) {
      props.deleteProperty(key);
      deleted++;
    }
  });

  return deleted;
}

function DEMO_accessDeniedPage_(reason) {
  const messages = {
    missing: 'هذا الرابط يحتاج إلى تصريح تجربة صالح.',
    invalid: 'رابط التجربة غير صالح.',
    expired: 'انتهت مدة الرابط التجريبي.',
    revoked: 'تم إلغاء هذا الرابط التجريبي.'
  };
  const msg = messages[reason] || 'تعذر التحقق من رابط التجربة.';
  return HtmlService.createHtmlOutput(
    '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>انتهت صلاحية التجربة</title></head>' +
    '<body style="font-family:Arial,sans-serif;background:#081426;color:#fff;display:grid;place-items:center;min-height:100vh;margin:0">' +
    '<main style="max-width:560px;padding:32px;text-align:center">' +
    '<h1 style="margin:0 0 14px">الدخول غير متاح</h1>' +
    '<p style="color:#cbd5e1;line-height:1.8">' + msg + '</p>' +
    '</main></body></html>'
  );
}

function DEMO_generateToken_() {
  const seed = [Utilities.getUuid(), Date.now(), Math.random(), Session.getTemporaryActiveUserKey()].join('|');
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, seed, Utilities.Charset.UTF_8);
  return Utilities.base64EncodeWebSafe(bytes).replace(/=+$/g, '');
}

function DEMO_hash_(rawToken) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(rawToken), Utilities.Charset.UTF_8);
  return Utilities.base64EncodeWebSafe(bytes).replace(/=+$/g, '');
}


/**
 * استقبال طلبات الموقع داخل Google Sheet.
 * غيّر REQUEST_SHEET_ID_ إلى معرف ملف Google Sheets الإداري.
 * لا تضع هذا المعرف في JavaScript الخاص بالموقع.
 */
const REQUEST_SHEET_ID_ = '1RoQpxZTC333nvyFKk1wk1qC3INRGJWSx8__3bSxl9xE';
const REQUEST_SHEET_NAME_ = 'طلبات_الموقع';

function doPost(e) {
  try {
    const p = (e && e.parameter) || {};
    if (String(p._gotcha || '').trim()) {
      return ContentService.createTextOutput(JSON.stringify({ ok: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const name = String(p.name || '').trim();
    const phone = String(p.phone || '').trim();
    const service = String(p.service || '').trim();
    if (name.length < 2 || phone.length < 8 || !service) {
      throw new Error('بيانات الطلب غير مكتملة.');
    }

    if (!REQUEST_SHEET_ID_ || REQUEST_SHEET_ID_.includes('PUT_ADMIN')) {
      throw new Error('يجب ضبط REQUEST_SHEET_ID_ أولًا.');
    }

    const ss = SpreadsheetApp.openById(REQUEST_SHEET_ID_);
    let sh = ss.getSheetByName(REQUEST_SHEET_NAME_);
    if (!sh) {
      sh = ss.insertSheet(REQUEST_SHEET_NAME_);
      sh.appendRow([
        'رقم الطلب','وقت الاستلام','نوع الطلب','الاسم','الجوال','الخدمة',
        'تفاصيل الطلب','نظام التجربة','مدة التجربة بالساعات','الحالة','رابط التجربة'
      ]);
      sh.setFrozenRows(1);
    }

    const requestId = 'REQ-' + Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Riyadh', 'yyyyMMdd-HHmmss');
    sh.appendRow([
      requestId, new Date(), String(p.request_type || 'consultation'), name, phone, service,
      String(p.details || ''), String(p.demo_system || ''), String(p.demo_duration_hours || ''),
      'جديد', ''
    ]);

    return ContentService.createTextOutput(JSON.stringify({ ok: true, requestId: requestId }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err && err.message || err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * بعد مراجعة طلب Demo في شيت "طلبات_الموقع":
 * شغّل DEMO_approveRequest('REQ-....')
 * فيصدر رابطًا محدد المدة ويكتبه في نفس صف الطلب.
 */
function DEMO_approveRequest(requestId) {
  requestId = String(requestId || '').trim();
  if (!requestId) throw new Error('أدخل رقم الطلب.');

  if (!REQUEST_SHEET_ID_ || REQUEST_SHEET_ID_.includes('PUT_ADMIN')) {
    throw new Error('يجب ضبط REQUEST_SHEET_ID_ أولًا.');
  }

  const sh = SpreadsheetApp.openById(REQUEST_SHEET_ID_).getSheetByName(REQUEST_SHEET_NAME_);
  if (!sh) throw new Error('ورقة طلبات_الموقع غير موجودة.');

  const values = sh.getDataRange().getValues();
  for (let r = 1; r < values.length; r++) {
    if (String(values[r][0]) !== requestId) continue;
    if (String(values[r][2]) !== 'demo') throw new Error('هذا الطلب ليس طلب تجربة.');

    const hours = Number(values[r][8] || 24);
    const link = DEMO_createAccessLink(hours);
    sh.getRange(r + 1, 10).setValue('معتمد');
    sh.getRange(r + 1, 11).setValue(link);
    return link;
  }
  throw new Error('لم يتم العثور على رقم الطلب.');
}
