# HeartLink Lock System

نظام مركزي مستقل للتحكم في فتح وقفل الهدايا الرقمية بدون حذف محتوى الهدية أو تغيير تصميمها.

## الملفات

- `heartlink-lock.js`: السكربت الذي يضاف داخل كل هدية.
- `admin.html`: لوحة التحكم لإضافة الهدايا وفتحها وقفلها وتعديل رسالة القفل ورقم واتساب.
- `firebase-rules.json`: قواعد Firebase Realtime Database المقترحة.
- `gifts-seed.json`: بيانات أولية للهدايا الموجودة داخل صفحة HeartLink الحالية.

## تركيب Firebase

1. افتح Firebase Console للمشروع `heart-link-e7e31-74eff`.
2. فعل Authentication بطريقة Email/Password.
3. أنشئ مستخدم أدمن من Authentication.
4. انسخ UID الخاص بالأدمن.
5. من Realtime Database أضف:

```json
{
  "admins": {
    "ADMIN_UID_HERE": true
  }
}
```

6. من Rules ضع محتوى `firebase-rules.json`.
7. افتح `admin.html` وسجل الدخول بإيميل وكلمة مرور الأدمن.
8. استورد ملف `gifts-seed.json` من زر "استيراد JSON".

## كود الإضافة داخل كل هدية

ضع الكود التالي قبل `</body>` مباشرة، مع تغيير `gift-001` حسب الهدية:

```html
<script>
  window.HEARTLINK_GIFT_ID = "gift-001";
</script>
<script src="https://heartlink349.github.io/Heart_Link/heartlink-lock.js"></script>
```

إذا كان ملف `heartlink-lock.js` مستضافًا على دومين آخر، غيّر رابط `src` للرابط الجديد.

## إضافة هدية جديدة

1. افتح `admin.html`.
2. اضغط "هدية جديدة".
3. اكتب Gift ID مثل `gift-014`.
4. اكتب اسم الهدية والرابط.
5. اختر الحالة `Open` أو `Closed`.
6. اكتب رسالة القفل ورقم واتساب.
7. اضغط "حفظ".
8. انسخ كود التركيب وضعه قبل `</body>` في ملف HTML الخاص بالهدية.

## فتح أو قفل هدية

- من الجدول اضغط "فتح" لجعل الحالة `open`.
- اضغط "قفل" لجعل الحالة `closed`.
- عند القفل، يظهر Overlay مستقل بأسماء `hl-lock-*` ولا يتم حذف أي محتوى من الهدية.

## تغيير رقم واتساب HeartLink

- من لوحة التحكم اضغط "تعديل" للهدية المطلوبة.
- غيّر رقم واتساب.
- اضغط "حفظ".
- الرابط المستخدم سيكون: `https://wa.me/NUMBER`.

## ملاحظات أمان مهمة

- إعدادات Firebase الموجودة في الواجهة ليست سرًا، لكن صلاحية الكتابة يجب أن تكون محمية بالقواعد.
- صفحة الهدية تقرأ فقط من `gifts`.
- لوحة التحكم تكتب فقط إذا كان المستخدم مسجلًا ومضافًا داخل `/admins/{uid}: true`.
- لا تضع كلمة مرور الأدمن داخل `admin.html`.

## حالة GitHub

تمت محاولة إنشاء فرع `heartlink-lock-system` على `HeartLink349/Heart_Link` عبر تكامل GitHub، لكن التكامل أرجع:

`403 Resource not accessible by integration`

لذلك الملفات هنا جاهزة للرفع يدويًا أو عبر حساب GitHub لديه صلاحية كتابة فعالة. الريبو الذي تم فحصه يحتوي على ملف HTML واحد فقط: `index.html`. وبما أن الطلب ذكر استثناء "الملف ده"، لم يتم حقن `index.html` تلقائيًا.
