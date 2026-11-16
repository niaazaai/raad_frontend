import type { AppLocale } from "@/data/enums/locale";

type Copy = { label: string; description: string };

const fa = "fa" as const;
const ps = "ps" as const;

const ACTION: Record<string, Record<AppLocale, string>> = {
  read: { en: "View", fa: "مشاهده", ps: "کتل" },
  create: { en: "Add", fa: "افزودن", ps: "زیاتول" },
  update: { en: "Edit", fa: "ویرایش", ps: "سمول" },
  delete: { en: "Delete", fa: "حذف", ps: "ړنګول" },
  toggle: { en: "Activate or deactivate", fa: "فعال یا غیرفعال کردن", ps: "فعال یا غیر فعال کول" },
  export: { en: "Export to Excel", fa: "خروجی اکسل", ps: "اکسل ته صادرات" },
  print: { en: "Print or save as PDF", fa: "چاپ یا ذخیره PDF", ps: "چاپ یا د PDF خوندي کول" },
  payment: { en: "Record a class payment", fa: "ثبت پرداخت صنف", ps: "د صنف تادیه ثبتول" },
  refund: { en: "Record a refund", fa: "ثبت بازپرداخت", ps: "بیرته ورکړه ثبتول" },
  invoice: { en: "Issue a class invoice", fa: "صدور فاکتور صنف", ps: "د صنف انوایس صادرول" },
};

const DETAIL: Record<string, Record<AppLocale, string>> = {
  read: {
    en: "Open the list and see these records.",
    fa: "فهرست را باز کنید و این رکوردها را ببینید.",
    ps: "لست پرانیزئ او دا ریکارډونه وګورئ.",
  },
  create: {
    en: "Add a new record in this area.",
    fa: "در این بخش رکورد تازه بسازید.",
    ps: "په دې برخه کې نوی ریکارډ زیات کړئ.",
  },
  update: {
    en: "Change an existing record.",
    fa: "یک رکورد موجود را تغییر دهید.",
    ps: "شته ریکارډ بدل کړئ.",
  },
  delete: {
    en: "Remove a record from this area.",
    fa: "یک رکورد را از این بخش حذف کنید.",
    ps: "له دې برخې ریکارډ لرې کړئ.",
  },
  toggle: {
    en: "Switch a record between active and inactive.",
    fa: "رکورد را بین فعال و غیرفعال جابه‌جا کنید.",
    ps: "ریکارډ فعال یا غیر فعال کړئ.",
  },
  export: {
    en: "Download the current list to Excel.",
    fa: "فهرست جاری را به اکسل دانلود کنید.",
    ps: "اوسنی لست اکسل ته ښکته کړئ.",
  },
  print: {
    en: "Print the current list or save it as a PDF.",
    fa: "فهرست جاری را چاپ کنید یا PDF ذخیره کنید.",
    ps: "اوسنی لست چاپ کړئ یا یې PDF خوندي کړئ.",
  },
  payment: {
    en: "Take a payment on a class enrollment.",
    fa: "برای ثبت‌نام صنف پرداخت بگیرید.",
    ps: "د صنف پر نوم‌لیکنه تادیه واخلئ.",
  },
  refund: {
    en: "Return money already recorded on an enrollment.",
    fa: "پولی را که برای ثبت‌نام ثبت شده برگردانید.",
    ps: "هغه پیسې بېرته ورکړئ چې پر نوم‌لیکنه ثبت شوې دي.",
  },
  invoice: {
    en: "Create an invoice for a class enrollment.",
    fa: "برای ثبت‌نام صنف فاکتور بسازید.",
    ps: "د صنف د نوم‌لیکنې لپاره انوایس جوړ کړئ.",
  },
};

