# دليل نشر «إدارة متجر» على GitHub وطلب الدعم

## 1. هل يمكن النشر مجانًا؟

نعم. يسمح حساب GitHub Free الشخصي بمستودعات عامة غير محدودة مع عدد غير محدود من المتعاونين، كما يوفر مستودعات خاصة غير محدودة بقدرات محدودة [1]. لتقديم تطبيقك للمستخدمين أو طلب الدعم من مجتمع المصادر المفتوحة، يُفضّل أن يكون المستودع **Public** بعد إزالة أي أسرار أو بيانات عملاء.

## 2. قبل الرفع: قائمة أمان سريعة

| افعل | لا ترفع |
|---|---|
| احتفظ بـ`.gitignore` الموجود في المشروع | `node_modules/` |
| راجع `git status` قبل كل رفع | ملفات `.env` أو مفاتيح API |
| احتفظ بصور العرض والأيقونات | مفاتيح Android مثل `.jks` و`.keystore` |
| استخدم بيانات تجريبية فقط في لقطات الشاشة | نسخ احتياطية حقيقية لبيانات المحل |

> لا ترفع كلمات المرور أو مفاتيح التوقيع أو بيانات العملاء إلى مستودع عام. إذا انكشف سر بالفعل، ألغِه من مزود الخدمة فورًا؛ حذف الملف من Git لا يلغي النسخ السابقة من السجل.

## 3. إنشاء المستودع من موقع GitHub

1. سجّل الدخول إلى GitHub ثم اختر علامة **+** في الأعلى، وبعدها **New repository**.
2. اكتب اسمًا واضحًا: `mahal-stock` أو `store-manager-ar`.
3. أضف وصفًا قصيرًا، مثل: `Arabic Android app for local inventory and barcode-based sales.`
4. اختر **Public** إذا كان الهدف عرض المشروع وفتح باب الدعم أو المساهمات؛ اختر **Private** إن كان الكود للاستخدام الداخلي فقط.
5. **لا تفعل خيار Add a README** في هذه الحالة، لأن المشروع المحلي يحتوي بالفعل على `README.md`.
6. اضغط **Create repository**.

توثق GitHub هذه الخطوات لإنشاء المستودع، وتوضح أن ملف README يظهر تلقائيًا في واجهة المستودع [2].

## 4. رفع المشروع من جهازك عبر الطرفية

افتح Terminal أو PowerShell داخل مجلد المشروع، ثم نفذ الأوامر الآتية بعد استبدال `USERNAME` باسم مستخدمك:

```bash
git init
git add .
git commit -m "Initial release: Arabic store management app"
git branch -M main
git remote add origin https://github.com/USERNAME/mahal-stock.git
git push -u origin main
```

إذا طلب GitHub تسجيل الدخول، أكمل المصادقة في المتصفح. لا تستخدم كلمة مرور حسابك مع Git عند الطلب؛ استخدم تسجيل الدخول من المتصفح أو Personal Access Token عند الحاجة.

## 5. الرفع بدون أوامر: GitHub Desktop

يمكنك استخدام GitHub Desktop بدل الطرفية. اختر **File → Add local repository**، وحدد مجلد `mahal-stock`، ثم اختر **Publish repository**. اكتب الاسم والوصف وحدد Public أو Private ثم اضغط **Publish repository**. راجع الملفات قبل النشر للتأكد من عدم وجود أسرار أو بيانات شخصية.

## 6. ماذا يجب أن يحتوي README؟

يوجد في جذر هذا المشروع ملف `README.md` جاهز بالعربية. يغطي وصف التطبيق، الميزات، التقنيات، التشغيل، بناء APK، المساهمة، والدعم. توصي GitHub بأن يشرح README ما الذي يفعله المشروع، ولماذا يفيد المستخدمين، وكيف يبدأون استخدامه، وأين يحصلون على المساعدة، ومن يديره [3].

قبل الرفع، عدّل فقط هذه المواضع:

| الموضع | ما الذي تعدله؟ |
|---|---|
| رابط `git clone` | استبدل `USERNAME` باسم مستخدمك على GitHub |
| قسم الترخيص | اختر MIT أو GPL-3.0 أو ترخيصًا خاصًا بك |
| قسم الدعم | أضف رابط GitHub Sponsors أو منصة دعم موثوقة بعد إعدادها |
| لقطات الشاشة | أضف صورًا من التطبيق دون بيانات متجر حقيقية |

## 7. هل يمكن طلب دعم مادي؟

نعم، إن كان المشروع مفتوح المصدر يمكنك إعداد **GitHub Sponsors**. يتطلب ذلك مساهمة في مشروع مفتوح المصدر، والإقامة في منطقة مدعومة، وتمكين المصادقة الثنائية، ثم إكمال الملف التعريفي وبيانات الحساب البنكي والضرائب قبل إرسال الطلب للمراجعة [4] [5]. يمكن للجهات الداعمة تقديم دفعات شهرية أو لمرة واحدة وفق المستويات التي تنشئها.

إذا لم يكن GitHub Sponsors متاحًا في منطقتك أو لم ترغب في استخدامه، يمكنك إظهار زر Sponsor بمصدر دعم خارجي موثوق. تدعم GitHub روابط مثل Buy Me a Coffee وKo-fi وPatreon وOpen Collective، إضافة إلى روابط مخصصة [6].

### ملف الدعم `FUNDING.yml`

لا تنسخ النموذج التالي كما هو إلى مستودع عام؛ استبدل القيم بروابطك الحقيقية فقط، ثم احفظه في `.github/FUNDING.yml`:

```yaml
# استخدم المنصات التي تملك حسابات فيها فقط
github: YOUR_GITHUB_USERNAME
ko_fi: YOUR_KOFI_USERNAME
buy_me_a_coffee: YOUR_BUYMEACOFFEE_USERNAME
# أو رابط واحد/عدة روابط مخصصة موثوقة
custom: ["https://example.com/support"]
```

بعد رفع الملف، افتح المستودع ثم **Settings → General → Features → Sponsorships** لإعداد أو تفعيل زر Sponsor. تسمح GitHub حتى بأربعة روابط مخصصة في ملف التمويل [6].

### صياغة مهنية لطلب الدعم

استخدم رسالة صادقة ومحددة مثل:

> يساعد الدعم في تمويل تطوير مسح الباركود، تحسين التقارير، إصلاح الأخطاء، وصيانة تطبيق إدارة متجر. لا يمنح الدعم ملكية في المشروع أو ضمانات تجارية، إلا إذا تم الاتفاق على ذلك بشكل منفصل ومكتوب.

تجنب الوعود غير الواقعية، واحترم القوانين الضريبية والدفع في بلدك. إذا ستبيع التطبيق أو تستقبل مبالغ مقابل خدمات مخصصة، فاستشر مختصًا قانونيًا أو ضريبيًا محليًا بشأن التزاماتك.

## 8. بعد أول رفع

1. أضف Topics مثل: `expo` و`react-native` و`android` و`inventory` و`barcode` و`arabic`.
2. فعّل Issues للإبلاغ عن الأخطاء وDiscussions للأسئلة والاقتراحات.
3. أنشئ Release عند تجهيز APK، وأرفق ملف APK أو رابط تنزيل موثوقًا، مع ملاحظات إصدار واضحة.
4. أضف `LICENSE` قبل قبول مساهمات خارجية.
5. استخدم branches وPull Requests للتغييرات الكبيرة بدل التعديل المباشر في `main`.

## المراجع

[1]: https://docs.github.com/get-started/learning-about-github/githubs-products "GitHub plans"
[2]: https://docs.github.com/en/repositories/creating-and-managing-repositories/quickstart-for-repositories "Quickstart for repositories"
[3]: https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes "About the repository README file"
[4]: https://docs.github.com/en/sponsors/getting-started-with-github-sponsors/about-github-sponsors "About GitHub Sponsors"
[5]: https://docs.github.com/sponsors/receiving-sponsorships-through-github-sponsors/setting-up-github-sponsors-for-your-personal-account "Setting up GitHub Sponsors for your personal account"
[6]: https://docs.github.com/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/displaying-a-sponsor-button-in-your-repository "Displaying a sponsor button in your repository"