const SUBJECT: Record<string, Record<AppLocale, string>> = {
  users: { en: "user accounts", fa: "حساب‌های کاربران", ps: "د کاروونکو حسابونه" },
  roles: { en: "roles", fa: "نقش‌ها", ps: "رولونه" },
  permissions: { en: "the permission list", fa: "فهرست دسترسی‌ها", ps: "د اجازو لست" },
  students: { en: "student profiles", fa: "پرونده‌های شاگردان", ps: "د زده‌کوونکو دوسيې" },
  blogs: { en: "blog posts", fa: "نوشته‌های بلاگ", ps: "د بلاګ لیکنې" },
  "course.main_categories": { en: "main categories", fa: "دسته‌های اصلی", ps: "اصلي کټګورۍ" },
  "course.sub_categories": { en: "sub categories", fa: "زیردسته‌ها", ps: "فرعي کټګورۍ" },
  "course.faasl_modules": { en: "chapters", fa: "فصل‌ها", ps: "فصلونه" },
  "course.courses": { en: "courses", fa: "دوره‌ها", ps: "کورسونه" },
  "course.lessons": { en: "lessons", fa: "درس‌ها", ps: "درسونه" },
  "course.assignments": { en: "chapter files", fa: "فایل‌های فصل", ps: "د فصل فایلونه" },
  "course.resources": { en: "downloadable resources", fa: "منابع قابل دانلود", ps: "د ښکته کولو سرچینې" },
  "course.quiz_files": { en: "quiz files", fa: "فایل‌های آزمون", ps: "د ازموینې فایلونه" },
  "course.mock_tests": { en: "mock tests", fa: "آزمون‌های آزمایشی", ps: "ازمایښتي ازموینې" },
  "course.subscription_plans": { en: "subscription plans", fa: "پلن‌های اشتراک", ps: "د ګډون پلانونه" },
  "course.student_subscriptions": { en: "course subscriptions", fa: "اشتراک‌های دوره", ps: "د کورس ګډونونه" },
  "course.instructors": { en: "instructors", fa: "استادان", ps: "ښوونکي" },
  "course.lms_classes": { en: "classes", fa: "صنف‌ها", ps: "صنفونه" },
  "course.class_students": { en: "class enrollments", fa: "ثبت‌نام‌های صنف", ps: "د صنف نوم‌لیکنې" },
};

const GROUP: Record<string, Record<AppLocale, string>> = {
  users: { en: "Users", fa: "کاربران", ps: "کاروونکي" },
  roles: { en: "Roles", fa: "نقش‌ها", ps: "رولونه" },
  permissions: { en: "Permissions", fa: "دسترسی‌ها", ps: "اجازې" },
  students: { en: "Students", fa: "شاگردان", ps: "زده‌کوونکي" },
  blogs: { en: "Blog", fa: "بلاگ", ps: "بلاګ" },
  settings: { en: "Settings", fa: "تنظیمات", ps: "تنظیمات" },
  dashboard: { en: "Dashboard", fa: "داشبورد", ps: "ډشبورډ" },
  finance: { en: "Finance", fa: "مالی", ps: "مالي" },
  attendance: { en: "Attendance", fa: "حاضری", ps: "حاضري" },
  reports: { en: "Reports", fa: "گزارش‌ها", ps: "راپورونه" },
  activity_log: { en: "Activity log", fa: "گزارش فعالیت", ps: "د فعالیت ثبت" },
  "course.content": { en: "Course content", fa: "محتوای دوره", ps: "د کورس منځپانګه" },
  "course.main_categories": { en: "Main categories", fa: "دسته‌های اصلی", ps: "اصلي کټګورۍ" },
  "course.sub_categories": { en: "Sub categories", fa: "زیردسته‌ها", ps: "فرعي کټګورۍ" },
  "course.faasl_modules": { en: "Chapters", fa: "فصل‌ها", ps: "فصلونه" },
  "course.courses": { en: "Courses", fa: "دوره‌ها", ps: "کورسونه" },
  "course.lessons": { en: "Lessons", fa: "درس‌ها", ps: "درسونه" },
  "course.assignments": { en: "Chapter files", fa: "فایل‌های فصل", ps: "د فصل فایلونه" },
  "course.resources": { en: "Resources", fa: "منابع", ps: "سرچینې" },
  "course.quiz_files": { en: "Quiz files", fa: "فایل‌های آزمون", ps: "د ازموینې فایلونه" },
  "course.mock_tests": { en: "Mock tests", fa: "آزمون‌های آزمایشی", ps: "ازمایښتي ازموینې" },
  "course.subscription_plans": { en: "Subscription plans", fa: "پلن‌های اشتراک", ps: "د ګډون پلانونه" },
  "course.student_subscriptions": { en: "Subscriptions", fa: "اشتراک‌ها", ps: "ګډونونه" },
  "course.instructors": { en: "Instructors", fa: "استادان", ps: "ښوونکي" },
  "course.lms_classes": { en: "Classes", fa: "صنف‌ها", ps: "صنفونه" },
  "course.class_students": { en: "Class students", fa: "شاگردان صنف", ps: "د صنف زده‌کوونکي" },
};

const SPECIAL: Record<string, Record<AppLocale, Copy>> = {
  "permissions.read": {
    en: { label: "View permissions", description: "Open the list of every permission in the system." },
    fa: { label: "مشاهده دسترسی‌ها", description: "فهرست همه دسترسی‌های سیستم را باز کنید." },
    ps: { label: "اجازې کتل", description: "د سیستم د ټولو اجازو لست پرانیزئ." },
  },
  "dashboard.read": {
    en: { label: "Open the dashboard", description: "See the main dashboard page." },
    fa: { label: "باز کردن داشبورد", description: "صفحه اصلی داشبورد را ببینید." },
    ps: { label: "ډشبورډ پرانیستل", description: "د ډشبورډ اصلي پاڼه وګورئ." },
  },
  "dashboard.analytics.read": {
    en: { label: "View dashboard charts", description: "See earnings, enrolments, and class charts." },
    fa: { label: "نمودارهای داشبورد", description: "نمودار درآمد، ثبت‌نام و صنف‌ها را ببینید." },
    ps: { label: "د ډشبورډ چارټونه", description: "د عاید، نوم‌لیکنې او صنفونو چارټونه وګورئ." },
  },
  "settings.view": {
    en: { label: "View settings", description: "Open institute settings without changing them." },
    fa: { label: "مشاهده تنظیمات", description: "تنظیمات مؤسسه را بدون تغییر ببینید." },
    ps: { label: "تنظیمات کتل", description: "د مؤسسه تنظیمات پرته له بدلون وګورئ." },
  },
  "settings.update": {
    en: { label: "Edit settings", description: "Change institute settings." },
    fa: { label: "ویرایش تنظیمات", description: "تنظیمات مؤسسه را تغییر دهید." },
    ps: { label: "تنظیمات سمول", description: "د مؤسسه تنظیمات بدل کړئ." },
  },
  "finance.read": {
    en: { label: "Open finance", description: "Enter the finance section and see its lists." },
    fa: { label: "باز کردن بخش مالی", description: "وارد بخش مالی شوید و فهرست‌های آن را ببینید." },
    ps: { label: "مالي برخه پرانیستل", description: "مالي برخې ته ننوځئ او لستونه یې وګورئ." },
  },
  "finance.transactions.delete": {
    en: { label: "Delete a transaction", description: "Remove a financial transaction. Limited to root." },
    fa: { label: "حذف تراکنش", description: "یک تراکنش مالی را حذف کنید. فقط برای ریشه." },
    ps: { label: "معامله ړنګول", description: "یوه مالي معامله لرې کړئ. یوازې د روت لپاره." },
  },
  "finance.reports.export": {
    en: { label: "Export finance reports", description: "Download the finance report to Excel." },
    fa: { label: "خروجی گزارش مالی", description: "گزارش مالی را به اکسل دانلود کنید." },
    ps: { label: "د مالي راپور صادرات", description: "مالي راپور اکسل ته ښکته کړئ." },
  },
  "finance.reports.print": {
    en: { label: "Print finance reports", description: "Print a finance report or save it as a PDF." },
    fa: { label: "چاپ گزارش مالی", description: "گزارش مالی را چاپ کنید یا PDF ذخیره کنید." },
    ps: { label: "د مالي راپور چاپ", description: "مالي راپور چاپ کړئ یا یې PDF خوندي کړئ." },
  },
  "finance.transactions.edit": {
    en: { label: "Edit financial records", description: "Change a saved payment, invoice, or other financial record." },
    fa: { label: "ویرایش رکورد مالی", description: "پرداخت، فاکتور یا رکورد مالی ذخیره‌شده را تغییر دهید." },
    ps: { label: "مالي ریکارډ سمول", description: "خوندي شوې تادیه، انوایس یا بل مالي ریکارډ بدل کړئ." },
  },
  "finance.payments.receive": {
    en: { label: "Receive a payment", description: "Record money received from a student, MOF, or another payer." },
    fa: { label: "دریافت پرداخت", description: "پول دریافتی از شاگرد، وزارت مالیه یا پرداخت‌کننده دیگر را ثبت کنید." },
    ps: { label: "تادیه ترلاسه کول", description: "له زده‌کوونکي، مالیه یا بل تادیه کوونکي پیسې ثبت کړئ." },
  },
  "finance.discounts.apply": {
    en: { label: "Apply a discount", description: "Give or change a discount on a fee." },
    fa: { label: "اعمال تخفیف", description: "روی فیس تخفیف بدهید یا آن را تغییر دهید." },
    ps: { label: "تخفیف ورکول", description: "پر فیس تخفیف ورکړئ یا یې بدل کړئ." },
  },
  "finance.debts.writeoff": {
    en: { label: "Write off a debt", description: "Mark an unpaid balance as no longer collectable." },
    fa: { label: "حذف مطالبه", description: "مانده پرداخت‌نشده را غیرقابل وصول علامت بزنید." },
    ps: { label: "پور لیکل", description: "نه ورکړل شوی پاتې مبلغ د نه راټولېدو په توګه په نښه کړئ." },
  },
  "finance.dues.read": {
    en: { label: "View dues", description: "See upcoming and overdue installments." },
    fa: { label: "مشاهده اقساط", description: "اقساط آینده و عقب‌افتاده را ببینید." },
    ps: { label: "قسطونه کتل", description: "راتلونکي او تېر شوي قسطونه وګورئ." },
  },
  "finance.receivables.students.read": {
    en: { label: "View student receivables", description: "See how much students still owe." },
    fa: { label: "مطالبات شاگردان", description: "ببینید شاگردان هنوز چقدر بدهکارند." },
    ps: { label: "د زده‌کوونکو پورونه", description: "وګورئ زده‌کوونکي لا څومره پور لري." },
  },
  "finance.receivables.mof.read": {
    en: { label: "View MOF receivables", description: "See amounts still owed by the Ministry of Finance." },
    fa: { label: "مطالبات وزارت مالیه", description: "مبلغ باقی‌مانده از وزارت مالیه را ببینید." },
    ps: { label: "د مالیې پورونه", description: "هغه مبلغ وګورئ چې لا د مالیې وزارت پور دی." },
  },
  "finance.receivables.other.read": {
    en: { label: "View other receivables", description: "See amounts still owed by other parties." },
    fa: { label: "سایر مطالبات", description: "مبلغ باقی‌مانده از طرف‌های دیگر را ببینید." },
    ps: { label: "نور پورونه", description: "هغه مبلغ وګورئ چې لا د نورو لورو پور دی." },
  },
  "finance.invoices.read": {
    en: { label: "View invoices", description: "Open the invoice list." },
    fa: { label: "مشاهده فاکتورها", description: "فهرست فاکتورها را باز کنید." },
    ps: { label: "انوایسونه کتل", description: "د انوایسونو لست پرانیزئ." },
  },
  "finance.service_income.read": {
    en: { label: "View service income", description: "See income recorded outside class fees." },
    fa: { label: "مشاهده درآمد خدمات", description: "درآمد ثبت‌شده بیرون از فیس صنف را ببینید." },
    ps: { label: "د خدمت عاید کتل", description: "هغه عاید وګورئ چې د صنف له فیس بهر ثبت شوی." },
  },
  "finance.service_income.create": {
    en: { label: "Record service income", description: "Add income that is not a class fee." },
    fa: { label: "ثبت درآمد خدمات", description: "درآمدی را که فیس صنف نیست ثبت کنید." },
    ps: { label: "د خدمت عاید ثبتول", description: "هغه عاید زیات کړئ چې د صنف فیس نه دی." },
  },
  "finance.manual_invoices.create": {
    en: { label: "Create a manual invoice", description: "Write an invoice that was not generated from a class payment." },
    fa: { label: "فاکتور دستی", description: "فاکتوری بسازید که از پرداخت صنف ساخته نشده است." },
    ps: { label: "لاسي انوایس", description: "هغه انوایس ولیکئ چې له صنف تادیې نه وي جوړ شوی." },
  },
  "finance.dashboard.read": {
    en: { label: "View finance cards", description: "See the finance summary cards and dashboard earnings." },
    fa: { label: "کارت‌های مالی", description: "کارت‌های خلاصه مالی و درآمد داشبورد را ببینید." },
    ps: { label: "مالي کارتونه", description: "د مالي لنډیز کارتونه او د ډشبورډ عاید وګورئ." },
  },
  "attendance.read": {
    en: { label: "View attendance", description: "Open attendance and see who was present, absent, or on leave." },
    fa: { label: "مشاهده حاضری", description: "حاضری را باز کنید و حاضر، غایب یا رخصت را ببینید." },
    ps: { label: "حاضري کتل", description: "حاضري پرانیزئ او حاضر، غیرحاضر یا رخصت وګورئ." },
  },
  "attendance.record": {
    en: { label: "Mark attendance", description: "Mark a student present, absent, or on leave." },
    fa: { label: "ثبت حاضری", description: "شاگرد را حاضر، غایب یا رخصت علامت بزنید." },
    ps: { label: "حاضري ثبتول", description: "زده‌کوونکی حاضر، غیرحاضر یا په رخصت نښه کړئ." },
  },
  "attendance.classes.read": {
    en: { label: "View class attendance", description: "See attendance for the classes assigned to you." },
    fa: { label: "حاضری صنف‌ها", description: "حاضری صنف‌هایی را که به شما سپرده شده ببینید." },
    ps: { label: "د صنف حاضري", description: "د هغو صنفونو حاضري وګورئ چې تاسو ته سپارل شوي." },
  },
  "reports.students.read": {
    en: { label: "View the student report", description: "Open progress, grades, and attendance for students." },
    fa: { label: "گزارش شاگردان", description: "پیشرفت، نمره و حاضری شاگردان را باز کنید." },
    ps: { label: "د زده‌کوونکو راپور", description: "پرمختګ، نمره او حاضري وګورئ." },
  },
  "reports.students.export": {
    en: { label: "Export the student report", description: "Download the student report to Excel." },
    fa: { label: "خروجی گزارش شاگردان", description: "گزارش شاگردان را به اکسل دانلود کنید." },
    ps: { label: "د زده‌کوونکو راپور صادرات", description: "د زده‌کوونکو راپور اکسل ته ښکته کړئ." },
  },
  "reports.students.print": {
    en: { label: "Print the student report", description: "Print the student report or save it as a PDF." },
    fa: { label: "چاپ گزارش شاگردان", description: "گزارش شاگردان را چاپ کنید یا PDF ذخیره کنید." },
    ps: { label: "د زده‌کوونکو راپور چاپ", description: "د زده‌کوونکو راپور چاپ کړئ یا یې PDF خوندي کړئ." },
  },
  "dashboard.cards.users": {
    en: { label: "User stat card", description: "Show the user count on the dashboard." },
    fa: { label: "کارت کاربران", description: "تعداد کاربران را در داشبورد نشان دهید." },
    ps: { label: "د کاروونکو کارت", description: "په ډشبورډ د کاروونکو شمېر وښایاست." },
  },
  "dashboard.cards.students": {
    en: { label: "Student stat card", description: "Show the student count on the dashboard." },
    fa: { label: "کارت شاگردان", description: "تعداد شاگردان را در داشبورد نشان دهید." },
    ps: { label: "د زده‌کوونکو کارت", description: "په ډشبورډ د زده‌کوونکو شمېر وښایاست." },
  },
  "dashboard.cards.instructors": {
    en: { label: "Instructor stat card", description: "Show the instructor count on the dashboard." },
    fa: { label: "کارت استادان", description: "تعداد استادان را در داشبورد نشان دهید." },
    ps: { label: "د ښوونکو کارت", description: "په ډشبورډ د ښوونکو شمېر وښایاست." },
  },
  "dashboard.cards.courses": {
    en: { label: "Course stat card", description: "Show the course count on the dashboard." },
    fa: { label: "کارت دوره‌ها", description: "تعداد دوره‌ها را در داشبورد نشان دهید." },
    ps: { label: "د کورسونو کارت", description: "په ډشبورډ د کورسونو شمېر وښایاست." },
  },
  "dashboard.cards.classes": {
    en: { label: "Class stat card", description: "Show the class count on the dashboard." },
    fa: { label: "کارت صنف‌ها", description: "تعداد صنف‌ها را در داشبورد نشان دهید." },
    ps: { label: "د صنفونو کارت", description: "په ډشبورډ د صنفونو شمېر وښایاست." },
  },
  "blogs.categories.create": {
    en: { label: "Add blog categories", description: "Create a new category for blog posts." },
    fa: { label: "افزودن دسته بلاگ", description: "برای نوشته‌های بلاگ دسته تازه بسازید." },
    ps: { label: "د بلاګ کټګوري زیاتول", description: "د بلاګ لیکنو لپاره نوې کټګوري جوړه کړئ." },
  },
  "blogs.categories.delete": {
    en: { label: "Delete blog categories", description: "Remove a blog category that no post is using." },
    fa: { label: "حذف دسته بلاگ", description: "دسته‌ای را حذف کنید که هیچ نوشته‌ای از آن استفاده نمی‌کند." },
    ps: { label: "د بلاګ کټګوري ړنګول", description: "هغه کټګوري لرې کړئ چې هیڅ لیکنه یې نه کاروي." },
  },
  "activity_log.read": {
    en: { label: "View the activity log", description: "See who changed records in the system." },
    fa: { label: "گزارش فعالیت", description: "ببینید چه کسی رکوردهای سیستم را تغییر داده است." },
    ps: { label: "د فعالیت ثبت", description: "وګورئ چا د سیستم ریکارډونه بدل کړي." },
  },
};

const COURSE_CONTENT = [
  "main_categories",
  "sub_categories",
  "courses",
  "faasl_modules",
  "lessons",
  "assignments",
  "resources",
  "quiz_files",
  "mock_tests",
] as const;

const ACTION_RANK: Record<string, number> = {
  read: 0,
  create: 1,
  update: 2,
  delete: 3,
  toggle: 4,
  export: 5,
  print: 6,
  payment: 7,
  refund: 8,
  invoice: 9,
};

export function permissionGroupKey(name: string): string {
  const parts = name.split(".");
  if (parts[0] === "course" && parts.length >= 3) {
    if ((COURSE_CONTENT as readonly string[]).includes(parts[1] ?? "")) return "course.content";
    return `course.${parts[1]}`;
  }
  if (parts[0] === "dashboard" && parts[1] === "cards") return "dashboard";
  return parts[0] || "general";
}

/** Subheading inside a module card. Course content keeps chapters, lessons, and files together. */
export function permissionSectionKey(name: string): string {
  const parts = name.split(".");
  if (permissionGroupKey(name) === "course.content") return parts[1] ?? "";
  return "";
}

export function comparePermissionNames(a: string, b: string): number {
  const sectionA = COURSE_CONTENT.indexOf(permissionSectionKey(a) as (typeof COURSE_CONTENT)[number]);
  const sectionB = COURSE_CONTENT.indexOf(permissionSectionKey(b) as (typeof COURSE_CONTENT)[number]);
  const sectionDelta = (sectionA === -1 ? 99 : sectionA) - (sectionB === -1 ? 99 : sectionB);
  if (sectionDelta !== 0) return sectionDelta;
  const actionA = ACTION_RANK[a.split(".").at(-1) ?? ""] ?? 50;
  const actionB = ACTION_RANK[b.split(".").at(-1) ?? ""] ?? 50;
  if (actionA !== actionB) return actionA - actionB;
  return a.localeCompare(b);
}

export function permissionGroupLabel(key: string, locale: AppLocale): string {
  return GROUP[key]?.[locale] ?? key.replace(/\./g, " ");
}

export function describePermission(name: string, locale: AppLocale): Copy {
  const special = SPECIAL[name]?.[locale];
  if (special) return special;

  const parts = name.split(".");
  const action = parts[parts.length - 1] ?? "";
  const subjectKey = parts[0] === "course" && parts.length >= 3 ? `course.${parts[1]}` : parts[0] ?? name;
  const subject = SUBJECT[subjectKey]?.[locale];
  const verb = ACTION[action]?.[locale];
  const detail = DETAIL[action]?.[locale];

  if (subject && verb && detail) {
    return { label: `${verb} ${subject}`, description: detail };
  }

  return {
    label: name,
    description: locale === fa
      ? "این دسترسی مشخص می‌کند این کار مجاز است یا نه."
      : locale === ps
        ? "دا اجازه ټاکي چې دا کار اجازه لري که نه."
        : "This permission allows or blocks this action.",
  };
}

export const PERMISSION_GROUP_ORDER = [
  "attendance",
  "finance",
  "dashboard",
  "reports",
  "users",
  "roles",
  "permissions",
  "students",
  "settings",
  "blogs",
  "activity_log",
  "course.content",
  "course.instructors",
  "course.lms_classes",
  "course.class_students",
  "course.subscription_plans",
  "course.student_subscriptions",
];

/** Fixed 4-column stack for role create/edit. */
export const PERMISSION_FORM_COLUMNS: readonly (readonly string[])[] = [
  ["attendance", "finance", "dashboard", "reports"],
  ["users", "roles", "permissions", "students", "settings", "blogs", "activity_log"],
  ["course.content"],
  [
    "course.instructors",
    "course.lms_classes",
    "course.class_students",
    "course.subscription_plans",
    "course.student_subscriptions",
  ],
];

export function permissionFormColumns(keys: string[]): string[][] {
  const available = new Set(keys);
  const used = new Set<string>();
  const columns = PERMISSION_FORM_COLUMNS.map((preferred) => {
    const column: string[] = [];
    for (const key of preferred) {
      if (!available.has(key) || used.has(key)) continue;
      column.push(key);
      used.add(key);
    }
    return column;
  });

  for (const key of keys) {
    if (used.has(key)) continue;
    let target = 0;
    for (let i = 1; i < columns.length; i += 1) {
      if (columns[i].length < columns[target].length) target = i;
    }
    columns[target].push(key);
    used.add(key);
  }

  return columns;
}
